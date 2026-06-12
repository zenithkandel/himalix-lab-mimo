import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const VIEWS = [
  { id: 'dashboard', icon: 'gauge',         label: 'Dashboard' },
  { id: 'orders',    icon: 'box',           label: 'Orders' },
  { id: 'products',  icon: 'tag',           label: 'Products' },
  { id: 'users',     icon: 'users',         label: 'Users' },
  { id: 'reviews',   icon: 'star',          label: 'Reviews' },
  { id: 'settings',  icon: 'gear',          label: 'Settings' },
];

const ORDER_STATUS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function StoreAdmin() {
  const { user, authFetch, logout } = useAuth();
  const navigate = useNavigate();

  const [view, setView]               = useState('dashboard');
  const [mobileOpen, setMobileOpen]   = useState(false);

  /* Dashboard */
  const [analytics, setAnalytics]     = useState(null);

  /* Orders */
  const [orders, setOrders]           = useState([]);
  const [orderPage, setOrderPage]     = useState(1);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderLoading, setOrderLoading] = useState(false);

  /* Products */
  const [products, setProducts]       = useState([]);
  const [prodLoading, setProdLoading] = useState(false);
  const [prodModal, setProdModal]     = useState(null); // null | 'new' | product object
  const [prodForm, setProdForm]       = useState({});
  const [prodSaving, setProdSaving]   = useState(false);

  /* Users */
  const [users, setUsers]             = useState([]);
  const [userSearch, setUserSearch]   = useState('');

  /* Reviews */
  const [reviews, setReviews]         = useState([]);

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return; }
  }, [user, navigate]);

  const load = useCallback(async () => {
    if (view === 'dashboard') {
      try {
        const res  = await authFetch('/api/store/admin/analytics');
        const data = await res.json();
        setAnalytics(data);
      } catch {}
    }

    if (view === 'orders') {
      setOrderLoading(true);
      try {
        const res  = await authFetch('/api/store/admin/orders');
        const data = await res.json();
        setOrders(data.orders || []);
      } catch {} finally { setOrderLoading(false); }
    }

    if (view === 'products') {
      setProdLoading(true);
      try {
        const res  = await authFetch('/api/store/products');
        const data = await res.json();
        setProducts(data.products || []);
      } catch {} finally { setProdLoading(false); }
    }

    if (view === 'users') {
      try {
        const res  = await authFetch('/api/store/admin/users');
        const data = await res.json();
        setUsers(data.users || []);
      } catch {}
    }

    if (view === 'reviews') {
      try {
        const res  = await authFetch('/api/store/admin/reviews');
        const data = await res.json();
        setReviews(data.reviews || []);
      } catch {}
    }
  }, [view, authFetch]);

  useEffect(() => { load(); }, [load]);

  const updateOrderStatus = async (orderId, status) => {
    try {
      await authFetch(`/api/store/admin/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    } catch {}
  };

  const saveProduct = async () => {
    setProdSaving(true);
    try {
      const isNew = prodModal === 'new';
      const url   = isNew ? '/api/store/products' : `/api/store/products/${prodForm.id}`;
      const res   = await authFetch(url, {
        method: isNew ? 'POST' : 'PUT',
        body: JSON.stringify(prodForm),
      });
      const data  = await res.json();
      if (!res.ok) throw new Error(data.message);
      setProdModal(null);
      load();
    } catch {} finally { setProdSaving(false); }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await authFetch(`/api/store/products/${id}`, { method: 'DELETE' });
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch {}
  };

  const toggleUserRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'customer' : 'admin';
    try {
      await authFetch(`/api/store/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole }),
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch {}
  };

  const deleteReview = async (id) => {
    try {
      await authFetch(`/api/store/admin/reviews/${id}`, { method: 'DELETE' });
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch {}
  };

  const formatPrice = n => `Rs. ${Number(n || 0).toLocaleString('en-NP')}`;
  const formatDate  = s => s ? new Date(s).toLocaleDateString('en-NP', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  const statusBadge = (status) => {
    const cls = { pending: 'badge-warning', confirmed: 'badge-gold', processing: 'badge-gold', shipped: 'badge-success', delivered: 'badge-success', cancelled: 'badge-danger' };
    return <span className={`badge ${cls[status] || 'badge-neutral'}`}>{status}</span>;
  };

  const filteredOrders  = orders.filter(o =>
    !orderSearch || (o.order_code || String(o.id)).toLowerCase().includes(orderSearch.toLowerCase()) ||
    (o.user_name || '').toLowerCase().includes(orderSearch.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    !userSearch || (u.name + u.email).toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <aside className={`admin-sidebar${mobileOpen ? ' admin-sidebar--mobile-open' : ''}`}>
        <div className="admin-sidebar__top">
          <div className="admin-sidebar__logo">
            HX <span style={{ color: 'var(--accent)' }}>STORE</span>
            <span className="admin-sidebar__module-tag">Admin</span>
          </div>
        </div>

        <nav className="admin-sidebar__nav">
          <div className="admin-sidebar__section-label">Store Management</div>
          {VIEWS.map(v => (
            <button
              key={v.id}
              className={`admin-sidebar__item${view === v.id ? ' admin-sidebar__item--active' : ''}`}
              onClick={() => { setView(v.id); setMobileOpen(false); }}
            >
              <i className={`fa-light fa-sharp fa-${v.icon}`} />
              {v.label}
            </button>
          ))}

          <div className="admin-sidebar__section-label" style={{ marginTop: 'var(--space-4)' }}>Navigation</div>
          <button className="admin-sidebar__item" onClick={() => navigate('/admin')}>
            <i className="fa-light fa-sharp fa-newspaper" /> Portfolio CMS
          </button>
          <button className="admin-sidebar__item" onClick={() => navigate('/store')}>
            <i className="fa-light fa-sharp fa-store" /> View Store
          </button>
        </nav>

        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__user-info">
            <div className="admin-sidebar__user-name">{user?.name}</div>
            <div className="admin-sidebar__user-role">Administrator</div>
          </div>
          <button className="admin-sidebar__logout" onClick={() => { logout(); navigate('/signin'); }} aria-label="Sign out">
            <i className="fa-light fa-sharp fa-right-from-bracket" />
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main">
        <div className="admin-topbar">
          <div className="admin-topbar__breadcrumb">
            <span>Store Admin</span>
            <i className="fa-light fa-sharp fa-chevron-right" />
            <span>{VIEWS.find(v => v.id === view)?.label}</span>
          </div>
          <div className="admin-topbar__actions">
            {view === 'products' && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => { setProdForm({}); setProdModal('new'); }}
              >
                <i className="fa-light fa-sharp fa-plus" /> New Product
              </button>
            )}
          </div>
        </div>

        <div className="admin-content">

          {/* ── DASHBOARD ── */}
          {view === 'dashboard' && analytics && (
            <>
              <div className="admin-stats-grid">
                {[
                  { label: 'Total Revenue', value: formatPrice(analytics.total_revenue), icon: 'circle-dollar', change: analytics.revenue_change },
                  { label: 'Total Orders',  value: analytics.total_orders,              icon: 'box',            change: analytics.orders_change  },
                  { label: 'Total Users',   value: analytics.total_users,               icon: 'users',          change: analytics.users_change   },
                  { label: 'Products',      value: analytics.total_products,            icon: 'tag',                                             },
                ].map((card, i) => (
                  <div key={i} className="admin-stat-card">
                    <div className="admin-stat-card__header">
                      <span className="admin-stat-card__label">{card.label}</span>
                      <i className={`fa-light fa-sharp fa-${card.icon} admin-stat-card__icon`} />
                    </div>
                    <div className="admin-stat-card__value">{card.value}</div>
                    {card.change != null && (
                      <div className={`admin-stat-card__change admin-stat-card__change--${card.change >= 0 ? 'up' : 'down'}`}>
                        <i className={`fa-light fa-sharp fa-arrow-${card.change >= 0 ? 'up' : 'down'}`} />
                        {Math.abs(card.change)}% vs last month
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Recent orders */}
              <div className="admin-table-wrap">
                <div className="admin-table-header">
                  <span className="admin-table-header__title">Recent Orders</span>
                </div>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(analytics.recent_orders || []).slice(0, 8).map(o => (
                      <tr key={o.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>#{o.order_code || o.id}</td>
                        <td>{o.user_name}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{formatPrice(o.total_amount)}</td>
                        <td>{statusBadge(o.status)}</td>
                        <td style={{ color: 'var(--text-2)' }}>{formatDate(o.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── ORDERS ── */}
          {view === 'orders' && (
            <div className="admin-table-wrap">
              <div className="admin-table-header">
                <span className="admin-table-header__title">All Orders</span>
                <div className="admin-table-search" role="search">
                  <span className="admin-table-search__icon"><i className="fa-light fa-sharp fa-magnifying-glass" /></span>
                  <input
                    className="admin-table-search__input"
                    placeholder="Search by order code or customer…"
                    value={orderSearch}
                    onChange={e => setOrderSearch(e.target.value)}
                    aria-label="Search orders"
                  />
                </div>
              </div>
              {orderLoading ? (
                <div className="loading-page" style={{ minHeight: 200 }}><div className="spinner" /></div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(o => (
                      <tr key={o.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>#{o.order_code || o.id}</td>
                        <td>{o.user_name}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{formatPrice(o.total_amount)}</td>
                        <td>
                          <select
                            value={o.status}
                            onChange={e => updateOrderStatus(o.id, e.target.value)}
                            style={{ padding: '3px 8px', background: 'var(--bg-3)', border: '1px solid var(--border)', color: 'var(--text-0)', fontSize: 'var(--text-xs)', cursor: 'pointer' }}
                          >
                            {ORDER_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td style={{ color: 'var(--text-2)', fontSize: 'var(--text-xs)' }}>{formatDate(o.created_at)}</td>
                        <td>
                          <div className="admin-table__actions">
                            <span className="admin-table__action-btn" title={o.shipping_address || 'No address'}>
                              <i className="fa-light fa-sharp fa-location-dot" />
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── PRODUCTS ── */}
          {view === 'products' && (
            <div className="admin-table-wrap">
              <div className="admin-table-header">
                <span className="admin-table-header__title">Products ({products.length})</span>
              </div>
              {prodLoading ? (
                <div className="loading-page" style={{ minHeight: 200 }}><div className="spinner" /></div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-0)' }}>{p.name}</td>
                        <td style={{ color: 'var(--text-2)', fontSize: 'var(--text-xs)' }}>{p.category}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{formatPrice(p.price)}</td>
                        <td>
                          <span className={`badge ${p.stock_quantity <= 0 ? 'badge-danger' : p.stock_quantity <= 5 ? 'badge-warning' : 'badge-success'}`}>
                            {p.stock_quantity}
                          </span>
                        </td>
                        <td>
                          <div className="admin-table__actions">
                            <button
                              className="admin-table__action-btn"
                              onClick={() => { setProdForm(p); setProdModal(p); }}
                              title="Edit"
                            >
                              <i className="fa-light fa-sharp fa-pen" />
                            </button>
                            <button
                              className="admin-table__action-btn admin-table__action-btn--danger"
                              onClick={() => deleteProduct(p.id)}
                              title="Delete"
                            >
                              <i className="fa-light fa-sharp fa-trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── USERS ── */}
          {view === 'users' && (
            <div className="admin-table-wrap">
              <div className="admin-table-header">
                <span className="admin-table-header__title">Users</span>
                <div className="admin-table-search">
                  <span className="admin-table-search__icon"><i className="fa-light fa-sharp fa-magnifying-glass" /></span>
                  <input
                    className="admin-table-search__input"
                    placeholder="Search by name or email…"
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                  />
                </div>
              </div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-0)' }}>{u.name}</td>
                      <td style={{ color: 'var(--text-2)', fontSize: 'var(--text-xs)' }}>{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === 'admin' ? 'badge-gold' : 'badge-neutral'}`}>{u.role}</span>
                      </td>
                      <td style={{ color: 'var(--text-2)', fontSize: 'var(--text-xs)' }}>{formatDate(u.created_at)}</td>
                      <td>
                        <div className="admin-table__actions">
                          {u.id !== user?.id && (
                            <button
                              className="admin-table__action-btn"
                              onClick={() => toggleUserRole(u.id, u.role)}
                              title={u.role === 'admin' ? 'Remove admin' : 'Make admin'}
                            >
                              <i className={`fa-light fa-sharp fa-${u.role === 'admin' ? 'user-minus' : 'shield'}`} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── REVIEWS ── */}
          {view === 'reviews' && (
            <div className="admin-table-wrap">
              <div className="admin-table-header">
                <span className="admin-table-header__title">All Reviews</span>
              </div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>User</th>
                    <th>Rating</th>
                    <th>Comment</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-0)', fontSize: 'var(--text-xs)' }}>{r.product_name}</td>
                      <td style={{ color: 'var(--text-2)', fontSize: 'var(--text-xs)' }}>{r.user_name}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <i key={i} className={`fa-${i < r.rating ? 'solid' : 'light'} fa-sharp fa-star`} style={{ color: 'var(--accent)', fontSize: 10 }} />
                          ))}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-1)', fontSize: 'var(--text-xs)', maxWidth: 200 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.comment}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-2)', fontSize: 'var(--text-xs)' }}>{formatDate(r.created_at)}</td>
                      <td>
                        <div className="admin-table__actions">
                          <button
                            className="admin-table__action-btn admin-table__action-btn--danger"
                            onClick={() => deleteReview(r.id)}
                            title="Delete review"
                          >
                            <i className="fa-light fa-sharp fa-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {view === 'settings' && (
            <div className="admin-settings-grid">
              <div className="page-header" style={{ border: 'none', padding: 0 }}>
                <h2 className="page-title" style={{ fontSize: 'var(--text-xl)' }}>Store Settings</h2>
                <p className="page-subtitle">Manage global store configuration</p>
              </div>

              {[
                { label: 'Maintenance Mode', desc: 'Show a maintenance page to all visitors', key: 'maintenance' },
                { label: 'Allow New Registrations', desc: 'Allow new users to create accounts', key: 'registrations' },
                { label: 'Enable COD', desc: 'Allow Cash on Delivery as payment method', key: 'cod' },
                { label: 'Show Out of Stock Products', desc: 'Display products with zero stock', key: 'show_oos' },
              ].map(setting => (
                <div key={setting.key} className="admin-setting-row">
                  <div className="admin-setting-row__info">
                    <div className="admin-setting-row__label">{setting.label}</div>
                    <div className="admin-setting-row__desc">{setting.desc}</div>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" defaultChecked={setting.key !== 'maintenance'} />
                    <span className="toggle__track" />
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Product Modal */}
      {prodModal && (
        <div className="admin-modal-overlay" onClick={() => setProdModal(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={prodModal === 'new' ? 'Add Product' : 'Edit Product'}>
            <div className="admin-modal__header">
              <span className="admin-modal__title">
                {prodModal === 'new' ? 'Add New Product' : 'Edit Product'}
              </span>
              <button className="admin-modal__close" onClick={() => setProdModal(null)} aria-label="Close">
                <i className="fa-light fa-sharp fa-xmark" />
              </button>
            </div>
            <div className="admin-modal__body">
              {[
                { id: 'p-name',  label: 'Product Name', key: 'name' },
                { id: 'p-cat',   label: 'Category',     key: 'category' },
                { id: 'p-price', label: 'Price (Rs.)',   key: 'price',     type: 'number' },
                { id: 'p-orig',  label: 'Original Price (Rs.)', key: 'original_price', type: 'number' },
                { id: 'p-stock', label: 'Stock Qty',    key: 'stock_quantity', type: 'number' },
                { id: 'p-img',   label: 'Image URL',    key: 'image_url' },
              ].map(f => (
                <div className="form-group" key={f.key}>
                  <label htmlFor={f.id} className="form-label">{f.label}</label>
                  <input
                    id={f.id}
                    type={f.type || 'text'}
                    className="form-input"
                    value={prodForm[f.key] || ''}
                    onChange={e => setProdForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  />
                </div>
              ))}
              <div className="form-group">
                <label htmlFor="p-desc" className="form-label">Description</label>
                <textarea
                  id="p-desc"
                  className="form-textarea"
                  value={prodForm.description || ''}
                  onChange={e => setProdForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={!!prodForm.is_new}
                    onChange={e => setProdForm(prev => ({ ...prev, is_new: e.target.checked }))}
                  />
                  Mark as "New"
                </label>
              </div>
            </div>
            <div className="admin-modal__footer">
              <button className="btn btn-ghost" onClick={() => setProdModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveProduct} disabled={prodSaving}>
                {prodSaving
                  ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving…</>
                  : <><i className="fa-light fa-sharp fa-floppy-disk" /> Save Product</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
