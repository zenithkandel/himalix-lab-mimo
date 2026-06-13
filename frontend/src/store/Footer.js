import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function StoreFooter() {
  const { systemConfig } = useAuth();
  const year = new Date().getFullYear();

  // Load helpline phone and support email dynamically from system configuration, or fallback to default values
  const helplinePhone = systemConfig?.emergencyContactPhone || '9801234567';
  const supportEmail = systemConfig?.emergencyContactEmail || 'support@himalix.store';

  const services = [
    { label: 'Himalix Store', to: '/store' },
    { label: '3D Printing', to: '/#services' },
    { label: 'Web Agency', to: '/#services' },
    { label: 'Custom Projects', to: '/#services' },
  ];

  const company = [
    { label: 'About Us', to: '/#about' },
    { label: 'Our Team', to: '/#team' },
    { label: 'Contact', to: '/#contact' },
  ];

  const legal = [
    { label: 'Terms & Conditions', to: '/store/terms' },
  ];

  return (
    <footer className="footer" style={{ borderTop: '1px solid var(--border)', marginTop: 'var(--space-12)' }}>
      <div className="container" style={{ maxWidth: 'var(--max-width)', margin: '0 auto', padding: '0 var(--space-6)' }}>
        <div className="footer__grid">
          {/* Brand */}
          <div>
            <div className="nav__logo" style={{ fontSize: 'var(--text-sm)' }}>
              HIMALIX <span style={{ color: 'var(--accent)' }}>STORE</span>
            </div>
            <p className="footer__brand-desc">
              Nepal's premium electronics and tech destination — delivering quality components,
              3D printing filaments, and custom project boards.
            </p>
          </div>

          {/* Services */}
          <div>
            <div className="footer__col-title">Store Services</div>
            {services.map(s => (
              <Link key={s.label} to={s.to} className="footer__link">{s.label}</Link>
            ))}
          </div>

          {/* Emergency Helpline Contacts */}
          <div>
            <div className="footer__col-title" style={{ color: 'var(--danger)' }}>
              <i className="fa-light fa-sharp fa-circle-exclamation" style={{ marginRight: '6px' }} />
              Emergency Contacts
            </div>
            <div className="footer__link" style={{ cursor: 'default', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <div>
                <strong style={{ color: 'var(--text-1)', display: 'block', fontSize: 'var(--text-xxs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Emergency Helpline Phone:</strong>
                <a href={`tel:${helplinePhone}`} style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>{helplinePhone}</a>
              </div>
              <div style={{ marginTop: 'var(--space-2)' }}>
                <strong style={{ color: 'var(--text-1)', display: 'block', fontSize: 'var(--text-xxs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Emergency Support Email:</strong>
                <a href={`mailto:${supportEmail}`} style={{ color: 'var(--accent)', fontSize: 'var(--text-sm)' }}>{supportEmail}</a>
              </div>
            </div>
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
