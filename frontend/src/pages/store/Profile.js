import React, { useState, useEffect } from 'react';
import StoreNavbar from '../../components/store/Navbar';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const TABS = ['orders', 'wallet', 'profile'];

export default function Profile() {
  const { user, authFetch, logout } = useAuth();
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
  const [socialClaim, setSocialClaim] = useState('');
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialMsg, setSocialMsg] = useState('');

  /* Profile edit */
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: '', address: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

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
    } catch (err) {
      setProfileMsg(err.message || 'Failed to save.');
    } finally {
      setProfileSaving(false);
    }
  };

  const formatPrice = n => `Rs. ${Number(n || 0).toLocaleString('en-NP')}`;
  const formatDate  = s => new Date(s).toLocaleDateString('en-NP', { year: 'numeric', month: 'short', day: 'numeric' });

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
              {user?.avatar_url
                ? <img src={user.avatar_url} alt={user.name} />
                : <i className="fa-light fa-sharp fa-user" />
              }
            </div>
            <div className="profile-card__name">{user?.name}</div>
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
                  <div className={`alert ${profileMsg.includes('!') ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: 'var(--space-5)' }}>
                    {profileMsg}
                  </div>
                )}
                <form className="profile-edit-form" onSubmit={handleProfileSave}>
                  <div className="profile-edit-form__row">
                    <div className="form-group">
                      <label htmlFor="profile-name" className="form-label">
                        <i className="fa-light fa-sharp fa-user" /> Full Name
                      </label>
                      <input
                        id="profile-name"
                        className="form-input"
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
