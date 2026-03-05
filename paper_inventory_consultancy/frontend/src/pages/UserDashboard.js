import React, { useState, useRef } from 'react';
import { useAuth } from '../AuthContext';
import axios from 'axios';

function UserDashboard() {
  const { user, token } = useAuth();
  const [userProfile] = useState({
    name: user?.name || 'Customer Name',
    email: user?.email || 'customer@example.com',
    phone: '+91 94427 83424',
    address: '3/315 State Bank Colony, NGGO Colony Post, Coimbatore - 641 022'
  });

  const [orders] = useState([
    { _id: '001', date: '2026-02-28', items: 'Tea Cups (2000 units)', total: '₹5,000', status: 'Delivered' },
    { _id: '002', date: '2026-03-02', items: 'Water Cups (1000 units)', total: '₹2,500', status: 'In Transit' }
  ]);

  // Feedback state
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackImage, setFeedbackImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [fbSuccess, setFbSuccess] = useState('');
  const [fbError, setFbError] = useState('');
  const imgRef = useRef(null);

  const getStatusIcon = (status) => status === 'Delivered' ? '✅' : '🚚';

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setFbSuccess('');
    setFbError('');
    if (!feedbackMsg.trim()) return setFbError('Please enter your feedback message.');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('message', feedbackMsg);
      if (feedbackImage) fd.append('image', feedbackImage);
      await axios.post('/api/feedback', fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setFbSuccess('🎉 Thank you! Your feedback has been submitted successfully.');
      setFeedbackMsg('');
      setFeedbackImage(null);
      if (imgRef.current) imgRef.current.value = '';
    } catch (err) {
      setFbError('❌ Failed to submit: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dashboard-container">
      <h2>My Account</h2>

      {/* Profile Section */}
      <section className="user-section">
        <div className="section-header">
          <h3>👤 Profile Information</h3>
        </div>
        <div className="profile-card">
          <div className="profile-avatar">{userProfile.name.charAt(0).toUpperCase()}</div>
          <div className="profile-info">
            <div className="profile-field">
              <span className="field-label">Full Name</span>
              <span className="field-value">{userProfile.name}</span>
            </div>
            <div className="profile-field">
              <span className="field-label">Email Address</span>
              <span className="field-value">{userProfile.email}</span>
            </div>
            <div className="profile-field">
              <span className="field-label">Phone Number</span>
              <span className="field-value">{userProfile.phone}</span>
            </div>
            <div className="profile-field">
              <span className="field-label">Delivery Address</span>
              <span className="field-value">{userProfile.address}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Orders Section */}
      <section className="user-section">
        <div className="section-header">
          <h3>📦 Order History</h3>
          <span className="order-count">{orders.length} orders</span>
        </div>
        <div className="orders-table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id}>
                  <td><code>#{order._id}</code></td>
                  <td>{order.date}</td>
                  <td>{order.items}</td>
                  <td><strong>{order.total}</strong></td>
                  <td>
                    <span className={`status-badge ${order.status.toLowerCase().replace(' ', '-')}`}>
                      {getStatusIcon(order.status)} {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="user-section quick-actions">
        <h3>⚡ Quick Actions</h3>
        <div className="action-buttons">
          <a href="/products" className="action-btn">
            <span className="action-icon">🛒</span>
            <span>Browse Products</span>
          </a>
          <a href="/contact" className="action-btn">
            <span className="action-icon">📞</span>
            <span>Contact Support</span>
          </a>
        </div>
      </section>

      {/* Feedback Section */}
      <section className="user-section feedback-section">
        <div className="section-header">
          <h3>💬 Submit Feedback</h3>
        </div>
        <p className="feedback-desc">
          Have a suggestion, complaint, or compliment? Let us know! Our team reviews all feedback and responds promptly.
        </p>
        <form className="feedback-form" onSubmit={handleFeedbackSubmit}>
          <div className="form-group">
            <label>Your Feedback *</label>
            <textarea
              value={feedbackMsg}
              onChange={e => setFeedbackMsg(e.target.value)}
              placeholder="Tell us about your experience, suggest improvements, or report an issue..."
              rows={5}
              required
            />
          </div>
          <div className="form-group">
            <label>Attach an Image (optional)</label>
            <input
              type="file"
              accept="image/*"
              ref={imgRef}
              onChange={e => setFeedbackImage(e.target.files[0])}
            />
            <p className="input-hint">You can attach a photo of the product or issue (max 5MB)</p>
          </div>

          {fbSuccess && <div className="alert alert-success">{fbSuccess}</div>}
          {fbError && <div className="alert alert-error">{fbError}</div>}

          <button type="submit" className="btn" disabled={submitting}>
            {submitting ? '⏳ Submitting...' : '📨 Submit Feedback'}
          </button>
        </form>
      </section>
    </div>
  );
}

export default UserDashboard;
