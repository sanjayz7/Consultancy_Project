import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <section className="home-section">
      {/* Hero Section */}
      <div className="hero">
        <h2>Welcome to Aadhi Papers</h2>
        <p>Your trusted partner for premium disposable cup solutions in Coimbatore</p>
      </div>

      {/* Featured Products Section */}
      <div className="features-section">
        <h3>Our Featured Products</h3>
        <div className="features grid">
          <div className="card">
            <div className="card-icon">☕</div>
            <h4>Tea Cups</h4>
            <p>Quality tea cups perfect for cafés, tea shops, and commercial establishments. Excellent heat retention properties.</p>
          </div>
          <div className="card">
            <div className="card-icon">💧</div>
            <h4>Water Cups</h4>
            <p>Sturdy water cups suitable for restaurants, offices, and events. Made from food-grade materials ensuring safety.</p>
          </div>
          <div className="card">
            <div className="card-icon">🍿</div>
            <h4>Popcorn Cups</h4>
            <p>Bright and fun popcorn cups for theaters, event venues, and parties. Available in attractive colors.</p>
          </div>
          <div className="card">
            <div className="card-icon">🧃</div>
            <h4>Juice Cups</h4>
            <p>Crystal clear disposable cups ideal for juice bars and hospitality sectors. Premium product presentation.</p>
          </div>
        </div>
      </div>

      {/* Why Choose Us Section */}
      <div className="features-section">
        <h3>Why Choose Aadhi Papers?</h3>
        <div className="features grid">
          <div className="card">
            <div className="card-icon">⭐</div>
            <h4>Premium Quality</h4>
            <p>High-quality disposable cups manufactured to international standards. Rigorous quality control ensures consistency.</p>
          </div>
          <div className="card">
            <div className="card-icon">📦</div>
            <h4>Wide Selection</h4>
            <p>Comprehensive range of tea, water, popcorn, and juice cups for all business requirements.</p>
          </div>
          <div className="card">
            <div className="card-icon">💰</div>
            <h4>Competitive Pricing</h4>
            <p>Bulk order discounts and affordable pricing for businesses of all sizes. Value for money.</p>
          </div>
          <div className="card">
            <div className="card-icon">🚚</div>
            <h4>Reliable Service</h4>
            <p>Timely delivery and dedicated customer support. We ensure your orders arrive on schedule.</p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <h4>Years Experience</h4>
            <p className="stat-value">15+</p>
          </div>
          <div className="stat-card">
            <h4>Products</h4>
            <p className="stat-value">50+</p>
          </div>
          <div className="stat-card">
            <h4>Happy Customers</h4>
            <p className="stat-value">1000+</p>
          </div>
          <div className="stat-card low-stock">
            <h4>Cities Served</h4>
            <p className="stat-value">20+</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="features-section cta-section">
        <div className="cta-content">
          <h3>Ready to Order?</h3>
          <p>Browse our products or contact us for bulk orders and custom requirements.</p>
          <div className="cta-buttons">
            <Link to="/products" className="btn">View Products</Link>
            <Link to="/contact" className="btn btn-cancel">Contact Us</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Home;

