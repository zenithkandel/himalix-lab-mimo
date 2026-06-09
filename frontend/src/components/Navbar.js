import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const navLinks = [
    { label: 'Home', href: '#home', section: true },
    { label: 'Services', href: '#services', section: true },
    { label: 'About', href: '#about', section: true },
    { label: 'Team', href: '#team', section: true },
    { label: 'Contact', href: '#contact', section: true },
  ];

  const handleNavClick = (e, href) => {
    e.preventDefault();
    if (!isHome) {
      window.location.href = '/' + href;
      return;
    }
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileOpen(false);
  };

  return (
    <>
      <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
        <div className="navbar__container">
          <Link to="/" className="navbar__logo">
            HIMALIX <span className="navbar__logo-accent">LABS</span>
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
              Admin
            </Link>
          </div>

          <button
            className="navbar__hamburger"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span className={`navbar__hamburger-line ${mobileOpen ? 'open' : ''}`} />
            <span className={`navbar__hamburger-line ${mobileOpen ? 'open' : ''}`} />
            <span className={`navbar__hamburger-line ${mobileOpen ? 'open' : ''}`} />
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
              transition={{ type: 'tween', duration: 0.3 }}
            >
              <div className="navbar__sidebar-header">
                <span className="navbar__sidebar-logo">
                  HIMALIX <span className="navbar__logo-accent">LABS</span>
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
                <motion.Link
                  to="/admin"
                  className="navbar__sidebar-link navbar__sidebar-link--admin"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <i className="fa-solid fa-gauge-high" /> Admin
                </motion.Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
