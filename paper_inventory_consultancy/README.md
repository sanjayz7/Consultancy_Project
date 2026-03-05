# Aadhi Papers - Paper Inventory Management System

This repository contains a MERN stack application for the **Paper Inventory Management System** used by Aadhi Papers, a supplier of quality paper cups and cup stock.

## Features

- **Inventory Management**: Track stock levels, reorder points, and inventory value
- **Product Management**: Add, edit, delete, and search products
- **Admin Dashboard**: Comprehensive inventory overview with stock status alerts
- **Category Filtering**: Filter products by category
- **Low Stock Alerts**: Real-time alerts for products below reorder levels
- **Stock Status Tracking**: Visual indicators for stock levels (Good, Medium, Low)

## Directory structure

- `backend/` – Express API with MongoDB models for inventory management
- `frontend/` – React single-page application with inventory features

## Getting started

1. **Install dependencies**
   ```bash
   cd backend
   npm install

   cd ../frontend
   npm install
   ```

2. **Configure environment**
   - Create `.env` file in `backend/` folder with:
     ```
     MONGO_URI=mongodb://localhost:27017/aadhi
     PORT=5000
     ```

3. **Run MongoDB**
   - Ensure a MongoDB instance is running (e.g. `mongod` or a cloud service).

4. **Start backend**
   ```bash
   cd backend
   npm run dev   # uses nodemon for automatic reloads
   ```

5. **Start frontend**
   ```bash
   cd frontend
   npm start
   ```
   The React app will open at `http://localhost:3000` and proxy API requests to port 5000.

## API endpoints

### Products
- `GET /api/products` – list all products (supports filtering by category and search)
- `GET /api/products/:id` – get a specific product
- `POST /api/products` – add a new product
- `PUT /api/products/:id` – update a product
- `DELETE /api/products/:id` – delete a product

### Inventory
- `GET /api/inventory-status` – get inventory overview (total products, low stock items, inventory value)

## Product Schema

```javascript
{
  name: String,                // Product name (required)
  description: String,         // Product description
  category: String,           // Product category (required)
  sku: String,               // Stock Keeping Unit (unique, required)
  price: Number,             // Price in ₹ (required)
  quantity: Number,          // Available quantity (required)
  reorderLevel: Number,      // Stock level to trigger reorder
  unit: String,              // Unit type (pieces, box, pack)
  supplier: String,          // Supplier name
  image: String,             // Product image URL
  createdAt: Date,           // Creation timestamp
  updatedAt: Date            // Last update timestamp
}
```

## UI pages

- **Home** – Welcome and business overview
- **Products** – View and search available paper cup products with stock information
- **Contact** – Shop details, hours, and contact information
- **Admin Dashboard** – Manage inventory, add/edit/delete products, view stock status
- **User Dashboard** – User account information and order history

## Database Models

### Product Model
Tracks all inventory and product information with real-time stock management capabilities.

## Technologies Used

- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Frontend**: React, React Router, Axios
- **Styling**: CSS3 with responsive grid layout
- **Database**: MongoDB

## Future Enhancements

- User authentication and authorization
- Order management system
- Supplier management
- Inventory history and analytics
- Email notifications for low stock
- Barcode/QR code support
- Mobile app integration# Consultancy_Project
