import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { login, loginWithGoogle, systemConfig } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
              if (redirect) {
                navigate(redirect);
              } else if (data.user.role === 'admin') {
                navigate('/store/admin');
              } else {
                navigate('/store');
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
            text: 'signin_with',
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
    setLoading(true);
    try {
      const data = await login(email, password);
      if (redirect) {
        navigate(redirect);
      } else if (data.user.role === 'admin') {
        navigate('/store/admin');
      } else {
        navigate('/store');
      }
    } catch (err) {
      setError(err.message || 'Login failed.');
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
        <h1 className="auth-card-title">Sign In</h1>
        <p className="auth-card-subtitle">Access your Himalix Store account</p>

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
              placeholder="admin@himalix.store"
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
              placeholder="Enter password"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? 'Signing In...' : (
              <>
                <i className="fa-sharp-duotone fa-light fa-right-to-bracket" style={{ marginRight: '6px' }}></i>
                Sign In
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
          Don't have an account? <Link to="/store/register">Register</Link>
        </div>
      </div>
    </div>
  );
}
