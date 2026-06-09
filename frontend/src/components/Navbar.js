import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
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
            <img src="/logo.png" alt="Himalix Labs" className="navbar__logo-img" style={{ height: '30px', width: 'auto' }} />
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
            
            <button
              onClick={toggleTheme}
              className="navbar__link"
              aria-label="Toggle Theme"
              style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            >
              <i 
                className={theme === 'light' ? 'fa-light fa-sharp fa-moon' : 'fa-light fa-sharp fa-sun'} 
                style={{ fontSize: '1.1rem', color: 'var(--accent-primary)' }} 
              />
            </button>

          </div>

          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }} className="navbar__hamburger-wrap">
            <button
              onClick={toggleTheme}
              className="navbar__mobile-theme-btn"
              aria-label="Toggle Theme"
              style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <i 
                className={theme === 'light' ? 'fa-light fa-sharp fa-moon' : 'fa-light fa-sharp fa-sun'} 
                style={{ fontSize: '1.1rem', color: 'var(--accent-primary)' }} 
              />
            </button>
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
                <img src="/logo.png" alt="Himalix Labs" className="navbar__logo-img" style={{ height: '26px', width: 'auto' }} />
                <button
                  className="navbar__sidebar-close"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                >
                  <i className="fa-light fa-sharp fa-xmark" />
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
                
                <motion.button
                  onClick={toggleTheme}
                  className="navbar__sidebar-link"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left', width: '100%' }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navLinks.length * 0.05 }}
                >
                  <i className={theme === 'light' ? 'fa-light fa-sharp fa-moon' : 'fa-light fa-sharp fa-sun'} /> {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
