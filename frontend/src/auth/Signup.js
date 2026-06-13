import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function Signup() {
  const { login, user, systemConfig } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    referral_code: '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, navigate, from]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setFieldErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Valid email required';
    if (form.password.length < 6) errs.password = 'Min 6 characters';
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          referral_code: form.referral_code || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
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
    if (!systemConfig?.googleAuthEnabled || !systemConfig?.googleClientId || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: systemConfig.googleClientId,
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
          if (!res.ok) throw new Error(data.message || 'Google sign-up failed');
          login(data.token, data.user);
          navigate(from, { replace: true });
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      },
    });

    const btnEl = document.getElementById('google-btn-signup');
    if (btnEl) {
      window.google.accounts.id.renderButton(
        btnEl,
        { type: 'standard', theme: 'filled_black', size: 'large', width: '100%' }
      );
    }
  }, [systemConfig]); // eslint-disable-line

  const Field = ({ id, label, icon, name, type = 'text', placeholder, autoComplete }) => (
    <div className={`form-group${fieldErrors[name] ? ' form-group--error' : ''}`}>
      <label htmlFor={id} className="form-label">
        <i className={`fa-light fa-sharp fa-${icon}`} /> {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        className="form-input"
        placeholder={placeholder}
        value={form[name]}
        onChange={handleChange}
        autoComplete={autoComplete}
        disabled={loading}
      />
      {fieldErrors[name] && (
        <span className="form-error">
          <i className="fa-light fa-sharp fa-triangle-exclamation" /> {fieldErrors[name]}
        </span>
      )}
    </div>
  );

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
            <h2>Join Nepal's technology community.</h2>
            <p>Create an account to shop, earn wallet credits through referrals, and access all Himalix services from one place.</p>
          </div>
        </div>
        <div className="auth-panel__footer">
          <div className="auth-panel__services">
            {[
              { icon: 'wallet', label: 'Earn wallet credits on every purchase' },
              { icon: 'users', label: 'Refer friends — both earn Rs. 100' },
              { icon: 'clock', label: 'Track orders in real-time' },
              { icon: 'star', label: 'Leave reviews, build history' },
            ].map(({ icon, label }) => (
              <div key={icon} className="auth-panel__service-item">
                <i className={`fa-light fa-sharp fa-${icon}`} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Right form */}
      <main className="auth-form-wrap">
        <div className="auth-form-box">
          <div className="auth-form-box__header">
            <div className="auth-form-box__eyebrow">Get started</div>
            <h1 className="auth-form-box__title">Create account</h1>
            <p className="auth-form-box__subtitle">Free. Takes 30 seconds.</p>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert" style={{ marginBottom: 'var(--space-5)' }}>
              <i className="fa-light fa-sharp fa-circle-exclamation" /> {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Google */}
            {systemConfig?.googleAuthEnabled && systemConfig?.googleClientId && (
              <>
                <div id="google-btn-signup" style={{ width: '100%' }} />
                <div className="auth-separator">or</div>
              </>
            )}

            <Field id="signup-name"     label="Full Name"  icon="user"     name="name"     placeholder="Your name"      autoComplete="name" />
            <Field id="signup-email"    label="Email"      icon="envelope" name="email"    type="email" placeholder="you@example.com" autoComplete="email" />
            <Field id="signup-password" label="Password"   icon="lock"     name="password" type="password" placeholder="Min 6 characters" autoComplete="new-password" />
            <Field id="signup-confirm"  label="Confirm Password" icon="lock-check" name="confirm" type="password" placeholder="Repeat password" autoComplete="new-password" />

            {/* Optional referral */}
            <div className="form-group">
              <label htmlFor="signup-referral" className="form-label">
                <i className="fa-light fa-sharp fa-gift" /> Referral Code <span style={{ color: 'var(--text-3)', fontWeight: 400, marginLeft: 4 }}>(optional)</span>
              </label>
              <input
                id="signup-referral"
                name="referral_code"
                type="text"
                className="form-input"
                placeholder="Enter referral code"
                value={form.referral_code}
                onChange={handleChange}
                disabled={loading}
              />
              <span className="auth-referral-note">
                <i className="fa-light fa-sharp fa-circle-info" style={{ color: 'var(--accent)' }} /> You and your referrer each earn Rs. 100 in wallet credits
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
              aria-busy={loading}
            >
              {loading
                ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Creating account…</>
                : <><i className="fa-light fa-sharp fa-user-plus" /> Create Account</>
              }
            </button>
          </form>

          <div className="auth-switch">
            Already have an account? <Link to="/signin">Sign in</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
