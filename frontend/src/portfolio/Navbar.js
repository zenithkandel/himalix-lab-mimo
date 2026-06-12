import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../auth/AuthContext';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Close drawer on route change */
  useEffect(() => { setDrawerOpen(false); }, [location]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setDrawerOpen(false);
  };

  const navLinks = [
    { label: 'Services', id: 'services' },
    { label: 'About', id: 'about' },
    { label: 'Team', id: 'team' },
    { label: 'Contact', id: 'contact' },
  ];

  return (
    <>
      <nav className={`nav${scrolled ? ' nav--scrolled' : ''}`}>
        <div className="nav__inner">
          {/* Logo */}
          <Link to="/" className="nav__logo" aria-label="Himalix Labs Home">
            HIMALIX <span style={{ color: 'var(--accent)' }}>LABS</span>
          </Link>

          {/* Desktop links */}
          <div className="nav__links">
            {navLinks.map(({ label, id }) => (
              <button
                key={id}
                className="nav__link"
                onClick={() => scrollTo(id)}
                aria-label={`Scroll to ${label}`}
              >
                {label}
              </button>
            ))}

            <Link to="/store" className="nav__link">
              <i className="fa-light fa-sharp fa-store" /> Store
            </Link>

            <button
              className="nav__link nav__theme-btn"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <i className={`fa-light fa-sharp fa-${theme === 'dark' ? 'sun' : 'moon'}`} />
            </button>

            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link to="/admin" className="nav__link nav__link--cta">
                    <i className="fa-light fa-sharp fa-shield-halved" /> Admin
                  </Link>
                )}
                <button className="nav__link" onClick={logout}>
                  <i className="fa-light fa-sharp fa-right-from-bracket" /> Logout
                </button>
              </>
            ) : (
              <Link to="/signin" className="nav__link nav__link--cta">
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="nav__hamburger"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <span className="nav__hamburger-bar" />
            <span className="nav__hamburger-bar" />
            <span className="nav__hamburger-bar" />
          </button>
        </div>
      </nav>

      {/* Mobile overlay */}
      <div
        className={`nav__overlay${drawerOpen ? ' nav__overlay--visible' : ''}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile drawer */}
      <div
        className={`nav__drawer${drawerOpen ? ' nav__drawer--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="nav__drawer-header">
          <span className="nav__logo" style={{ fontSize: 'var(--text-xs)' }}>
            HIMALIX <span style={{ color: 'var(--accent)' }}>LABS</span>
          </span>
          <button className="nav__drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Close menu">
            <i className="fa-light fa-sharp fa-xmark" />
          </button>
        </div>

        {navLinks.map(({ label, id }) => (
          <button key={id} className="nav__drawer-link" onClick={() => scrollTo(id)}>
            <i className="fa-light fa-sharp fa-arrow-right" /> {label}
          </button>
        ))}

        <Link to="/store" className="nav__drawer-link">
          <i className="fa-light fa-sharp fa-store" /> Store
        </Link>

        <button className="nav__drawer-link" onClick={toggleTheme}>
          <i className={`fa-light fa-sharp fa-${theme === 'dark' ? 'sun' : 'moon'}`} />
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>

        {user ? (
          <button className="nav__drawer-link" onClick={logout} style={{ color: 'var(--danger)' }}>
            <i className="fa-light fa-sharp fa-right-from-bracket" /> Logout
          </button>
        ) : (
          <Link to="/signin" className="nav__drawer-link" style={{ color: 'var(--accent)' }}>
            <i className="fa-light fa-sharp fa-arrow-right-to-bracket" /> Sign In
          </Link>
        )}
      </div>
    </>
  );
}
