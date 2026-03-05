import React from 'react';

function Contact() {
  return (
    <div className="contact-page">
      <h2>Contact Information</h2>
      <p className="contact-intro">We'd love to hear from you! Get in touch with us for any inquiries.</p>
      
      <div className="contact-grid">
        <div className="contact-item">
          <div className="contact-icon">📍</div>
          <h3>Business Address</h3>
          <p>
            3/315 State Bank Colony,<br />
            NGGO Colony Post,<br />
            Coimbatore - 641 022<br />
            <strong>Tamil Nadu, India</strong>
          </p>
        </div>
        
        <div className="contact-item">
          <div className="contact-icon">📞</div>
          <h3>Contact Details</h3>
          <p>
            <strong>Mobile:</strong><br />
            <a href="tel:+919442783424">+91 94427 83424</a><br />
            <a href="tel:+919495257104">+91 94952 57104</a>
          </p>
          <p>
            <strong>Email:</strong><br />
            <a href="mailto:msubbu1968@gmail.com">msubbu1968@gmail.com</a>
          </p>
        </div>
        
        <div className="contact-item">
          <div className="contact-icon">🕐</div>
          <h3>Business Hours</h3>
          <p>
            <strong>Monday to Friday:</strong><br />
            9:00 AM - 6:00 PM
          </p>
          <p>
            <strong>Saturday:</strong><br />
            9:00 AM - 2:00 PM
          </p>
          <p>
            <strong>Sunday:</strong><br />
            Closed
          </p>
        </div>
      </div>

      {/* Map placeholder or additional info */}
      <div className="contact-cta">
        <h3>Ready to Order?</h3>
        <p>Browse our products or sign up to place your order today!</p>
        <div className="cta-buttons">
          <a href="/products" className="btn">View Products</a>
          <a href="/signup" className="btn btn-cancel">Sign Up</a>
        </div>
      </div>
    </div>
  );
}

export default Contact;

