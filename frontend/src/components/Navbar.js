import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const navLinks = [
    { label: 'Home', href: '#home' },
    { label: 'Services', href: '#services' },
    { label: 'About', href: '#about' },
    { label: 'Team', href: '#team' },
    { label: 'Contact', href: '#contact' },
  ];

  const handleNavClick = (e, href) => {
    e.preventDefault();
    if (!isHome) {
      window.location.href = '/' + href;
      return;
    }
    const el = document.querySelector(href);
    if (el) {
      // Offset scrolling slightly to account for the sticky header
      const headerOffset = 100;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
    setMobileOpen(false);
  };

  return (
    <>
      <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
        <div className="navbar__container">
          <Link to="/" className="navbar__logo">
            <span style={{ 
              fontFamily: "var(--font-heading)", 
              fontWeight: 500, 
              fontSize: '1rem', 
              letterSpacing: '3px',
              color: 'var(--text-primary)'
            }}>
              HIMALIX <span style={{ color: 'var(--accent-primary)' }}>LABS</span>
            </span>
          </Link>

          <div className="navbar__links">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="navbar__link"
                onClick={(e) => handleNavClick(e, link.href)}
              >
                {link.label}
              </a>
            ))}
            <Link to="/admin" className="navbar__link navbar__link--admin">
              Console
            </Link>
          </div>

          <button
            className="navbar__hamburger"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span className={`navbar__hamburger-line ${mobileOpen ? 'open' : ''}`} style={{
              transform: mobileOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none'
            }} />
            <span className={`navbar__hamburger-line ${mobileOpen ? 'open' : ''}`} style={{
              opacity: mobileOpen ? 0 : 1
            }} />
            <span className={`navbar__hamburger-line ${mobileOpen ? 'open' : ''}`} style={{
              transform: mobileOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none'
            }} />
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="navbar__overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              className="navbar__sidebar"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
            >
              <div className="navbar__sidebar-header">
                <span style={{ 
                  fontFamily: "var(--font-heading)", 
                  fontWeight: 500, 
                  fontSize: '1rem', 
                  letterSpacing: '2px'
                }}>
                  HIMALIX <span style={{ color: 'var(--accent-primary)' }}>LABS</span>
                </span>
                <button
                  className="navbar__sidebar-close"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              <div className="navbar__sidebar-links">
                {navLinks.map((link, i) => (
                  <motion.a
                    key={link.label}
                    href={link.href}
                    className="navbar__sidebar-link"
                    onClick={(e) => handleNavClick(e, link.href)}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    {link.label}
                  </motion.a>
                ))}
                <motion.div
                  className="navbar__sidebar-divider"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.25 }}
                />
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Link
                    to="/admin"
                    className="navbar__sidebar-link navbar__sidebar-link--admin"
                  >
                    <i className="fa-solid fa-gauge-high" style={{ marginRight: '8px' }} /> Console
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
