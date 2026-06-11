import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';


const CATEGORIES = [
  'Microcontrollers', 'Sensors', 'ICs', 'Modules', 'Development Boards', 'Components', 'Other',
];

const EMPTY_FORM = {
  name: '', sku: '', description: '', category: 'Microcontrollers',
  price: '', cost_price: '0.00', stock_quantity: '', image_url: '', image_urls: [],
  technical_specs: '', stock_type: 'in_stock', outsource_days: 0,
};

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];

function Modal({ isOpen, onClose, title, size = 'md', children }) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div
        className={`admin-modal ${size === 'lg' ? 'admin-modal-lg' : size === 'sm' ? 'admin-modal-sm' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-modal-header">
          <h4>{title}</h4>
          <button className="btn-close" onClick={onClose}>
            <i className="fa-sharp-duotone fa-light fa-xmark"></i>
          </button>
        </div>
        <div className="admin-modal-body">{children}</div>
      </div>
    </div>
  );
}

/* ─── Status badge helper ─── */
function StatusBadge({ status }) {
  const cls = {
    completed: 'badge-success', shipped: 'badge-info',
    processing: 'badge-warning', cancelled: 'badge-danger', pending: 'badge-neutral',
  }[status] || 'badge-neutral';
  return <span className={`badge ${cls}`}>{status}</span>;
}

/* ─── Avatar helper ─── */
function UserAvatar({ user, size = 'sm' }) {
  const cls = size === 'lg' ? 'user-detail-avatar' : 'user-avatar-sm';
  const placeholderCls = size === 'lg' ? 'user-detail-avatar-placeholder' : 'user-avatar-placeholder';
  if (user.avatar_url) {
    return <img src={user.avatar_url} alt={user.email} className={cls} />;
  }
  return (
    <div className={placeholderCls}>
      {(user.email || '?')[0].toUpperCase()}
    </div>
  );
}

export default function Admin() {
  const { token, logout, user, fetchSystemConfig } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ── Settings State ── */
  const [settings, setSettings] = useState({
    lowStockThreshold: 5, salesTaxRate: 13, maintenanceMode: false,
    storeBannerText: '', googleClientId: '', googleClientSecret: '', googleAuthEnabled: false,
    deliveryPerKmRate: 15.00, deliveryMinCharge: 50.00, deliveryFreeThreshold: 2000.00,
    emergencyContactPhone: '', emergencyContactEmail: '',
    smtpHost: '', smtpPort: '', smtpUser: '', smtpPass: '', smtpSecure: false,
  });
  const [settingsForm, setSettingsForm] = useState({ ...settings });
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [rawSettings, setRawSettings] = useState([]);
  const [rawSettingsEdits, setRawSettingsEdits] = useState({});
  const [newRawKey, setNewRawKey] = useState('');
  const [newRawValue, setNewRawValue] = useState('');

  /* ── Notification Receivers State ── */
  const [receivers, setReceivers] = useState([]);
  const [receiversLoading, setReceiversLoading] = useState(false);
  const [newReceiver, setNewReceiver] = useState({
    email_address: '',
    notify_on_order_placed: true,
    notify_on_low_stock: true,
    notify_on_user_registered: true
  });

  /* ── Reviews State ── */
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewSearch, setReviewSearch] = useState('');

  /* ── Transactions Ledger State ── */
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionSearch, setTransactionSearch] = useState('');
  const [transactionType, setTransactionType] = useState('All');

  /* ── Social Claims State ── */
  const [socialClaims, setSocialClaims] = useState([]);
  const [socialClaimsLoading, setSocialClaimsLoading] = useState(false);
  const [socialClaimSearch, setSocialClaimSearch] = useState('');

  /* ── Wallet Form State ── */
  const [walletForm, setWalletForm] = useState({
    action: 'deposit',
    amount: '',
    reference: '',
    submitting: false,
  });

  /* ── Products State ── */
  const [products, setProducts] = useState([]);
  const [productView, setProductView] = useState('card'); // 'card' | 'table'
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [technicalSpecsPairs, setTechnicalSpecsPairs] = useState([{ key: '', value: '' }]);
  const [deleteProductTarget, setDeleteProductTarget] = useState(null);
  const [inlineStockEdits, setInlineStockEdits] = useState({});

  /* ── Filter/sort state ── */
  const [productSearch, setProductSearch] = useState('');
  const [productCategory, setProductCategory] = useState('All');
  const [productStock, setProductStock] = useState('All');
  const [productSort, setProductSort] = useState('name-asc');

  /* ── Users State ── */
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRole, setUserRole] = useState('All');
  const [userSort, setUserSort] = useState('created-desc');
  const [userDetailTarget, setUserDetailTarget] = useState(null);
  const [userDetailOrders, setUserDetailOrders] = useState([]);
  const [userDetailOrdersLoading, setUserDetailOrdersLoading] = useState(false);
  const [userEditForm, setUserEditForm] = useState({ email: '', role: 'user' });
  const [newPassword, setNewPassword] = useState('');
  const [deleteUserTarget, setDeleteUserTarget] = useState(null);
  const [changingPasswordUser, setChangingPasswordUser] = useState(null);

  /* ── Carts State ── */
  const [carts, setCarts] = useState([]);
  const [cartsLoading, setCartsLoading] = useState(false);
  const [cartSearch, setCartSearch] = useState('');
  const [cartCategory, setCartCategory] = useState('All');
  const [cartSort, setCartSort] = useState('email-asc');
  const [expandedUserCarts, setExpandedUserCarts] = useState({});

  /* ── Orders State ── */
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatus, setOrderStatus] = useState('All');
  const [orderSort, setOrderSort] = useState('date-desc');
  const [expandedOrders, setExpandedOrders] = useState({});
  const [inlineStatuses, setInlineStatuses] = useState({});
  const [inlinePaymentStatuses, setInlinePaymentStatuses] = useState({});
  const [savingOrderStatus, setSavingOrderStatus] = useState({});
  const [deleteOrderTarget, setDeleteOrderTarget] = useState(null);

  /* ── Analytics State ── */
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  /* ── Error ── */
  const [error, setError] = useState('');

  const getAuthHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }), [token]);

  /* ══════════════════════════════════════════
     DATA FETCHERS
  ══════════════════════════════════════════ */
  const fetchProducts = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/admin/products`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setProducts(Array.isArray(data) ? data : data.products || []);
    } catch (err) { setError(err.message || 'Failed to load products'); }
    finally { setLoading(false); }
  }, [getAuthHeaders]);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true); setError('');
    try {
      const res = await fetch(`/api/admin/users`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setUsers(data);
    } catch (err) { setError(err.message || 'Failed to load users'); }
    finally { setUsersLoading(false); }
  }, [getAuthHeaders]);

  const fetchCarts = useCallback(async () => {
    setCartsLoading(true); setError('');
    try {
      const res = await fetch(`/api/admin/carts`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCarts(data);
    } catch (err) { setError(err.message || 'Failed to load carts'); }
    finally { setCartsLoading(false); }
  }, [getAuthHeaders]);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true); setError('');
    try {
      const res = await fetch(`/api/admin/orders`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setOrders(data);
      const initStatuses = {};
      const initPaymentStatuses = {};
      data.forEach(o => {
        initStatuses[o.id] = o.status;
        initPaymentStatuses[o.id] = o.payment_status;
      });
      setInlineStatuses(initStatuses);
      setInlinePaymentStatuses(initPaymentStatuses);
    } catch (err) { setError(err.message || 'Failed to load orders'); }
    finally { setOrdersLoading(false); }
  }, [getAuthHeaders]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/settings`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok) { setSettings(data); setSettingsForm(data); }
    } catch (err) { console.error(err); }
  }, [getAuthHeaders]);

  const fetchRawSettings = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/settings/raw`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok) { setRawSettings(data); setRawSettingsEdits({}); }
    } catch (err) { console.error(err); }
  }, [getAuthHeaders]);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok) setAnalytics(data);
    } catch (err) { console.error(err); }
    finally { setAnalyticsLoading(false); }
  }, [getAuthHeaders]);

  const fetchAllReviews = useCallback(async () => {
    setReviewsLoading(true); setError('');
    try {
      const res = await fetch(`/api/admin/reviews`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok) setReviews(data);
    } catch (err) { console.error(err); }
    finally { setReviewsLoading(false); }
  }, [getAuthHeaders]);

  const deleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    setError('');
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete review');
      }
      setReviews(prev => prev.filter(r => r.id !== reviewId));
    } catch (err) { setError(err.message); }
  };

  const fetchTransactions = useCallback(async () => {
    setTransactionsLoading(true); setError('');
    try {
      const res = await fetch(`/api/admin/wallet/transactions`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok) setTransactions(data);
    } catch (err) { console.error(err); }
    finally { setTransactionsLoading(false); }
  }, [getAuthHeaders]);

  const fetchSocialClaims = useCallback(async () => {
    setSocialClaimsLoading(true); setError('');
    try {
      const res = await fetch(`/api/admin/social-claims`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok) setSocialClaims(data);
    } catch (err) { console.error(err); }
    finally { setSocialClaimsLoading(false); }
  }, [getAuthHeaders]);

  const fetchReceivers = useCallback(async () => {
    setReceiversLoading(true);
    try {
      const res = await fetch(`/api/admin/notification-receivers`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok) setReceivers(data);
    } catch (err) { console.error(err); }
    finally { setReceiversLoading(false); }
  }, [getAuthHeaders]);

  const handleAddReceiver = async (e) => {
    e.preventDefault();
    if (!newReceiver.email_address.trim()) return;
    setError('');
    try {
      const res = await fetch(`/api/admin/notification-receivers`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          email_address: newReceiver.email_address.trim(),
          notify_on_order_placed: newReceiver.notify_on_order_placed ? 1 : 0,
          notify_on_low_stock: newReceiver.notify_on_low_stock ? 1 : 0,
          notify_on_user_registered: newReceiver.notify_on_user_registered ? 1 : 0
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add receiver');
      setReceivers(prev => [...prev, data]);
      setNewReceiver({ email_address: '', notify_on_order_placed: true, notify_on_low_stock: true, notify_on_user_registered: true });
    } catch (err) { setError(err.message); }
  };

  const handleToggleReceiverPref = async (id, field, currentValue) => {
    setError('');
    try {
      const res = await fetch(`/api/admin/notification-receivers/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ [field]: !currentValue })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Failed to update receiver');
      }
      setReceivers(prev => prev.map(r => r.id === id ? { ...r, [field]: !currentValue ? 1 : 0 } : r));
    } catch (err) { setError(err.message); }
  };

  const handleDeleteReceiver = async (id) => {
    if (!window.confirm('Delete this email receiver?')) return;
    setError('');
    try {
      const res = await fetch(`/api/admin/notification-receivers/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Failed to delete receiver');
      }
      setReceivers(prev => prev.filter(r => r.id !== id));
    } catch (err) { setError(err.message); }
  };

  /* ── Fetch on tab change ── */
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'carts') fetchCarts();
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'settings') { fetchSettings(); fetchRawSettings(); fetchReceivers(); }
    if (activeTab === 'analytics' || activeTab === 'overview') fetchAnalytics();
    if (activeTab === 'reviews') fetchAllReviews();
    if (activeTab === 'transactions') fetchTransactions();
    if (activeTab === 'social_claims') fetchSocialClaims();
  }, [activeTab, fetchUsers, fetchCarts, fetchOrders, fetchSettings, fetchRawSettings, fetchAnalytics, fetchAllReviews, fetchTransactions, fetchSocialClaims, fetchReceivers]);


  /* ── Stats (from products) ── */
  const stats = React.useMemo(() => {
    const total = products.length;
    const totalStock = products.reduce((s, p) => s + (p.stock_quantity || 0), 0);
    const low = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= settings.lowStockThreshold);
    const out = products.filter(p => p.stock_quantity === 0);
    return { total, totalStock, lowCount: low.length, outCount: out.length, lowProducts: low };
  }, [products, settings.lowStockThreshold]);

  /* ══════════════════════════════════════════
     PRODUCT ACTIONS
  ══════════════════════════════════════════ */
  const resetForm = useCallback(() => {
    setFormData(EMPTY_FORM); setFormErrors({}); setEditingProduct(null);
    setShowForm(false); setTechnicalSpecsPairs([{ key: '', value: '' }]);
  }, []);

  const uploadMultipleFiles = useCallback(async (files) => {
    if (!files || files.length === 0) return;
    const fd = new FormData();
    files.forEach(file => fd.append('images', file));
    setUploadingImage(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/upload-multiple`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setFormData(prev => {
        const currentUrls = prev.image_urls || [];
        const newUrls = [...currentUrls, ...data.imageUrls];
        return {
          ...prev,
          image_urls: newUrls,
          image_url: prev.image_url || newUrls[0] || ''
        };
      });
    } catch (err) { setError(err.message || 'Upload failed'); }
    finally { setUploadingImage(false); }
  }, [token]);

  useEffect(() => {
    if (!showForm) return;
    const onPaste = (e) => {
      const items = (e.clipboardData || window.clipboardData)?.items;
      if (!items) return;
      const files = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) { files.push(items[i].getAsFile()); }
      }
      if (files.length > 0) uploadMultipleFiles(files);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [showForm, uploadMultipleFiles]);

  const openCreateForm = () => { resetForm(); setShowForm(true); };

  const openEditForm = (product) => {
    setEditingProduct(product);
    let pairs = [];
    if (product.technical_specs) {
      try {
        const obj = typeof product.technical_specs === 'string'
          ? JSON.parse(product.technical_specs) : product.technical_specs;
        pairs = Object.entries(obj).map(([k, v]) => ({ key: k, value: String(v) }));
      } catch (e) {}
    }
    let urls = [];
    if (product.image_urls) {
      try {
        urls = typeof product.image_urls === 'string' ? JSON.parse(product.image_urls) : product.image_urls;
      } catch (e) {
        urls = product.image_url ? [product.image_url] : [];
      }
    } else {
      urls = product.image_url ? [product.image_url] : [];
    }
    setTechnicalSpecsPairs(pairs.length ? pairs : [{ key: '', value: '' }]);
    setFormData({
      name: product.name || '', sku: product.sku || '',
      description: product.description || '', category: product.category || 'Microcontrollers',
      price: product.price || '', cost_price: product.cost_price || '0.00', stock_quantity: product.stock_quantity ?? '',
      image_url: product.image_url || '', image_urls: Array.isArray(urls) ? urls : [], technical_specs: '',
      stock_type: product.stock_type || 'in_stock',
      outsource_days: product.outsource_days || 0,
    });
    setFormErrors({}); setShowForm(true);
  };

  const openDuplicateForm = (product) => {
    openEditForm({ ...product, id: null, sku: product.sku + '-COPY', name: product.name + ' (Copy)' });
    setEditingProduct(null); // treat as new
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Name is required';
    if (!formData.sku.trim()) errs.sku = 'SKU is required';
    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) errs.price = 'Price must be positive';
    if (formData.cost_price && (isNaN(Number(formData.cost_price)) || Number(formData.cost_price) < 0)) errs.cost_price = 'Cost price must be non-negative';
    if (formData.stock_quantity === '' || isNaN(Number(formData.stock_quantity)) || Number(formData.stock_quantity) < 0) errs.stock_quantity = 'Stock must be a non-negative integer';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: type === 'checkbox' ? checked : value };
      if (name === 'stock_type' && value === 'outsourced') {
        next.stock_quantity = 0;
      }
      return next;
    });
    if (formErrors[name]) setFormErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true); setError('');
    try {
      const specsObj = {};
      technicalSpecsPairs.forEach(({ key, value }) => { if (key.trim()) specsObj[key.trim()] = value.trim(); });
      const payload = {
        name: formData.name.trim(), sku: formData.sku.trim(),
        description: formData.description.trim(), category: formData.category,
        price: Number(formData.price),
        cost_price: Number(formData.cost_price || 0),
        stock_quantity: Number(formData.stock_quantity),
        image_url: formData.image_url.trim(),
        image_urls: formData.image_urls || [],
        technical_specs: Object.keys(specsObj).length ? specsObj : null,
        stock_type: formData.stock_type || 'in_stock',
        outsource_days: Number(formData.outsource_days || 0),
      };
      const isEdit = !!editingProduct;
      const url = isEdit ? `/api/admin/products/${editingProduct.id}` : `/api/admin/products`;
      const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      resetForm(); fetchProducts();
    } catch (err) { setError(err.message || 'Operation failed'); }
    finally { setSubmitting(false); }
  };

  const confirmDeleteProduct = async () => {
    if (!deleteProductTarget) return;
    setError('');
    try {
      const res = await fetch(`/api/admin/products/${deleteProductTarget.id}`, { method: 'DELETE', headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setDeleteProductTarget(null); fetchProducts();
    } catch (err) { setError(err.message); setDeleteProductTarget(null); }
  };

  const saveInlineStock = async (productId) => {
    const qty = inlineStockEdits[productId];
    if (qty === undefined || qty === '') return;
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT', headers: getAuthHeaders(),
        body: JSON.stringify({ stock_quantity: Number(qty) }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      setInlineStockEdits(prev => { const n = { ...prev }; delete n[productId]; return n; });
      fetchProducts();
    } catch (err) { setError(err.message); }
  };

  const getStockStatus = (prod) => {
    if (prod.stock_type === 'outsourced') {
      return { label: `Outsourced (ETA: +${prod.outsource_days || 0} days)`, className: 'badge-neutral' };
    }
    const qty = prod.stock_quantity;
    if (qty < 0) return { label: `Backordered (${Math.abs(qty)})`, className: 'badge-danger' };
    if (qty === 0) return { label: 'Available (On-Demand)', className: 'badge-neutral' };
    if (qty <= settings.lowStockThreshold) return { label: 'Low Stock', className: 'badge-warning' };
    return { label: 'In Stock', className: 'badge-success' };
  };

  /* ══════════════════════════════════════════
     USER ACTIONS
  ══════════════════════════════════════════ */
  const openUserDetail = async (u) => {
    setUserDetailTarget(u);
    setUserEditForm({ email: u.email, role: u.role });
    setWalletForm({ action: 'deposit', amount: '', reference: '', submitting: false });
    setNewPassword('');
    setUserDetailOrders([]);
    setUserDetailOrdersLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${u.id}/orders`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok) setUserDetailOrders(data);
    } catch (err) { console.error(err); }
    finally { setUserDetailOrdersLoading(false); }
  };

  const handleWalletAdjustment = async (e) => {
    e.preventDefault();
    if (!walletForm.amount || isNaN(Number(walletForm.amount)) || Number(walletForm.amount) <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }
    setWalletForm(p => ({ ...p, submitting: true }));
    setError('');
    
    let adjustedAmount = Number(walletForm.amount);
    let type = 'deposit';
    
    if (walletForm.action === 'deduct') {
      adjustedAmount = -adjustedAmount;
      type = 'purchase';
    }
    
    try {
      const res = await fetch(`/api/admin/users/${userDetailTarget.id}/credit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          amount: adjustedAmount,
          type: type,
          reference_id: walletForm.reference.trim() || `admin_adj_by_${user.id}`
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update balance');
      
      // Update target and list state
      setUserDetailTarget(prev => ({ ...prev, wallet_balance: data.user.wallet_balance }));
      setUsers(prev => prev.map(usr => usr.id === userDetailTarget.id ? { ...usr, wallet_balance: data.user.wallet_balance } : usr));
      setWalletForm({ action: 'deposit', amount: '', reference: '', submitting: false });
      
      if (activeTab === 'transactions') {
        fetchTransactions();
      }
    } catch (err) {
      setError(err.message);
      setWalletForm(p => ({ ...p, submitting: false }));
    }
  };

  const submitUserEdit = async (e) => {
    e.preventDefault(); setError('');
    try {
      const res = await fetch(`/api/admin/users/${userDetailTarget.id}`, {
        method: 'PUT', headers: getAuthHeaders(),
        body: JSON.stringify({ email: userEditForm.email, role: userEditForm.role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setUserDetailTarget(null); fetchUsers();
    } catch (err) { setError(err.message); }
  };

  const submitPasswordChange = async (e) => {
    e.preventDefault(); setError('');
    if (!newPassword || newPassword.length < 6) { setError('Password must be ≥ 6 characters'); return; }
    try {
      const userId = changingPasswordUser?.id || userDetailTarget?.id;
      const res = await fetch(`/api/admin/users/${userId}/password`, {
        method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setChangingPasswordUser(null); setNewPassword('');
    } catch (err) { setError(err.message); }
  };

  const confirmDeleteUser = async () => {
    if (!deleteUserTarget) return; setError('');
    try {
      const res = await fetch(`/api/admin/users/${deleteUserTarget.id}`, { method: 'DELETE', headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setDeleteUserTarget(null); fetchUsers();
    } catch (err) { setError(err.message); setDeleteUserTarget(null); }
  };

  /* ══════════════════════════════════════════
     ORDER ACTIONS
  ══════════════════════════════════════════ */
  const saveOrderStatus = async (orderId) => {
    const status = inlineStatuses[orderId];
    const payment_status = inlinePaymentStatuses[orderId];
    setSavingOrderStatus(prev => ({ ...prev, [orderId]: true }));
    setError('');
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ status, payment_status }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, payment_status } : o));
    } catch (err) { setError(err.message); }
    finally { setSavingOrderStatus(prev => ({ ...prev, [orderId]: false })); }
  };

  const confirmDeleteOrder = async () => {
    if (!deleteOrderTarget) return; setError('');
    try {
      const res = await fetch(`/api/admin/orders/${deleteOrderTarget.id}`, { method: 'DELETE', headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setDeleteOrderTarget(null); fetchOrders();
    } catch (err) { setError(err.message); setDeleteOrderTarget(null); }
  };

  const exportOrdersCSV = () => {
    const rows = [['Order ID', 'Email', 'Status', 'Total', 'Tracking', 'Date']];
    filteredOrders.forEach(o => {
      rows.push([o.id, o.email, o.status, Number(o.total).toFixed(2), o.tracking_code || '', new Date(o.created_at).toLocaleString()]);
    });
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `orders-export-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  /* ══════════════════════════════════════════
     SETTINGS ACTIONS
  ══════════════════════════════════════════ */
  const handleSettingsSubmit = async (e) => {
    e.preventDefault(); setError(''); setSettingsSaved(false);
    try {
      const res = await fetch(`/api/admin/settings`, {
        method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(settingsForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSettings(settingsForm); setSettingsSaved(true);
      if (fetchSystemConfig) fetchSystemConfig();
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (err) { setError(err.message); }
  };

  const saveRawSetting = async (key) => {
    const value = rawSettingsEdits[key] ?? rawSettings.find(r => r.key_name === key)?.key_value ?? '';
    try {
      const res = await fetch(`/api/admin/settings/raw`, {
        method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ key_name: key, key_value: value }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      fetchRawSettings();
    } catch (err) { setError(err.message); }
  };

  const deleteRawSetting = async (key) => {
    try {
      const res = await fetch(`/api/admin/settings/raw/${encodeURIComponent(key)}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      fetchRawSettings();
    } catch (err) { setError(err.message); }
  };

  const addRawSetting = async () => {
    if (!newRawKey.trim()) return;
    try {
      const res = await fetch(`/api/admin/settings/raw`, {
        method: 'POST', headers: getAuthHeaders(),
        body: JSON.stringify({ key_name: newRawKey.trim(), key_value: newRawValue }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      setNewRawKey(''); setNewRawValue(''); fetchRawSettings();
    } catch (err) { setError(err.message); }
  };

  /* ══════════════════════════════════════════
     FILTERED LISTS
  ══════════════════════════════════════════ */
  const filteredProducts = products
    .filter(p => {
      const s = productSearch.toLowerCase();
      const matchSearch = p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s) || (p.description || '').toLowerCase().includes(s);
      const matchCat = productCategory === 'All' || p.category === productCategory;
      let matchStock = true;
      if (productStock === 'in_stock') matchStock = p.stock_quantity > settings.lowStockThreshold;
      else if (productStock === 'low_stock') matchStock = p.stock_quantity > 0 && p.stock_quantity <= settings.lowStockThreshold;
      else if (productStock === 'out_of_stock') matchStock = p.stock_quantity === 0;
      return matchSearch && matchCat && matchStock;
    })
    .sort((a, b) => {
      const [field, dir] = productSort.split('-'); const f = dir === 'asc' ? 1 : -1;
      if (field === 'price') return (Number(a.price) - Number(b.price)) * f;
      if (field === 'stock') return (a.stock_quantity - b.stock_quantity) * f;
      if (field === 'sku') return a.sku.localeCompare(b.sku) * f;
      return a.name.localeCompare(b.name) * f;
    });

  const filteredUsers = users
    .filter(u => {
      const matchSearch = u.email.toLowerCase().includes(userSearch.toLowerCase());
      const matchRole = userRole === 'All' || u.role === userRole;
      return matchSearch && matchRole;
    })
    .sort((a, b) => {
      const [field, dir] = userSort.split('-'); const f = dir === 'asc' ? 1 : -1;
      if (field === 'id') return (a.id - b.id) * f;
      if (field === 'created') return (new Date(a.created_at) - new Date(b.created_at)) * f;
      if (field === 'role') return a.role.localeCompare(b.role) * f;
      if (field === 'orders') return ((a.order_count || 0) - (b.order_count || 0)) * f;
      return a.email.localeCompare(b.email) * f;
    });

  const filteredCarts = carts.filter(c => {
    const s = cartSearch.toLowerCase();
    return (c.email.toLowerCase().includes(s) || c.product_name.toLowerCase().includes(s) || c.sku.toLowerCase().includes(s))
      && (cartCategory === 'All' || c.category === cartCategory);
  });
  const cartsGrouped = {};
  filteredCarts.forEach(item => {
    if (!cartsGrouped[item.email]) cartsGrouped[item.email] = { email: item.email, userId: item.user_id, items: [], totalValue: 0, totalQuantity: 0 };
    cartsGrouped[item.email].items.push(item);
    cartsGrouped[item.email].totalValue += Number(item.price) * item.quantity;
    cartsGrouped[item.email].totalQuantity += item.quantity;
  });
  const sortedGroupedCarts = Object.values(cartsGrouped).sort((a, b) => {
    const [field, dir] = cartSort.split('-'); const f = dir === 'asc' ? 1 : -1;
    if (field === 'total') return (a.totalValue - b.totalValue) * f;
    if (field === 'items') return (a.totalQuantity - b.totalQuantity) * f;
    return a.email.localeCompare(b.email) * f;
  });

  const filteredOrders = orders
    .filter(o => {
      const s = orderSearch.toLowerCase();
      const matchSearch = String(o.id).includes(s) || o.email.toLowerCase().includes(s)
        || (o.tracking_code || '').toLowerCase().includes(s);
      const matchStatus = orderStatus === 'All' || o.status === orderStatus;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      const [field, dir] = orderSort.split('-'); const f = dir === 'asc' ? 1 : -1;
      if (field === 'id') return (a.id - b.id) * f;
      if (field === 'total') return (Number(a.total) - Number(b.total)) * f;
      return (new Date(a.created_at) - new Date(b.created_at)) * f;
    });

  const orderRevenue = filteredOrders
    .filter(o => o.status !== 'cancelled')
    .reduce((s, o) => s + Number(o.total), 0);

  /* ══════════════════════════════════════════
     RENDER — SIDEBAR
  ══════════════════════════════════════════ */
  const renderSidebar = () => (
    <>
      {sidebarOpen && <div className="admin-sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-brand">
          HIMALIX <span style={{ opacity: 0.5, fontWeight: 400 }}>ADMIN</span>
        </div>
        <nav className="admin-sidebar-nav">
          {[
            { key: 'overview', icon: 'fa-chart-line', label: 'Overview' },
            { key: 'analytics', icon: 'fa-chart-pie', label: 'Analytics' },
            { key: 'products', icon: 'fa-boxes-stacked', label: 'Products' },
            { key: 'users', icon: 'fa-users', label: 'Users' },
            { key: 'carts', icon: 'fa-cart-shopping', label: 'Cart Audits' },
            { key: 'orders', icon: 'fa-credit-card', label: 'Orders' },
            { key: 'reviews', icon: 'fa-comments', label: 'Reviews' },
            { key: 'transactions', icon: 'fa-wallet', label: 'Wallet Ledger' },
            { key: 'social_claims', icon: 'fa-thumbs-up', label: 'Social Claims' },
            { key: 'settings', icon: 'fa-sliders', label: 'Settings' },
            { key: 'guide', icon: 'fa-book-open', label: 'Guide' },
          ].map(({ key, icon, label }) => (
            <button
              key={key}
              className={`admin-sidebar-item ${activeTab === key ? 'active' : ''}`}
              onClick={() => { setActiveTab(key); if (key === 'products') resetForm(); setSidebarOpen(false); }}
            >
              <i className={`fa-sharp-duotone fa-light ${icon}`}></i>
              {label}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-profile">
            <i className="fa-sharp-duotone fa-light fa-user-shield"></i>
            <span className="admin-sidebar-profile-email" title={user?.email}>{user?.email}</span>
          </div>
          <Link to="/" className="admin-sidebar-storefront-btn" onClick={() => setSidebarOpen(false)}>
            <i className="fa-sharp-duotone fa-light fa-store"></i> Visit Storefront
          </Link>
          <button onClick={() => { logout(); navigate('/'); }} className="admin-sidebar-logout-btn">
            <i className="fa-sharp-duotone fa-light fa-right-from-bracket"></i> Logout
          </button>
        </div>
      </aside>
    </>
  );

  /* ══════════════════════════════════════════
     RENDER — OVERVIEW
  ══════════════════════════════════════════ */
  const renderOverviewTab = () => {
    const pending = analytics?.ordersByStatus?.find(s => s.status === 'pending');
    const totalUsers = analytics?.userCounts?.reduce((s, r) => s + Number(r.count), 0) || 0;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Revenue cards */}
        <div className="overview-revenue-grid">
          <div className="overview-revenue-card revenue">
            <div className="overview-revenue-label">Total Revenue</div>
            <div className="overview-revenue-value">रु {(analytics?.totalRevenue || 0).toFixed(2)}</div>
            <div className="overview-revenue-sub">{analytics?.totalOrders || 0} fulfilled orders</div>
          </div>
          <div className="overview-revenue-card orders">
            <div className="overview-revenue-label">Avg Order Value</div>
            <div className="overview-revenue-value">रु {(analytics?.avgOrderValue || 0).toFixed(2)}</div>
            <div className="overview-revenue-sub">per completed transaction</div>
          </div>
          <div className="overview-revenue-card pending">
            <div className="overview-revenue-label">Pending Orders</div>
            <div className="overview-revenue-value">{pending?.count || 0}</div>
            <div className="overview-revenue-sub">रु {Number(pending?.revenue || 0).toFixed(2)} awaiting</div>
          </div>
          <div className="overview-revenue-card users">
            <div className="overview-revenue-label">Total Users</div>
            <div className="overview-revenue-value">{totalUsers}</div>
            <div className="role-pills">
              {analytics?.userCounts?.map(r => (
                <span key={r.role} className="role-pill">
                  <span className="count">{r.count}</span> {r.role}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Inventory stats */}
          <div className="stat-card" style={{ padding: '24px' }}>
            <h4 style={{ fontWeight: 800, marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              Inventory Summary
            </h4>
            <div className="system-health-grid">
              <div className="system-health-item"><span className="label">Total SKUs</span><span className="value">{stats.total}</span></div>
              <div className="system-health-item"><span className="label">Total Units</span><span className="value">{stats.totalStock}</span></div>
              <div className="system-health-item"><span className="label" style={{ color: 'var(--warning-text)' }}>Low Stock</span><span className="value" style={{ color: 'var(--warning-text)' }}>{stats.lowCount}</span></div>
              <div className="system-health-item"><span className="label" style={{ color: 'var(--danger)' }}>Out of Stock</span><span className="value" style={{ color: 'var(--danger)' }}>{stats.outCount}</span></div>
            </div>
          </div>

          {/* System config */}
          <div className="stat-card" style={{ padding: '24px' }}>
            <h4 style={{ fontWeight: 800, marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              Active Configuration
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', fontFamily: 'var(--font-mono)' }}>
              <div>Tax Rate: <strong>{settings.salesTaxRate}%</strong></div>
              <div>Low Stock Level: <strong>≤ {settings.lowStockThreshold} units</strong></div>
              <div>Maintenance Mode: <strong style={{ color: settings.maintenanceMode ? 'var(--danger)' : 'var(--success)' }}>{settings.maintenanceMode ? 'ACTIVE' : 'INACTIVE'}</strong></div>
              <div>Google Auth: <strong>{settings.googleAuthEnabled ? 'Enabled' : 'Disabled'}</strong></div>
              <div>Delivery: <strong>रु {Number(settings.deliveryPerKmRate).toFixed(2)}/km (Min रु {Number(settings.deliveryMinCharge).toFixed(2)})</strong></div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="stat-card" style={{ padding: '24px' }}>
            <h4 style={{ fontWeight: 800, marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              Quick Actions
            </h4>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-sm" onClick={() => { setActiveTab('products'); openCreateForm(); }}>
                <i className="fa-sharp-duotone fa-light fa-plus"></i> New Product
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('orders')}>
                <i className="fa-sharp-duotone fa-light fa-credit-card"></i> View Orders
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('settings')}>
                <i className="fa-sharp-duotone fa-light fa-sliders"></i> Settings
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('analytics')}>
                <i className="fa-sharp-duotone fa-light fa-chart-pie"></i> Analytics
              </button>
            </div>
          </div>

          {/* Low stock alerts */}
          {stats.lowProducts.length > 0 && (
            <div className="stat-card" style={{ padding: '24px' }}>
              <h4 style={{ fontWeight: 800, marginBottom: '16px', borderBottom: '1px solid var(--warning-border)', paddingBottom: '8px', color: 'var(--warning-text)' }}>
                <i className="fa-sharp-duotone fa-light fa-triangle-exclamation" style={{ marginRight: '8px' }}></i>
                Low Stock Alerts
              </h4>
              <div className="low-stock-alert-list">
                {stats.lowProducts.slice(0, 5).map(p => (
                  <div key={p.id} className="low-stock-alert-item">
                    <span className="product-name">{p.name}</span>
                    <span className="stock-count">{p.stock_quantity} left</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent orders */}
          {analytics?.recentOrders?.length > 0 && (
            <div className="stat-card" style={{ padding: '24px' }}>
              <h4 style={{ fontWeight: 800, marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                Recent Orders
              </h4>
              <div className="recent-orders-list">
                {analytics.recentOrders.map(o => (
                  <div key={o.id} className="recent-order-row">
                    <span className="recent-order-id">#{o.id}</span>
                    <span className="recent-order-email">{o.email || 'Guest'}</span>
                    <StatusBadge status={o.status} />
                    <span className="recent-order-amount">रु {Number(o.total_amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════
     RENDER — ANALYTICS
  ══════════════════════════════════════════ */
  const renderAnalyticsTab = () => {
    if (analyticsLoading) return <div className="loading-spinner"><div className="spinner"></div></div>;
    if (!analytics) return <div className="empty-state"><p>No analytics data available.</p></div>;

    const maxRevenue = Math.max(...analytics.daily7.map(d => d.revenue), 1);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
        {/* Summary cards */}
        <div>
          <div className="analytics-section-title">Revenue Summary</div>
          <div className="analytics-summary-grid">
            <div className="analytics-summary-card">
              <div className="analytics-summary-label">Total Revenue</div>
              <div className="analytics-summary-value">रु {analytics.totalRevenue.toFixed(2)}</div>
              <div className="analytics-summary-sub">All time (exc. cancelled)</div>
            </div>
            <div className="analytics-summary-card">
              <div className="analytics-summary-label">Total Orders</div>
              <div className="analytics-summary-value">{analytics.totalOrders}</div>
              <div className="analytics-summary-sub">Fulfilled orders</div>
            </div>
            <div className="analytics-summary-card">
              <div className="analytics-summary-label">Avg Order Value</div>
              <div className="analytics-summary-value">रु {analytics.avgOrderValue.toFixed(2)}</div>
              <div className="analytics-summary-sub">Per transaction</div>
            </div>
            {analytics.ordersByStatus.map(s => (
              <div key={s.status} className="analytics-summary-card">
                <div className="analytics-summary-label">{s.status} Orders</div>
                <div className="analytics-summary-value">{s.count}</div>
                <div className="analytics-summary-sub">रु {Number(s.revenue).toFixed(2)} revenue</div>
              </div>
            ))}
          </div>
        </div>

        {/* 7-day revenue bar chart */}
        <div>
          <div className="analytics-section-title">7-Day Revenue</div>
          <div className="analytics-bar-chart">
            {analytics.daily7.map((d, i) => {
              const pct = maxRevenue > 0 ? (d.revenue / maxRevenue) * 100 : 0;
              const label = new Date(d.day).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
              return (
                <div key={i} className="analytics-bar-col">
                  <div
                    className="analytics-bar"
                    style={{ height: `${Math.max(pct, 2)}%` }}
                    data-tooltip={`${label}: रु ${d.revenue.toFixed(2)} (${d.order_count} orders)`}
                  ></div>
                  <div className="analytics-bar-label">{new Date(d.day).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top products */}
        <div>
          <div className="analytics-section-title">Top Products by Units Sold</div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Units Sold</th>
                  <th>Revenue Generated</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topProducts.map((p, i) => (
                  <tr key={p.id}>
                    <td><span className="top-products-rank">{i + 1}</span></td>
                    <td><strong>{p.name}</strong></td>
                    <td className="cell-mono">{p.sku}</td>
                    <td><span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>{p.category || 'Other'}</span></td>
                    <td className="cell-mono"><strong>{p.units_sold}</strong></td>
                    <td className="cell-mono">रु {p.revenue_generated.toFixed(2)}</td>
                  </tr>
                ))}
                {analytics.topProducts.length === 0 && (
                  <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>No order data yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category breakdown */}
        <div>
          <div className="analytics-section-title">Inventory by Category</div>
          <div className="analytics-category-grid">
            {analytics.categoryBreakdown.map(c => (
              <div key={c.category} className="analytics-category-card">
                <div className="analytics-category-name">{c.category}</div>
                <div className="analytics-category-count">{c.product_count}</div>
                <div className="analytics-category-stock">{c.total_stock} units total</div>
              </div>
            ))}
          </div>
        </div>

        {/* User breakdown */}
        <div>
          <div className="analytics-section-title">User Accounts by Role</div>
          <div className="analytics-category-grid">
            {analytics.userCounts.map(r => (
              <div key={r.role} className="analytics-category-card">
                <div className="analytics-category-name">{r.role}</div>
                <div className="analytics-category-count">{r.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════
     RENDER — PRODUCTS
  ══════════════════════════════════════════ */
  const renderProductsTab = () => {
    if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

    return (
      <>
        {/* Toolbar */}
        <div className="admin-toolbar" style={{ borderBottom: 'none', marginBottom: '8px' }}>
          <div className="admin-toolbar-left">
            <h4>Products Inventory</h4>
            <span className="font-mono text-muted" style={{ fontSize: '0.8125rem' }}>
              {filteredProducts.length} / {products.length} records
            </span>
          </div>
          <div className="admin-toolbar-right" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div className="admin-view-toggle">
              <button className={`admin-view-toggle-btn ${productView === 'card' ? 'active' : ''}`} onClick={() => setProductView('card')}>
                <i className="fa-sharp-duotone fa-light fa-grid-2"></i> Cards
              </button>
              <button className={`admin-view-toggle-btn ${productView === 'table' ? 'active' : ''}`} onClick={() => setProductView('table')}>
                <i className="fa-sharp-duotone fa-light fa-table-list"></i> Table
              </button>
            </div>
            <button className="btn btn-primary btn-sm" onClick={openCreateForm}>
              <i className="fa-sharp-duotone fa-light fa-plus" style={{ marginRight: '6px' }}></i> New Product
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="admin-toolbar-row">
          <div className="admin-toolbar-search">
            <i className="fa-sharp-duotone fa-light fa-magnifying-glass admin-toolbar-search-icon"></i>
            <input type="text" placeholder="Search name, SKU, description..." value={productSearch} onChange={e => setProductSearch(e.target.value)} />
          </div>
          <div className="admin-toolbar-filter">
            <label>Category</label>
            <select value={productCategory} onChange={e => setProductCategory(e.target.value)}>
              <option value="All">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="admin-toolbar-filter">
            <label>Stock</label>
            <select value={productStock} onChange={e => setProductStock(e.target.value)}>
              <option value="All">All Stock Levels</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
          <div className="admin-toolbar-sort">
            <label>Sort By</label>
            <select value={productSort} onChange={e => setProductSort(e.target.value)}>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="price-asc">Price (Low-High)</option>
              <option value="price-desc">Price (High-Low)</option>
              <option value="stock-asc">Stock (Low-High)</option>
              <option value="stock-desc">Stock (High-Low)</option>
              <option value="sku-asc">SKU (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Create/Edit Modal */}
        <Modal isOpen={showForm} onClose={resetForm} title={editingProduct ? 'Edit Product' : 'Create New Product'} size="lg">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input type="text" name="name" className={`form-input ${formErrors.name ? 'error' : ''}`} value={formData.name} onChange={handleFormChange} placeholder="Product name" />
                {formErrors.name && <div className="form-error">{formErrors.name}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">SKU *</label>
                <input type="text" name="sku" className={`form-input ${formErrors.sku ? 'error' : ''}`} value={formData.sku} onChange={handleFormChange} placeholder="e.g. MCU-ESP32-DEV" style={{ fontFamily: 'var(--font-mono)' }} />
                {formErrors.sku && <div className="form-error">{formErrors.sku}</div>}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea name="description" className="form-input form-textarea" value={formData.description} onChange={handleFormChange} placeholder="Product description" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select name="category" className="form-select" value={formData.category} onChange={handleFormChange}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Product Images</label>
                <div className="image-upload-wrapper">
                  <label className={`image-upload-dropzone ${isDragging ? 'dragging' : ''}`}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
                    onDrop={e => { e.preventDefault(); setIsDragging(false); uploadMultipleFiles(Array.from(e.dataTransfer.files)); }}>
                    <i className="fa-sharp-duotone fa-light fa-cloud-arrow-up image-upload-icon"></i>
                    <span className="image-upload-text">Drag & drop, click, or paste (Ctrl+V)</span>
                    <span className="image-upload-subtext">JPG, PNG, WebP up to 5MB (Multiple Allowed)</span>
                    <input type="file" accept="image/*" multiple onChange={e => uploadMultipleFiles(Array.from(e.target.files))} style={{ display: 'none' }} />
                  </label>
                  {uploadingImage && <div className="image-upload-loader"><i className="fa-sharp-duotone fa-light fa-spinner fa-spin"></i><span>Uploading...</span></div>}
                  {formData.image_urls && formData.image_urls.length > 0 && (
                    <div className="image-upload-previews-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '10px', marginTop: '12px' }}>
                      {formData.image_urls.map((url, idx) => (
                        <div key={idx} className="image-upload-preview-card" style={{ position: 'relative', border: '1px solid var(--border)', padding: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#fafafa' }}>
                          <img src={url} alt={`Preview ${idx}`} style={{ width: '100%', height: '70px', objectFit: 'cover' }} />
                          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '4px 0 0', gap: '4px' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              title="Set as Main Image"
                              style={{ padding: '2px 4px', fontSize: '0.65rem', flex: 1, border: 'radius 0', height: '22px' }}
                              onClick={() => setFormData(p => ({ ...p, image_url: url }))}
                            >
                              {formData.image_url === url ? '★ Main' : 'Main'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              title="Remove"
                              style={{ padding: '2px 4px', fontSize: '0.65rem', height: '22px' }}
                              onClick={() => setFormData(p => {
                                const newUrls = p.image_urls.filter((_, i) => i !== idx);
                                return {
                                  ...p,
                                  image_urls: newUrls,
                                  image_url: p.image_url === url ? (newUrls[0] || '') : p.image_url
                                };
                              })}
                            >
                              <i className="fa-sharp-duotone fa-light fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Retail Price (रु) *</label>
                <input type="number" name="price" className={`form-input ${formErrors.price ? 'error' : ''}`} value={formData.price} onChange={handleFormChange} placeholder="0.00" step="0.01" min="0" style={{ fontFamily: 'var(--font-mono)' }} />
                {formErrors.price && <div className="form-error">{formErrors.price}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Cost Price (रु)</label>
                <input type="number" name="cost_price" className={`form-input ${formErrors.cost_price ? 'error' : ''}`} value={formData.cost_price} onChange={handleFormChange} placeholder="0.00" step="0.01" min="0" style={{ fontFamily: 'var(--font-mono)' }} />
                {formErrors.cost_price && <div className="form-error">{formErrors.cost_price}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Stock Quantity *</label>
                <input
                  type="number"
                  name="stock_quantity"
                  className={`form-input ${formErrors.stock_quantity ? 'error' : ''}`}
                  value={formData.stock_type === 'outsourced' ? 0 : formData.stock_quantity}
                  onChange={handleFormChange}
                  disabled={formData.stock_type === 'outsourced'}
                  placeholder="0"
                  step="1"
                  min="0"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    backgroundColor: formData.stock_type === 'outsourced' ? '#f1f5f9' : 'inherit',
                    color: formData.stock_type === 'outsourced' ? '#64748b' : 'inherit',
                    cursor: formData.stock_type === 'outsourced' ? 'not-allowed' : 'default',
                    opacity: formData.stock_type === 'outsourced' ? 0.7 : 1
                  }}
                />
                {formErrors.stock_quantity && <div className="form-error">{formErrors.stock_quantity}</div>}
              </div>
            </div>
            <div className="form-row" style={{ marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label">Stock Type *</label>
                <select name="stock_type" className="form-select" value={formData.stock_type} onChange={handleFormChange} style={{ borderRadius: 0 }}>
                  <option value="in_stock">In Stock</option>
                  <option value="outsourced">To be Outsourced</option>
                </select>
              </div>
              {formData.stock_type === 'outsourced' && (
                <div className="form-group">
                  <label className="form-label">Estimated Outsource Days *</label>
                  <input type="number" name="outsource_days" className="form-input" value={formData.outsource_days} onChange={handleFormChange} placeholder="e.g. 3" min="0" style={{ fontFamily: 'var(--font-mono)', borderRadius: 0 }} required />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Number of days expected to procure this item from external source.</p>
                </div>
              )}
            </div>
            <div className="form-group">
              <div className="spec-builder-header">
                <label className="form-label" style={{ margin: 0 }}>Technical Specifications</label>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setTechnicalSpecsPairs(p => [...p, { key: '', value: '' }])}>
                  <i className="fa-sharp-duotone fa-light fa-plus" style={{ marginRight: '4px' }}></i> Add Row
                </button>
              </div>
              <div className="spec-builder-container">
                {technicalSpecsPairs.map((pair, idx) => (
                  <div className="spec-builder-row" key={idx}>
                    <input type="text" className="form-input" placeholder="Property (e.g. Voltage)" value={pair.key}
                      onChange={e => { const u = [...technicalSpecsPairs]; u[idx].key = e.target.value; setTechnicalSpecsPairs(u); }} />
                    <input type="text" className="form-input" placeholder="Value (e.g. 5V)" value={pair.value}
                      onChange={e => { const u = [...technicalSpecsPairs]; u[idx].value = e.target.value; setTechnicalSpecsPairs(u); }} />
                    <button type="button" className="btn btn-danger btn-sm" style={{ padding: '8px', minWidth: '36px' }}
                      onClick={() => { const u = technicalSpecsPairs.filter((_, i) => i !== idx); setTechnicalSpecsPairs(u.length ? u : [{ key: '', value: '' }]); }}>
                      <i className="fa-sharp-duotone fa-light fa-trash"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <button type="button" className="btn btn-outline" onClick={resetForm} disabled={submitting}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                <i className="fa-sharp-duotone fa-light fa-floppy-disk" style={{ marginRight: '6px' }}></i>
                {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Product List */}
        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><i className="fa-sharp-duotone fa-light fa-boxes-packing"></i></div>
            <h3>No Products Found</h3>
            <p>Refine your search or filters.</p>
          </div>
        ) : productView === 'card' ? (
          <div className="product-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {filteredProducts.map(product => {
              const stockStatus = getStockStatus(product);
              const editingStock = inlineStockEdits[product.id] !== undefined;
              return (
                <div className="product-card" key={product.id}>
                  <div className="product-card-image" style={{ height: '160px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                    {product.image_url ? <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span className="text-muted" style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>No Image</span>}
                  </div>
                  <div className="product-card-body" style={{ padding: '16px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <span className="product-card-category">{product.category || 'Uncategorized'}</span>
                    <h3 className="product-card-name" style={{ fontSize: '0.95rem', fontWeight: 700, margin: '4px 0' }}>{product.name}</h3>
                    <p className="product-card-sku" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SKU: {product.sku}</p>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', margin: '8px 0' }}>
                      <span className={`badge ${stockStatus.className}`}>{stockStatus.label}</span>
                    </div>
                    <div className="flex-between" style={{ marginTop: 'auto', paddingTop: '10px', gap: '8px' }}>
                      <span className="product-card-price" style={{ margin: 0, fontSize: '1.05rem' }}>रु {Number(product.price).toFixed(2)}</span>
                      <div className="inline-stock-edit">
                        <input
                          type="number" min="0" step="1"
                          value={editingStock ? inlineStockEdits[product.id] : product.stock_quantity}
                          onChange={e => setInlineStockEdits(prev => ({ ...prev, [product.id]: e.target.value }))}
                          onFocus={() => { if (!editingStock) setInlineStockEdits(prev => ({ ...prev, [product.id]: product.stock_quantity })); }}
                        />
                        {editingStock && (
                          <>
                            <button onClick={() => saveInlineStock(product.id)} title="Save stock">
                              <i className="fa-sharp-duotone fa-light fa-check"></i>
                            </button>
                            <button onClick={() => setInlineStockEdits(prev => { const n = { ...prev }; delete n[product.id]; return n; })} title="Cancel">
                              <i className="fa-sharp-duotone fa-light fa-xmark"></i>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="cell-actions" style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', background: '#fafafa' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEditForm(product)} style={{ width: '100%' }}>
                      <i className="fa-sharp-duotone fa-light fa-pen-to-square"></i> Edit
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => openDuplicateForm(product)} style={{ width: '100%' }} title="Duplicate product">
                      <i className="fa-sharp-duotone fa-light fa-copy"></i> Dupe
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteProductTarget(product)} style={{ width: '100%' }}>
                      <i className="fa-sharp-duotone fa-light fa-trash"></i> Del
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: '12px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th><th>Image</th><th>Name / SKU</th><th>Category</th>
                  <th>Price</th><th>Stock</th><th>Stock Type</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => {
                  const stockStatus = getStockStatus(product);
                  const editingStock = inlineStockEdits[product.id] !== undefined;
                  return (
                    <tr key={product.id}>
                      <td className="cell-mono" style={{ color: 'var(--text-muted)' }}>{product.id}</td>
                      <td>
                        {product.image_url
                          ? <img src={product.image_url} alt="" style={{ width: 40, height: 40, objectFit: 'cover', border: '1px solid var(--border)' }} />
                          : <div style={{ width: 40, height: 40, background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: 'var(--text-muted)' }}>IMG</div>}
                      </td>
                      <td>
                        <strong style={{ display: 'block' }}>{product.name}</strong>
                        <span className="cell-mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{product.sku}</span>
                      </td>
                      <td><span className="badge badge-neutral" style={{ fontSize: '0.68rem' }}>{product.category || 'Other'}</span></td>
                      <td className="cell-mono">रु {Number(product.price).toFixed(2)}</td>
                      <td>
                        <div className="inline-stock-edit">
                          <input
                            type="number" min="0" step="1"
                            value={editingStock ? inlineStockEdits[product.id] : product.stock_quantity}
                            onChange={e => setInlineStockEdits(prev => ({ ...prev, [product.id]: e.target.value }))}
                            onFocus={() => { if (!editingStock) setInlineStockEdits(prev => ({ ...prev, [product.id]: product.stock_quantity })); }}
                          />
                          {editingStock && (
                            <>
                              <button onClick={() => saveInlineStock(product.id)}><i className="fa-sharp-duotone fa-light fa-check"></i></button>
                              <button onClick={() => setInlineStockEdits(prev => { const n = { ...prev }; delete n[product.id]; return n; })}><i className="fa-sharp-duotone fa-light fa-xmark"></i></button>
                            </>
                          )}
                        </div>
                        <div style={{ marginTop: '4px' }}><span className={`badge ${stockStatus.className}`} style={{ fontSize: '0.65rem' }}>{stockStatus.label}</span></div>
                      </td>
                      <td>{product.stock_type === 'outsourced' ? <span className="badge badge-neutral" style={{ fontSize: '0.68rem' }}>Outsourced (+{product.outsource_days}d)</span> : <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>In Stock</span>}</td>
                      <td>
                        <div className="cell-actions">
                          <button className="btn btn-secondary btn-sm" onClick={() => openEditForm(product)}><i className="fa-sharp-duotone fa-light fa-pen-to-square"></i> Edit</button>
                          <button className="btn btn-outline btn-sm" onClick={() => openDuplicateForm(product)} title="Duplicate"><i className="fa-sharp-duotone fa-light fa-copy"></i></button>
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteProductTarget(product)}><i className="fa-sharp-duotone fa-light fa-trash"></i></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </>
    );
  };

  /* ══════════════════════════════════════════
     RENDER — USERS
  ══════════════════════════════════════════ */
  const renderUsersTab = () => {
    if (usersLoading) return <div className="loading-spinner"><div className="spinner"></div></div>;
    return (
      <>
        <div className="admin-toolbar" style={{ borderBottom: 'none', marginBottom: '8px' }}>
          <div className="admin-toolbar-left">
            <h4>Users Database</h4>
            <span className="font-mono text-muted" style={{ fontSize: '0.8125rem' }}>{filteredUsers.length} / {users.length} records</span>
          </div>
        </div>
        <div className="admin-toolbar-row">
          <div className="admin-toolbar-search">
            <i className="fa-sharp-duotone fa-light fa-magnifying-glass admin-toolbar-search-icon"></i>
            <input type="text" placeholder="Search by email..." value={userSearch} onChange={e => setUserSearch(e.target.value)} />
          </div>
          <div className="admin-toolbar-filter">
            <label>Role</label>
            <select value={userRole} onChange={e => setUserRole(e.target.value)}>
              <option value="All">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="admin-toolbar-sort">
            <label>Sort By</label>
            <select value={userSort} onChange={e => setUserSort(e.target.value)}>
              <option value="created-desc">Newest First</option>
              <option value="created-asc">Oldest First</option>
              <option value="email-asc">Email (A-Z)</option>
              <option value="orders-desc">Most Orders</option>
              <option value="role-asc">Role</option>
            </select>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon"><i className="fa-sharp-duotone fa-light fa-users-slash"></i></div><h3>No Users Found</h3></div>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: '12px' }}>
            <table className="data-table">
              <thead>
                <tr><th>Avatar</th><th>Email</th><th>Role</th><th>Auth</th><th>Balance</th><th>Orders</th><th>Joined</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td><UserAvatar user={u} size="sm" /></td>
                    <td><strong>{u.email}</strong></td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-success' : 'badge-neutral'}`}>{u.role}</span>
                    </td>
                    <td>
                      <span className={`auth-provider-badge ${u.auth_provider}`}>
                        {u.auth_provider === 'google' ? <><i className="fa-brands fa-google"></i> Google</> : <><i className="fa-sharp-duotone fa-light fa-key"></i> Local</>}
                      </span>
                    </td>
                    <td className="cell-mono" style={{ fontWeight: 700 }}>रु {Number(u.wallet_balance || 0).toFixed(2)}</td>
                    <td className="cell-mono">{u.order_count || 0}</td>
                    <td className="cell-mono" style={{ fontSize: '0.78rem' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="cell-actions">
                        <button className="btn btn-outline btn-sm" onClick={() => openUserDetail(u)}>
                          <i className="fa-sharp-duotone fa-light fa-user-pen" style={{ marginRight: '4px' }}></i> Manage
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteUserTarget(u)}>
                          <i className="fa-sharp-duotone fa-light fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>
    );
  };

  /* ══════════════════════════════════════════
     RENDER — CARTS
  ══════════════════════════════════════════ */
  const renderCartsTab = () => {
    if (cartsLoading) return <div className="loading-spinner"><div className="spinner"></div></div>;
    if (carts.length === 0) return (
      <div className="empty-state"><div className="empty-state-icon"><i className="fa-sharp-duotone fa-light fa-cart-shopping"></i></div><h3>All Carts Empty</h3><p>No users have items in their shopping cart.</p></div>
    );
    return (
      <>
        <div className="admin-toolbar" style={{ borderBottom: 'none', marginBottom: '8px' }}>
          <div className="admin-toolbar-left">
            <h4>Active Shopping Carts</h4>
            <span className="font-mono text-muted" style={{ fontSize: '0.8125rem' }}>{sortedGroupedCarts.length} active users</span>
          </div>
        </div>
        <div className="admin-toolbar-row">
          <div className="admin-toolbar-search">
            <i className="fa-sharp-duotone fa-light fa-magnifying-glass admin-toolbar-search-icon"></i>
            <input type="text" placeholder="Search by email, product name, SKU..." value={cartSearch} onChange={e => setCartSearch(e.target.value)} />
          </div>
          <div className="admin-toolbar-filter">
            <label>Category</label>
            <select value={cartCategory} onChange={e => setCartCategory(e.target.value)}>
              <option value="All">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="admin-toolbar-sort">
            <label>Sort By</label>
            <select value={cartSort} onChange={e => setCartSort(e.target.value)}>
              <option value="email-asc">Email (A-Z)</option>
              <option value="total-desc">Cart Value (High-Low)</option>
              <option value="items-desc">Total Items (High-Low)</option>
            </select>
          </div>
        </div>
        {sortedGroupedCarts.length === 0 ? (
          <div className="empty-state"><h3>No Matching Carts</h3></div>
        ) : (
          <div className="cart-audit-list">
            {sortedGroupedCarts.map(g => {
              const expanded = !!expandedUserCarts[g.email];
              return (
                <div className="cart-audit-user-card" key={g.email}>
                  <div className="cart-audit-header" onClick={() => setExpandedUserCarts(prev => ({ ...prev, [g.email]: !expanded }))}>
                    <div className="cart-audit-header-left">
                      <i className="fa-sharp-duotone fa-light fa-user" style={{ color: 'var(--text-secondary)' }}></i>
                      <span className="cart-audit-email">{g.email}</span>
                    </div>
                    <div className="cart-audit-header-right">
                      <div className="cart-audit-stats">
                        <span>Products: <strong>{g.items.length}</strong></span>
                        <span>Qty: <strong>{g.totalQuantity}</strong></span>
                        <span>Value: <strong>रु {g.totalValue.toFixed(2)}</strong></span>
                      </div>
                      <i className={`fa-sharp-duotone fa-light fa-chevron-down cart-audit-chevron ${expanded ? 'open' : ''}`}></i>
                    </div>
                  </div>
                  {expanded && (
                    <div className="cart-audit-details">
                      <table className="data-table" style={{ margin: 0 }}>
                        <thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Unit Price</th><th>Qty</th><th>Total</th></tr></thead>
                        <tbody>
                          {g.items.map(item => (
                            <tr key={item.id}>
                              <td><strong>{item.product_name}</strong></td>
                              <td className="cell-mono">{item.sku}</td>
                              <td><span className="badge badge-neutral" style={{ fontSize: '0.68rem' }}>{item.category || 'Other'}</span></td>
                              <td className="cell-mono">रु {Number(item.price).toFixed(2)}</td>
                              <td className="cell-mono">{item.quantity}</td>
                              <td className="cell-mono"><strong>रु {(item.price * item.quantity).toFixed(2)}</strong></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </>
    );
  };

  /* ══════════════════════════════════════════
     RENDER — ORDERS
  ══════════════════════════════════════════ */
  const renderOrdersTab = () => {
    if (ordersLoading) return <div className="loading-spinner"><div className="spinner"></div></div>;
    if (orders.length === 0) return (
      <div className="empty-state"><div className="empty-state-icon"><i className="fa-sharp-duotone fa-light fa-credit-card"></i></div><h3>No Orders Yet</h3><p>Completed checkouts will appear here.</p></div>
    );
    return (
      <>
        <div className="admin-toolbar" style={{ borderBottom: 'none', marginBottom: '8px' }}>
          <div className="admin-toolbar-left">
            <h4>Order Transactions</h4>
            <span className="font-mono text-muted" style={{ fontSize: '0.8125rem' }}>{filteredOrders.length} / {orders.length} orders</span>
          </div>
          <div className="admin-toolbar-right">
            <button className="btn btn-export btn-sm" onClick={exportOrdersCSV}>
              <i className="fa-sharp-duotone fa-light fa-file-csv" style={{ marginRight: '6px' }}></i> Export CSV
            </button>
          </div>
        </div>
        <div className="admin-toolbar-row">
          <div className="admin-toolbar-search">
            <i className="fa-sharp-duotone fa-light fa-magnifying-glass admin-toolbar-search-icon"></i>
            <input type="text" placeholder="Search by ID, email, tracking code..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)} />
          </div>
          <div className="admin-toolbar-filter">
            <label>Status</label>
            <select value={orderStatus} onChange={e => setOrderStatus(e.target.value)}>
              <option value="All">All Statuses</option>
              {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="admin-toolbar-sort">
            <label>Sort By</label>
            <select value={orderSort} onChange={e => setOrderSort(e.target.value)}>
              <option value="date-desc">Date (Newest)</option>
              <option value="date-asc">Date (Oldest)</option>
              <option value="total-desc">Total (High-Low)</option>
              <option value="id-asc">Order ID (Asc)</option>
            </select>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="empty-state"><h3>No Matching Orders</h3></div>
        ) : (
          <>
            <div style={{ overflowX: 'auto', marginTop: '12px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '24px' }}></th>
                    <th>Order ID</th><th>Email</th><th>Date</th>
                    <th>Total</th><th>Payment Method</th><th>Payment Status</th><th>Shipping Status</th><th>Tracking</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(o => {
                    const expanded = !!expandedOrders[o.id];
                    const currentStatus = inlineStatuses[o.id] ?? o.status;
                    const currentPaymentStatus = inlinePaymentStatuses[o.id] ?? o.payment_status;
                    const saving = !!savingOrderStatus[o.id];
                    return (
                      <React.Fragment key={o.id}>
                        <tr className="order-expand-toggle" onClick={() => setExpandedOrders(prev => ({ ...prev, [o.id]: !expanded }))}>
                          <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            <i className={`fa-sharp-duotone fa-light fa-chevron-${expanded ? 'down' : 'right'}`}></i>
                          </td>
                          <td className="cell-mono" onClick={e => e.stopPropagation()}>#{o.id}</td>
                          <td onClick={e => e.stopPropagation()}><strong>{o.email || 'Guest'}</strong></td>
                          <td className="cell-mono cell-nowrap" onClick={e => e.stopPropagation()} style={{ fontSize: '0.78rem' }}>
                            {new Date(o.created_at).toLocaleString()}
                          </td>
                          <td className="cell-mono" onClick={e => e.stopPropagation()}><strong>रु {Number(o.total).toFixed(2)}</strong></td>
                          <td onClick={e => e.stopPropagation()} style={{ fontSize: '0.82rem' }}>
                            {o.payment_method === 'store_credit' ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)', fontWeight: 600 }}>
                                <i className="fa-sharp-duotone fa-light fa-wallet"></i> Store Credit
                              </span>
                            ) : (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                                <i className="fa-sharp-duotone fa-light fa-money-bill-1-wave"></i> COD (Cash)
                              </span>
                            )}
                          </td>
                          <td onClick={e => e.stopPropagation()} style={{ minWidth: '110px' }}>
                            <select
                              className="inline-status-select"
                              value={currentPaymentStatus}
                              onChange={e => setInlinePaymentStatuses(prev => ({ ...prev, [o.id]: e.target.value }))}
                              style={{ 
                                backgroundColor: currentPaymentStatus === 'paid' ? '#f0fdf4' : '#fef2f2', 
                                color: currentPaymentStatus === 'paid' ? '#166534' : '#991b1b', 
                                border: currentPaymentStatus === 'paid' ? '1px solid #bbf7d0' : '1px solid #fecaca', 
                                fontWeight: 600,
                                borderRadius: 0
                              }}
                            >
                              <option value="unpaid">Unpaid</option>
                              <option value="paid">Paid</option>
                            </select>
                          </td>
                          <td onClick={e => e.stopPropagation()} style={{ minWidth: '140px' }}>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <select
                                className="inline-status-select"
                                value={currentStatus}
                                onChange={e => setInlineStatuses(prev => ({ ...prev, [o.id]: e.target.value }))}
                              >
                                {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              {(currentStatus !== o.status || currentPaymentStatus !== o.payment_status) && (
                                <button className="btn btn-primary btn-sm" style={{ padding: '4px 8px', minWidth: 'unset' }} onClick={() => saveOrderStatus(o.id)} disabled={saving}>
                                  {saving ? <i className="fa-sharp-duotone fa-light fa-spinner fa-spin"></i> : <i className="fa-sharp-duotone fa-light fa-check"></i>}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="cell-mono" onClick={e => e.stopPropagation()} style={{ fontSize: '0.78rem', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {o.tracking_code || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                          </td>
                          <td onClick={e => e.stopPropagation()}>
                            <button className="btn btn-danger btn-sm" onClick={() => setDeleteOrderTarget(o)}>
                              <i className="fa-sharp-duotone fa-light fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                        {expanded && (
                          <tr className="order-expand-row">
                            <td colSpan="10">
                              <div className="order-expand-content">
                                <div className="order-expand-section">
                                  <h6>Shipping Address</h6>
                                  {o.shipping_address ? (
                                    <div className="order-expand-address" style={{ fontSize: '0.82rem', lineHeight: '1.5', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                      <div><strong>Name:</strong> {o.shipping_address.fullName}</div>
                                      {o.shipping_address.phone && <div><strong>Phone:</strong> {o.shipping_address.phone}</div>}
                                      {o.shipping_address.province && (
                                        <div><strong>Address:</strong> {o.shipping_address.city}, {o.shipping_address.district}, {o.shipping_address.province}</div>
                                      )}
                                      {o.shipping_address.receivingLocation && (
                                        <div>
                                          <strong>Coordinates:</strong>{' '}
                                          <a 
                                            href={`https://www.google.com/maps/search/?api=1&query=${o.shipping_address.receivingLocation}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            style={{ fontFamily: 'var(--font-mono)', textDecoration: 'underline', color: 'var(--accent)' }}
                                          >
                                            {o.shipping_address.receivingLocation} <i className="fa-sharp-duotone fa-light fa-arrow-up-right-from-square" style={{ fontSize: '0.7rem', marginLeft: '2px' }}></i>
                                          </a>
                                        </div>
                                      )}
                                      {o.shipping_address.shippingFee !== undefined && (
                                        <div>
                                          <strong>Shipping Fee:</strong>{' '}
                                          रु {Number(o.shipping_address.shippingFee).toFixed(2)}
                                          {o.shipping_address.distanceKm !== undefined && ` (${o.shipping_address.distanceKm} km distance)`}
                                        </div>
                                      )}
                                      {o.shipping_address.additionalMessage && <div><strong>Message:</strong> {o.shipping_address.additionalMessage}</div>}
                                      
                                      {/* Fallback for legacy orders */}
                                      {!o.shipping_address.province && (
                                        <>
                                          <div>{o.shipping_address.address1 || o.shipping_address.addressLine1}</div>
                                          {o.shipping_address.address2 && <div>{o.shipping_address.address2}</div>}
                                          <div>{o.shipping_address.city}, {o.shipping_address.state} {o.shipping_address.postalCode || o.shipping_address.zipCode}</div>
                                          <div>{o.shipping_address.country}</div>
                                        </>
                                      )}
                                    </div>
                                  ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No address recorded</span>}
                                </div>
                                <div className="order-expand-section">
                                  <h6>Order Items</h6>
                                  <table className="order-expand-items-table">
                                    <thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Subtotal</th></tr></thead>
                                    <tbody>
                                      {o.items.map((item, idx) => (
                                        <tr key={idx}>
                                          <td><strong>{item.name}</strong></td>
                                          <td>रु {Number(item.price).toFixed(2)}</td>
                                          <td>{item.quantity}</td>
                                          <td><strong>रु {(item.price * item.quantity).toFixed(2)}</strong></td>
                                        </tr>
                                      ))}
                                      <tr>
                                        <td colSpan="3" style={{ textAlign: 'right', fontWeight: 700 }}>Total:</td>
                                        <td><strong>रु {Number(o.total).toFixed(2)}</strong></td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="revenue-footer">
              <span>Showing <strong>{filteredOrders.length}</strong> orders</span>
              <span>Revenue (exc. cancelled): <strong>रु {orderRevenue.toFixed(2)}</strong></span>
            </div>
          </>
        )}
      </>
    );
  };

  /* ══════════════════════════════════════════
     RENDER — REVIEWS
  ══════════════════════════════════════════ */
  const renderReviewsTab = () => {
    if (reviewsLoading) return <div className="loading-spinner"><div className="spinner"></div></div>;
    
    const filteredReviews = reviews.filter(r => {
      const s = reviewSearch.toLowerCase();
      return r.user_email.toLowerCase().includes(s) || r.product_name.toLowerCase().includes(s) || (r.comment || '').toLowerCase().includes(s);
    });

    return (
      <>
        <div className="admin-toolbar" style={{ borderBottom: 'none', marginBottom: '8px' }}>
          <div className="admin-toolbar-left">
            <h4>User Product Reviews</h4>
            <span className="font-mono text-muted" style={{ fontSize: '0.8125rem' }}>{filteredReviews.length} / {reviews.length} reviews</span>
          </div>
        </div>
        <div className="admin-toolbar-row" style={{ marginBottom: '20px' }}>
          <div className="admin-toolbar-search">
            <i className="fa-sharp-duotone fa-light fa-magnifying-glass admin-toolbar-search-icon"></i>
            <input type="text" placeholder="Search by email, product, comment..." value={reviewSearch} onChange={e => setReviewSearch(e.target.value)} />
          </div>
        </div>

        {filteredReviews.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><i className="fa-sharp-duotone fa-light fa-comments"></i></div>
            <h3>No Reviews Found</h3>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: '12px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Product</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Date</th>
                  <th style={{ width: '80px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.map(r => (
                  <tr key={r.id}>
                    <td className="cell-mono" style={{ color: 'var(--text-muted)' }}>#{r.id}</td>
                    <td><strong>{r.user_email}</strong></td>
                    <td>
                      <strong>{r.product_name}</strong>
                      <div className="cell-mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.product_sku}</div>
                    </td>
                    <td>
                      <div style={{ color: 'var(--accent)', fontSize: '0.85rem' }}>
                        {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem', maxWidth: '300px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      {r.comment || <span className="text-muted" style={{ fontStyle: 'italic' }}>No comment left</span>}
                    </td>
                    <td className="cell-mono" style={{ fontSize: '0.78rem' }}>{new Date(r.created_at).toLocaleString()}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteReview(r.id)} title="Delete Review">
                        <i className="fa-sharp-duotone fa-light fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>
    );
  };

  /* ══════════════════════════════════════════
     RENDER — TRANSACTIONS
  ══════════════════════════════════════════ */
  const renderTransactionsTab = () => {
    if (transactionsLoading) return <div className="loading-spinner"><div className="spinner"></div></div>;

    const filteredTx = transactions.filter(t => {
      const s = transactionSearch.toLowerCase();
      const matchSearch = t.user_email.toLowerCase().includes(s) || (t.reference_id || '').toLowerCase().includes(s);
      const matchType = transactionType === 'All' || t.type === transactionType;
      return matchSearch && matchType;
    });

    const stats = transactions.reduce((acc, t) => {
      const amt = Number(t.amount);
      if (t.type === 'deposit') acc.deposits += amt;
      if (t.type === 'purchase') acc.purchases += Math.abs(amt);
      if (t.type === 'referral') acc.referrals += amt;
      if (t.type === 'social') acc.social += amt;
      if (t.type === 'refund') acc.refunds += amt;
      return acc;
    }, { deposits: 0, purchases: 0, referrals: 0, social: 0, refunds: 0 });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="overview-revenue-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div className="overview-revenue-card revenue" style={{ padding: '16px' }}>
            <div className="overview-revenue-label">Total Deposits</div>
            <div className="overview-revenue-value" style={{ fontSize: '1.5rem' }}>रु {stats.deposits.toFixed(2)}</div>
          </div>
          <div className="overview-revenue-card orders" style={{ padding: '16px' }}>
            <div className="overview-revenue-label">Total Purchases</div>
            <div className="overview-revenue-value" style={{ fontSize: '1.5rem', color: '#dc2626' }}>रु {stats.purchases.toFixed(2)}</div>
          </div>
          <div className="overview-revenue-card pending" style={{ padding: '16px' }}>
            <div className="overview-revenue-label">Referrals Paid</div>
            <div className="overview-revenue-value" style={{ fontSize: '1.5rem', color: '#2563eb' }}>रु {stats.referrals.toFixed(2)}</div>
          </div>
          <div className="overview-revenue-card users" style={{ padding: '16px' }}>
            <div className="overview-revenue-label">Social Claims Paid</div>
            <div className="overview-revenue-value" style={{ fontSize: '1.5rem', color: '#16a34a' }}>रु {stats.social.toFixed(2)}</div>
          </div>
        </div>

        <div className="admin-toolbar" style={{ borderBottom: 'none', marginBottom: '8px' }}>
          <div className="admin-toolbar-left">
            <h4>Transactions Ledger History</h4>
            <span className="font-mono text-muted" style={{ fontSize: '0.8125rem' }}>{filteredTx.length} / {transactions.length} records</span>
          </div>
        </div>
        <div className="admin-toolbar-row" style={{ marginBottom: '20px' }}>
          <div className="admin-toolbar-search">
            <i className="fa-sharp-duotone fa-light fa-magnifying-glass admin-toolbar-search-icon"></i>
            <input type="text" placeholder="Search by email, reference ID..." value={transactionSearch} onChange={e => setTransactionSearch(e.target.value)} />
          </div>
          <div className="admin-toolbar-filter">
            <label>Transaction Type</label>
            <select value={transactionType} onChange={e => setTransactionType(e.target.value)}>
              <option value="All">All Types</option>
              <option value="deposit">Deposit</option>
              <option value="purchase">Purchase</option>
              <option value="referral">Referral</option>
              <option value="social">Social Claim</option>
              <option value="refund">Refund</option>
            </select>
          </div>
        </div>

        {filteredTx.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><i className="fa-sharp-duotone fa-light fa-wallet"></i></div>
            <h3>No Transactions Found</h3>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: '12px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tx ID</th>
                  <th>User Email</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Reference ID</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredTx.map(t => {
                  const isNegative = Number(t.amount) < 0;
                  return (
                    <tr key={t.id}>
                      <td className="cell-mono" style={{ color: 'var(--text-muted)' }}>#{t.id}</td>
                      <td><strong>{t.user_email}</strong></td>
                      <td>
                        <span className={`badge ${
                          t.type === 'deposit' ? 'badge-success' :
                          t.type === 'purchase' ? 'badge-danger' :
                          t.type === 'referral' ? 'badge-info' :
                          t.type === 'social' ? 'badge-neutral' : 'badge-warning'
                        }`} style={{ fontSize: '0.68rem' }}>
                          {t.type}
                        </span>
                      </td>
                      <td className="cell-mono" style={{ fontWeight: 700, color: isNegative ? '#b91c1c' : '#15803d' }}>
                        {isNegative ? '-' : '+'} रु {Math.abs(Number(t.amount)).toFixed(2)}
                      </td>
                      <td className="cell-mono" style={{ fontSize: '0.8rem' }}>{t.reference_id || '—'}</td>
                      <td className="cell-mono" style={{ fontSize: '0.78rem' }}>{new Date(t.created_at).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  /* ══════════════════════════════════════════
     RENDER — SOCIAL CLAIMS
  ══════════════════════════════════════════ */
  const renderSocialClaimsTab = () => {
    if (socialClaimsLoading) return <div className="loading-spinner"><div className="spinner"></div></div>;

    const filteredClaims = socialClaims.filter(c => {
      const s = socialClaimSearch.toLowerCase();
      return c.user_email.toLowerCase().includes(s) || c.platform.toLowerCase().includes(s);
    });

    return (
      <>
        <div className="admin-toolbar" style={{ borderBottom: 'none', marginBottom: '8px' }}>
          <div className="admin-toolbar-left">
            <h4>Social Follow Rewards Claims</h4>
            <span className="font-mono text-muted" style={{ fontSize: '0.8125rem' }}>{filteredClaims.length} / {socialClaims.length} claims</span>
          </div>
        </div>
        <div className="admin-toolbar-row" style={{ marginBottom: '20px' }}>
          <div className="admin-toolbar-search">
            <i className="fa-sharp-duotone fa-light fa-magnifying-glass admin-toolbar-search-icon"></i>
            <input type="text" placeholder="Search by email, platform..." value={socialClaimSearch} onChange={e => setSocialClaimSearch(e.target.value)} />
          </div>
        </div>

        {filteredClaims.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><i className="fa-sharp-duotone fa-light fa-thumbs-up"></i></div>
            <h3>No Claims Found</h3>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: '12px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>User Email</th>
                  <th>Platform</th>
                  <th>Claim Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredClaims.map((c, idx) => (
                  <tr key={idx}>
                    <td><strong>{c.user_email}</strong></td>
                    <td>
                      <span className="badge badge-info" style={{ fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {c.platform === 'instagram' ? <i className="fa-brands fa-instagram"></i> : <i className="fa-brands fa-facebook"></i>}
                        {c.platform}
                      </span>
                    </td>
                    <td className="cell-mono" style={{ fontSize: '0.78rem' }}>{new Date(c.claimed_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>
    );
  };

  /* ══════════════════════════════════════════
     RENDER — SETTINGS
  ══════════════════════════════════════════ */
  const renderSettingsTab = () => (
    <>
      <form onSubmit={handleSettingsSubmit} className="settings-grid">
        <div className="settings-card">
          <h3 className="settings-card-title">
            <i className="fa-sharp-duotone fa-light fa-warehouse" style={{ color: 'var(--text-secondary)' }}></i> Inventory
          </h3>
          <div className="settings-row">
            <label className="form-label" style={{ fontWeight: 700 }}>Low Stock Warning Threshold</label>
            <input type="number" className="form-input" value={settingsForm.lowStockThreshold || ''} onChange={e => setSettingsForm(p => ({ ...p, lowStockThreshold: parseInt(e.target.value, 10) || 1 }))} min="1" max="100" required style={{ fontFamily: 'var(--font-mono)' }} />
            <p className="settings-field-desc">Products at or below this level are flagged as Low Stock.</p>
          </div>
        </div>

        <div className="settings-card">
          <h3 className="settings-card-title">
            <i className="fa-sharp-duotone fa-light fa-calculator" style={{ color: 'var(--text-secondary)' }}></i> Fiscal & Checkout
          </h3>
          <div className="settings-row">
            <label className="form-label" style={{ fontWeight: 700 }}>Sales Tax Rate (%)</label>
            <input type="number" className="form-input" value={settingsForm.salesTaxRate !== undefined ? settingsForm.salesTaxRate : ''} onChange={e => setSettingsForm(p => ({ ...p, salesTaxRate: parseFloat(e.target.value) || 0 }))} min="0" max="50" step="0.1" required style={{ fontFamily: 'var(--font-mono)' }} />
            <p className="settings-field-desc">Applied to cart subtotal at checkout.</p>
          </div>
          <div className="settings-row" style={{ marginTop: '16px' }}>
            <label className="form-label" style={{ fontWeight: 700 }}>Delivery Rate (रु per KM)</label>
            <input type="number" className="form-input" value={settingsForm.deliveryPerKmRate !== undefined ? settingsForm.deliveryPerKmRate : ''} onChange={e => setSettingsForm(p => ({ ...p, deliveryPerKmRate: parseFloat(e.target.value) || 0 }))} min="0" step="0.01" required style={{ fontFamily: 'var(--font-mono)' }} />
            <p className="settings-field-desc">Cost per kilometer calculated dynamically from Basantapur HQ.</p>
          </div>
          <div className="settings-row" style={{ marginTop: '16px' }}>
            <label className="form-label" style={{ fontWeight: 700 }}>Minimum Delivery Charge (रु)</label>
            <input type="number" className="form-input" value={settingsForm.deliveryMinCharge !== undefined ? settingsForm.deliveryMinCharge : ''} onChange={e => setSettingsForm(p => ({ ...p, deliveryMinCharge: parseFloat(e.target.value) || 0 }))} min="0" step="0.01" required style={{ fontFamily: 'var(--font-mono)' }} />
            <p className="settings-field-desc">Base minimum delivery fee applied to all orders.</p>
          </div>
          <div className="settings-row" style={{ marginTop: '16px' }}>
            <label className="form-label" style={{ fontWeight: 700 }}>Free Delivery Threshold (रु)</label>
            <input type="number" className="form-input" value={settingsForm.deliveryFreeThreshold !== undefined ? settingsForm.deliveryFreeThreshold : ''} onChange={e => setSettingsForm(p => ({ ...p, deliveryFreeThreshold: parseFloat(e.target.value) || 0 }))} min="0" step="0.01" required style={{ fontFamily: 'var(--font-mono)' }} />
            <p className="settings-field-desc">Orders above this subtotal get free shipping.</p>
          </div>
        </div>

        <div className="settings-card" style={{ gridColumn: 'span 2' }}>
          <h3 className="settings-card-title">
            <i className="fa-sharp-duotone fa-light fa-key" style={{ color: 'var(--text-secondary)' }}></i> Google Sign-In
          </h3>
          <div className="settings-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>Google Client ID</label>
              <input type="text" className="form-input" value={settingsForm.googleClientId || ''} onChange={e => setSettingsForm(p => ({ ...p, googleClientId: e.target.value }))} placeholder="Google client ID" style={{ fontFamily: 'var(--font-mono)' }} />
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>Google Client Secret</label>
              <input type="password" className="form-input" value={settingsForm.googleClientSecret || ''} onChange={e => setSettingsForm(p => ({ ...p, googleClientSecret: e.target.value }))} placeholder="Google client secret" style={{ fontFamily: 'var(--font-mono)' }} />
            </div>
          </div>
          <div className="settings-row" style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input type="checkbox" id="googleAuthEnabled" checked={settingsForm.googleAuthEnabled || false} onChange={e => setSettingsForm(p => ({ ...p, googleAuthEnabled: e.target.checked }))} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
              <label htmlFor="googleAuthEnabled" style={{ fontWeight: 700, cursor: 'pointer' }}>Enable Google Sign-In</label>
            </div>
          </div>
        </div>

        <div className="settings-card">
          <h3 className="settings-card-title">
            <i className="fa-sharp-duotone fa-light fa-headset" style={{ color: 'var(--text-secondary)' }}></i> Emergency Support
          </h3>
          <div className="settings-row">
            <label className="form-label" style={{ fontWeight: 700 }}>Emergency Contact Phone</label>
            <input type="text" className="form-input" value={settingsForm.emergencyContactPhone || ''} onChange={e => setSettingsForm(p => ({ ...p, emergencyContactPhone: e.target.value }))} placeholder="e.g. 9800000000" />
            <p className="settings-field-desc">Shown to buyers on checkout error / order confirmation views.</p>
          </div>
          <div className="settings-row" style={{ marginTop: '16px' }}>
            <label className="form-label" style={{ fontWeight: 700 }}>Emergency Contact Email</label>
            <input type="email" className="form-input" value={settingsForm.emergencyContactEmail || ''} onChange={e => setSettingsForm(p => ({ ...p, emergencyContactEmail: e.target.value }))} placeholder="e.g. support@himalix.store" />
            <p className="settings-field-desc">Support email listed on checkout screens.</p>
          </div>
        </div>

        <div className="settings-card" style={{ gridColumn: 'span 2' }}>
          <h3 className="settings-card-title">
            <i className="fa-sharp-duotone fa-light fa-envelope" style={{ color: 'var(--text-secondary)' }}></i> SMTP Server Settings
          </h3>
          <div className="settings-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>SMTP Host</label>
              <input type="text" className="form-input" value={settingsForm.smtpHost || ''} onChange={e => setSettingsForm(p => ({ ...p, smtpHost: e.target.value }))} placeholder="smtp.mailtrap.io or smtp.gmail.com" style={{ fontFamily: 'var(--font-mono)' }} />
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>SMTP Port</label>
              <input type="number" className="form-input" value={settingsForm.smtpPort || ''} onChange={e => setSettingsForm(p => ({ ...p, smtpPort: e.target.value }))} placeholder="587" style={{ fontFamily: 'var(--font-mono)' }} />
            </div>
          </div>
          <div className="settings-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '16px' }}>
            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>SMTP Username</label>
              <input type="text" className="form-input" value={settingsForm.smtpUser || ''} onChange={e => setSettingsForm(p => ({ ...p, smtpUser: e.target.value }))} placeholder="Username" style={{ fontFamily: 'var(--font-mono)' }} />
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>SMTP Password</label>
              <input type="password" className="form-input" value={settingsForm.smtpPass || ''} onChange={e => setSettingsForm(p => ({ ...p, smtpPass: e.target.value }))} placeholder="Password" style={{ fontFamily: 'var(--font-mono)' }} />
            </div>
          </div>
          <div className="settings-row" style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input type="checkbox" id="smtpSecure" checked={settingsForm.smtpSecure || false} onChange={e => setSettingsForm(p => ({ ...p, smtpSecure: e.target.checked }))} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
              <label htmlFor="smtpSecure" style={{ fontWeight: 700, cursor: 'pointer' }}>Use Secure TLS / SSL Connection (Port 465)</label>
            </div>
            <p className="settings-field-desc" style={{ marginTop: '4px' }}>Usually checked for port 465 and unchecked for port 587/25.</p>
          </div>
        </div>

        <div className="settings-card">
          <h3 className="settings-card-title">
            <i className="fa-sharp-duotone fa-light fa-bullhorn" style={{ color: 'var(--text-secondary)' }}></i> Storefront Banner
          </h3>
          <div className="settings-row">
            <label className="form-label" style={{ fontWeight: 700 }}>Announcement Banner Text</label>
            <textarea className="form-input form-textarea" value={settingsForm.storeBannerText || ''} onChange={e => setSettingsForm(p => ({ ...p, storeBannerText: e.target.value }))} style={{ height: '80px' }} />
            <p className="settings-field-desc">Shown to visitors at the top of the storefront.</p>
          </div>
        </div>

        <div className="settings-card">
          <h3 className="settings-card-title">
            <i className="fa-sharp-duotone fa-light fa-lock" style={{ color: 'var(--text-secondary)' }}></i> System Access
          </h3>
          <div className="settings-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
              <input type="checkbox" id="maintenanceMode" checked={settingsForm.maintenanceMode || false} onChange={e => setSettingsForm(p => ({ ...p, maintenanceMode: e.target.checked }))} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
              <label htmlFor="maintenanceMode" style={{ fontWeight: 700, cursor: 'pointer' }}>Enable Maintenance Mode</label>
            </div>
            <p className="settings-field-desc" style={{ marginTop: '12px' }}>Puts the public storefront offline. Admins can still access the dashboard.</p>
          </div>
        </div>

        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '16px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
          {settingsSaved && <div className="text-success" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}><i className="fa-sharp-duotone fa-light fa-circle-check"></i> Saved!</div>}
          <button type="submit" className="btn btn-primary">
            <i className="fa-sharp-duotone fa-light fa-floppy-disk" style={{ marginRight: '6px' }}></i> Save Settings
          </button>
        </div>
      </form>

      {/* Notification Receivers Routing Ledger */}
      <div style={{ marginTop: '40px', paddingTop: '32px', borderTop: '2px solid var(--border-dark)' }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontWeight: 800, marginBottom: '4px' }}>
            <i className="fa-sharp-duotone fa-light fa-bell" style={{ marginRight: '8px', color: 'var(--text-muted)' }}></i>
            Email Notification Receivers & Routing
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Configure which administrator or team email addresses receive notifications when system events occur.
          </p>
        </div>

        {receiversLoading ? (
          <div className="loading-spinner"><div className="spinner"></div></div>
        ) : (
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Receiver Email Address</th>
                <th>Order Placed Alert</th>
                <th>Low Stock Alert</th>
                <th>User Registration Alert</th>
                <th style={{ width: '80px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {receivers.map(r => (
                <tr key={r.id}>
                  <td><strong>{r.email_address}</strong></td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={r.notify_on_order_placed === 1 || r.notify_on_order_placed === true}
                      onChange={() => handleToggleReceiverPref(r.id, 'notify_on_order_placed', r.notify_on_order_placed)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={r.notify_on_low_stock === 1 || r.notify_on_low_stock === true}
                      onChange={() => handleToggleReceiverPref(r.id, 'notify_on_low_stock', r.notify_on_low_stock)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={r.notify_on_user_registered === 1 || r.notify_on_user_registered === true}
                      onChange={() => handleToggleReceiverPref(r.id, 'notify_on_user_registered', r.notify_on_user_registered)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteReceiver(r.id)} style={{ padding: '6px 10px' }}>
                      <i className="fa-sharp-duotone fa-light fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {receivers.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                    No notification receivers defined. Alerts will not be emailed.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        <form onSubmit={handleAddReceiver} className="raw-settings-add-row" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', backgroundColor: '#fafafa', padding: '16px', border: '1px solid var(--border)' }}>
          <div style={{ flex: 2, minWidth: '200px' }}>
            <input
              type="email"
              placeholder="admin@himalix.store"
              value={newReceiver.email_address}
              onChange={e => setNewReceiver(p => ({ ...p, email_address: e.target.value }))}
              required
              style={{ width: '100%', padding: '10px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '16px', flex: 3, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={newReceiver.notify_on_order_placed}
                onChange={e => setNewReceiver(p => ({ ...p, notify_on_order_placed: e.target.checked }))}
              />
              <span>Order Placed</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={newReceiver.notify_on_low_stock}
                onChange={e => setNewReceiver(p => ({ ...p, notify_on_low_stock: e.target.checked }))}
              />
              <span>Low Stock</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={newReceiver.notify_on_user_registered}
                onChange={e => setNewReceiver(p => ({ ...p, notify_on_user_registered: e.target.checked }))}
              />
              <span>Registration</span>
            </label>
          </div>
          <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '10px 20px' }} disabled={!newReceiver.email_address.trim()}>
            <i className="fa-sharp-duotone fa-light fa-plus" style={{ marginRight: '6px' }}></i> Add Receiver
          </button>
        </form>
      </div>

      {/* Raw DB Settings Editor */}
      <div style={{ marginTop: '40px', paddingTop: '32px', borderTop: '2px solid var(--border-dark)' }}>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontWeight: 800, marginBottom: '4px' }}>
            <i className="fa-sharp-duotone fa-light fa-database" style={{ marginRight: '8px', color: 'var(--text-muted)' }}></i>
            Raw Database Settings Editor
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Directly edit, add, or delete any key-value pair in the <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-secondary)', padding: '1px 6px' }}>settings</code> table. Changes take effect immediately.
          </p>
        </div>

        <table className="raw-settings-table">
          <thead>
            <tr><th>Key Name</th><th>Value</th><th style={{ width: '120px' }}>Actions</th></tr>
          </thead>
          <tbody>
            {rawSettings.map(r => (
              <tr key={r.key_name}>
                <td className="key-cell">{r.key_name}</td>
                <td>
                  <input
                    className="val-input"
                    value={rawSettingsEdits[r.key_name] !== undefined ? rawSettingsEdits[r.key_name] : (r.key_value || '')}
                    onChange={e => setRawSettingsEdits(prev => ({ ...prev, [r.key_name]: e.target.value }))}
                  />
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => saveRawSetting(r.key_name)}>
                      <i className="fa-sharp-duotone fa-light fa-floppy-disk"></i>
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => { if (window.confirm(`Delete setting "${r.key_name}"?`)) deleteRawSetting(r.key_name); }}>
                      <i className="fa-sharp-duotone fa-light fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="raw-settings-add-row">
          <input type="text" placeholder="New key name (e.g. feature_flag_x)" value={newRawKey} onChange={e => setNewRawKey(e.target.value)} />
          <input type="text" placeholder="Value" value={newRawValue} onChange={e => setNewRawValue(e.target.value)} />
          <button className="btn btn-primary btn-sm" onClick={addRawSetting} disabled={!newRawKey.trim()}>
            <i className="fa-sharp-duotone fa-light fa-plus" style={{ marginRight: '4px' }}></i> Add
          </button>
        </div>
      </div>
    </>
  );

  /* ══════════════════════════════════════════
     RENDER — GUIDE
  ══════════════════════════════════════════ */
  const renderGuideTab = () => (
    <div className="guide-container">
      {[
        {
          n: 1, title: 'Product Catalog Management', body: (
            <>
              <p>Use the <strong>Products</strong> tab to manage your full inventory. Switch between <strong>Card</strong> and <strong>Table</strong> views using the toggle. In both views you can inline-edit stock quantities by clicking the number field.</p>
              <ul style={{ paddingLeft: '20px', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li><strong>Create / Edit:</strong> Full form with image drag-and-drop, category, price, specs builder.</li>
                <li><strong>Duplicate:</strong> Clones an existing product with SKU appended "-COPY" for quick catalog expansion.</li>
                <li><strong>Inline Stock Edit:</strong> Click the quantity field on any product card/row, change the number, click ✓.</li>
              </ul>
            </>
          )
        },
        {
          n: 2, title: 'Order Fulfillment Workflow', body: (
            <>
              <p>The <strong>Orders</strong> tab shows all transactions. Click any row to expand shipping address and line items. Use the inline status dropdown to update without opening a modal.</p>
              <table className="guide-step-table" style={{ marginTop: '12px' }}>
                <thead><tr><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  <tr><td><strong>Pending</strong></td><td>New order, verify details</td></tr>
                  <tr><td><strong>Processing</strong></td><td>Packing components</td></tr>
                  <tr><td><strong>Shipped</strong></td><td>Enter courier tracking code</td></tr>
                  <tr><td><strong>Completed</strong></td><td>Delivered, confirmed</td></tr>
                  <tr><td><strong>Cancelled</strong></td><td>Voided by customer/operator</td></tr>
                </tbody>
              </table>
              <p style={{ marginTop: '12px' }}>Use <strong>Export CSV</strong> to download order data for accounting or courier systems.</p>
            </>
          )
        },
        {
          n: 3, title: 'User & Access Management', body: (
            <>
              <p>The <strong>Users</strong> tab lists every account. Click <strong>Manage</strong> to open the user profile panel, where you can update email, change role, reset password, and view that user's order history.</p>
              <ul style={{ paddingLeft: '20px', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li><strong>user:</strong> Standard public storefront access only.</li>
                <li><strong>admin:</strong> Full admin dashboard access.</li>
              </ul>
            </>
          )
        },
        {
          n: 4, title: 'Analytics & Revenue Reporting', body: (
            <p>The <strong>Analytics</strong> tab provides a live view of revenue, 7-day bar chart, top products by units sold, category inventory breakdown, and user role distribution. All data is computed in real-time from the database.</p>
          )
        },
        {
          n: 5, title: 'System Settings & Raw DB Editor', body: (
            <>
              <p>The <strong>Settings</strong> tab has two sections:</p>
              <ul style={{ paddingLeft: '20px', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li><strong>Named Settings:</strong> Tax rate, low-stock threshold, Google auth credentials, banner text, maintenance mode.</li>
                <li><strong>Raw DB Settings Editor:</strong> A full table of every key in the database <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-secondary)', padding: '1px 6px' }}>settings</code> table. Add new keys, edit values, or delete entries directly.</li>
              </ul>
            </>
          )
        },
      ].map(({ n, title, body }) => (
        <div key={n} className="guide-step-card">
          <div className="guide-step-header">
            <span className="guide-step-badge">{n}</span>
            <h3 className="guide-step-title">{title}</h3>
          </div>
          <div className="guide-step-content">{body}</div>
        </div>
      ))}
    </div>
  );

  /* ══════════════════════════════════════════
     MAIN RENDER
  ══════════════════════════════════════════ */
  const tabTitles = {
    overview: 'Dashboard Overview', analytics: 'Analytics & Revenue',
    products: 'Products Catalog', users: 'Users Database',
    carts: 'Shopping Cart Audits', orders: 'Order Transactions',
    reviews: 'Reviews Moderation', transactions: 'Wallet Transactions Ledger',
    social_claims: 'Social Claims Log',
    settings: 'Store Settings', guide: 'Operator Guide',
  };
  const tabIcons = {
    overview: 'fa-chart-line', analytics: 'fa-chart-pie',
    products: 'fa-boxes-stacked', users: 'fa-users',
    carts: 'fa-cart-shopping', orders: 'fa-credit-card',
    reviews: 'fa-comments', transactions: 'fa-wallet',
    social_claims: 'fa-thumbs-up',
    settings: 'fa-sliders', guide: 'fa-book-open',
  };

  return (
    <div className="admin-dashboard-layout">
      {renderSidebar()}

      <main className="admin-main">
        <header className="admin-content-header">
          <button className="admin-sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle sidebar">
            <i className={sidebarOpen ? 'fa-sharp-duotone fa-light fa-xmark' : 'fa-sharp-duotone fa-light fa-bars'}></i>
          </button>
          <h2 className="admin-content-header-title">
            <i className={`fa-sharp-duotone fa-light ${tabIcons[activeTab] || 'fa-sliders'}`} style={{ marginRight: '8px' }}></i>
            {tabTitles[activeTab]}
          </h2>
          <div className="admin-content-header-actions">
            <span className="font-mono text-muted" style={{ fontSize: '0.82rem' }}>SYSTEM: ONLINE</span>
          </div>
        </header>

        <div className="admin-content-body">
          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
              <span className="alert-icon"><i className="fa-sharp-duotone fa-light fa-circle-exclamation"></i></span>
              <span className="alert-content">{error}</span>
              <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }} onClick={() => setError('')}>
                <i className="fa-sharp-duotone fa-light fa-xmark"></i>
              </button>
            </div>
          )}
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'analytics' && renderAnalyticsTab()}
          {activeTab === 'products' && renderProductsTab()}
          {activeTab === 'users' && renderUsersTab()}
          {activeTab === 'carts' && renderCartsTab()}
          {activeTab === 'orders' && renderOrdersTab()}
          {activeTab === 'reviews' && renderReviewsTab()}
          {activeTab === 'transactions' && renderTransactionsTab()}
          {activeTab === 'social_claims' && renderSocialClaimsTab()}
          {activeTab === 'settings' && renderSettingsTab()}
          {activeTab === 'guide' && renderGuideTab()}
        </div>
      </main>

      {/* ── DELETE PRODUCT MODAL ── */}
      <Modal isOpen={!!deleteProductTarget} onClose={() => setDeleteProductTarget(null)} title="Confirm Product Deletion" size="sm">
        {deleteProductTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p>Permanently delete <strong>"{deleteProductTarget.name}"</strong>?</p>
            <div style={{ background: '#f8fafc', padding: '12px', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
              <div>SKU: {deleteProductTarget.sku}</div>
              <div>Price: रु {Number(deleteProductTarget.price).toFixed(2)}</div>
              <div>Stock: {deleteProductTarget.stock_quantity} units</div>
            </div>
            <p style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '0.85rem' }}>
              <i className="fa-sharp-duotone fa-light fa-triangle-exclamation" style={{ marginRight: '6px' }}></i>
              This action is permanent.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setDeleteProductTarget(null)}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={confirmDeleteProduct}>Delete Product</button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── DELETE USER MODAL ── */}
      <Modal isOpen={!!deleteUserTarget} onClose={() => setDeleteUserTarget(null)} title="Confirm User Deletion" size="sm">
        {deleteUserTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p>Permanently delete user <strong>"{deleteUserTarget.email}"</strong>?</p>
            <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>
              <i className="fa-sharp-duotone fa-light fa-triangle-exclamation" style={{ marginRight: '6px' }}></i>
              This removes their profile and cart items permanently.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setDeleteUserTarget(null)}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={confirmDeleteUser}>Delete User</button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── DELETE ORDER MODAL ── */}
      <Modal isOpen={!!deleteOrderTarget} onClose={() => setDeleteOrderTarget(null)} title="Confirm Order Deletion" size="sm">
        {deleteOrderTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p>Permanently delete order <strong>#{deleteOrderTarget.id}</strong> from <strong>{deleteOrderTarget.email}</strong>?</p>
            <div style={{ background: '#f8fafc', padding: '12px', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
              <div>Total: रु {Number(deleteOrderTarget.total).toFixed(2)}</div>
              <div>Status: {deleteOrderTarget.status}</div>
            </div>
            <p style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '0.85rem' }}>
              <i className="fa-sharp-duotone fa-light fa-triangle-exclamation" style={{ marginRight: '6px' }}></i>
              Order records and items will be permanently removed.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setDeleteOrderTarget(null)}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={confirmDeleteOrder}>Delete Order</button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── RESET PASSWORD MODAL (standalone) ── */}
      <Modal isOpen={!!changingPasswordUser} onClose={() => setChangingPasswordUser(null)} title="Reset Password" size="sm">
        {changingPasswordUser && (
          <form onSubmit={submitPasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Set a new password for <strong>{changingPasswordUser.email}</strong>.
            </p>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input type="password" className="form-input" placeholder="At least 6 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setChangingPasswordUser(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm">Update Password</button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── USER DETAIL / MANAGE MODAL ── */}
      <Modal isOpen={!!userDetailTarget} onClose={() => { setUserDetailTarget(null); setNewPassword(''); }} title="Manage User" size="lg">
        {userDetailTarget && (
          <div>
            <div className="user-detail-header">
              <UserAvatar user={userDetailTarget} size="lg" />
              <div className="user-detail-info">
                <div className="user-detail-email">{userDetailTarget.email}</div>
                <div className="user-detail-meta">
                  <span className={`badge ${userDetailTarget.role === 'admin' ? 'badge-success' : 'badge-neutral'}`}>{userDetailTarget.role}</span>
                  <span className={`auth-provider-badge ${userDetailTarget.auth_provider}`}>
                    {userDetailTarget.auth_provider === 'google' ? 'Google' : 'Local'}
                  </span>
                  <span className="badge badge-neutral" style={{ fontWeight: 700, color: 'var(--accent)', borderColor: 'var(--border-dark)', fontFamily: 'var(--font-mono)' }}>
                    Wallet: रु {Number(userDetailTarget.wallet_balance || 0).toFixed(2)}
                  </span>
                  <span className="font-mono text-muted" style={{ fontSize: '0.75rem' }}>
                    Joined {new Date(userDetailTarget.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Edit email + role */}
              <div>
                <h5 style={{ fontWeight: 700, marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Edit Profile</h5>
                <form onSubmit={submitUserEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-input" value={userEditForm.email} onChange={e => setUserEditForm(p => ({ ...p, email: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select className="form-select" value={userEditForm.role} onChange={e => setUserEditForm(p => ({ ...p, role: e.target.value }))}>
                      <option value="user">User — Standard customer</option>
                      <option value="admin">Admin — Full dashboard</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm">
                    <i className="fa-sharp-duotone fa-light fa-floppy-disk" style={{ marginRight: '6px' }}></i> Save Changes
                  </button>
                </form>

                <h5 style={{ fontWeight: 700, margin: '24px 0 12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Reset Password</h5>
                <form onSubmit={submitPasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <input type="password" className="form-input" placeholder="At least 6 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                  </div>
                  <button type="submit" className="btn btn-outline btn-sm" disabled={!newPassword || newPassword.length < 6}>
                    <i className="fa-sharp-duotone fa-light fa-key" style={{ marginRight: '6px' }}></i> Update Password
                  </button>
                </form>

                <h5 style={{ fontWeight: 700, margin: '24px 0 12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Adjust Store Credit</h5>
                <form onSubmit={handleWalletAdjustment} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Action</label>
                      <select 
                        className="form-select" 
                        value={walletForm.action} 
                        onChange={e => setWalletForm(p => ({ ...p, action: e.target.value }))}
                        style={{ borderRadius: '0 !important' }}
                      >
                        <option value="deposit">Deposit (Add)</option>
                        <option value="deduct">Deduct (Subtract)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Amount (रु)</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        placeholder="0.00" 
                        step="0.01" 
                        min="0.01"
                        value={walletForm.amount} 
                        onChange={e => setWalletForm(p => ({ ...p, amount: e.target.value }))} 
                        required 
                        style={{ fontFamily: 'var(--font-mono)', borderRadius: '0 !important' }}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Reference / Reason</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Manual deposit, correction" 
                      value={walletForm.reference} 
                      onChange={e => setWalletForm(p => ({ ...p, reference: e.target.value }))}
                      style={{ borderRadius: '0 !important' }}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={walletForm.submitting} style={{ borderRadius: '0 !important' }}>
                    {walletForm.submitting ? (
                      <><i className="fa-sharp-duotone fa-light fa-spinner fa-spin" style={{ marginRight: '6px' }}></i> Adjusting...</>
                    ) : (
                      <><i className="fa-sharp-duotone fa-light fa-wallet" style={{ marginRight: '6px' }}></i> Apply Adjustment</>
                    )}
                  </button>
                </form>
              </div>

              {/* Order history */}
              <div>
                <h5 style={{ fontWeight: 700, marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  Order History ({userDetailOrders.length})
                </h5>
                {userDetailOrdersLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}><i className="fa-sharp-duotone fa-light fa-spinner fa-spin"></i></div>
                ) : userDetailOrders.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No orders placed yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
                    {userDetailOrders.map(o => (
                      <div key={o.id} style={{ padding: '10px 12px', border: '1px solid var(--border)', fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                        <span className="cell-mono" style={{ color: 'var(--text-secondary)' }}>#{o.id}</span>
                        <StatusBadge status={o.status} />
                        <span className="cell-mono"><strong>रु {Number(o.total).toFixed(2)}</strong></span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{new Date(o.created_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
