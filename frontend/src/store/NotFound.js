import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-0)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-6)',
        textAlign: 'center',
        padding: 'var(--space-8)',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'clamp(4rem, 12vw, 8rem)',
          fontWeight: 700,
          color: 'var(--border-strong)',
          lineHeight: 1,
          letterSpacing: '-0.04em',
        }}
        aria-hidden="true"
      >
        404
      </div>

      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-0)', marginBottom: 'var(--space-2)' }}>
          Page not found
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/" className="btn btn-primary">
          <i className="fa-light fa-sharp fa-house" /> Go Home
        </Link>
        <Link to="/store" className="btn btn-outline">
          <i className="fa-light fa-sharp fa-store" /> Visit Store
        </Link>
      </div>
    </div>
  );
}
