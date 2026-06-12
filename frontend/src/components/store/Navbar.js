import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';

export default function StoreNavbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  return (
    <nav className="store-nav" aria-label="Store navigation">
      <div className="store-nav__inner">
        {/* Logo / Back to portfolio */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <Link to="/" className="store-nav__link store-nav__link--back" title="Back to Himalix Labs">
            <i className="fa-light fa-sharp fa-arrow-left" />
          </Link>
          <Link to="/store" className="store-nav__logo">
            HIMALIX <span style={{ color: 'var(--accent)', marginLeft: 4 }}>STORE</span>
          </Link>
        </div>

        {/* Desktop links */}
        <div className="store-nav__links">
          <Link
            to="/store"
            className={`store-nav__link${isActive('/store') ? ' store-nav__link--active' : ''}`}
          >
            <i className="fa-light fa-sharp fa-grid-2" /> Products
          </Link>

          {user && (
            <>
              <Link
                to="/store/cart"
                className={`store-nav__link${isActive('/store/cart') ? ' store-nav__link--active' : ''}`}
                aria-label={`Cart — ${itemCount} items`}
              >
                <i className="fa-light fa-sharp fa-bag-shopping" />
                {itemCount > 0 && (
                  <span className="store-nav__badge">{itemCount}</span>
                )}
              </Link>

              <Link
                to="/store/profile"
                className={`store-nav__link${isActive('/store/profile') ? ' store-nav__link--active' : ''}`}
              >
                <i className="fa-light fa-sharp fa-user" />
              </Link>

              {user.role === 'admin' && (
                <Link
                  to="/store/admin"
                  className={`store-nav__link${location.pathname.startsWith('/store/admin') ? ' store-nav__link--active' : ''}`}
                >
                  <i className="fa-light fa-sharp fa-shield-halved" />
                </Link>
              )}

              <button className="store-nav__link" onClick={handleLogout} title="Sign out">
                <i className="fa-light fa-sharp fa-right-from-bracket" />
              </button>
            </>
          )}

          {!user && (
            <Link to="/signin" className="store-nav__link" style={{ color: 'var(--accent)', fontWeight: 600 }}>
              <i className="fa-light fa-sharp fa-arrow-right-to-bracket" /> Sign In
            </Link>
          )}

          <button className="store-nav__link" onClick={toggleTheme} aria-label="Toggle theme">
            <i className={`fa-light fa-sharp fa-${theme === 'dark' ? 'sun' : 'moon'}`} />
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="store-nav__hamburger"
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          <span className="store-nav__hamburger-bar" />
          <span className="store-nav__hamburger-bar" />
          <span className="store-nav__hamburger-bar" />
        </button>
      </div>

      {/* Mobile expanded links */}
      {mobileOpen && (
        <div className="store-nav__links store-nav__links--open">
          <Link to="/store" className="store-nav__link" onClick={() => setMobileOpen(false)}>
            <i className="fa-light fa-sharp fa-grid-2" /> Products
          </Link>
          {user ? (
            <>
              <Link to="/store/cart" className="store-nav__link" onClick={() => setMobileOpen(false)}>
                <i className="fa-light fa-sharp fa-bag-shopping" /> Cart
                {itemCount > 0 && <span className="store-nav__badge">{itemCount}</span>}
              </Link>
              <Link to="/store/profile" className="store-nav__link" onClick={() => setMobileOpen(false)}>
                <i className="fa-light fa-sharp fa-user" /> Profile
              </Link>
              <button className="store-nav__link btn-danger" onClick={handleLogout}>
                <i className="fa-light fa-sharp fa-right-from-bracket" /> Sign Out
              </button>
            </>
          ) : (
            <Link to="/signin" className="store-nav__link" onClick={() => setMobileOpen(false)}>
              <i className="fa-light fa-sharp fa-arrow-right-to-bracket" /> Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
