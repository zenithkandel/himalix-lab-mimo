import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5001/api';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fa-solid fa-gauge-high' },
  { id: 'hero', label: 'Hero Section', icon: 'fa-solid fa-trophy' },
  { id: 'about', label: 'About', icon: 'fa-solid fa-building' },
  { id: 'services', label: 'Services', icon: 'fa-solid fa-microchip' },
  { id: 'team', label: 'Team', icon: 'fa-solid fa-users' },
  { id: 'testimonials', label: 'Testimonials', icon: 'fa-solid fa-quote-right' },
  { id: 'stats', label: 'Stats', icon: 'fa-solid fa-chart-line' },
  { id: 'contact', label: 'Contact Info', icon: 'fa-solid fa-envelope' },
  { id: 'settings', label: 'Settings', icon: 'fa-solid fa-gear' },
  { id: 'messages', label: 'Messages', icon: 'fa-solid fa-inbox' },
];

const EMPTY_SERVICE = {
  title: '',
  subtitle: '',
  description: '',
  icon_class: '',
  features: [''],
  link_url: '#',
  display_order: 0,
  is_active: true,
};

const EMPTY_MEMBER = {
  name: '',
  role: '',
  bio: '',
  image_url: '',
  social_links: { twitter: '', linkedin: '', github: '' },
  display_order: 0,
  is_active: true,
};

const EMPTY_TESTIMONIAL = {
  client_name: '',
  client_title: '',
  company: '',
  content: '',
  rating: 5,
  image_url: '',
  display_order: 0,
  is_active: true,
};

/* ─── Toast ────────────────────────────────────────────────────── */
function Toast({ toasts, onRemove }) {
  return (
    <div className="admin-toast-container">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`admin-toast admin-toast-${t.type}`}
          onClick={() => onRemove(t.id)}
        >
          <i className={t.type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation'} />
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Modal ────────────────────────────────────────────────────── */
function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h3>{title}</h3>
          <button className="admin-btn-close" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="admin-modal-body">{children}</div>
      </div>
    </div>
  );
}

/* ─── Confirm Dialog ──────────────────────────────────────────── */
function ConfirmDialog({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;
  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal-content admin-modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h3>{title}</h3>
        </div>
        <div className="admin-modal-body">
          <p style={{ color: '#ccc', marginBottom: '1.5rem' }}>{message}</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button className="admin-btn" onClick={onClose}>Cancel</button>
            <button className="admin-btn admin-btn-danger" onClick={onConfirm}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Login Screen ────────────────────────────────────────────── */
function LoginScreen({ login }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login-card">
        <div className="admin-login-logo">
          <h2>HIMALIX LABS</h2>
          <span className="admin-badge">ADMIN</span>
        </div>
        <h3>Sign In</h3>
        {error && <div className="admin-alert admin-alert-error"><i className="fa-solid fa-circle-exclamation" /> {error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label className="admin-form-label">
              <i className="fa-solid fa-envelope" /> Email
            </label>
            <input
              type="email"
              className="admin-form-input"
              placeholder="admin@himalixlabs.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">
              <i className="fa-solid fa-lock" /> Password
            </label>
            <input
              type="password"
              className="admin-form-input"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="admin-btn admin-btn-primary admin-btn-full" disabled={loading}>
            {loading ? (
              <><i className="fa-solid fa-spinner fa-spin" /> Signing in...</>
            ) : (
              <><i className="fa-solid fa-right-to-bracket" /> Sign In</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Admin Component ────────────────────────────────────── */
export default function Admin() {
  const { user, token, login, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  // Data states
  const [stats, setStats] = useState(null);
  const [content, setContent] = useState([]);
  const [services, setServices] = useState([]);
  const [team, setTeam] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [settings, setSettings] = useState([]);
  const [messages, setMessages] = useState([]);

  // Hero state
  const [heroForm, setHeroForm] = useState({ headline: '', subline: '', cta_text: '', cta_link: '' });

  // About state
  const [aboutForm, setAboutForm] = useState({ title: '', description: '', mission: '', vision: '' });

  // Services modal
  const [serviceModal, setServiceModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({ ...EMPTY_SERVICE, features: [''] });
  const [serviceSaving, setServiceSaving] = useState(false);

  // Team modal
  const [teamModal, setTeamModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [memberForm, setMemberForm] = useState({ ...EMPTY_MEMBER, social_links: { twitter: '', linkedin: '', github: '' } });
  const [memberSaving, setMemberSaving] = useState(false);

  // Testimonials modal
  const [testimonialModal, setTestimonialModal] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [testimonialForm, setTestimonialForm] = useState({ ...EMPTY_TESTIMONIAL });
  const [testimonialSaving, setTestimonialSaving] = useState(false);

  // Stats form
  const [statsForm, setStatsForm] = useState({
    projects_completed: '',
    happy_clients: '',
    products_available: '',
    years_experience: '',
  });

  // Contact form
  const [contactForm, setContactForm] = useState({ title: '', email: '', phone: '', address: '' });

  // Settings form
  const [settingsForm, setSettingsForm] = useState({
    site_name: '', site_tagline: '', logo_url: '',
    primary_color: '#d4a017', secondary_color: '#c9a227',
    social_facebook: '', social_twitter: '', social_instagram: '',
    social_linkedin: '', social_github: '',
  });

  // Messages state
  const [expandedMessage, setExpandedMessage] = useState(null);

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });

  /* ─── Helpers ─────────────────────────────────────────────── */
  const addToast = useCallback((message, type = 'success') => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }), [token]);

  const authFetch = useCallback(async (url, options = {}) => {
    const res = await fetch(url, { ...options, headers: { ...authHeaders(), ...options.headers } });
    if (res.status === 401) {
      logout();
      return null;
    }
    return res;
  }, [authHeaders, logout]);

  /* ─── Data Fetching ──────────────────────────────────────── */
  const fetchAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [statsRes, contentRes, servicesRes, teamRes, testRes, settingsRes, msgRes] = await Promise.all([
        authFetch(`${API_URL}/admin/stats`),
        authFetch(`${API_URL}/admin/content`),
        authFetch(`${API_URL}/admin/services`),
        authFetch(`${API_URL}/admin/team`),
        authFetch(`${API_URL}/admin/testimonials`),
        authFetch(`${API_URL}/admin/settings`),
        authFetch(`${API_URL}/admin/messages`),
      ]);

      if (statsRes) {
        const s = await statsRes.json();
        setStats(s);
      }
      if (contentRes) {
        const c = await contentRes.json();
        setContent(c);
      }
      if (servicesRes) {
        const s = await servicesRes.json();
        setServices(s);
      }
      if (teamRes) {
        const t = await teamRes.json();
        setTeam(t);
      }
      if (testRes) {
        const t = await testRes.json();
        setTestimonials(t);
      }
      if (settingsRes) {
        const s = await settingsRes.json();
        setSettings(s);
        const sf = {};
        s.forEach((item) => { sf[item.setting_key] = item.setting_value; });
        setSettingsForm((prev) => ({ ...prev, ...sf }));
      }
      if (msgRes) {
        const m = await msgRes.json();
        setMessages(m);
      }
    } catch (err) {
      addToast('Failed to load data', 'error');
    }
    setLoading(false);
  }, [token, authFetch, addToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ─── Populate content forms when data loads ─────────────── */
  useEffect(() => {
    if (!content.length) return;
    const getVal = (section, key) => {
      const item = content.find((c) => c.section_name === section);
      if (!item) return '';
      try {
        const parsed = typeof item.content_value === 'string' ? JSON.parse(item.content_value) : item.content_value;
        return parsed[key] || '';
      } catch { return ''; }
    };
    setHeroForm({
      headline: getVal('hero', 'headline'),
      subline: getVal('hero', 'subline'),
      cta_text: getVal('hero', 'cta_text'),
      cta_link: getVal('hero', 'cta_link'),
    });
    setAboutForm({
      title: getVal('about', 'title'),
      description: getVal('about', 'description'),
      mission: getVal('about', 'mission'),
      vision: getVal('about', 'vision'),
    });
    setContactForm({
      title: getVal('contact', 'title'),
      email: getVal('contact', 'email'),
      phone: getVal('contact', 'phone'),
      address: getVal('contact', 'address'),
    });
    setStatsForm({
      projects_completed: getVal('stats', 'projects_completed'),
      happy_clients: getVal('stats', 'happy_clients'),
      products_available: getVal('stats', 'products_available'),
      years_experience: getVal('stats', 'years_experience'),
    });
  }, [content]);

  /* ─── Content Save ───────────────────────────────────────── */
  const saveContent = async (section, data) => {
    const item = content.find((c) => c.section_name === section);
    if (!item) {
      addToast('Content section not found', 'error');
      return;
    }
    const res = await authFetch(`${API_URL}/admin/content/${item.id}`, {
      method: 'PUT',
      body: JSON.stringify({ content_value: data }),
    });
    if (res && res.ok) {
      addToast(`${section.charAt(0).toUpperCase() + section.slice(1)} saved successfully`);
      fetchAll();
    } else {
      addToast('Failed to save content', 'error');
    }
  };

  /* ─── Settings Save ──────────────────────────────────────── */
  const saveSetting = async (key, value) => {
    const res = await authFetch(`${API_URL}/admin/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ setting_value: value }),
    });
    if (res && res.ok) {
      addToast(`${key.replace(/_/g, ' ')} saved`);
    } else {
      addToast('Failed to save setting', 'error');
    }
  };

  const saveAllSettings = async () => {
    const promises = Object.entries(settingsForm).map(([key, value]) =>
      authFetch(`${API_URL}/admin/settings/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ setting_value: value }),
      })
    );
    const results = await Promise.all(promises);
    if (results.every((r) => r && r.ok)) {
      addToast('Settings saved successfully');
      fetchAll();
    } else {
      addToast('Some settings failed to save', 'error');
    }
  };

  /* ─── Service CRUD ───────────────────────────────────────── */
  const openAddService = () => {
    setEditingService(null);
    setServiceForm({ ...EMPTY_SERVICE, features: [''] });
    setServiceModal(true);
  };

  const openEditService = (svc) => {
    setEditingService(svc);
    let feats = [''];
    try {
      feats = typeof svc.features === 'string' ? JSON.parse(svc.features) : svc.features;
      if (!Array.isArray(feats) || feats.length === 0) feats = [''];
    } catch { feats = ['']; }
    setServiceForm({
      title: svc.title || '',
      subtitle: svc.subtitle || '',
      description: svc.description || '',
      icon_class: svc.icon_class || '',
      features: feats,
      link_url: svc.link_url || '#',
      display_order: svc.display_order || 0,
      is_active: svc.is_active !== false,
    });
    setServiceModal(true);
  };

  const saveService = async () => {
    if (!serviceForm.title.trim()) {
      addToast('Title is required', 'error');
      return;
    }
    setServiceSaving(true);
    const body = {
      ...serviceForm,
      features: serviceForm.features.filter((f) => f.trim()),
    };
    const url = editingService
      ? `${API_URL}/admin/services/${editingService.id}`
      : `${API_URL}/admin/services`;
    const res = await authFetch(url, {
      method: editingService ? 'PUT' : 'POST',
      body: JSON.stringify(body),
    });
    if (res && res.ok) {
      addToast(editingService ? 'Service updated' : 'Service created');
      setServiceModal(false);
      fetchAll();
    } else {
      addToast('Failed to save service', 'error');
    }
    setServiceSaving(false);
  };

  const deleteService = (svc) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Service',
      message: `Delete "${svc.title}"? This cannot be undone.`,
      onConfirm: async () => {
        const res = await authFetch(`${API_URL}/admin/services/${svc.id}`, { method: 'DELETE' });
        if (res && res.ok) {
          addToast('Service deleted');
          fetchAll();
        } else {
          addToast('Failed to delete service', 'error');
        }
        setConfirmDialog({ open: false });
      },
    });
  };

  /* ─── Team CRUD ──────────────────────────────────────────── */
  const openAddMember = () => {
    setEditingMember(null);
    setMemberForm({ ...EMPTY_MEMBER, social_links: { twitter: '', linkedin: '', github: '' } });
    setTeamModal(true);
  };

  const openEditMember = (m) => {
    setEditingMember(m);
    let socials = { twitter: '', linkedin: '', github: '' };
    try {
      socials = typeof m.social_links === 'string' ? JSON.parse(m.social_links) : (m.social_links || socials);
    } catch { /* keep defaults */ }
    setMemberForm({
      name: m.name || '',
      role: m.role || '',
      bio: m.bio || '',
      image_url: m.image_url || '',
      social_links: socials,
      display_order: m.display_order || 0,
      is_active: m.is_active !== false,
    });
    setTeamModal(true);
  };

  const saveMember = async () => {
    if (!memberForm.name.trim() || !memberForm.role.trim()) {
      addToast('Name and role are required', 'error');
      return;
    }
    setMemberSaving(true);
    const url = editingMember
      ? `${API_URL}/admin/team/${editingMember.id}`
      : `${API_URL}/admin/team`;
    const res = await authFetch(url, {
      method: editingMember ? 'PUT' : 'POST',
      body: JSON.stringify(memberForm),
    });
    if (res && res.ok) {
      addToast(editingMember ? 'Member updated' : 'Member added');
      setTeamModal(false);
      fetchAll();
    } else {
      addToast('Failed to save member', 'error');
    }
    setMemberSaving(false);
  };

  const deleteMember = (m) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Team Member',
      message: `Remove "${m.name}" from the team?`,
      onConfirm: async () => {
        const res = await authFetch(`${API_URL}/admin/team/${m.id}`, { method: 'DELETE' });
        if (res && res.ok) {
          addToast('Member removed');
          fetchAll();
        } else {
          addToast('Failed to delete member', 'error');
        }
        setConfirmDialog({ open: false });
      },
    });
  };

  /* ─── Testimonial CRUD ──────────────────────────────────── */
  const openAddTestimonial = () => {
    setEditingTestimonial(null);
    setTestimonialForm({ ...EMPTY_TESTIMONIAL });
    setTestimonialModal(true);
  };

  const openEditTestimonial = (t) => {
    setEditingTestimonial(t);
    setTestimonialForm({
      client_name: t.client_name || '',
      client_title: t.client_title || '',
      company: t.company || '',
      content: t.content || '',
      rating: t.rating || 5,
      image_url: t.image_url || '',
      display_order: t.display_order || 0,
      is_active: t.is_active !== false,
    });
    setTestimonialModal(true);
  };

  const saveTestimonial = async () => {
    if (!testimonialForm.client_name.trim() || !testimonialForm.content.trim()) {
      addToast('Client name and content are required', 'error');
      return;
    }
    setTestimonialSaving(true);
    const url = editingTestimonial
      ? `${API_URL}/admin/testimonials/${editingTestimonial.id}`
      : `${API_URL}/admin/testimonials`;
    const res = await authFetch(url, {
      method: editingTestimonial ? 'PUT' : 'POST',
      body: JSON.stringify(testimonialForm),
    });
    if (res && res.ok) {
      addToast(editingTestimonial ? 'Testimonial updated' : 'Testimonial added');
      setTestimonialModal(false);
      fetchAll();
    } else {
      addToast('Failed to save testimonial', 'error');
    }
    setTestimonialSaving(false);
  };

  const deleteTestimonial = (t) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Testimonial',
      message: `Delete testimonial from "${t.client_name}"?`,
      onConfirm: async () => {
        const res = await authFetch(`${API_URL}/admin/testimonials/${t.id}`, { method: 'DELETE' });
        if (res && res.ok) {
          addToast('Testimonial deleted');
          fetchAll();
        } else {
          addToast('Failed to delete testimonial', 'error');
        }
        setConfirmDialog({ open: false });
      },
    });
  };

  /* ─── Message Actions ────────────────────────────────────── */
  const markAsRead = async (msg) => {
    const res = await authFetch(`${API_URL}/admin/messages/${msg.id}/read`, { method: 'PUT' });
    if (res && res.ok) {
      addToast('Message marked as read');
      fetchAll();
    }
  };

  const deleteMessage = (msg) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Message',
      message: `Delete message from "${msg.name}"? This cannot be undone.`,
      onConfirm: async () => {
        const res = await authFetch(`${API_URL}/admin/messages/${msg.id}`, { method: 'DELETE' });
        if (res && res.ok) {
          addToast('Message deleted');
          setExpandedMessage(null);
          fetchAll();
        } else {
          addToast('Failed to delete message', 'error');
        }
        setConfirmDialog({ open: false });
      },
    });
  };

  /* ─── Image Upload ───────────────────────────────────────── */
  const uploadImage = async (file, callback) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch(`${API_URL}/admin/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        callback(data.url);
        addToast('Image uploaded');
      } else {
        addToast('Upload failed', 'error');
      }
    } catch {
      addToast('Upload failed', 'error');
    }
  };

  /* ─── Not Auth ───────────────────────────────────────────── */
  if (!user) {
    return (
      <>
        <Toast toasts={toasts} onRemove={removeToast} />
        <LoginScreen login={login} />
      </>
    );
  }

  /* ─── Sidebar ────────────────────────────────────────────── */
  const renderSidebar = () => (
    <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : ''}`}>
      <div className="admin-sidebar-header">
        <h2 className="admin-sidebar-logo">HIMALIX LABS</h2>
        <span className="admin-badge">ADMIN</span>
      </div>

      <nav className="admin-sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`admin-sidebar-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
          >
            <i className={item.icon} />
            <span>{item.label}</span>
            {item.id === 'messages' && stats && stats.unread_messages > 0 && (
              <span className="admin-sidebar-badge">{stats.unread_messages}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <div className="admin-sidebar-user">
          <i className="fa-solid fa-circle-user" />
          <span>{user.name || user.email}</span>
        </div>
        <button
          className="admin-btn admin-btn-sm"
          onClick={() => { logout(); navigate('/'); }}
        >
          <i className="fa-solid fa-right-from-bracket" /> Logout
        </button>
      </div>
    </aside>
  );

  /* ─── Tab: Dashboard ─────────────────────────────────────── */
  const renderDashboard = () => (
    <div>
      <div className="admin-header">
        <h1 className="admin-header-title">Dashboard</h1>
        <p style={{ color: '#888', marginTop: '0.25rem' }}>
          Welcome back, <span style={{ color: '#d4a017' }}>{user.name || 'Admin'}</span>
        </p>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(212,160,23,0.15)', color: '#d4a017' }}>
            <i className="fa-solid fa-microchip" />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-value">{stats?.total_services ?? '-'}</span>
            <span className="admin-stat-label">Total Services</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>
            <i className="fa-solid fa-users" />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-value">{stats?.total_team ?? '-'}</span>
            <span className="admin-stat-label">Team Members</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
            <i className="fa-solid fa-quote-right" />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-value">{stats?.total_testimonials ?? '-'}</span>
            <span className="admin-stat-label">Testimonials</span>
          </div>
        </div>
        <div className={`admin-stat-card ${stats && stats.unread_messages > 0 ? 'admin-stat-card--highlight' : ''}`}>
          <div className="admin-stat-icon" style={{
            background: stats && stats.unread_messages > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(168,85,247,0.15)',
            color: stats && stats.unread_messages > 0 ? '#ef4444' : '#a855f7',
          }}>
            <i className="fa-solid fa-inbox" />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-value">{stats?.unread_messages ?? '-'}</span>
            <span className="admin-stat-label">Unread Messages</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
        <button className="admin-btn admin-btn-primary" onClick={() => setActiveTab('hero')}>
          <i className="fa-solid fa-trophy" /> Edit Hero
        </button>
        <button className="admin-btn" onClick={() => setActiveTab('messages')}>
          <i className="fa-solid fa-inbox" /> View Messages
        </button>
      </div>
    </div>
  );

  /* ─── Tab: Hero ──────────────────────────────────────────── */
  const renderHero = () => (
    <div>
      <div className="admin-header">
        <h1 className="admin-header-title"><i className="fa-solid fa-trophy" /> Hero Section</h1>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">Edit Hero Content</h3>
        <div className="admin-form">
          <div className="admin-form-group">
            <label className="admin-form-label">Headline</label>
            <input
              className="admin-form-input"
              value={heroForm.headline}
              onChange={(e) => setHeroForm({ ...heroForm, headline: e.target.value })}
              placeholder="Building the Future of Embedded Electronics"
            />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Subline</label>
            <textarea
              className="admin-form-input admin-form-textarea"
              rows={3}
              value={heroForm.subline}
              onChange={(e) => setHeroForm({ ...heroForm, subline: e.target.value })}
              placeholder="From concept to creation..."
            />
          </div>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-form-label">CTA Button Text</label>
              <input
                className="admin-form-input"
                value={heroForm.cta_text}
                onChange={(e) => setHeroForm({ ...heroForm, cta_text: e.target.value })}
                placeholder="Explore Services"
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">CTA Button Link</label>
              <input
                className="admin-form-input"
                value={heroForm.cta_link}
                onChange={(e) => setHeroForm({ ...heroForm, cta_link: e.target.value })}
                placeholder="#services"
              />
            </div>
          </div>
        </div>

        <div className="admin-card" style={{ marginTop: '1.5rem', background: '#0a0a0a' }}>
          <h4 className="admin-card-title" style={{ fontSize: '0.9rem' }}>Preview</h4>
          <div style={{ padding: '1rem', borderRadius: '4px', background: '#111', border: '1px solid #222' }}>
            <p style={{ color: '#d4a017', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              <i className="fa-solid fa-microchip" /> Embedded Innovation
            </p>
            <h2 style={{ color: '#fff', fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              {heroForm.headline || 'Headline preview'}
            </h2>
            <p style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {heroForm.subline || 'Subline preview'}
            </p>
            {heroForm.cta_text && (
              <span className="admin-btn admin-btn-primary admin-btn-sm" style={{ pointerEvents: 'none' }}>
                {heroForm.cta_text}
              </span>
            )}
          </div>
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <button className="admin-btn admin-btn-primary" onClick={() => saveContent('hero', heroForm)}>
            <i className="fa-solid fa-floppy-disk" /> Save Hero
          </button>
        </div>
      </div>
    </div>
  );

  /* ─── Tab: About ─────────────────────────────────────────── */
  const renderAbout = () => (
    <div>
      <div className="admin-header">
        <h1 className="admin-header-title"><i className="fa-solid fa-building" /> About Section</h1>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">Edit About Content</h3>
        <div className="admin-form">
          <div className="admin-form-group">
            <label className="admin-form-label">About Title</label>
            <input
              className="admin-form-input"
              value={aboutForm.title}
              onChange={(e) => setAboutForm({ ...aboutForm, title: e.target.value })}
              placeholder="About Himalix Labs"
            />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Description</label>
            <textarea
              className="admin-form-input admin-form-textarea"
              rows={5}
              value={aboutForm.description}
              onChange={(e) => setAboutForm({ ...aboutForm, description: e.target.value })}
              placeholder="About the company..."
            />
          </div>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-form-label">Mission</label>
              <textarea
                className="admin-form-input admin-form-textarea"
                rows={4}
                value={aboutForm.mission}
                onChange={(e) => setAboutForm({ ...aboutForm, mission: e.target.value })}
                placeholder="Our mission..."
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Vision</label>
              <textarea
                className="admin-form-input admin-form-textarea"
                rows={4}
                value={aboutForm.vision}
                onChange={(e) => setAboutForm({ ...aboutForm, vision: e.target.value })}
                placeholder="Our vision..."
              />
            </div>
          </div>
        </div>
        <div style={{ marginTop: '1.5rem' }}>
          <button className="admin-btn admin-btn-primary" onClick={() => saveContent('about', aboutForm)}>
            <i className="fa-solid fa-floppy-disk" /> Save About
          </button>
        </div>
      </div>
    </div>
  );

  /* ─── Tab: Services ──────────────────────────────────────── */
  const renderServices = () => (
    <div>
      <div className="admin-header">
        <h1 className="admin-header-title"><i className="fa-solid fa-microchip" /> Services</h1>
        <button className="admin-btn admin-btn-primary" onClick={openAddService}>
          <i className="fa-solid fa-plus" /> Add Service
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Icon</th>
              <th>Title</th>
              <th>Subtitle</th>
              <th>Order</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map((svc) => (
              <tr key={svc.id}>
                <td><i className={svc.icon_class} style={{ color: '#d4a017', fontSize: '1.1rem' }} /></td>
                <td style={{ color: '#fff', fontWeight: 500 }}>{svc.title}</td>
                <td style={{ color: '#aaa' }}>{svc.subtitle}</td>
                <td style={{ fontFamily: 'JetBrains Mono, monospace', color: '#888' }}>{svc.display_order}</td>
                <td>
                  <span className={`admin-badge ${svc.is_active ? 'admin-badge-active' : 'admin-badge-inactive'}`}>
                    {svc.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="admin-btn admin-btn-sm" onClick={() => openEditService(svc)}>
                      <i className="fa-solid fa-pen" />
                    </button>
                    <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => deleteService(svc)}>
                      <i className="fa-solid fa-trash" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {services.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>No services yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ─── Tab: Team ──────────────────────────────────────────── */
  const renderTeam = () => (
    <div>
      <div className="admin-header">
        <h1 className="admin-header-title"><i className="fa-solid fa-users" /> Team</h1>
        <button className="admin-btn admin-btn-primary" onClick={openAddMember}>
          <i className="fa-solid fa-plus" /> Add Member
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Avatar</th>
              <th>Name</th>
              <th>Role</th>
              <th>Order</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {team.map((m) => (
              <tr key={m.id}>
                <td>
                  <div className="admin-avatar-sm">
                    {m.image_url ? (
                      <img src={m.image_url} alt={m.name} />
                    ) : (
                      <i className="fa-solid fa-user" />
                    )}
                  </div>
                </td>
                <td style={{ color: '#fff', fontWeight: 500 }}>{m.name}</td>
                <td style={{ color: '#aaa' }}>{m.role}</td>
                <td style={{ fontFamily: 'JetBrains Mono, monospace', color: '#888' }}>{m.display_order}</td>
                <td>
                  <span className={`admin-badge ${m.is_active ? 'admin-badge-active' : 'admin-badge-inactive'}`}>
                    {m.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="admin-btn admin-btn-sm" onClick={() => openEditMember(m)}>
                      <i className="fa-solid fa-pen" />
                    </button>
                    <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => deleteMember(m)}>
                      <i className="fa-solid fa-trash" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {team.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>No team members yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ─── Tab: Testimonials ──────────────────────────────────── */
  const renderTestimonials = () => (
    <div>
      <div className="admin-header">
        <h1 className="admin-header-title"><i className="fa-solid fa-quote-right" /> Testimonials</h1>
        <button className="admin-btn admin-btn-primary" onClick={openAddTestimonial}>
          <i className="fa-solid fa-plus" /> Add Testimonial
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Company</th>
              <th>Rating</th>
              <th>Order</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {testimonials.map((t) => (
              <tr key={t.id}>
                <td style={{ color: '#fff', fontWeight: 500 }}>{t.client_name}</td>
                <td style={{ color: '#aaa' }}>{t.company}</td>
                <td>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <i key={i} className={`fa-${i < t.rating ? 'solid' : 'regular'} fa-star`} style={{ color: '#d4a017', fontSize: '0.8rem' }} />
                    ))}
                  </div>
                </td>
                <td style={{ fontFamily: 'JetBrains Mono, monospace', color: '#888' }}>{t.display_order}</td>
                <td>
                  <span className={`admin-badge ${t.is_active ? 'admin-badge-active' : 'admin-badge-inactive'}`}>
                    {t.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="admin-btn admin-btn-sm" onClick={() => openEditTestimonial(t)}>
                      <i className="fa-solid fa-pen" />
                    </button>
                    <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => deleteTestimonial(t)}>
                      <i className="fa-solid fa-trash" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {testimonials.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>No testimonials yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ─── Tab: Stats ─────────────────────────────────────────── */
  const renderStats = () => (
    <div>
      <div className="admin-header">
        <h1 className="admin-header-title"><i className="fa-solid fa-chart-line" /> Stats</h1>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">Edit Statistics Values</h3>
        <div className="admin-form">
          {[
            { key: 'projects_completed', label: 'Projects Completed', icon: 'fa-solid fa-rocket', placeholder: '500+' },
            { key: 'happy_clients', label: 'Happy Clients', icon: 'fa-solid fa-face-smile', placeholder: '200+' },
            { key: 'products_available', label: 'Products Available', icon: 'fa-solid fa-box-open', placeholder: '1000+' },
            { key: 'years_experience', label: 'Years Experience', icon: 'fa-solid fa-calendar-check', placeholder: '10+' },
          ].map((s) => (
            <div key={s.key} className="admin-form-group">
              <label className="admin-form-label">
                <i className={s.icon} /> {s.label}
              </label>
              <input
                className="admin-form-input"
                value={statsForm[s.key]}
                onChange={(e) => setStatsForm({ ...statsForm, [s.key]: e.target.value })}
                placeholder={s.placeholder}
              />
            </div>
          ))}
        </div>
        <div style={{ marginTop: '1.5rem' }}>
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => saveContent('stats', statsForm)}
          >
            <i className="fa-solid fa-floppy-disk" /> Save Stats
          </button>
        </div>
      </div>
    </div>
  );

  /* ─── Tab: Contact Info ──────────────────────────────────── */
  const renderContact = () => (
    <div>
      <div className="admin-header">
        <h1 className="admin-header-title"><i className="fa-solid fa-envelope" /> Contact Info</h1>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">Edit Contact Information</h3>
        <div className="admin-form">
          <div className="admin-form-group">
            <label className="admin-form-label">Contact Section Title</label>
            <input
              className="admin-form-input"
              value={contactForm.title}
              onChange={(e) => setContactForm({ ...contactForm, title: e.target.value })}
              placeholder="Get In Touch"
            />
          </div>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-form-label">
                <i className="fa-solid fa-envelope" /> Email
              </label>
              <input
                className="admin-form-input"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                placeholder="info@himalixlabs.com"
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">
                <i className="fa-solid fa-phone" /> Phone
              </label>
              <input
                className="admin-form-input"
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                placeholder="+977-1-XXXXXXX"
              />
            </div>
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">
              <i className="fa-solid fa-location-dot" /> Address
            </label>
            <input
              className="admin-form-input"
              value={contactForm.address}
              onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
              placeholder="Kathmandu, Nepal"
            />
          </div>
        </div>
        <div style={{ marginTop: '1.5rem' }}>
          <button className="admin-btn admin-btn-primary" onClick={() => saveContent('contact', contactForm)}>
            <i className="fa-solid fa-floppy-disk" /> Save Contact Info
          </button>
        </div>
      </div>
    </div>
  );

  /* ─── Tab: Settings ──────────────────────────────────────── */
  const renderSettings = () => (
    <div>
      <div className="admin-header">
        <h1 className="admin-header-title"><i className="fa-solid fa-gear" /> Settings</h1>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">Site Settings</h3>
        <div className="admin-form">
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-form-label">Site Name</label>
              <input
                className="admin-form-input"
                value={settingsForm.site_name || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, site_name: e.target.value })}
                placeholder="Himalix Labs"
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Site Tagline</label>
              <input
                className="admin-form-input"
                value={settingsForm.site_tagline || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, site_tagline: e.target.value })}
                placeholder="Building the Future of Electronics"
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Logo URL</label>
            <input
              className="admin-form-input"
              value={settingsForm.logo_url || ''}
              onChange={(e) => setSettingsForm({ ...settingsForm, logo_url: e.target.value })}
              placeholder="https://example.com/logo.png"
            />
            {settingsForm.logo_url && (
              <div style={{ marginTop: '0.5rem' }}>
                <img src={settingsForm.logo_url} alt="Logo preview" style={{ maxHeight: '40px', borderRadius: '4px' }} onError={(e) => e.target.style.display = 'none'} />
              </div>
            )}
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-form-label">Primary Color</label>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <input
                  type="color"
                  value={settingsForm.primary_color || '#d4a017'}
                  onChange={(e) => setSettingsForm({ ...settingsForm, primary_color: e.target.value })}
                  style={{ width: '48px', height: '40px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'transparent' }}
                />
                <input
                  className="admin-form-input"
                  value={settingsForm.primary_color || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, primary_color: e.target.value })}
                  placeholder="#d4a017"
                  style={{ flex: 1 }}
                />
              </div>
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Secondary Color</label>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <input
                  type="color"
                  value={settingsForm.secondary_color || '#c9a227'}
                  onChange={(e) => setSettingsForm({ ...settingsForm, secondary_color: e.target.value })}
                  style={{ width: '48px', height: '40px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'transparent' }}
                />
                <input
                  className="admin-form-input"
                  value={settingsForm.secondary_color || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, secondary_color: e.target.value })}
                  placeholder="#c9a227"
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>

          <h4 className="admin-card-title" style={{ marginTop: '1.5rem', fontSize: '0.95rem' }}>
            <i className="fa-solid fa-share-nodes" /> Social Media Links
          </h4>

          {[
            { key: 'social_facebook', label: 'Facebook', icon: 'fa-brands fa-facebook-f' },
            { key: 'social_twitter', label: 'Twitter', icon: 'fa-brands fa-twitter' },
            { key: 'social_instagram', label: 'Instagram', icon: 'fa-brands fa-instagram' },
            { key: 'social_linkedin', label: 'LinkedIn', icon: 'fa-brands fa-linkedin-in' },
            { key: 'social_github', label: 'GitHub', icon: 'fa-brands fa-github' },
          ].map((s) => (
            <div key={s.key} className="admin-form-group">
              <label className="admin-form-label">
                <i className={s.icon} /> {s.label} URL
              </label>
              <input
                className="admin-form-input"
                value={settingsForm[s.key] || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, [s.key]: e.target.value })}
                placeholder={`https://${s.label.toLowerCase()}.com/...`}
              />
            </div>
          ))}
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <button className="admin-btn admin-btn-primary" onClick={saveAllSettings}>
            <i className="fa-solid fa-floppy-disk" /> Save Settings
          </button>
        </div>
      </div>
    </div>
  );

  /* ─── Tab: Messages ──────────────────────────────────────── */
  const renderMessages = () => (
    <div>
      <div className="admin-header">
        <h1 className="admin-header-title"><i className="fa-solid fa-inbox" /> Messages</h1>
        <span style={{ color: '#888' }}>{messages.length} total, {messages.filter((m) => !m.is_read).length} unread</span>
      </div>

      <div className="admin-messages-list">
        {messages.length === 0 && (
          <div className="admin-card" style={{ textAlign: 'center', color: '#666', padding: '3rem' }}>
            <i className="fa-solid fa-inbox" style={{ fontSize: '2rem', marginBottom: '1rem', display: 'block' }} />
            No messages yet
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`admin-message-item ${!msg.is_read ? 'admin-message-item--unread' : ''} ${expandedMessage === msg.id ? 'admin-message-item--expanded' : ''}`}
            onClick={() => setExpandedMessage(expandedMessage === msg.id ? null : msg.id)}
          >
            <div className="admin-message-header">
              <div className="admin-message-info">
                {!msg.is_read && <span className="admin-unread-dot" />}
                <div>
                  <h4 className="admin-message-name">{msg.name}</h4>
                  <span className="admin-message-email">{msg.email}</span>
                </div>
              </div>
              <div className="admin-message-meta">
                <span className="admin-message-subject">{msg.subject}</span>
                <span className="admin-message-date">
                  {new Date(msg.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {expandedMessage === msg.id && (
              <div className="admin-message-body">
                <p className="admin-message-text">{msg.message}</p>
                <div className="admin-message-actions">
                  {!msg.is_read && (
                    <button
                      className="admin-btn admin-btn-sm admin-btn-primary"
                      onClick={(e) => { e.stopPropagation(); markAsRead(msg); }}
                    >
                      <i className="fa-solid fa-check" /> Mark as Read
                    </button>
                  )}
                  <button
                    className="admin-btn admin-btn-sm admin-btn-danger"
                    onClick={(e) => { e.stopPropagation(); deleteMessage(msg); }}
                  >
                    <i className="fa-solid fa-trash" /> Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  /* ─── Tab Content Renderer ───────────────────────────────── */
  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="admin-loading">
          <i className="fa-solid fa-spinner fa-spin" />
          <p>Loading...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'hero': return renderHero();
      case 'about': return renderAbout();
      case 'services': return renderServices();
      case 'team': return renderTeam();
      case 'testimonials': return renderTestimonials();
      case 'stats': return renderStats();
      case 'contact': return renderContact();
      case 'settings': return renderSettings();
      case 'messages': return renderMessages();
      default: return renderDashboard();
    }
  };

  /* ─── Render ─────────────────────────────────────────────── */
  return (
    <div className="admin-layout">
      <Toast toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog
        isOpen={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
      />

      <button className="admin-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <i className={sidebarOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'} />
      </button>

      {sidebarOpen && <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {renderSidebar()}

      <main className="admin-content">
        {renderTabContent()}
      </main>

      {/* ─── Service Modal ───────────────────────────────────── */}
      <Modal isOpen={serviceModal} onClose={() => setServiceModal(false)} title={editingService ? 'Edit Service' : 'Add Service'}>
        <div className="admin-form">
          <div className="admin-form-group">
            <label className="admin-form-label">Title *</label>
            <input
              className="admin-form-input"
              value={serviceForm.title}
              onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
              placeholder="Embedded Systems"
            />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Subtitle</label>
            <input
              className="admin-form-input"
              value={serviceForm.subtitle}
              onChange={(e) => setServiceForm({ ...serviceForm, subtitle: e.target.value })}
              placeholder="Custom embedded solutions..."
            />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Description</label>
            <textarea
              className="admin-form-input admin-form-textarea"
              rows={3}
              value={serviceForm.description}
              onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
              placeholder="Detailed description..."
            />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Icon Class (FontAwesome)</label>
            <input
              className="admin-form-input"
              value={serviceForm.icon_class}
              onChange={(e) => setServiceForm({ ...serviceForm, icon_class: e.target.value })}
              placeholder="fa-solid fa-microchip"
            />
            {serviceForm.icon_class && (
              <div style={{ marginTop: '0.5rem', color: '#d4a017' }}>
                Preview: <i className={serviceForm.icon_class} /> {serviceForm.icon_class}
              </div>
            )}
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Features</label>
            <div className="admin-feature-list">
              {serviceForm.features.map((feat, idx) => (
                <div key={idx} className="admin-feature-item">
                  <input
                    className="admin-form-input"
                    value={feat}
                    onChange={(e) => {
                      const newFeatures = [...serviceForm.features];
                      newFeatures[idx] = e.target.value;
                      setServiceForm({ ...serviceForm, features: newFeatures });
                    }}
                    placeholder={`Feature ${idx + 1}`}
                  />
                  {serviceForm.features.length > 1 && (
                    <button
                      className="admin-btn admin-btn-sm admin-btn-danger"
                      onClick={() => {
                        const newFeatures = serviceForm.features.filter((_, i) => i !== idx);
                        setServiceForm({ ...serviceForm, features: newFeatures });
                      }}
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              className="admin-btn admin-btn-sm"
              style={{ marginTop: '0.5rem' }}
              onClick={() => setServiceForm({ ...serviceForm, features: [...serviceForm.features, ''] })}
            >
              <i className="fa-solid fa-plus" /> Add Feature
            </button>
          </div>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-form-label">Link URL</label>
              <input
                className="admin-form-input"
                value={serviceForm.link_url}
                onChange={(e) => setServiceForm({ ...serviceForm, link_url: e.target.value })}
                placeholder="#contact"
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Display Order</label>
              <input
                type="number"
                className="admin-form-input"
                value={serviceForm.display_order}
                onChange={(e) => setServiceForm({ ...serviceForm, display_order: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={serviceForm.is_active}
                onChange={(e) => setServiceForm({ ...serviceForm, is_active: e.target.checked })}
                style={{ accentColor: '#d4a017' }}
              />
              Active
            </label>
          </div>
        </div>
        <div className="admin-modal-footer">
          <button className="admin-btn" onClick={() => setServiceModal(false)}>Cancel</button>
          <button className="admin-btn admin-btn-primary" onClick={saveService} disabled={serviceSaving}>
            {serviceSaving ? (
              <><i className="fa-solid fa-spinner fa-spin" /> Saving...</>
            ) : (
              <><i className="fa-solid fa-floppy-disk" /> {editingService ? 'Update' : 'Create'}</>
            )}
          </button>
        </div>
      </Modal>

      {/* ─── Team Modal ──────────────────────────────────────── */}
      <Modal isOpen={teamModal} onClose={() => setTeamModal(false)} title={editingMember ? 'Edit Member' : 'Add Member'}>
        <div className="admin-form">
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-form-label">Name *</label>
              <input
                className="admin-form-input"
                value={memberForm.name}
                onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Role *</label>
              <input
                className="admin-form-input"
                value={memberForm.role}
                onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                placeholder="Lead Engineer"
              />
            </div>
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Bio</label>
            <textarea
              className="admin-form-input admin-form-textarea"
              rows={3}
              value={memberForm.bio}
              onChange={(e) => setMemberForm({ ...memberForm, bio: e.target.value })}
              placeholder="Brief bio..."
            />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Image URL</label>
            <input
              className="admin-form-input"
              value={memberForm.image_url}
              onChange={(e) => setMemberForm({ ...memberForm, image_url: e.target.value })}
              placeholder="https://example.com/photo.jpg"
            />
            {memberForm.image_url && (
              <div style={{ marginTop: '0.5rem' }}>
                <img
                  src={memberForm.image_url}
                  alt="Preview"
                  style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '4px' }}
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>
            )}
          </div>
          <h4 className="admin-card-title" style={{ fontSize: '0.9rem', marginTop: '1rem' }}>
            <i className="fa-solid fa-share-nodes" /> Social Links
          </h4>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-form-label"><i className="fa-brands fa-twitter" /> Twitter</label>
              <input
                className="admin-form-input"
                value={memberForm.social_links.twitter}
                onChange={(e) => setMemberForm({
                  ...memberForm,
                  social_links: { ...memberForm.social_links, twitter: e.target.value },
                })}
                placeholder="https://twitter.com/..."
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label"><i className="fa-brands fa-linkedin-in" /> LinkedIn</label>
              <input
                className="admin-form-input"
                value={memberForm.social_links.linkedin}
                onChange={(e) => setMemberForm({
                  ...memberForm,
                  social_links: { ...memberForm.social_links, linkedin: e.target.value },
                })}
                placeholder="https://linkedin.com/in/..."
              />
            </div>
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label"><i className="fa-brands fa-github" /> GitHub</label>
            <input
              className="admin-form-input"
              value={memberForm.social_links.github}
              onChange={(e) => setMemberForm({
                ...memberForm,
                social_links: { ...memberForm.social_links, github: e.target.value },
              })}
              placeholder="https://github.com/..."
            />
          </div>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-form-label">Display Order</label>
              <input
                type="number"
                className="admin-form-input"
                value={memberForm.display_order}
                onChange={(e) => setMemberForm({ ...memberForm, display_order: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={memberForm.is_active}
                  onChange={(e) => setMemberForm({ ...memberForm, is_active: e.target.checked })}
                  style={{ accentColor: '#d4a017' }}
                />
                Active
              </label>
            </div>
          </div>
        </div>
        <div className="admin-modal-footer">
          <button className="admin-btn" onClick={() => setTeamModal(false)}>Cancel</button>
          <button className="admin-btn admin-btn-primary" onClick={saveMember} disabled={memberSaving}>
            {memberSaving ? (
              <><i className="fa-solid fa-spinner fa-spin" /> Saving...</>
            ) : (
              <><i className="fa-solid fa-floppy-disk" /> {editingMember ? 'Update' : 'Create'}</>
            )}
          </button>
        </div>
      </Modal>

      {/* ─── Testimonial Modal ───────────────────────────────── */}
      <Modal isOpen={testimonialModal} onClose={() => setTestimonialModal(false)} title={editingTestimonial ? 'Edit Testimonial' : 'Add Testimonial'}>
        <div className="admin-form">
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-form-label">Client Name *</label>
              <input
                className="admin-form-input"
                value={testimonialForm.client_name}
                onChange={(e) => setTestimonialForm({ ...testimonialForm, client_name: e.target.value })}
                placeholder="John Smith"
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Client Title</label>
              <input
                className="admin-form-input"
                value={testimonialForm.client_title}
                onChange={(e) => setTestimonialForm({ ...testimonialForm, client_title: e.target.value })}
                placeholder="CTO"
              />
            </div>
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Company</label>
            <input
              className="admin-form-input"
              value={testimonialForm.company}
              onChange={(e) => setTestimonialForm({ ...testimonialForm, company: e.target.value })}
              placeholder="Tech Corp"
            />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Content *</label>
            <textarea
              className="admin-form-input admin-form-textarea"
              rows={4}
              value={testimonialForm.content}
              onChange={(e) => setTestimonialForm({ ...testimonialForm, content: e.target.value })}
              placeholder="What the client said..."
            />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Rating</label>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setTestimonialForm({ ...testimonialForm, rating: i + 1 })}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', fontSize: '1.25rem' }}
                >
                  <i className={`fa-${i < testimonialForm.rating ? 'solid' : 'regular'} fa-star`} style={{ color: '#d4a017' }} />
                </button>
              ))}
            </div>
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Image URL</label>
            <input
              className="admin-form-input"
              value={testimonialForm.image_url}
              onChange={(e) => setTestimonialForm({ ...testimonialForm, image_url: e.target.value })}
              placeholder="https://example.com/photo.jpg"
            />
          </div>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-form-label">Display Order</label>
              <input
                type="number"
                className="admin-form-input"
                value={testimonialForm.display_order}
                onChange={(e) => setTestimonialForm({ ...testimonialForm, display_order: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={testimonialForm.is_active}
                  onChange={(e) => setTestimonialForm({ ...testimonialForm, is_active: e.target.checked })}
                  style={{ accentColor: '#d4a017' }}
                />
                Active
              </label>
            </div>
          </div>
        </div>
        <div className="admin-modal-footer">
          <button className="admin-btn" onClick={() => setTestimonialModal(false)}>Cancel</button>
          <button className="admin-btn admin-btn-primary" onClick={saveTestimonial} disabled={testimonialSaving}>
            {testimonialSaving ? (
              <><i className="fa-solid fa-spinner fa-spin" /> Saving...</>
            ) : (
              <><i className="fa-solid fa-floppy-disk" /> {editingTestimonial ? 'Update' : 'Create'}</>
            )}
          </button>
        </div>
      </Modal>
    </div>
  );
}
