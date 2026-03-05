import React, { useEffect, useState } from 'react';
import axios from 'axios';

// static fallback list in case API not populated
const defaultProducts = [
  {
    _id: 'tea-1',
    name: 'Tea Cups',
    category: 'Tea Cups',
    sku: 'TC001',
    description: 'Premium disposable tea cups suitable for cafés, tea shops, and commercial establishments. Available in various sizes with excellent heat retention properties.',
    price: 250,
    quantity: 500,
    reorderLevel: 50,
    unit: 'pieces',
    supplier: 'Aadhi Papers',
    image: '/images/tea-cup.jpg'
  },
  {
    _id: 'water-1',
    name: 'Water Cups',
    category: 'Water Cups',
    sku: 'WC001',
    description: 'Durable disposable water cups designed for restaurants, offices, and events. Made from food-grade materials ensuring safety and hygiene standards.',
    price: 180,
    quantity: 800,
    reorderLevel: 100,
    unit: 'pieces',
    supplier: 'Aadhi Papers',
    image: '/images/water-cup.jpeg'
  },
  {
    _id: 'popcorn-1',
    name: 'Popcorn Cups',
    category: 'Popcorn Cups',
    sku: 'PC001',
    description: 'Professionally designed popcorn cups perfect for theaters, event venues, and entertainment facilities. Available in attractive colors and custom branding options.',
    price: 320,
    quantity: 300,
    reorderLevel: 30,
    unit: 'pieces',
    supplier: 'Aadhi Papers',
    image: '/images/popcorn-cup.jpg'
  },
  {
    _id: 'juice-1',
    name: 'Juice Cups',
    category: 'Juice Cups',
    sku: 'JC001',
    description: 'Crystal clear disposable cups ideal for juice bars, beverage services, and hospitality sectors. High transparency for premium product presentation.',
    price: 210,
    quantity: 600,
    reorderLevel: 75,
    unit: 'pieces',
    supplier: 'Aadhi Papers',
    image: '/images/juice-cup.png'
  }
];

function Products() {
  const [products, setProducts] = useState([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [filterCategory, searchTerm]);

  const fetchProducts = async () => {
    try {
      let url = '/api/products';
      const params = [];
      if (filterCategory) params.push(`category=${filterCategory}`);
      if (searchTerm) params.push(`search=${searchTerm}`);
      if (params.length) url += '?' + params.join('&');
      
      const response = await axios.get(url);
      if (response.data && response.data.length) setProducts(response.data);
      else setProducts(defaultProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      setProducts(defaultProducts);
    }
  };

  const getStockStatus = (quantity, reorderLevel) => {
    if (quantity <= reorderLevel) return { class: 'low-stock', text: 'Low Stock' };
    if (quantity <= reorderLevel * 2) return { class: 'medium-stock', text: 'Medium Stock' };
    return { class: 'good-stock', text: 'In Stock' };
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Tea Cups': '☕',
      'Water Cups': '💧',
      'Popcorn Cups': '🍿',
      'Juice Cups': '🧃',
      'Other': '📦'
    };
    return icons[category] || '📦';
  };

  const categories = [...new Set(products.map(p => p.category))];

  return (
    <div className="products-page">
      <h2>Our Product Range</h2>
      
      <div className="product-filters">
        <div className="filter-group">
          <label>🔍 Search Products</label>
          <input 
            type="text" 
            placeholder="Search by product name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-group">
          <label>📂 Filter by Category</label>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="product-grid">
        {products.map(p => {
          const stockStatus = getStockStatus(p.quantity, p.reorderLevel);
          return (
            <div key={p._id} className="product-card">
              <div className="product-card-inner">
                {p.image ? (
                  <div className="img-container">
                    <img src={p.image} alt={p.name} className="product-img" />
                    <span className="product-name-overlay">
                      {getCategoryIcon(p.category)} {p.name}
                    </span>
                  </div>
                ) : (
                  <div className="product-icon">
                    {getCategoryIcon(p.category)}
                  </div>
                )}
                <div className="product-info">
                  <span className="product-category">{p.category}</span>
                  <p className="product-sku">SKU: {p.sku}</p>
                  <p className="product-description">{p.description}</p>
                  <div className="product-details">
                    <div className="detail-row">
                      <span className="label">Price:</span>
                      <span className="value">₹{p.price}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Available:</span>
                      <span className="value">{p.quantity} {p.unit}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Status:</span>
                      <span className={`status ${stockStatus.class}`}>{stockStatus.text}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {products.length === 0 && (
        <div className="no-products">
          <p>No products found. Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
}

export default Products;

