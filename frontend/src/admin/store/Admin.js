import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import OrderManager from './components/OrderManager';
import ProductEditor from './components/ProductEditor';
import UserManager from './components/UserManager';
import ReviewManager from './components/ReviewManager';
import SettingsManager from './components/SettingsManager';
import LogsManager from './components/LogsManager';

const VIEWS = [
  { id: 'dashboard', icon: 'gauge',         label: 'Dashboard' },
  { id: 'orders',    icon: 'box',           label: 'Orders' },
  { id: 'products',  icon: 'tag',           label: 'Products' },
  { id: 'users',     icon: 'users',         label: 'Users' },
  { id: 'reviews',   icon: 'star',          label: 'Reviews' },
  { id: 'settings',  icon: 'gear',          label: 'Settings' },
  { id: 'logs',      icon: 'file-lines',    label: 'Logs' },
];

export default function StoreAdmin() {
  const { user, authFetch, logout } = useAuth();
  const navigate = useNavigate();

  const [view, setView]               = useState('dashboard');
  const [mobileOpen, setMobileOpen]   = useState(false);

  /* Data States */
  const [analytics, setAnalytics]     = useState(null);
  const [orders, setOrders]           = useState([]);
  const [orderLoading, setOrderLoading] = useState(false);
  
  const [products, setProducts]       = useState([]);
  const [prodLoading, setProdLoading] = useState(false);
  const [prodModal, setProdModal]     = useState(null);
  const [prodSaving, setProdSaving]   = useState(false);

  const [users, setUsers]             = useState([]);
  const [reviews, setReviews]         = useState([]);

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return; }
  }, [user, navigate]);

  const load = useCallback(async () => {
    if (view === 'dashboard') {
      try {
        const res  = await authFetch('/api/store/admin/analytics');
        setAnalytics(await res.json());
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
        const res  = await authFetch('/api/store/admin/products');
        const data = await res.json();
        setProducts(data.products || []);
      } catch {} finally { setProdLoading(false); }
    }
    if (view === 'users') {
      try {
        const res  = await authFetch('/api/store/admin/users');
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : (data.users || []));
      } catch {}
    }
    if (view === 'reviews') {
      try {
        const res  = await authFetch('/api/store/admin/reviews');
        const data = await res.json();
        setReviews(Array.isArray(data) ? data : (data.reviews || []));
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

  const saveProduct = async (productData, id) => {
    setProdSaving(true);
    try {
      const isNew = !id;
      const url   = isNew ? '/api/store/admin/products' : `/api/store/admin/products/${id}`;
      const res   = await authFetch(url, {
        method: isNew ? 'POST' : 'PUT',
        body: JSON.stringify(productData),
      });
      if (!res.ok) throw new Error('Failed to save');
      setProdModal(null);
      load();
    } catch {} finally { setProdSaving(false); }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await authFetch(`/api/store/admin/products/${id}`, { method: 'DELETE' });
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch {}
  };

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
          <button className="admin-sidebar__item" onClick={() => navigate('/store')}>
            <i className="fa-light fa-sharp fa-store" /> View Store
          </button>
        </nav>

        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__user-info">
            <div className="admin-sidebar__user-name">{user?.email}</div>
            <div className="admin-sidebar__user-role">{user?.role}</div>
          </div>
          <button className="admin-sidebar__logout" onClick={logout} title="Log Out">
            <i className="fa-light fa-sharp fa-arrow-right-from-bracket" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        <header className="admin-topbar">
          <button className="btn btn-ghost admin-topbar__hamburger" onClick={() => setMobileOpen(!mobileOpen)}>
            <i className="fa-light fa-sharp fa-bars" />
          </button>
          <div className="admin-topbar__breadcrumb">
            <i className="fa-light fa-sharp fa-house" />
            <span>Store Admin</span>
            <i className="fa-light fa-sharp fa-chevron-right" />
            <span>{VIEWS.find(v => v.id === view)?.label}</span>
          </div>
        </header>

        <div className="admin-content">
          {view === 'dashboard' && <Dashboard analytics={analytics} />}
          
          {view === 'orders' && (
            <OrderManager 
              orders={orders} 
              loading={orderLoading} 
              updateOrderStatus={updateOrderStatus} 
            />
          )}

          {view === 'products' && (
            <div className="admin-products">
              <div className="flex justify-between items-center mb-6">
                <h2 className="page-title">Product Catalog</h2>
                <button className="btn btn-primary" onClick={() => setProdModal('new')}>
                  <i className="fa-light fa-sharp fa-plus" /> Add Product
                </button>
              </div>

              {prodLoading ? <div className="spinner" /> : (
                <div className="product-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                  {products.map(p => (
                    <div className="product-card" key={p.id}>
                      <div className="product-card__img-wrap">
                        {p.image_url ? (
                          <img 
                            src={`http://localhost:5000${p.image_url}`} 
                            alt={p.name} 
                            className="product-card__img" 
                            onError={e => { e.target.src = '/placeholder.png'; }} 
                          />
                        ) : (
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
                            <i className="fa-light fa-sharp fa-image text-3xl" />
                          </div>
                        )}
                      </div>
                      <div className="product-card__body">
                        <div className="product-card__name" style={{ fontSize: '14px' }}>{p.name}</div>
                        <div className="product-card__price">Rs. {p.price}</div>
                        <div className="flex gap-2 mt-2">
                          <button className="btn btn-ghost btn-sm" onClick={() => setProdModal(p)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => deleteProduct(p.id)}>Del</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {prodModal && (
                <ProductEditor 
                  product={prodModal === 'new' ? null : prodModal}
                  saving={prodSaving}
                  onSave={saveProduct}
                  onClose={() => setProdModal(null)}
                  authFetch={authFetch}
                />
              )}
            </div>
          )}

          {view === 'users' && (
            <UserManager 
              users={users} 
              authFetch={authFetch} 
              onLoad={load} 
            />
          )}
          {view === 'reviews' && (
            <ReviewManager 
              reviews={reviews} 
              authFetch={authFetch} 
              onLoad={load} 
            />
          )}
          {view === 'settings' && (
            <SettingsManager 
              authFetch={authFetch} 
            />
          )}
          {view === 'logs' && (
            <LogsManager 
              authFetch={authFetch} 
            />
          )}
        </div>
      </main>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="admin-modal-overlay" 
          onClick={() => setMobileOpen(false)} 
          style={{ zIndex: 190 }} 
        />
      )}
    </div>
  );
}
