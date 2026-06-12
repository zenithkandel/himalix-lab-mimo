import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();

  const services = [
    { label: 'Himalix Store', to: '/store' },
    { label: '3D Printing', to: '/#services' },
    { label: 'Web Agency', to: '/#services' },
    { label: 'Custom Projects', to: '/#services' },
  ];

  const company = [
    { label: 'About', href: '#about' },
    { label: 'Team', href: '#team' },
    { label: 'Contact', href: '#contact' },
  ];

  const legal = [
    { label: 'Terms & Conditions', to: '/store/terms' },
  ];

  const scrollTo = (id) => {
    const el = document.getElementById(id.replace('#', ''));
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          {/* Brand */}
          <div>
            <div className="nav__logo" style={{ fontSize: 'var(--text-sm)' }}>
              HIMALIX <span style={{ color: 'var(--accent)' }}>LABS</span>
            </div>
            <p className="footer__brand-desc">
              Nepal's emerging technology hub — delivering electronics, 3D printing,
              web solutions, and custom projects with precision.
            </p>
          </div>

          {/* Services */}
          <div>
            <div className="footer__col-title">Services</div>
            {services.map(s => (
              <Link key={s.label} to={s.to} className="footer__link">{s.label}</Link>
            ))}
          </div>

          {/* Company */}
          <div>
            <div className="footer__col-title">Company</div>
            {company.map(c => (
              <button
                key={c.label}
                className="footer__link"
                onClick={() => scrollTo(c.href)}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', width: '100%' }}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Legal */}
          <div>
            <div className="footer__col-title">Legal</div>
            {legal.map(l => (
              <Link key={l.label} to={l.to} className="footer__link">{l.label}</Link>
            ))}
          </div>
        </div>

        <div className="footer__bottom">
          <span>© {year} Himalix Labs. All rights reserved.</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-light fa-sharp fa-location-dot" /> Kathmandu, Nepal
          </span>
        </div>
      </div>
    </footer>
  );
}
