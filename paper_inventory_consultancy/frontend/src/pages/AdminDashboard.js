import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext';

const API = '/api';

function AdminDashboard() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('products');
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  // ── Products state ──────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    name: '', description: '', category: '', sku: '',
    price: '', quantity: '', reorderLevel: '10', unit: 'pieces', supplier: '', image: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [inventoryStats, setInventoryStats] = useState({});
  const [showForm, setShowForm] = useState(false);

  // ── Image Gallery state ─────────────────────────────────────────
  const [uploads, setUploads] = useState([]);
  const [projectImages, setProjectImages] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // ── Feedback state ──────────────────────────────────────────────
  const [feedbacks, setFeedbacks] = useState([]);

  // ── Audit Log state ─────────────────────────────────────────────
  const [auditLogs, setAuditLogs] = useState([]);

  // ── Stock Update state ──────────────────────────────────────────
  const [stockForm, setStockForm] = useState({ productId: '', newQuantity: '', reason: '' });
  const [stockMsg, setStockMsg] = useState('');

  // ── Toast ───────────────────────────────────────────────────────
  const [toast, setToast] = useState('');
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    fetchProducts();
    fetchInventoryStats();
    // eslint-disable-next-line
  }, [token]);

  useEffect(() => {
    if (activeTab === 'images') fetchImages();
    if (activeTab === 'feedback') fetchFeedbacks();
    if (activeTab === 'audit') fetchAuditLogs();
    // eslint-disable-next-line
  }, [activeTab]);

  // ── Fetch helpers ───────────────────────────────────────────────
  const fetchProducts = async () => {
    try { const r = await axios.get(`${API}/products`); setProducts(r.data); } catch (e) { console.error(e); }
  };
  const fetchInventoryStats = async () => {
    try { const r = await axios.get(`${API}/inventory-status`, axiosConfig); setInventoryStats(r.data); } catch (e) { console.error(e); }
  };
  const fetchImages = async () => {
    try { const r = await axios.get(`${API}/images`, axiosConfig); setUploads(r.data.uploads); setProjectImages(r.data.projectImages); } catch (e) { console.error(e); }
  };
  const fetchFeedbacks = async () => {
    try { const r = await axios.get(`${API}/feedback`, axiosConfig); setFeedbacks(r.data); } catch (e) { console.error(e); }
  };
  const fetchAuditLogs = async () => {
    try { const r = await axios.get(`${API}/audit-logs`, axiosConfig); setAuditLogs(r.data); } catch (e) { console.error(e); }
  };

  // ── Products CRUD ───────────────────────────────────────────────
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const r = await axios.put(`${API}/products/${editingId}`, formData, axiosConfig);
        setProducts(products.map(p => p._id === editingId ? r.data : p));
        setEditingId(null);
        showToast('✅ Product updated');
      } else {
        const r = await axios.post(`${API}/products`, formData, axiosConfig);
        setProducts([...products, r.data]);
        showToast('✅ Product added');
      }
      resetForm();
      setShowForm(false);
      fetchInventoryStats();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEdit = (product) => {
    setFormData(product);
    setEditingId(product._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await axios.delete(`${API}/products/${id}`, axiosConfig);
      setProducts(products.filter(p => p._id !== id));
      fetchInventoryStats();
      showToast('🗑️ Product deleted');
    } catch (err) { console.error(err); }
  };

  const resetForm = () => setFormData({
    name: '', description: '', category: '', sku: '',
    price: '', quantity: '', reorderLevel: '10', unit: 'pieces', supplier: '', image: ''
  });

  // ── Image Upload ─────────────────────────────────────────────────
  const handleUploadImage = async (e) => {
    e.preventDefault();
    if (!uploadFile) return alert('Please select an image file');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', uploadFile);
      fd.append('notes', uploadNotes);
      await axios.post(`${API}/images/upload`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      setUploadFile(null);
      setUploadNotes('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchImages();
      showToast('📷 Image uploaded successfully');
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.error || err.message));
    } finally { setUploading(false); }
  };

  const handleDeleteImage = async (id) => {
    if (!window.confirm('Delete this image?')) return;
    try {
      await axios.delete(`${API}/images/${id}`, axiosConfig);
      fetchImages();
      showToast('🗑️ Image deleted');
    } catch (err) { console.error(err); }
  };

  // ── Feedback ─────────────────────────────────────────────────────
  const handleResolveFeedback = async (id) => {
    try {
      const r = await axios.patch(`${API}/feedback/${id}`, { status: 'resolved' }, axiosConfig);
      setFeedbacks(feedbacks.map(f => f._id === id ? r.data : f));
      showToast('✅ Feedback resolved');
    } catch (err) { console.error(err); }
  };

  const handleDeleteFeedback = async (id) => {
    if (!window.confirm('Delete this feedback?')) return;
    try {
      await axios.delete(`${API}/feedback/${id}`, axiosConfig);
      setFeedbacks(feedbacks.filter(f => f._id !== id));
      showToast('🗑️ Feedback deleted');
    } catch (err) { console.error(err); }
  };

  // ── Stock Update ─────────────────────────────────────────────────
  const handleStockUpdate = async (e) => {
    e.preventDefault();
    setStockMsg('');
    try {
      const r = await axios.post(`${API}/stock-update`, {
        productId: stockForm.productId,
        newQuantity: Number(stockForm.newQuantity),
        reason: stockForm.reason
      }, axiosConfig);
      setStockMsg('✅ ' + r.data.message);
      setStockForm({ productId: '', newQuantity: '', reason: '' });
      fetchProducts();
      fetchInventoryStats();
    } catch (err) {
      setStockMsg('❌ ' + (err.response?.data?.error || err.message));
    }
  };

  const tabs = [
    { id: 'products', label: '📦 Products', badge: products.length },
    { id: 'images', label: '📷 Images' },
    { id: 'feedback', label: '💬 Feedback', badge: feedbacks.filter(f => f.status === 'open').length || null },
    { id: 'audit', label: '📋 Audit Log' },
    { id: 'stock', label: '⚡ Stock Update' },
  ];

  return (
    <div className="dashboard-container">
      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}

      <div className="dashboard-header">
        <h2>Administrator Dashboard</h2>
      </div>

      {/* Stats Section */}
      <section className="stats-section">
        <h3>📊 Inventory Overview</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">📦</span>
            <h4>Total Products</h4>
            <p className="stat-value">{inventoryStats.totalProducts || 0}</p>
          </div>
          <div className="stat-card low-stock">
            <span className="stat-icon">⚠️</span>
            <h4>Low Stock Items</h4>
            <p className="stat-value">{inventoryStats.lowStockItems || 0}</p>
          </div>
          <div className="stat-card">
            <span className="stat-icon">💰</span>
            <h4>Inventory Value</h4>
            <p className="stat-value">₹{(inventoryStats.totalInventoryValue || 0).toFixed(2)}</p>
          </div>
          <div className="stat-card">
            <span className="stat-icon">💬</span>
            <h4>Open Feedback</h4>
            <p className="stat-value">{feedbacks.filter(f => f.status === 'open').length || 0}</p>
          </div>
        </div>
      </section>

      {/* Tab Bar */}
      <div className="tab-bar">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`tab-btn${activeTab === t.id ? ' active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
            {t.badge ? <span className="tab-badge">{t.badge}</span> : null}
          </button>
        ))}
      </div>

      {/* ── TAB: Products ─────────────────────────────────────────── */}
      {activeTab === 'products' && (
        <section className="admin-section">
          <div className="section-top">
            <h3>Product Management</h3>
            <button className="btn" onClick={() => { setShowForm(!showForm); if (showForm) { resetForm(); setEditingId(null); } }}>
              {showForm ? '✕ Close Form' : '+ Add Product'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleAddProduct} className="admin-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="Enter product name" />
                </div>
                <div className="form-group">
                  <label>SKU *</label>
                  <input type="text" name="sku" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} required placeholder="Enter SKU" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select name="category" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} required>
                    <option value="">Select Category</option>
                    <option value="Tea Cups">Tea Cups</option>
                    <option value="Water Cups">Water Cups</option>
                    <option value="Popcorn Cups">Popcorn Cups</option>
                    <option value="Juice Cups">Juice Cups</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Supplier</label>
                  <input type="text" name="supplier" value={formData.supplier} onChange={e => setFormData({ ...formData, supplier: e.target.value })} placeholder="Enter supplier name" />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea name="description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Enter product description" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input type="number" name="price" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label>Quantity *</label>
                  <input type="number" name="quantity" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} required placeholder="0" />
                </div>
                <div className="form-group">
                  <label>Unit</label>
                  <select name="unit" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })}>
                    <option value="pieces">Pieces</option>
                    <option value="box">Box</option>
                    <option value="pack">Pack</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Reorder Level</label>
                  <input type="number" name="reorderLevel" value={formData.reorderLevel} onChange={e => setFormData({ ...formData, reorderLevel: e.target.value })} placeholder="10" />
                </div>
              </div>
              <div className="form-group">
                <label>Image URL</label>
                <input type="text" name="image" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} placeholder="Enter image URL" />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn">{editingId ? '💾 Update Product' : '➕ Add Product'}</button>
                {editingId && <button type="button" className="btn btn-cancel" onClick={() => { setEditingId(null); resetForm(); setShowForm(false); }}>✕ Cancel</button>}
              </div>
            </form>
          )}

          <table className="products-table">
            <thead>
              <tr>
                <th>SKU</th><th>Product Name</th><th>Category</th>
                <th>Price</th><th>Quantity</th><th>Unit</th>
                <th>Reorder Level</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>No products yet. Click "+ Add Product".</td></tr>
              )}
              {products.map(product => (
                <tr key={product._id} className={product.quantity <= product.reorderLevel ? 'low-stock-row' : ''}>
                  <td><code>{product.sku}</code></td>
                  <td><strong>{product.name}</strong></td>
                  <td>{product.category}</td>
                  <td>₹{product.price}</td>
                  <td>{product.quantity}</td>
                  <td>{product.unit}</td>
                  <td>{product.reorderLevel}</td>
                  <td>
                    <span className={`status ${product.quantity <= product.reorderLevel ? 'low-stock' : 'good-stock'}`}>
                      {product.quantity <= product.reorderLevel ? '⚠️ Low' : '✅ OK'}
                    </span>
                  </td>
                  <td>
                    <button className="btn-small" onClick={() => handleEdit(product)}>✏️ Edit</button>
                    <button className="btn-small btn-delete" onClick={() => handleDelete(product._id)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {inventoryStats.lowStockProducts?.length > 0 && (
            <div className="low-stock-alert">
              <h4>⚠️ Low Stock Alert — {inventoryStats.lowStockProducts.length} item(s) need reordering</h4>
              <ul>
                {inventoryStats.lowStockProducts.map(p => (
                  <li key={p._id}><strong>{p.name}</strong> — {p.quantity} {p.unit} remaining (reorder at {p.reorderLevel})</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* ── TAB: Image Gallery ────────────────────────────────────── */}
      {activeTab === 'images' && (
        <section className="admin-section">
          <h3>📷 Image Gallery</h3>

          {/* Upload Form */}
          <form onSubmit={handleUploadImage} className="upload-form">
            <div className="form-row">
              <div className="form-group">
                <label>Select Image (JPG/PNG/GIF/WebP, max 5MB)</label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={e => setUploadFile(e.target.files[0])}
                />
              </div>
              <div className="form-group">
                <label>Notes (optional)</label>
                <input type="text" value={uploadNotes} onChange={e => setUploadNotes(e.target.value)} placeholder="e.g. Stock photo batch 1" />
              </div>
            </div>
            <button type="submit" className="btn" disabled={uploading}>
              {uploading ? '⏳ Uploading...' : '📤 Upload Image'}
            </button>
          </form>

          {/* Uploaded images from DB */}
          {uploads.length > 0 && (
            <>
              <h4 style={{ margin: '24px 0 12px' }}>Uploaded Images ({uploads.length})</h4>
              <div className="img-gallery">
                {uploads.map(img => (
                  <div className="img-card" key={img._id}>
                    <img src={`/uploads/${img.filename}`} alt={img.originalName} />
                    <div className="img-info">
                      <p className="img-name" title={img.originalName}>{img.originalName}</p>
                      <p className="img-meta">By {img.uploadedByName}</p>
                      <p className="img-meta">{new Date(img.uploadedAt).toLocaleDateString('en-IN')}</p>
                      {img.notes && <p className="img-notes">{img.notes}</p>}
                    </div>
                    <button className="btn-small btn-delete" onClick={() => handleDeleteImage(img._id)}>🗑️ Delete</button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Project images/ folder */}
          {projectImages.length > 0 && (
            <>
              <h4 style={{ margin: '32px 0 12px' }}>📁 Project Images Folder ({projectImages.length})</h4>
              <div className="img-gallery">
                {projectImages.map((img, i) => (
                  <div className="img-card" key={i}>
                    <div className="img-placeholder">🖼️</div>
                    <div className="img-info">
                      <p className="img-name" title={img.filename}>{img.filename}</p>
                      <p className="img-meta">{new Date(img.uploadedAt).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {uploads.length === 0 && projectImages.length === 0 && (
            <p style={{ color: '#888', marginTop: '20px' }}>No images yet. Upload your first image above.</p>
          )}
        </section>
      )}

      {/* ── TAB: Feedback Management ──────────────────────────────── */}
      {activeTab === 'feedback' && (
        <section className="admin-section">
          <div className="section-top">
            <h3>💬 Customer Feedback</h3>
            <span className="badge-info">{feedbacks.filter(f => f.status === 'open').length} open</span>
          </div>
          {feedbacks.length === 0 ? (
            <p style={{ color: '#888' }}>No feedback received yet.</p>
          ) : (
            <div className="feedback-list">
              {feedbacks.map(fb => (
                <div key={fb._id} className={`feedback-card ${fb.status}`}>
                  <div className="feedback-header">
                    <div>
                      <strong>{fb.userName}</strong>
                      <span className="feedback-email"> — {fb.userEmail}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className={`fb-status-badge ${fb.status}`}>
                        {fb.status === 'open' ? '🔵 Open' : '✅ Resolved'}
                      </span>
                      <span className="img-meta">{new Date(fb.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                  <p className="feedback-message">{fb.message}</p>
                  {fb.imageUrl && (
                    <div className="feedback-img-wrap">
                      <img src={fb.imageUrl} alt="feedback attachment" className="feedback-img" />
                    </div>
                  )}
                  <div className="feedback-actions">
                    {fb.status === 'open' && (
                      <button className="btn-small" onClick={() => handleResolveFeedback(fb._id)}>✅ Mark Resolved</button>
                    )}
                    <button className="btn-small btn-delete" onClick={() => handleDeleteFeedback(fb._id)}>🗑️ Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── TAB: Audit Log ────────────────────────────────────────── */}
      {activeTab === 'audit' && (
        <section className="admin-section">
          <div className="section-top">
            <h3>📋 Stock Audit Log</h3>
            <button className="btn btn-outline" onClick={fetchAuditLogs}>🔄 Refresh</button>
          </div>
          {auditLogs.length === 0 ? (
            <p style={{ color: '#888' }}>No audit log entries yet. Updates made via "Stock Update" tab appear here.</p>
          ) : (
            <div className="table-scroll">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Timestamp</th><th>Product</th><th>SKU</th>
                    <th>Old Qty</th><th>New Qty</th><th>Change</th><th>By</th><th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(log => {
                    const diff = log.newQuantity - log.oldQuantity;
                    return (
                      <tr key={log._id}>
                        <td className="audit-time">{new Date(log.timestamp).toLocaleString('en-IN')}</td>
                        <td><strong>{log.productName}</strong></td>
                        <td><code>{log.sku}</code></td>
                        <td>{log.oldQuantity}</td>
                        <td>{log.newQuantity}</td>
                        <td className={diff >= 0 ? 'qty-up' : 'qty-down'}>{diff > 0 ? `+${diff}` : diff}</td>
                        <td>{log.changedBy}</td>
                        <td>{log.reason || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ── TAB: Quick Stock Update ──────────────────────────────── */}
      {activeTab === 'stock' && (
        <section className="admin-section">
          <h3>⚡ Quick Stock Update</h3>
          <p style={{ color: '#888', marginBottom: '20px' }}>
            Update a product's stock quantity. The change will be logged in the Audit Log and an email alert will be sent if the item goes below reorder level.
          </p>
          <form onSubmit={handleStockUpdate} className="admin-form stock-update-form">
            <div className="form-row">
              <div className="form-group">
                <label>Select Product *</label>
                <select
                  value={stockForm.productId}
                  onChange={e => setStockForm({ ...stockForm, productId: e.target.value })}
                  required
                >
                  <option value="">— Select a product —</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.name} (SKU: {p.sku}) — Current: {p.quantity} {p.unit}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>New Quantity *</label>
                <input
                  type="number"
                  min="0"
                  value={stockForm.newQuantity}
                  onChange={e => setStockForm({ ...stockForm, newQuantity: e.target.value })}
                  required
                  placeholder="Enter new quantity"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Reason for Change *</label>
              <input
                type="text"
                value={stockForm.reason}
                onChange={e => setStockForm({ ...stockForm, reason: e.target.value })}
                required
                placeholder="e.g. Monthly restock, Inventory correction, Damaged goods removed"
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn">⚡ Update Stock</button>
            </div>
            {stockMsg && <p className={`stock-msg ${stockMsg.startsWith('✅') ? 'success' : 'error'}`}>{stockMsg}</p>}
          </form>

          {stockForm.productId && (() => {
            const selected = products.find(p => p._id === stockForm.productId);
            if (!selected) return null;
            return (
              <div className="product-preview">
                <h4>Selected Product Details</h4>
                <div className="preview-grid">
                  <div><span>Name</span><strong>{selected.name}</strong></div>
                  <div><span>Category</span><strong>{selected.category}</strong></div>
                  <div><span>Current Qty</span><strong>{selected.quantity} {selected.unit}</strong></div>
                  <div><span>Reorder Level</span><strong>{selected.reorderLevel} {selected.unit}</strong></div>
                  <div><span>Status</span><strong className={selected.quantity <= selected.reorderLevel ? 'text-danger' : 'text-success'}>
                    {selected.quantity <= selected.reorderLevel ? '⚠️ Low Stock' : '✅ In Stock'}
                  </strong></div>
                </div>
              </div>
            );
          })()}
        </section>
      )}
    </div>
  );
}

export default AdminDashboard;
