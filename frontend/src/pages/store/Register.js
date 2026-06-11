import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register, loginWithGoogle, systemConfig } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const googleBtnRef = useRef(null);

  useEffect(() => {
    if (systemConfig?.googleAuthEnabled && systemConfig?.googleClientId && window.google && googleBtnRef.current) {
      try {
        window.google.accounts.id.initialize({
          client_id: systemConfig.googleClientId,
          callback: async (response) => {
            setLoading(true);
            setError('');
            try {
              const data = await loginWithGoogle(response.credential);
              if (data.user.role === 'admin') {
                navigate('/admin');
              } else {
                navigate('/');
              }
            } catch (err) {
              setError(err.message || 'Google Sign-In failed.');
            } finally {
              setLoading(false);
            }
          },
        });

        window.google.accounts.id.renderButton(
          googleBtnRef.current,
          {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            shape: 'square',
            width: googleBtnRef.current.offsetWidth || 340,
            text: 'signup_with',
            logo_alignment: 'left'
          }
        );
      } catch (err) {
        console.error('Google button render error:', err);
      }
    }
  }, [systemConfig, loginWithGoogle, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register(email, password, referralCode);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo-wrapper">
          <img src="/logo.png" alt="HIMALIX Logo" className="auth-logo-img" />
        </div>
        <h1 className="auth-card-title">Register</h1>
        <p className="auth-card-subtitle">Create your Himalix Store account</p>

        {error && (
          <div className="alert alert-danger">
            <span className="alert-icon">
              <i className="fa-sharp-duotone fa-light fa-circle-exclamation"></i>
            </span>
            <span className="alert-content">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              <i className="fa-sharp-duotone fa-light fa-envelope" style={{ marginRight: '6px', opacity: 0.8 }}></i>
              Email
            </label>
            <input
              className="form-input"
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              <i className="fa-sharp-duotone fa-light fa-lock" style={{ marginRight: '6px', opacity: 0.8 }}></i>
              Password
            </label>
            <input
              className="form-input"
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">
              <i className="fa-sharp-duotone fa-light fa-lock" style={{ marginRight: '6px', opacity: 0.8 }}></i>
              Confirm Password
            </label>
            <input
              className="form-input"
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="referralCode">
              <i className="fa-sharp-duotone fa-light fa-gift" style={{ marginRight: '6px', opacity: 0.8 }}></i>
              Referral Code (Optional)
            </label>
            <input
              className="form-input"
              type="text"
              id="referralCode"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              placeholder="e.g. HMX-REF-XXXXXX"
            />
          </div>
 
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? 'Creating Account...' : (
              <>
                <i className="fa-sharp-duotone fa-light fa-user-plus" style={{ marginRight: '6px' }}></i>
                Create Account
              </>
            )}
          </button>
        </form>

        {systemConfig?.googleAuthEnabled && (
          <>
            <div className="auth-divider">
              <span>OR</span>
            </div>
            <div ref={googleBtnRef} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}></div>
          </>
        )}

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
