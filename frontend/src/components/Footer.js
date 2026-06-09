import React from 'react';
import { Link } from 'react-router-dom';
import ScrollReveal from './ScrollReveal';

const Footer = () => {
  const quickLinks = [
    { label: 'Home', href: '#home' },
    { label: 'Services', href: '#services' },
    { label: 'About', href: '#about' },
    { label: 'Team', href: '#team' },
    { label: 'Contact', href: '#contact' },
  ];

  const services = [
    'Embedded Systems',
    'IoT Solutions',
    'PCB Design',
    'Firmware Development',
    'Product Prototyping',
  ];

  const socialLinks = [
    { icon: 'fa-brands fa-facebook-f', href: '#', label: 'Facebook' },
    { icon: 'fa-brands fa-twitter', href: '#', label: 'Twitter' },
    { icon: 'fa-brands fa-linkedin-in', href: '#', label: 'LinkedIn' },
    { icon: 'fa-brands fa-github', href: '#', label: 'GitHub' },
  ];

  const handleLinkClick = (e, href) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="footer" id="footer">
      <div className="footer__gradient-line" />

      <div className="footer__container">
        <div className="footer__grid">
          <ScrollReveal direction="up" delay={0}>
            <div className="footer__col footer__col--brand">
              <Link to="/" className="footer__logo">
                <img src="/logo.png" alt="Himalix Labs" className="footer__logo-img" />
              </Link>
              <p className="footer__desc">
                Pioneering the future of embedded electronics and IoT solutions.
                We transform innovative ideas into reality with cutting-edge technology.
              </p>
              <div className="footer__socials">
                {socialLinks.map((s) => (
                  <a key={s.label} href={s.href} className="footer__social-icon" aria-label={s.label}>
                    <i className={s.icon} />
                  </a>
                ))}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.1}>
            <div className="footer__col">
              <h4 className="footer__heading">Quick Links</h4>
              <ul className="footer__list">
                {quickLinks.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="footer__link" onClick={(e) => handleLinkClick(e, link.href)}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.2}>
            <div className="footer__col">
              <h4 className="footer__heading">Services</h4>
              <ul className="footer__list">
                {services.map((s) => (
                  <li key={s}>
                    <span className="footer__link">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.3}>
            <div className="footer__col">
              <h4 className="footer__heading">Contact</h4>
              <ul className="footer__list footer__list--contact">
                <li>
                  <i className="fa-solid fa-location-dot" />
                  <span>Kathmandu, Nepal</span>
                </li>
                <li>
                  <i className="fa-solid fa-envelope" />
                  <span>info@himalixlabs.com</span>
                </li>
                <li>
                  <i className="fa-solid fa-phone" />
                  <span>+977-1-XXXXXXX</span>
                </li>
              </ul>
            </div>
          </ScrollReveal>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="footer__bottom-inner">
          <p>&copy; {new Date().getFullYear()} Himalix Labs. All rights reserved.</p>
          <p className="footer__bottom-tagline">Engineered with precision.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
