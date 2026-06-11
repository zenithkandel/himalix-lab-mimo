import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function Profile() {
  const { user, token, walletBalance, fetchWalletBalance } = useAuth();
  const [orders, setOrders] = useState(null);
  const [ordersError, setOrdersError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [walletHistory, setWalletHistory] = useState(null);
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [referralMsg, setReferralMsg] = useState(null);
  const [socialMsg, setSocialMsg] = useState(null);
  const [claimingSocial, setClaimingSocial] = useState(false);
  const [bindingReferral, setBindingReferral] = useState(false);

  const fetchWalletHistory = async () => {
    try {
      const response = await fetch('/api/store/wallet/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setWalletHistory(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApplyReferral = async (e) => {
    e.preventDefault();
    if (!referralCodeInput.trim()) return;
    setBindingReferral(true);
    setReferralMsg(null);
    try {
      const res = await fetch('/api/store/wallet/referral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ referralCode: referralCodeInput.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to apply referral code');
      }
      setReferralMsg({ type: 'success', text: `Applied successfully! Earned Rs. ${data.bonusEarned.toFixed(2)}` });
      setReferralCodeInput('');
      fetchWalletBalance();
      fetchWalletHistory();
    } catch (err) {
      setReferralMsg({ type: 'error', text: err.message });
    } finally {
      setBindingReferral(false);
    }
  };

  const handleClaimSocial = async (platform) => {
    setClaimingSocial(true);
    setSocialMsg(null);
    try {
      const res = await fetch('/api/store/wallet/claim-social', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ platform })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to claim social credit');
      }
      setSocialMsg({ type: 'success', text: data.message });
      fetchWalletBalance();
      fetchWalletHistory();
    } catch (err) {
      setSocialMsg({ type: 'error', text: err.message });
    } finally {
      setClaimingSocial(false);
    }
  };

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await fetch(`/api/store/orders/history`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Not available');
        const data = await res.json();
        setOrders(data);
      } catch {
        setOrdersError(true);
      } finally {
        setLoading(false);
      }
    }
    if (token) {
      loadOrders();
      fetchWalletHistory();
    }
  }, [token]);

  if (!user) {
    return (
      <div className="profile-page">
        <div className="container">
          <div className="loading-spinner">
            <div className="spinner" />
          </div>
        </div>
      </div>
    );
  }

  const initials = (user.email || '?')[0].toUpperCase();

  return (
    <div className="profile-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Profile</h1>
        </div>

        <div className="profile-header">
          <div className="profile-avatar" style={{ padding: 0, overflow: 'hidden' }}>
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="Profile Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              initials
            )}
          </div>
          <div className="profile-info">
            <h2>{user.email}</h2>
            <p>{user.role || 'user'}</p>
          </div>
        </div>

        <div className="profile-section">
          <h3 className="profile-section-title">
            <i className="fa-sharp-duotone fa-light fa-id-card" style={{ marginRight: '8px', opacity: 0.8 }}></i>
            Account Details
          </h3>
          <div style={{ border: '1px solid var(--border)', padding: '24px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)' }}>
            <div className="spec-row">
              <span className="spec-label">Email</span>
              <span className="spec-value">{user.email}</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Role</span>
              <span className="spec-value">{user.role || 'user'}</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Member Since</span>
              <span className="spec-value">{formatDate(user.created_at)}</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Wallet Balance</span>
              <span className="spec-value font-mono" style={{ fontWeight: 700 }}>
                रु {Number(walletBalance || 0).toFixed(2)}
              </span>
            </div>
            {walletHistory && walletHistory.referralCode && (
              <div className="spec-row">
                <span className="spec-label">Your Referral Code</span>
                <span className="spec-value font-mono" style={{ fontWeight: 700, color: 'var(--accent)' }}>
                  {walletHistory.referralCode}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="profile-section" style={{ marginTop: '36px' }}>
          <h3 className="profile-section-title">
            <i className="fa-sharp-duotone fa-light fa-wallet" style={{ marginRight: '8px', opacity: 0.8 }}></i>
            Store Credit & Promotions
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', flexWrap: 'wrap' }}>
            {/* Wallet Transactions Ledger */}
            <div style={{ border: '1px solid var(--border)', padding: '24px', backgroundColor: 'var(--bg-card)' }}>
              <h4 style={{ fontWeight: 700, marginBottom: '16px', fontSize: '1.05rem' }}>Transaction History</h4>
              {walletHistory && walletHistory.transactions && walletHistory.transactions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '200px', overflowY: 'auto', paddingRight: '6px' }}>
                  {walletHistory.transactions.map((tx) => (
                    <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{tx.type}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{new Date(tx.created_at).toLocaleDateString()}</span>
                      </div>
                      <span className="font-mono" style={{ fontWeight: 700, color: tx.amount > 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {tx.amount > 0 ? `+रु ${Number(tx.amount).toFixed(2)}` : `-रु ${Number(Math.abs(tx.amount)).toFixed(2)}`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>No transactions yet.</p>
              )}
            </div>

            {/* Referrals & Social Claims */}
            <div style={{ border: '1px solid var(--border)', padding: '24px', backgroundColor: 'var(--bg-card)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Referral Binding */}
              {walletHistory && walletHistory.referredBy === null && (
                <div>
                  <h4 style={{ fontWeight: 700, marginBottom: '8px', fontSize: '1.05rem' }}>Enter Referral Code</h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Got invited? Enter their code to instantly claim Rs. 5.00 credit!</p>
                  <form onSubmit={handleApplyReferral} style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. HMX-REF-XXXXXX"
                      value={referralCodeInput}
                      onChange={(e) => setReferralCodeInput(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
                    />
                    <button type="submit" className="btn btn-primary btn-sm" disabled={bindingReferral}>
                      Apply
                    </button>
                  </form>
                  {referralMsg && (
                    <div className={`alert ${referralMsg.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginTop: '8px', padding: '8px 12px', fontSize: '0.8rem' }}>
                      <span className="alert-content">{referralMsg.text}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Social Media Follow Claims */}
              <div>
                <h4 style={{ fontWeight: 700, marginBottom: '8px', fontSize: '1.05rem' }}>Follow Us to Earn Credits</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Follow us on social networks to claim Rs. 5.00 credit per platform!</p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    className="btn btn-outline btn-sm" 
                    onClick={() => {
                      window.open('https://instagram.com/himalix.labs', '_blank');
                      handleClaimSocial('instagram');
                    }}
                    disabled={claimingSocial}
                    style={{ flex: 1 }}
                  >
                    <i className="fa-brands fa-instagram" style={{ marginRight: '6px' }}></i>
                    Instagram
                  </button>
                  <button 
                    className="btn btn-outline btn-sm" 
                    onClick={() => {
                      window.open('https://facebook.com/himalix.labs', '_blank');
                      handleClaimSocial('facebook');
                    }}
                    disabled={claimingSocial}
                    style={{ flex: 1 }}
                  >
                    <i className="fa-brands fa-facebook" style={{ marginRight: '6px' }}></i>
                    Facebook
                  </button>
                </div>
                {socialMsg && (
                  <div className={`alert ${socialMsg.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginTop: '8px', padding: '8px 12px', fontSize: '0.8rem' }}>
                    <span className="alert-content">{socialMsg.text}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h3 className="profile-section-title">
            <i className="fa-sharp-duotone fa-light fa-clock-rotate-left" style={{ marginRight: '8px', opacity: 0.8 }}></i>
            Order History
          </h3>

          {loading && (
            <div className="loading-spinner">
              <div className="spinner" />
            </div>
          )}

          {!loading && ordersError && (
            <div className="empty-state">
              <div className="empty-state-icon">
                <i className="fa-sharp-duotone fa-light fa-box-open"></i>
              </div>
              <h3>No orders yet</h3>
              <p>Start shopping to see your orders here.</p>
              <Link to="/store" className="btn btn-primary">
                <i className="fa-sharp-duotone fa-light fa-arrow-left" style={{ marginRight: '6px' }}></i>
                Browse Products
              </Link>
            </div>
          )}

          {!loading && !ordersError && orders && orders.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">
                <i className="fa-sharp-duotone fa-light fa-box-open"></i>
              </div>
              <h3>No orders yet</h3>
              <p>Your order history will appear here once you make a purchase.</p>
              <Link to="/store" className="btn btn-primary">
                <i className="fa-sharp-duotone fa-light fa-arrow-left" style={{ marginRight: '6px' }}></i>
                Browse Products
              </Link>
            </div>
          )}

          {!loading && !ordersError && orders && orders.length > 0 && (
            <div className="order-list">
              {orders.map((order) => (
                <div className="order-card" key={order.id}>
                  <div className="order-card-header">
                    <span className="order-id">
                      <i className="fa-sharp-duotone fa-light fa-hashtag" style={{ marginRight: '4px', fontSize: '0.8rem' }}></i>
                      Order #{order.id}
                    </span>
                    <span className="order-date">{formatDate(order.created_at)}</span>
                  </div>
                  <div className="order-items">
                    {(order.items || []).map((item, idx) => (
                      <div className="order-item" key={idx}>
                        <span className="order-item-name">{item.name}</span>
                        <span className="order-item-qty">Qty: {item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div className="order-card-footer">
                    <span className={`badge ${order.status === 'delivered' ? 'badge-success' : order.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}`}>
                      <i className={`fa-sharp-duotone fa-light ${order.status === 'delivered' ? 'fa-circle-check' : order.status === 'cancelled' ? 'fa-circle-exclamation' : 'fa-clock'}`} style={{ marginRight: '4px' }}></i>
                      {order.status || 'pending'}
                    </span>
                    <span className="order-total">रु {Number(order.total || 0).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
