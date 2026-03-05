import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Home from './pages/Home';
import Products from './pages/Products';
import Contact from './pages/Contact';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import './styles.css';

function AppContent() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div>
      <header className={scrolled ? 'scrolled' : ''}>
        <div className="header-content">
          <h1>🏆 Aadhi Papers</h1>
          <p className="subtitle">Premium Paper Cup Suppliers & Cup Stock Solutions</p>
          <nav>
            <ul className="nav-grid">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/products">Products</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
              {user ? (
                <>
                  <li><Link to="/user-dashboard">My Account</Link></li>
                  {user.role === 'admin' && <li><Link to="/admin-dashboard">Admin Panel</Link></li>}
                  <li><button onClick={handleLogout} className="logout-btn">Logout</button></li>
                </>
              ) : (
                <>
                  <li><Link to="/login">Login</Link></li>
                  <li><Link to="/signup">Sign Up</Link></li>
                </>
              )}
            </ul>
          </nav>
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/user-dashboard" element={user ? <UserDashboard /> : <Login />} />
          <Route path="/admin-dashboard" element={user?.role === 'admin' ? <AdminDashboard /> : <Login />} />
        </Routes>
      </main>
      <footer>
        <p>© 2026 <strong>Aadhi Papers</strong>. All rights reserved.</p>
        <p>📍 3/315 State Bank Colony, NGGO Colony Post, Coimbatore - 641 022</p>
        <p>📞 +91 94427 83424 | ✉️ msubbu1968@gmail.com</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

