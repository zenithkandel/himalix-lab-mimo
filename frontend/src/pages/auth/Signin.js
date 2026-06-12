import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Signin() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /* Redirect if already logged in */
  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, navigate, from]);

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Invalid credentials');
      login(data.token, data.user);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* Google Sign-In callback */
  useEffect(() => {
    if (!window.google) return;
    window.google.accounts.id.initialize({
      client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      callback: async (response) => {
        setLoading(true);
        setError('');
        try {
          const res = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: response.credential }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'Google sign-in failed');
          login(data.token, data.user);
          navigate(from, { replace: true });
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      },
    });

    window.google.accounts.id.renderButton(
      document.getElementById('google-btn-signin'),
      { type: 'standard', theme: 'filled_black', size: 'large', width: '100%' }
    );
  }, []);  // eslint-disable-line

  return (
    <div className="auth-page">
      {/* Left branding panel */}
      <aside className="auth-panel" aria-hidden="true">
        <div className="auth-panel__grid" />
        <div className="auth-panel__content">
          <div className="auth-panel__logo">
            HIMALIX <span style={{ color: 'var(--accent)' }}>LABS</span>
          </div>
          <div className="auth-panel__tagline">
            <h2>Nepal's technology access center.</h2>
            <p>Sign in to shop electronics, track orders, manage your wallet, and access all Himalix services.</p>
          </div>
        </div>
        <div className="auth-panel__footer">
          <div className="auth-panel__services">
            {[
              { icon: 'store', label: 'Himalix Store — Electronics & More' },
              { icon: 'cube', label: 'Himalix 3D — Custom Prints' },
              { icon: 'globe', label: 'Himalix Web — Digital Solutions' },
              { icon: 'code', label: 'Himalix Projects — Software Dev' },
            ].map(({ icon, label }) => (
              <div key={icon} className="auth-panel__service-item">
                <i className={`fa-light fa-sharp fa-${icon}`} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Right form panel */}
      <main className="auth-form-wrap">
        <div className="auth-form-box">
          <div className="auth-form-box__header">
            <div className="auth-form-box__eyebrow">Welcome back</div>
            <h1 className="auth-form-box__title">Sign in</h1>
            <p className="auth-form-box__subtitle">Access your Himalix account</p>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert" style={{ marginBottom: 'var(--space-5)' }}>
              <i className="fa-light fa-sharp fa-circle-exclamation" />
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Google Sign-In */}
            <div id="google-btn-signin" style={{ width: '100%' }} />

            <div className="auth-separator">or</div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="signin-email" className="form-label">
                <i className="fa-light fa-sharp fa-envelope" /> Email
              </label>
              <input
                id="signin-email"
                name="email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="signin-password" className="form-label">
                <i className="fa-light fa-sharp fa-lock" /> Password
              </label>
              <input
                id="signin-password"
                name="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
              aria-busy={loading}
            >
              {loading
                ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Signing in…</>
                : <><i className="fa-light fa-sharp fa-arrow-right-to-bracket" /> Sign In</>
              }
            </button>
          </form>

          <div className="auth-switch">
            Don't have an account? <Link to="/signup">Create one</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
