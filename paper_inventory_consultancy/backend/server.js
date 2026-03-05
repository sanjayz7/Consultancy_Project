const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// -------------------------------------------------------------------
// Ensure uploads directory exists
// -------------------------------------------------------------------
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Serve uploads as static files
app.use('/uploads', express.static(UPLOADS_DIR));

// -------------------------------------------------------------------
// Multer configuration
// -------------------------------------------------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) cb(null, true);
  else cb(new Error('Only image files are allowed'));
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// -------------------------------------------------------------------
// Email service (nodemailer — graceful fallback if creds missing)
// -------------------------------------------------------------------
let transporter = null;
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

async function sendEmail(to, subject, html) {
  if (!transporter) {
    console.log('[Email] Transporter not configured — skipping email:', subject);
    return;
  }
  try {
    await transporter.sendMail({ from: process.env.SMTP_USER, to, subject, html });
    console.log('[Email] Sent:', subject, '→', to);
  } catch (err) {
    console.error('[Email] Failed to send:', err.message);
  }
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'msubbu1968@gmail.com';

// -------------------------------------------------------------------
// MongoDB Schemas
// -------------------------------------------------------------------

// User
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// Product (paper cup inventory)
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  category: { type: String, required: true },
  sku: { type: String, unique: true, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 0 },
  reorderLevel: { type: Number, default: 10 },
  unit: { type: String, default: 'pieces' },
  supplier: String,
  image: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
const Product = mongoose.model('Product', productSchema);

// Image record (metadata for uploaded images)
const imageRecordSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  uploadedBy: { type: String },
  uploadedByName: { type: String },
  uploadedAt: { type: Date, default: Date.now },
  notes: { type: String, default: '' }
});
const ImageRecord = mongoose.model('ImageRecord', imageRecordSchema);

// Feedback
const feedbackSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String, required: true },
  userEmail: { type: String },
  message: { type: String, required: true },
  imageUrl: { type: String, default: '' },
  status: { type: String, enum: ['open', 'resolved'], default: 'open' },
  adminReply: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});
const Feedback = mongoose.model('Feedback', feedbackSchema);

// Audit Log (stock change history)
const auditLogSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String },
  sku: { type: String },
  changedBy: { type: String },
  oldQuantity: { type: Number },
  newQuantity: { type: Number },
  reason: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
});
const AuditLog = mongoose.model('AuditLog', auditLogSchema);

// -------------------------------------------------------------------
// JWT Middleware
// -------------------------------------------------------------------
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    req.userId = decoded.id;
    req.userRole = decoded.role;
    req.userEmail = decoded.email;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
};

// -------------------------------------------------------------------
// Auth Routes
// -------------------------------------------------------------------
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Please provide name, email, and password' });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword, role: 'user' });
    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Please provide email and password' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/verify', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------------
// Product Routes
// -------------------------------------------------------------------
app.get('/', (req, res) => res.send('Aadhi Papers Inventory Management API — Enterprise Edition'));

app.get('/api/products', async (req, res) => {
  try {
    const { category, search } = req.query;
    let filter = {};
    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };
    const products = await Product.find(filter);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', verifyAdmin, async (req, res) => {
  try {
    const prod = new Product(req.body);
    await prod.save();
    res.status(201).json(prod);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/products/:id', verifyAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/products/:id', verifyAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/inventory-status', verifyAdmin, async (req, res) => {
  try {
    const lowStock = await Product.find({ $expr: { $lte: ['$quantity', '$reorderLevel'] } });
    const totalProducts = await Product.countDocuments();
    const totalValue = await Product.aggregate([
      { $group: { _id: null, total: { $sum: { $multiply: ['$price', '$quantity'] } } } }
    ]);
    res.json({
      totalProducts,
      lowStockItems: lowStock.length,
      totalInventoryValue: totalValue[0]?.total || 0,
      lowStockProducts: lowStock
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------------
// Stock Quick-Update Route (with audit log + low-stock email)
// -------------------------------------------------------------------
app.post('/api/stock-update', verifyAdmin, async (req, res) => {
  try {
    const { productId, newQuantity, reason } = req.body;
    if (!productId || newQuantity === undefined)
      return res.status(400).json({ error: 'productId and newQuantity are required' });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const oldQuantity = product.quantity;

    // Write audit log
    const log = new AuditLog({
      productId: product._id,
      productName: product.name,
      sku: product.sku,
      changedBy: req.userEmail || 'admin',
      oldQuantity,
      newQuantity,
      reason: reason || ''
    });
    await log.save();

    // Update product
    product.quantity = newQuantity;
    product.updatedAt = Date.now();
    await product.save();

    // Send low-stock alert if needed
    if (newQuantity <= product.reorderLevel) {
      await sendEmail(
        ADMIN_EMAIL,
        `⚠️ Low Stock Alert — ${product.name}`,
        `<h2>Low Stock Alert — Aadhi Papers</h2>
         <p>Product <strong>${product.name}</strong> (SKU: <code>${product.sku}</code>) is below the reorder level.</p>
         <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;">
           <tr><th>Field</th><th>Value</th></tr>
           <tr><td>Current Quantity</td><td>${newQuantity} ${product.unit}</td></tr>
           <tr><td>Reorder Level</td><td>${product.reorderLevel} ${product.unit}</td></tr>
           <tr><td>Updated By</td><td>${req.userEmail}</td></tr>
           <tr><td>Reason</td><td>${reason || 'N/A'}</td></tr>
         </table>
         <p>Please reorder stock as soon as possible.</p>`
      );
    }

    res.json({ message: 'Stock updated', product, auditLog: log });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------------
// Audit Log Routes
// -------------------------------------------------------------------
app.get('/api/audit-logs', verifyAdmin, async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(200);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------------
// Image Upload Routes
// -------------------------------------------------------------------
app.post('/api/images/upload', verifyToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Get uploader name
    const uploader = await User.findById(req.userId).select('name email');

    const record = new ImageRecord({
      filename: req.file.filename,
      originalName: req.file.originalname,
      uploadedBy: req.userId,
      uploadedByName: uploader?.name || 'Unknown',
      notes: req.body.notes || ''
    });
    await record.save();

    // Notify admin
    await sendEmail(
      ADMIN_EMAIL,
      `📷 New Image Uploaded — Aadhi Papers`,
      `<h2>New Image Uploaded</h2>
       <p><strong>${uploader?.name}</strong> (${uploader?.email}) uploaded an image: <em>${req.file.originalname}</em></p>
       <p>Uploaded at: ${new Date().toLocaleString('en-IN')}</p>`
    );

    res.status(201).json({
      message: 'Image uploaded successfully',
      record,
      url: `/uploads/${req.file.filename}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/images', verifyAdmin, async (req, res) => {
  try {
    // DB records for backend/uploads
    const dbImages = await ImageRecord.find().sort({ uploadedAt: -1 });

    // Also scan project root images/ folder
    const PROJECT_IMAGES_DIR = path.join(__dirname, '..', 'images');
    let folderImages = [];
    if (fs.existsSync(PROJECT_IMAGES_DIR)) {
      folderImages = fs.readdirSync(PROJECT_IMAGES_DIR)
        .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
        .map(f => ({
          filename: f,
          originalName: f,
          uploadedByName: 'File System',
          uploadedAt: fs.statSync(path.join(PROJECT_IMAGES_DIR, f)).mtime,
          source: 'project-images'
        }));
    }

    res.json({ uploads: dbImages, projectImages: folderImages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/images/:id', verifyAdmin, async (req, res) => {
  try {
    const record = await ImageRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Image record not found' });

    const filePath = path.join(UPLOADS_DIR, record.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await ImageRecord.findByIdAndDelete(req.params.id);
    res.json({ message: 'Image deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------------
// Feedback Routes
// -------------------------------------------------------------------
app.post('/api/feedback', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Feedback message is required' });

    const user = await User.findById(req.userId).select('name email');
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';

    const feedback = new Feedback({
      userId: req.userId,
      userName: user?.name || 'User',
      userEmail: user?.email || '',
      message,
      imageUrl
    });
    await feedback.save();

    // Notify admin
    await sendEmail(
      ADMIN_EMAIL,
      `💬 New Customer Feedback — Aadhi Papers`,
      `<h2>New Feedback Received</h2>
       <p><strong>From:</strong> ${user?.name} (${user?.email})</p>
       <p><strong>Message:</strong></p>
       <blockquote style="border-left:4px solid #ccc;padding-left:12px;">${message}</blockquote>
       ${imageUrl ? `<p><strong>Attached Image:</strong> ${imageUrl}</p>` : ''}
       <p>Login to the admin panel to respond.</p>`
    );

    res.status(201).json({ message: 'Feedback submitted successfully', feedback });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/feedback', verifyAdmin, async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/feedback/:id', verifyAdmin, async (req, res) => {
  try {
    const { status, adminReply } = req.body;
    const fb = await Feedback.findByIdAndUpdate(
      req.params.id,
      { ...(status && { status }), ...(adminReply !== undefined && { adminReply }) },
      { new: true }
    );
    if (!fb) return res.status(404).json({ error: 'Feedback not found' });
    res.json(fb);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/feedback/:id', verifyAdmin, async (req, res) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    res.json({ message: 'Feedback deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------------
// Scheduled Cron Job — Every 6 hours: check low stock & email admin
// -------------------------------------------------------------------
async function checkLowStockAndNotify() {
  try {
    const lowStock = await Product.find({ $expr: { $lte: ['$quantity', '$reorderLevel'] } });
    if (lowStock.length === 0) {
      console.log('[Cron] All products are adequately stocked.');
      return;
    }

    const rows = lowStock.map(p =>
      `<tr>
        <td>${p.name}</td>
        <td><code>${p.sku}</code></td>
        <td>${p.category}</td>
        <td style="color:red;font-weight:bold;">${p.quantity} ${p.unit}</td>
        <td>${p.reorderLevel} ${p.unit}</td>
       </tr>`
    ).join('');

    await sendEmail(
      ADMIN_EMAIL,
      `📊 Aadhi Papers — Low Stock Report (${new Date().toLocaleDateString('en-IN')})`,
      `<h2>Scheduled Low-Stock Report — Aadhi Papers</h2>
       <p>The following <strong>${lowStock.length}</strong> product(s) are at or below reorder level:</p>
       <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif;">
         <thead style="background:#f44336;color:white;">
           <tr>
             <th>Product</th><th>SKU</th><th>Category</th>
             <th>Current Qty</th><th>Reorder Level</th>
           </tr>
         </thead>
         <tbody>${rows}</tbody>
       </table>
       <p style="margin-top:16px;">Please reorder the above items immediately to avoid stock-outs.</p>
       <p><em>Generated at ${new Date().toLocaleString('en-IN')} by the Aadhi Papers automated system.</em></p>`
    );
    console.log(`[Cron] Low-stock email sent for ${lowStock.length} item(s).`);
  } catch (err) {
    console.error('[Cron] Error in stock check:', err.message);
  }
}

// Run every 6 hours: 0 */6 * * *
cron.schedule('0 */6 * * *', () => {
  console.log('[Cron] Running scheduled low-stock check...');
  checkLowStockAndNotify();
});

// -------------------------------------------------------------------
// Connect to MongoDB and Start Server
// -------------------------------------------------------------------
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aadhi';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} — Enterprise Edition`);
      console.log(`Admin email alerts → ${ADMIN_EMAIL}`);
      console.log(`Email transport: ${transporter ? 'CONFIGURED ✓' : 'NOT configured (set SMTP_USER/PASS in .env)'}`);
      console.log(`Cron job: Low-stock check every 6 hours ✓`);
    });
  })
  .catch((err) => console.error(err));