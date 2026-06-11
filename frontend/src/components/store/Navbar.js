import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout, walletBalance } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate('/');
  };

  const closeMobile = () => setMobileOpen(false);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-brand">
          <Link to="/" className="nav-logo" onClick={closeMobile}>
            <img src="/logo.png" alt="HIMALIX Logo" className="nav-logo-img" />
            HIMALIX
          </Link>
        </div>

        <button
          className="navbar-mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>

        <div className={`navbar-links${mobileOpen ? ' open' : ''}`}>
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`} onClick={closeMobile}>
            <i className="fa-sharp-duotone fa-light fa-store"></i>
            Store
          </Link>

          <Link to="/cart" className={`nav-link ${isActive('/cart') ? 'active' : ''}`} onClick={closeMobile}>
            <i className="fa-sharp-duotone fa-light fa-bag-shopping"></i>
            Cart
            {cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
          </Link>

          {user ? (
            <>
              <span className="nav-link" style={{ cursor: 'default', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-sharp-duotone fa-light fa-wallet" style={{ opacity: 0.8 }}></i>
                रु {Number(walletBalance || 0).toFixed(2)}
              </span>

              <Link to="/profile" className={`nav-link ${isActive('/profile') ? 'active' : ''}`} onClick={closeMobile} style={{ display: 'inline-flex', alignItems: 'center' }}>
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="Avatar" style={{ width: '18px', height: '18px', objectFit: 'cover', marginRight: '6px' }} />
                ) : (
                  <i className="fa-sharp-duotone fa-light fa-user"></i>
                )}
                Profile
              </Link>

              {user.role === 'admin' && (
                <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`} onClick={closeMobile}>
                  <i className="fa-sharp-duotone fa-light fa-user-shield"></i>
                  Admin
                </Link>
              )}

              <button onClick={handleLogout} className="nav-link nav-btn">
                <i className="fa-sharp-duotone fa-light fa-right-from-bracket"></i>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={`nav-link ${isActive('/login') ? 'active' : ''}`} onClick={closeMobile}>
                <i className="fa-sharp-duotone fa-light fa-right-to-bracket"></i>
                Login
              </Link>
              <Link to="/register" className={`nav-link ${isActive('/register') ? 'active' : ''}`} onClick={closeMobile}>
                <i className="fa-sharp-duotone fa-light fa-user-plus"></i>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
