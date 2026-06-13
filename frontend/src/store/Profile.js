import React, { useState, useEffect } from 'react';
import StoreNavbar from './Navbar';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import StoreFooter from './Footer';

export default function Profile() {
  const { user, setUser, authFetch, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('orders');

  /* Orders */
  const [orders, setOrders]               = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  /* Wallet */
  const [wallet, setWallet]   = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialMsg, setSocialMsg] = useState('');

  /* Profile edit state */
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', address: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);

  /* Password update state */
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  // Update profile edit form fields when user state updates
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (tab !== 'profile') return;
    const handlePaste = async (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      let file = null;
      for (const item of items) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          file = item.getAsFile();
          break;
        }
      }
      if (!file) return;
      const formData = new FormData();
      formData.append('image', file);

      setAvatarUploading(true);
      setProfileMsg('');
      try {
        const res = await authFetch('/api/auth/upload-avatar', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Avatar upload failed');
        setUser(prev => ({ ...prev, avatar_url: data.avatarUrl }));
        setProfileMsg('Avatar uploaded successfully!');
      } catch (err) {
        setProfileMsg(err.message || 'Failed to upload avatar.');
      } finally {
        setAvatarUploading(false);
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [tab, authFetch, setUser]);

  useEffect(() => {
    if (!user) { navigate('/signin'); return; }
    authFetch('/api/store/orders/my')
      .then(r => r.json())
      .then(d => setOrders(d.orders || []))
      .finally(() => setOrdersLoading(false));
    authFetch('/api/store/wallet')
      .then(r => r.json())
      .then(d => setWallet(d.wallet));
  }, [user, authFetch, navigate]);

  useEffect(() => {
    if (tab !== 'wallet') return;
    setHistoryLoading(true);
    authFetch('/api/store/wallet/history')
      .then(r => r.json())
      .then(d => setHistory(d.history || []))
      .finally(() => setHistoryLoading(false));
  }, [tab, authFetch]);

  const handleSocialClaim = async (platform) => {
    setSocialLoading(true);
    setSocialMsg('');
    try {
      const res = await authFetch('/api/store/wallet/social-claim', {
        method: 'POST',
        body: JSON.stringify({ platform }),
      });
      const d = await res.json();
      setSocialMsg(d.message || 'Claimed!');
      if (res.ok && d.wallet) setWallet(d.wallet);
    } catch {
      setSocialMsg('Failed to claim reward.');
    } finally {
      setSocialLoading(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg('');
    try {
      const res = await authFetch('/api/auth/update', {
        method: 'PUT',
        body: JSON.stringify(profileForm),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message);
      setProfileMsg('Profile updated!');
      setUser(d.user);
    } catch (err) {
      setProfileMsg(err.message || 'Failed to save.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);

    setAvatarUploading(true);
    setProfileMsg('');
    try {
      const res = await authFetch('/api/auth/upload-avatar', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Avatar upload failed');
      setUser(prev => ({ ...prev, avatar_url: data.avatarUrl }));
      setProfileMsg('Avatar uploaded successfully!');
    } catch (err) {
      setProfileMsg(err.message || 'Failed to upload avatar.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: 'danger', text: 'New passwords do not match' });
      return;
    }
    setPasswordSaving(true);
    setPasswordMsg({ type: '', text: '' });
    try {
      const res = await authFetch('/api/auth/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Password update failed');
      setPasswordMsg({ type: 'success', text: 'Password updated successfully!' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordMsg({ type: 'danger', text: err.message });
    } finally {
      setPasswordSaving(false);
    }
  };

  const formatPrice = n => `Rs. ${Number(n || 0).toLocaleString('en-NP')}`;
  const formatDate  = s => new Date(s).toLocaleDateString('en-NP', { year: 'numeric', month: 'short', day: 'numeric' });

  const resolveAvatar = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    return `http://localhost:5000${url}`;
  };

  const statusBadge = (status) => {
    const map = {
      pending:    'badge-warning',
      confirmed:  'badge-gold',
      processing: 'badge-gold',
      shipped:    'badge-success',
      delivered:  'badge-success',
      cancelled:  'badge-danger',
    };
    return <span className={`badge ${map[status] || 'badge-neutral'}`}>{status}</span>;
  };

  return (
    <div className="store-page">
      <StoreNavbar />

      <div className="profile-layout">
        {/* Sidebar */}
        <aside className="profile-sidebar">
          <div className="profile-card">
            <div className="profile-card__avatar">
              {user?.avatar_url ? (
                <img 
                  src={resolveAvatar(user.avatar_url)} 
                  alt={user.name || 'User'} 
                  onError={e => { e.target.src = '/placeholder.png'; }}
                />
              ) : (
                <i className="fa-light fa-sharp fa-user" />
              )}
            </div>
            <div className="profile-card__name">{user?.name || 'Customer'}</div>
            <div className="profile-card__email">{user?.email}</div>
            <div className={`profile-card__role${user?.role === 'admin' ? ' profile-card__role--admin' : ''}`}>
              {user?.role || 'customer'}
            </div>
          </div>

          <nav className="profile-nav" aria-label="Profile sections">
            {[
              { id: 'orders',  icon: 'box',    label: 'My Orders' },
              { id: 'wallet',  icon: 'wallet', label: 'Wallet & Referral' },
              { id: 'profile', icon: 'user',   label: 'Edit Profile' },
            ].map(item => (
              <button
                key={item.id}
                className={`profile-nav__item${tab === item.id ? ' profile-nav__item--active' : ''}`}
                onClick={() => setTab(item.id)}
              >
                <i className={`fa-light fa-sharp fa-${item.icon}`} />
                {item.label}
              </button>
            ))}
            <button
              className="profile-nav__item"
              onClick={() => { logout(); navigate('/signin'); }}
              style={{ color: 'var(--danger)' }}
            >
              <i className="fa-light fa-sharp fa-right-from-bracket" />
              Sign Out
            </button>
          </nav>
        </aside>

        {/* Main content */}
        <div className="profile-content">

          {/* ── ORDERS ── */}
          {tab === 'orders' && (
            <div className="profile-section">
              <div className="profile-section__header">
                <div className="profile-section__title">
                  <i className="fa-light fa-sharp fa-box" /> Order History
                </div>
              </div>
              <div className="profile-section__body" style={{ padding: 0 }}>
                {ordersLoading ? (
                  <div className="loading-page" style={{ minHeight: '200px' }}>
                    <div className="spinner" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon"><i className="fa-light fa-sharp fa-box-open" /></div>
                    <p>No orders yet.</p>
                  </div>
                ) : (
                  <div className="order-list">
                    {orders.map(order => (
                      <div
                        key={order.id}
                        className="order-row"
                        onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={e => e.key === 'Enter' && setSelectedOrder(order)}
                        aria-expanded={selectedOrder?.id === order.id}
                      >
                        <span className="order-row__id">#{order.order_code || order.id}</span>
                        <span className="order-row__date">{formatDate(order.created_at)}</span>
                        <span className="order-row__items">
                          {order.items?.map(i => i.product_name).join(', ') || '—'}
                        </span>
                        <span className="order-row__total">{formatPrice(order.total_amount)}</span>
                        <span className="order-row__status">{statusBadge(order.status)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Order detail drawer */}
                {selectedOrder && (
                  <>
                    <div className="order-detail-overlay" onClick={() => setSelectedOrder(null)} aria-hidden="true" />
                    <div className="order-detail-panel" role="dialog" aria-modal="true" aria-label="Order details">
                      <div className="order-detail-panel__header">
                        <span className="order-detail-panel__title">#{selectedOrder.order_code || selectedOrder.id}</span>
                        <button className="order-detail-panel__close" onClick={() => setSelectedOrder(null)} aria-label="Close">
                          <i className="fa-light fa-sharp fa-xmark" />
                        </button>
                      </div>
                      <div className="order-detail-panel__body">
                        <div>
                          <div className="profile-section__title" style={{ fontSize: 'var(--text-xs)' }}>Status</div>
                          <div style={{ marginTop: 'var(--space-2)' }}>{statusBadge(selectedOrder.status)}</div>
                        </div>
                        <div>
                          <div className="profile-section__title" style={{ fontSize: 'var(--text-xs)' }}>Items</div>
                          {selectedOrder.items?.map((item, i) => (
                            <div key={i} className="order-summary__row" style={{ marginTop: 'var(--space-2)' }}>
                              <span>{item.product_name} × {item.quantity}</span>
                              <span className="order-summary__value">{formatPrice(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="order-summary__row order-summary__row--total">
                          <span>Total</span>
                          <span className="order-summary__value order-summary__value--gold">{formatPrice(selectedOrder.total_amount)}</span>
                        </div>
                        {selectedOrder.shipping_address && (
                          <div>
                            <div className="profile-section__title" style={{ fontSize: 'var(--text-xs)', marginBottom: 'var(--space-2)' }}>Delivery Address</div>
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-1)', lineHeight: 1.6 }}>
                              {selectedOrder.shipping_address}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── WALLET ── */}
          {tab === 'wallet' && wallet && (
            <div className="profile-section">
              <div className="profile-section__header">
                <div className="profile-section__title">
                  <i className="fa-light fa-sharp fa-wallet" /> Wallet & Referral
                </div>
              </div>
              <div className="profile-section__body">
                {/* Overview */}
                <div className="wallet-overview">
                  <div className="wallet-stat">
                    <div className="wallet-stat__label">Balance</div>
                    <div className="wallet-stat__value wallet-stat__value--gold">{formatPrice(wallet.balance)}</div>
                  </div>
                  <div className="wallet-stat">
                    <div className="wallet-stat__label">Total Earned</div>
                    <div className="wallet-stat__value">{formatPrice(wallet.total_earned)}</div>
                  </div>
                  <div className="wallet-stat">
                    <div className="wallet-stat__label">Referrals</div>
                    <div className="wallet-stat__value">{wallet.referral_count || 0}</div>
                  </div>
                </div>

                {/* Referral code */}
                <div className="referral-box">
                  <div className="referral-box__label">Your Referral Code</div>
                  <div className="referral-box__code">
                    <span className="referral-box__code-value">{wallet.referral_code || '—'}</span>
                    <button
                      className="referral-box__copy-btn"
                      onClick={() => navigator.clipboard.writeText(wallet.referral_code || '')}
                      title="Copy to clipboard"
                      aria-label="Copy referral code"
                    >
                      <i className="fa-light fa-sharp fa-copy" />
                    </button>
                  </div>
                  <div className="referral-box__desc">
                    Share this code — you and your friend each earn <strong>Rs. 100</strong> when they sign up and place their first order.
                  </div>
                </div>

                {/* Social claim */}
                <div className="social-claim">
                  <div className="social-claim__title">
                    <i className="fa-brands fa-youtube" /> Social Reward
                  </div>
                  <div className="social-claim__desc">
                    Subscribe to our YouTube channel and follow on Instagram to earn a one-time wallet bonus.
                  </div>
                  {socialMsg && (
                    <div className="alert alert-success" style={{ marginBottom: 0 }}>
                      <i className="fa-light fa-sharp fa-check" /> {socialMsg}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => handleSocialClaim('youtube')} disabled={socialLoading}>
                      <i className="fa-brands fa-youtube" /> YouTube (Rs. 50)
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => handleSocialClaim('instagram')} disabled={socialLoading}>
                      <i className="fa-brands fa-instagram" /> Instagram (Rs. 25)
                    </button>
                  </div>
                </div>

                {/* Transaction history */}
                {historyLoading ? (
                  <div className="loading-page" style={{ minHeight: 120 }}><div className="spinner" /></div>
                ) : history.length > 0 ? (
                  <div>
                    <div className="profile-section__title" style={{ fontSize: 'var(--text-xs)', marginBottom: 'var(--space-4)' }}>
                      Transaction History
                    </div>
                    <div className="wallet-history-list" style={{ border: '1px solid var(--border)' }}>
                      {history.map((tx, i) => (
                        <div key={tx.id || i} className="wallet-history-item">
                          <div className="wallet-history-item__left">
                            <div className={`wallet-history-item__icon wallet-history-item__icon--${tx.type}`}>
                              <i className={`fa-light fa-sharp fa-${tx.type === 'credit' ? 'arrow-down' : 'arrow-up'}`} />
                            </div>
                            <div>
                              <div className="wallet-history-item__desc">{tx.description}</div>
                              <div className="wallet-history-item__date">{formatDate(tx.created_at)}</div>
                            </div>
                          </div>
                          <span className={`wallet-history-item__amount wallet-history-item__amount--${tx.type}`}>
                            {tx.type === 'credit' ? '+' : '−'}{formatPrice(tx.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* ── EDIT PROFILE ── */}
          {tab === 'profile' && (
            <div className="profile-section">
              <div className="profile-section__header">
                <div className="profile-section__title">
                  <i className="fa-light fa-sharp fa-user-pen" /> Edit Profile
                </div>
              </div>
              <div className="profile-section__body">
                {profileMsg && (
                  <div className={`alert ${profileMsg.toLowerCase().includes('failed') || profileMsg.toLowerCase().includes('error') ? 'alert-danger' : 'alert-success'}`} style={{ marginBottom: 'var(--space-5)' }}>
                    {profileMsg}
                  </div>
                )}

                {/* Avatar upload */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-5)' }}>
                  <div style={{ width: '80px', height: '80px', background: '#141414', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {user?.avatar_url ? (
                      <img 
                        src={resolveAvatar(user.avatar_url)} 
                        alt="" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        onError={e => { e.target.src = '/placeholder.png'; }}
                      />
                    ) : (
                      <i className="fa-light fa-sharp fa-user text-3xl" style={{ color: 'var(--text-3)' }} />
                    )}
                  </div>
                  <div>
                    <label htmlFor="avatar-file" className="btn btn-outline btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <i className="fa-light fa-sharp fa-upload" />
                      {avatarUploading ? 'Uploading...' : 'Upload Picture'}
                    </label>
                    <input 
                      type="file" 
                      id="avatar-file" 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                      onChange={handleAvatarUpload}
                      disabled={avatarUploading}
                    />
                    <div style={{ fontSize: 'var(--text-xxs)', color: 'var(--text-3)', marginTop: 'var(--space-1)' }}>
                      JPEG, PNG or WEBP (Max 5MB)
                    </div>
                  </div>
                </div>

                <form className="profile-edit-form" onSubmit={handleProfileSave}>
                  <div className="profile-edit-form__row">
                    <div className="form-group">
                      <label htmlFor="profile-name" className="form-label">
                        <i className="fa-light fa-sharp fa-user" /> Full Name
                      </label>
                      <input
                        id="profile-name"
                        className="form-input"
                        placeholder="Enter your full name"
                        value={profileForm.name}
                        onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                        disabled={profileSaving}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">
                        <i className="fa-light fa-sharp fa-envelope" /> Email
                      </label>
                      <input className="form-input" value={user?.email || ''} disabled style={{ opacity: 0.5 }} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="profile-phone" className="form-label">
                      <i className="fa-light fa-sharp fa-phone" /> Phone
                    </label>
                    <input
                      id="profile-phone"
                      type="tel"
                      className="form-input"
                      placeholder="Enter your phone number"
                      value={profileForm.phone}
                      onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                      disabled={profileSaving}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="profile-address" className="form-label">
                      <i className="fa-light fa-sharp fa-location-dot" /> Default Address
                    </label>
                    <textarea
                      id="profile-address"
                      className="form-textarea"
                      placeholder="Enter your primary delivery address"
                      value={profileForm.address}
                      onChange={e => setProfileForm(p => ({ ...p, address: e.target.value }))}
                      disabled={profileSaving}
                      style={{ minHeight: 80 }}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={profileSaving}>
                    {profileSaving
                      ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving…</>
                      : <><i className="fa-light fa-sharp fa-floppy-disk" /> Save Changes</>
                    }
                  </button>
                </form>

                {/* Password reset for local accounts */}
                {!user?.google_id && (
                  <div style={{ marginTop: 'var(--space-8)', borderTop: '1px solid var(--border)', paddingTop: 'var(--space-6)' }}>
                    <div className="profile-section__title" style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
                      <i className="fa-light fa-sharp fa-key" /> Change Password
                    </div>

                    {passwordMsg.text && (
                      <div className={`alert alert-${passwordMsg.type} mb-4`}>
                        <i className={`fa-light fa-sharp fa-${passwordMsg.type === 'success' ? 'circle-check' : 'circle-exclamation'}`} /> {passwordMsg.text}
                      </div>
                    )}

                    <form onSubmit={handlePasswordChange}>
                      <div className="form-group">
                        <label htmlFor="curr-pass" className="form-label">Current Password</label>
                        <input
                          type="password"
                          id="curr-pass"
                          className="form-input"
                          placeholder="••••••••"
                          value={passwordForm.currentPassword}
                          onChange={e => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
                          required
                          disabled={passwordSaving}
                        />
                      </div>
                      <div className="profile-edit-form__row">
                        <div className="form-group">
                          <label htmlFor="new-pass" className="form-label">New Password</label>
                          <input
                            type="password"
                            id="new-pass"
                            className="form-input"
                            placeholder="Min 6 characters"
                            value={passwordForm.newPassword}
                            onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                            required
                            disabled={passwordSaving}
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="confirm-pass" className="form-label">Confirm New Password</label>
                          <input
                            type="password"
                            id="confirm-pass"
                            className="form-input"
                            placeholder="Re-enter new password"
                            value={passwordForm.confirmPassword}
                            onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                            required
                            disabled={passwordSaving}
                          />
                        </div>
                      </div>
                      <button type="submit" className="btn btn-primary" disabled={passwordSaving}>
                        {passwordSaving ? 'Updating...' : 'Update Password'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <StoreFooter />
    </div>
  );
}
