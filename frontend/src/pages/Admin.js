import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import ImageUploadZone from '../components/ImageUploadZone';

const API_URL = 'http://localhost:5001/api';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fa-light fa-sharp fa-gauge-high' },
  { id: 'hero', label: 'Hero Section', icon: 'fa-light fa-sharp fa-trophy' },
  { id: 'about', label: 'About', icon: 'fa-light fa-sharp fa-building' },
  { id: 'services', label: 'Services', icon: 'fa-light fa-sharp fa-microchip' },
  { id: 'team', label: 'Team', icon: 'fa-light fa-sharp fa-users' },
  { id: 'testimonials', label: 'Testimonials', icon: 'fa-light fa-sharp fa-quote-right' },
  { id: 'stats', label: 'Stats', icon: 'fa-light fa-sharp fa-chart-line' },
  { id: 'contact', label: 'Contact Info', icon: 'fa-light fa-sharp fa-envelope' },
  { id: 'settings', label: 'Settings', icon: 'fa-light fa-sharp fa-gear' },
  { id: 'messages', label: 'Messages', icon: 'fa-light fa-sharp fa-inbox' },
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

/* ─── Helper: Convert Generic Icons to Light Sharp ───────────────── */
const getIconClass = (cls) => {
  if (!cls) return 'fa-light fa-sharp fa-cube';
  return cls
    .replace('fa-solid', 'fa-light fa-sharp')
    .replace('fa-regular', 'fa-light fa-sharp');
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
          style={{ cursor: 'pointer' }}
        >
          <i className={t.type === 'success' ? 'fa-light fa-sharp fa-circle-check' : 'fa-light fa-sharp fa-circle-exclamation'} />
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
          <button className="admin-btn-close" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <i className="fa-light fa-sharp fa-xmark" />
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
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{message}</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button className="admin-btn admin-btn-secondary" onClick={onClose}>Cancel</button>
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
        <h3 style={{ fontWeight: 400 }}>Sign In</h3>
        {error && (
          <div className="admin-toast admin-toast-error" style={{ position: 'relative', bottom: 'auto', right: 'auto', marginBottom: '1.5rem', width: '100%' }}>
            <i className="fa-light fa-sharp fa-circle-exclamation" />
            <span>{error}</span>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label className="admin-form-label">
              <i className="fa-light fa-sharp fa-envelope" /> Email
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
              <i className="fa-light fa-sharp fa-lock" /> Password
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
              <><i className="fa-light fa-sharp fa-spinner fa-spin" /> Signing in...</>
            ) : (
              <><i className="fa-light fa-sharp fa-right-to-bracket" /> Sign In</>
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
  const { theme, toggleTheme } = useTheme();
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

  // Drag and Drop reordering refs
  const dragItem = useRef();
  const dragOverItem = useRef();

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
    primary_color: '#e0af3c', secondary_color: '#cba02f',
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
      const item = content.find((c) => c.section === section && c.content_key === key);
      return item ? item.content_value : '';
    };
    setHeroForm({
      headline: getVal('hero', 'hero_headline'),
      subline: getVal('hero', 'hero_subline'),
      cta_text: getVal('hero', 'hero_cta_text'),
      cta_link: getVal('hero', 'hero_cta_link'),
    });
    setAboutForm({
      title: getVal('about', 'about_title'),
      description: getVal('about', 'about_description'),
      mission: getVal('about', 'about_mission'),
      vision: getVal('about', 'about_vision'),
    });
    setContactForm({
      title: getVal('contact', 'contact_title'),
      email: getVal('contact', 'contact_email'),
      phone: getVal('contact', 'contact_phone'),
      address: getVal('contact', 'contact_address'),
    });
    setStatsForm({
      projects_completed: getVal('stats', 'stats_projects'),
      happy_clients: getVal('stats', 'stats_clients'),
      products_available: getVal('stats', 'stats_products'),
      years_experience: getVal('stats', 'stats_years'),
    });
  }, [content]);

  /* ─── Content Save ───────────────────────────────────────── */
  const saveContent = async (section, dataMap) => {
    try {
      const updates = [];
      Object.entries(dataMap).forEach(([key, value]) => {
        // Find DB key name mapping
        let dbKey = key;
        if (section === 'hero') dbKey = `hero_${key}`;
        if (section === 'about') dbKey = `about_${key}`;
        if (section === 'contact') dbKey = `contact_${key}`;
        if (section === 'stats') {
          if (key === 'projects_completed') dbKey = 'stats_projects';
          if (key === 'happy_clients') dbKey = 'stats_clients';
          if (key === 'products_available') dbKey = 'stats_products';
          if (key === 'years_experience') dbKey = 'stats_years';
        }

        const item = content.find((c) => c.section === section && c.content_key === dbKey);
        if (item) {
          updates.push({ id: item.id, content_value: value });
        }
      });

      if (updates.length === 0) {
        addToast('No parameters updated', 'error');
        return;
      }

      const res = await authFetch(`${API_URL}/admin/content/bulk`, {
        method: 'PUT',
        body: JSON.stringify({ updates }),
      });

      if (res && res.ok) {
        addToast(`${section.charAt(0).toUpperCase() + section.slice(1)} configuration saved`);
        fetchAll();
      } else {
        addToast('Failed to save config', 'error');
      }
    } catch {
      addToast('Failed to save content', 'error');
    }
  };

  /* ─── Settings Save ──────────────────────────────────────── */
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

  /* ─── Team CRUD & Drag-and-Drop Reordering ───────────────── */
  const dragStart = (e, position) => {
    dragItem.current = position;
    e.dataTransfer.effectAllowed = 'move';
  };

  const dragEnter = (e, position) => {
    dragOverItem.current = position;
  };

  const drop = async (e) => {
    e.preventDefault();
    if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) {
      return;
    }

    const copyListItems = [...team];
    const dragItemContent = copyListItems[dragItem.current];
    copyListItems.splice(dragItem.current, 1);
    copyListItems.splice(dragOverItem.current, 0, dragItemContent);
    dragItem.current = null;
    dragOverItem.current = null;

    // Dynamically assign display orders based on new index
    const updatedList = copyListItems.map((item, index) => ({
      ...item,
      display_order: index + 1
    }));
    
    // Update local state first for immediate UI response
    setTeam(updatedList);

    // Call backend API sequentially for each updated display order
    try {
      await Promise.all(
        updatedList.map((m) =>
          authFetch(`${API_URL}/admin/team/${m.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              name: m.name,
              role: m.role,
              bio: m.bio,
              image_url: m.image_url,
              social_links: typeof m.social_links === 'string' ? JSON.parse(m.social_links) : m.social_links,
              display_order: m.display_order,
              is_active: m.is_active !== false,
            })
          })
        )
      );
      addToast('Team reordered successfully');
      fetchAll();
    } catch {
      addToast('Failed to save display orders', 'error');
    }
  };

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
        <div>
          <h2 className="admin-sidebar-logo">HIMALIX LABS</h2>
          <span className="admin-badge">ADMIN</span>
        </div>
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
          <i className="fa-light fa-sharp fa-circle-user" />
          <span>{user.name || user.email}</span>
        </div>
        
        <button
          className="admin-btn admin-btn-sm"
          onClick={toggleTheme}
          style={{ justifyContent: 'center' }}
        >
          <i className={theme === 'light' ? 'fa-light fa-sharp fa-moon' : 'fa-light fa-sharp fa-sun'} /> 
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>

        <button
          className="admin-btn admin-btn-sm admin-btn-danger"
          onClick={() => { logout(); navigate('/'); }}
          style={{ justifyContent: 'center' }}
        >
          <i className="fa-light fa-sharp fa-right-from-bracket" /> Logout
        </button>
      </div>
    </aside>
  );

  /* ─── Tab: Dashboard ─────────────────────────────────────── */
  const renderDashboard = () => (
    <div>
      <div className="admin-header">
        <h1 className="admin-header-title">Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.85rem' }}>
          Welcome back, <span style={{ color: 'var(--accent-primary)' }}>{user.name || 'Admin'}</span>
        </p>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'var(--accent-glow)', color: 'var(--accent-primary)' }}>
            <i className="fa-light fa-sharp fa-microchip" />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-value">{stats?.total_services ?? '-'}</span>
            <span className="admin-stat-label">Total Services</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
            <i className="fa-light fa-sharp fa-users" />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-value">{stats?.total_team ?? '-'}</span>
            <span className="admin-stat-label">Team Members</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <i className="fa-light fa-sharp fa-quote-right" />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-value">{stats?.total_testimonials ?? '-'}</span>
            <span className="admin-stat-label">Testimonials</span>
          </div>
        </div>
        <div className={`admin-stat-card ${stats && stats.unread_messages > 0 ? 'admin-stat-card--highlight' : ''}`}>
          <div className="admin-stat-icon" style={{
            background: stats && stats.unread_messages > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(168,85,247,0.1)',
            color: stats && stats.unread_messages > 0 ? '#ef4444' : '#a855f7',
          }}>
            <i className="fa-light fa-sharp fa-inbox" />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-value">{stats?.unread_messages ?? '-'}</span>
            <span className="admin-stat-label">Unread Messages</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
        <button className="admin-btn admin-btn-primary" onClick={() => setActiveTab('hero')}>
          <i className="fa-light fa-sharp fa-trophy" /> Edit Hero Section
        </button>
        <button className="admin-btn admin-btn-secondary" onClick={() => setActiveTab('messages')}>
          <i className="fa-light fa-sharp fa-inbox" /> View Inbox Messages
        </button>
      </div>
    </div>
  );

  /* ─── Tab: Hero ──────────────────────────────────────────── */
  const renderHero = () => (
    <div>
      <div className="admin-header">
        <h1 className="admin-header-title"><i className="fa-light fa-sharp fa-trophy" /> Hero Section</h1>
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

        <div className="admin-card" style={{ marginTop: '1.5rem', background: 'var(--bg-secondary)' }}>
          <h4 className="admin-card-title" style={{ fontSize: '0.9rem' }}>Live Preview</h4>
          <div style={{ padding: '2rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
            <p style={{ color: 'var(--accent-primary)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              <i className="fa-light fa-sharp fa-microchip" /> Hardware & Custom IoT Solutions
            </p>
            <h2 style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 500 }}>
              {heroForm.headline || 'Headline preview'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              {heroForm.subline || 'Subline preview'}
            </p>
            {heroForm.cta_text && (
              <span className="btn btn--gold btn--sm" style={{ pointerEvents: 'none', padding: '0.65rem 1.25rem', fontSize: '0.75rem' }}>
                {heroForm.cta_text}
              </span>
            )}
          </div>
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <button className="admin-btn admin-btn-primary" onClick={() => saveContent('hero', heroForm)}>
            <i className="fa-light fa-sharp fa-floppy-disk" /> Save Hero Section
          </button>
        </div>
      </div>
    </div>
  );

  /* ─── Tab: About ─────────────────────────────────────────── */
  const renderAbout = () => (
    <div>
      <div className="admin-header">
        <h1 className="admin-header-title"><i className="fa-light fa-sharp fa-building" /> About Section</h1>
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
            <i className="fa-light fa-sharp fa-floppy-disk" /> Save About Section
          </button>
        </div>
      </div>
    </div>
  );

  /* ─── Tab: Services ──────────────────────────────────────── */
  const renderServices = () => (
    <div>
      <div className="admin-header">
        <h1 className="admin-header-title"><i className="fa-light fa-sharp fa-microchip" /> Services</h1>
        <button className="admin-btn admin-btn-primary" onClick={openAddService}>
          <i className="fa-light fa-sharp fa-plus" /> Add Service
        </button>
      </div>

      <div className="admin-table-container">
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
                <td><i className={getIconClass(svc.icon_class)} style={{ color: 'var(--accent-primary)', fontSize: '1.1rem' }} /></td>
                <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{svc.title}</td>
                <td style={{ color: 'var(--text-muted)' }}>{svc.subtitle}</td>
                <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{svc.display_order}</td>
                <td>
                  <span className={`admin-badge ${svc.is_active ? 'admin-badge-active' : 'admin-badge-inactive'}`}>
                    {svc.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="admin-table-actions">
                    <button className="admin-btn admin-btn-sm admin-btn-secondary" onClick={() => openEditService(svc)}>
                      <i className="fa-light fa-sharp fa-pen" />
                    </button>
                    <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => deleteService(svc)}>
                      <i className="fa-light fa-sharp fa-trash" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {services.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-dark)', padding: '3rem' }}>No services configured.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ─── Tab: Team (Draggable Reorder Card List) ────────────── */
  const renderTeam = () => (
    <div>
      <div className="admin-header">
        <h1 className="admin-header-title"><i className="fa-light fa-sharp fa-users" /> Team Section</h1>
        <button className="admin-btn admin-btn-primary" onClick={openAddMember}>
          <i className="fa-light fa-sharp fa-plus" /> Add Member
        </button>
      </div>

      <div style={{ marginBottom: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <i className="fa-light fa-sharp fa-circle-info" style={{ color: 'var(--accent-primary)' }} />
        <span>Drag and drop the cards below to instantly reorder their layout position on the landing page.</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {team.map((m, idx) => {
          return (
            <div
              key={m.id}
              draggable
              onDragStart={(e) => dragStart(e, idx)}
              onDragEnter={(e) => dragEnter(e, idx)}
              onDragEnd={drop}
              onDragOver={(e) => e.preventDefault()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.25rem 2rem',
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-color)',
                cursor: 'grab',
                transition: 'var(--transition-fast)'
              }}
              className="admin-draggable-card"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ color: 'var(--text-dark)', cursor: 'grab' }}>
                  <i className="fa-light fa-sharp fa-grip-vertical" style={{ fontSize: '1.1rem' }} />
                </div>
                <div style={{ width: '48px', height: '48px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  {m.image_url ? (
                    <img src={m.image_url.startsWith('/') ? `${API_URL.replace('/api', '')}${m.image_url}` : m.image_url} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'rgba(255,255,255,0.02)', color: 'var(--accent-primary)' }}>
                      <i className="fa-light fa-sharp fa-user" />
                    </div>
                  )}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 500, color: 'var(--text-primary)' }}>{m.name}</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>{m.role}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <span className={`admin-badge ${m.is_active ? 'admin-badge-active' : 'admin-badge-inactive'}`}>
                  {m.is_active ? 'Active' : 'Inactive'}
                </span>
                
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Order: <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{m.display_order}</strong>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="admin-btn admin-btn-sm admin-btn-secondary" onClick={() => openEditMember(m)}>
                    <i className="fa-light fa-sharp fa-pen" />
                  </button>
                  <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => deleteMember(m)}>
                    <i className="fa-light fa-sharp fa-trash" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        
        {team.length === 0 && (
          <div className="admin-empty">
            <i className="fa-light fa-sharp fa-users" />
            <h3>No Members Configured</h3>
            <p>Add co-founders and team members using the "Add Member" button.</p>
          </div>
        )}
      </div>
    </div>
  );

  /* ─── Tab: Testimonials ──────────────────────────────────── */
  const renderTestimonials = () => (
    <div>
      <div className="admin-header">
        <h1 className="admin-header-title"><i className="fa-light fa-sharp fa-quote-right" /> Testimonials</h1>
        <button className="admin-btn admin-btn-primary" onClick={openAddTestimonial}>
          <i className="fa-light fa-sharp fa-plus" /> Add Testimonial
        </button>
      </div>

      <div className="admin-table-container">
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
                <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{t.client_name}</td>
                <td style={{ color: 'var(--text-muted)' }}>{t.company}</td>
                <td>
                  <div className="admin-star-rating">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <i key={i} className={`fa-light fa-sharp fa-star ${i < t.rating ? 'active' : ''}`} style={{ fontSize: '0.8rem' }} />
                    ))}
                  </div>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{t.display_order}</td>
                <td>
                  <span className={`admin-badge ${t.is_active ? 'admin-badge-active' : 'admin-badge-inactive'}`}>
                    {t.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="admin-table-actions">
                    <button className="admin-btn admin-btn-sm admin-btn-secondary" onClick={() => openEditTestimonial(t)}>
                      <i className="fa-light fa-sharp fa-pen" />
                    </button>
                    <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => deleteTestimonial(t)}>
                      <i className="fa-light fa-sharp fa-trash" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {testimonials.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-dark)', padding: '3rem' }}>No testimonials received yet.</td></tr>
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
        <h1 className="admin-header-title"><i className="fa-light fa-sharp fa-chart-line" /> Statistics</h1>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">Edit Statistics Configurations</h3>
        <div className="admin-form">
          {[
            { key: 'projects_completed', label: 'Projects Completed', icon: 'fa-light fa-sharp fa-rocket', placeholder: '500+' },
            { key: 'happy_clients', label: 'Happy Clients', icon: 'fa-light fa-sharp fa-heart', placeholder: '200+' },
            { key: 'products_available', label: 'Components Supplied', icon: 'fa-light fa-sharp fa-microchip', placeholder: '1000+' },
            { key: 'years_experience', label: 'Years Experience', icon: 'fa-light fa-sharp fa-calendar-check', placeholder: '5+' },
          ].map((s) => (
            <div key={s.key} className="admin-form-group">
              <label className="admin-form-label">
                <i className={s.icon} /> {s.label}
              </label>
              <input
                className="admin-form-input"
                value={statsForm[s.key] || ''}
                onChange={(e) => setStatsForm({ ...statsForm, [s.key]: e.target.value })}
                placeholder={s.placeholder}
              />
            </div>
          ))}
        </div>
        <div style={{ marginTop: '1.5rem' }}>
          <button className="admin-btn admin-btn-primary" onClick={() => saveContent('stats', statsForm)}>
            <i className="fa-light fa-sharp fa-floppy-disk" /> Save Stats Config
          </button>
        </div>
      </div>
    </div>
  );

  /* ─── Tab: Contact Info ──────────────────────────────────── */
  const renderContact = () => (
    <div>
      <div className="admin-header">
        <h1 className="admin-header-title"><i className="fa-light fa-sharp fa-envelope" /> Contact details</h1>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">Edit Contact Block</h3>
        <div className="admin-form">
          <div className="admin-form-group">
            <label className="admin-form-label">Contact Section Eyebrow</label>
            <input
              className="admin-form-input"
              value={contactForm.title}
              onChange={(e) => setContactForm({ ...contactForm, title: e.target.value })}
              placeholder="Get In Touch"
            />
          </div>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-form-label"><i className="fa-light fa-sharp fa-envelope" /> Email Coordinates</label>
              <input
                className="admin-form-input"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                placeholder="info@himalixlab.com"
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label"><i className="fa-light fa-sharp fa-phone" /> Support Phone</label>
              <input
                className="admin-form-input"
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                placeholder="+977-9800000000"
              />
            </div>
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label"><i className="fa-light fa-sharp fa-location-dot" /> Base Address</label>
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
            <i className="fa-light fa-sharp fa-floppy-disk" /> Save Contact Settings
          </button>
        </div>
      </div>
    </div>
  );

  /* ─── Tab: Settings ──────────────────────────────────────── */
  const renderSettings = () => (
    <div>
      <div className="admin-header">
        <h1 className="admin-header-title"><i className="fa-light fa-sharp fa-gear" /> Global Settings</h1>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">Site Brand Configuration</h3>
        <div className="admin-form">
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-form-label">Site Title</label>
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
                placeholder="Innovating Nepal's Tech Future"
              />
            </div>
          </div>

          <ImageUploadZone
            label="Upload Site Logo"
            value={settingsForm.logo_url}
            onChange={(url) => setSettingsForm({ ...settingsForm, logo_url: url })}
            token={token}
            apiUrl={API_URL}
          />

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-form-label">Primary Brand Color</label>
              <div className="admin-color-picker">
                <input
                  type="color"
                  value={settingsForm.primary_color || '#e0af3c'}
                  onChange={(e) => setSettingsForm({ ...settingsForm, primary_color: e.target.value })}
                />
                <input
                  className="admin-form-input"
                  value={settingsForm.primary_color || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, primary_color: e.target.value })}
                  placeholder="#e0af3c"
                />
              </div>
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Secondary Brand Color</label>
              <div className="admin-color-picker">
                <input
                  type="color"
                  value={settingsForm.secondary_color || '#cba02f'}
                  onChange={(e) => setSettingsForm({ ...settingsForm, secondary_color: e.target.value })}
                />
                <input
                  className="admin-form-input"
                  value={settingsForm.secondary_color || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, secondary_color: e.target.value })}
                  placeholder="#cba02f"
                />
              </div>
            </div>
          </div>

          <h4 className="admin-card-title" style={{ marginTop: '1.5rem', fontSize: '0.95rem' }}>
            <i className="fa-light fa-sharp fa-share-nodes" /> Social Coordinates
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
                <i className={s.icon} /> {s.label} Link
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
            <i className="fa-light fa-sharp fa-floppy-disk" /> Save Settings Config
          </button>
        </div>
      </div>
    </div>
  );

  /* ─── Tab: Messages ──────────────────────────────────────── */
  const renderMessages = () => (
    <div>
      <div className="admin-header">
        <h1 className="admin-header-title"><i className="fa-light fa-sharp fa-inbox" /> Consultation Inbox</h1>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{messages.length} received, {messages.filter((m) => !m.is_read).length} unread</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.length === 0 && (
          <div className="admin-empty">
            <i className="fa-light fa-sharp fa-inbox" />
            <h3>Inbox Empty</h3>
            <p>Consultation requests from the contact form will appear here.</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`admin-message-item ${!msg.is_read ? 'unread' : ''}`}
            style={{ borderRadius: 0 }}
          >
            <div className="admin-message-header" onClick={() => setExpandedMessage(expandedMessage === msg.id ? null : msg.id)} style={{ cursor: 'pointer' }}>
              <div className="admin-message-info">
                <div className="admin-message-avatar">
                  {msg.name.charAt(0).toUpperCase()}
                </div>
                <div className="admin-message-meta">
                  <h4>{msg.name}</h4>
                  <p>{msg.email}</p>
                </div>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>{msg.subject || '(No Subject)'}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {new Date(msg.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
            </div>

            {expandedMessage === msg.id && (
              <div className="admin-message-body">
                <p style={{ whiteSpace: 'pre-wrap', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>{msg.message}</p>
                <div className="admin-message-actions">
                  {!msg.is_read && (
                    <button
                      className="admin-btn admin-btn-sm admin-btn-success"
                      onClick={() => markAsRead(msg)}
                    >
                      <i className="fa-light fa-sharp fa-check" /> Mark Read
                    </button>
                  )}
                  <button
                    className="admin-btn admin-btn-sm admin-btn-danger"
                    onClick={() => deleteMessage(msg)}
                  >
                    <i className="fa-light fa-sharp fa-trash" /> Delete Request
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderTabContent = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem', color: 'var(--accent-primary)' }}>
          <i className="fa-light fa-sharp fa-spinner fa-spin" style={{ fontSize: '2rem' }} />
          <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', letterSpacing: '1px' }}>FETCHING DATABASE INSTANCES...</span>
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

      <button 
        className="admin-mobile-toggle" 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 1100,
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-color)',
          width: '44px',
          height: '44px',
          display: 'none',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <i className={sidebarOpen ? 'fa-light fa-sharp fa-xmark' : 'fa-light fa-sharp fa-bars'} />
      </button>

      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)} 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', z-index: 999 }} 
        />
      )}

      {renderSidebar()}

      <main className="admin-content">
        <div className="admin-body">
          {renderTabContent()}
        </div>
      </main>

      {/* ─── Service Modal ───────────────────────────────────── */}
      <Modal isOpen={serviceModal} onClose={() => setServiceModal(false)} title={editingService ? 'Edit Service' : 'Add Service'}>
        <div className="admin-form">
          <div className="admin-form-group">
            <label className="admin-form-label">Service Title *</label>
            <input
              className="admin-form-input"
              value={serviceForm.title}
              onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
              placeholder="e.g. PCB Prototyping"
            />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Subtitle</label>
            <input
              className="admin-form-input"
              value={serviceForm.subtitle}
              onChange={(e) => setServiceForm({ ...serviceForm, subtitle: e.target.value })}
              placeholder="e.g. Fine pitch printing"
            />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Detailed Description</label>
            <textarea
              className="admin-form-input admin-form-textarea"
              rows={3}
              value={serviceForm.description}
              onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
              placeholder="Explain specifications..."
            />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Icon Class (FontAwesome)</label>
            <input
              className="admin-form-input"
              value={serviceForm.icon_class}
              onChange={(e) => setServiceForm({ ...serviceForm, icon_class: e.target.value })}
              placeholder="e.g. fa-light fa-sharp fa-microchip"
            />
            {serviceForm.icon_class && (
              <div style={{ marginTop: '0.5rem', color: 'var(--accent-primary)', fontSize: '0.85rem' }}>
                Preview: <i className={getIconClass(serviceForm.icon_class)} /> {getIconClass(serviceForm.icon_class)}
              </div>
            )}
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Service Key Features</label>
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
                    placeholder={`e.g. Custom designs`}
                  />
                  {serviceForm.features.length > 1 && (
                    <button
                      className="admin-btn admin-btn-sm admin-btn-danger"
                      onClick={() => {
                        const newFeatures = serviceForm.features.filter((_, i) => i !== idx);
                        setServiceForm({ ...serviceForm, features: newFeatures });
                      }}
                    >
                      <i className="fa-light fa-sharp fa-xmark" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              className="admin-btn admin-btn-sm admin-btn-secondary"
              style={{ marginTop: '0.5rem' }}
              onClick={() => setServiceForm({ ...serviceForm, features: [...serviceForm.features, ''] })}
            >
              <i className="fa-light fa-sharp fa-plus" /> Add Feature Line
            </button>
          </div>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-form-label">Service Direct Link</label>
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
            <label className="admin-form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={serviceForm.is_active}
                onChange={(e) => setServiceForm({ ...serviceForm, is_active: e.target.checked })}
              />
              <span>Render as Active</span>
            </label>
          </div>
        </div>
        <div className="admin-modal-footer">
          <button className="admin-btn admin-btn-secondary" onClick={() => setServiceModal(false)}>Cancel</button>
          <button className="admin-btn admin-btn-primary" onClick={saveService} disabled={serviceSaving}>
            {serviceSaving ? (
              <><i className="fa-light fa-sharp fa-spinner fa-spin" /> Saving...</>
            ) : (
              <><i className="fa-light fa-sharp fa-floppy-disk" /> {editingService ? 'Update Service' : 'Create Service'}</>
            )}
          </button>
        </div>
      </Modal>

      {/* ─── Team Modal ──────────────────────────────────────── */}
      <Modal isOpen={teamModal} onClose={() => setTeamModal(false)} title={editingMember ? 'Edit Team Member' : 'Add Team Member'}>
        <div className="admin-form">
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-form-label">Member Name *</label>
              <input
                className="admin-form-input"
                value={memberForm.name}
                onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                placeholder="e.g. Zenith Kandel"
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Professional Role *</label>
              <input
                className="admin-form-input"
                value={memberForm.role}
                onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                placeholder="e.g. Co-Founder"
              />
            </div>
          </div>
          
          <div className="admin-form-group">
            <label className="admin-form-label">Biography Details</label>
            <textarea
              className="admin-form-input admin-form-textarea"
              rows={3}
              value={memberForm.bio}
              onChange={(e) => setMemberForm({ ...memberForm, bio: e.target.value })}
              placeholder="Brief professional profile..."
            />
          </div>

          <ImageUploadZone
            label="Upload Avatar Photo"
            value={memberForm.image_url}
            onChange={(url) => setMemberForm({ ...memberForm, image_url: url })}
            token={token}
            apiUrl={API_URL}
          />

          <h4 className="admin-card-title" style={{ fontSize: '0.9rem', marginTop: '1rem' }}>
            <i className="fa-light fa-sharp fa-share-nodes" /> Social Profile Coordinates
          </h4>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-form-label"><i className="fa-brands fa-twitter" /> Twitter URL</label>
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
              <label className="admin-form-label"><i className="fa-brands fa-linkedin-in" /> LinkedIn URL</label>
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
            <label className="admin-form-label"><i className="fa-brands fa-github" /> GitHub URL</label>
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
              <label className="admin-form-label">Display Position Order</label>
              <input
                type="number"
                className="admin-form-input"
                value={memberForm.display_order}
                onChange={(e) => setMemberForm({ ...memberForm, display_order: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '2rem' }}>
                <input
                  type="checkbox"
                  checked={memberForm.is_active}
                  onChange={(e) => setMemberForm({ ...memberForm, is_active: e.target.checked })}
                />
                <span>Render as Active</span>
              </label>
            </div>
          </div>
        </div>
        <div className="admin-modal-footer">
          <button className="admin-btn admin-btn-secondary" onClick={() => setTeamModal(false)}>Cancel</button>
          <button className="admin-btn admin-btn-primary" onClick={saveMember} disabled={memberSaving}>
            {memberSaving ? (
              <><i className="fa-light fa-sharp fa-spinner fa-spin" /> Saving...</>
            ) : (
              <><i className="fa-light fa-sharp fa-floppy-disk" /> {editingMember ? 'Update Member' : 'Add Member'}</>
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
                placeholder="e.g. Anita Gurung"
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Client Position Title</label>
              <input
                className="admin-form-input"
                value={testimonialForm.client_title}
                onChange={(e) => setTestimonialForm({ ...testimonialForm, client_title: e.target.value })}
                placeholder="e.g. Hardware Lead"
              />
            </div>
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Client Company Name</label>
            <input
              className="admin-form-input"
              value={testimonialForm.company}
              onChange={(e) => setTestimonialForm({ ...testimonialForm, company: e.target.value })}
              placeholder="e.g. Nepal Telecom"
            />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Testimonial Content *</label>
            <textarea
              className="admin-form-input admin-form-textarea"
              rows={3}
              value={testimonialForm.content}
              onChange={(e) => setTestimonialForm({ ...testimonialForm, content: e.target.value })}
              placeholder="Detailed testimonial statement..."
            />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Client Feedback Star Rating</label>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setTestimonialForm({ ...testimonialForm, rating: i + 1 })}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', fontSize: '1.25rem' }}
                >
                  <i className={`fa-light fa-sharp fa-star ${i < testimonialForm.rating ? 'active' : ''}`} style={{ color: 'var(--accent-primary)' }} />
                </button>
              ))}
            </div>
          </div>

          <ImageUploadZone
            label="Upload Client Photo"
            value={testimonialForm.image_url}
            onChange={(url) => setTestimonialForm({ ...testimonialForm, image_url: url })}
            token={token}
            apiUrl={API_URL}
          />

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
              <label className="admin-form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '2rem' }}>
                <input
                  type="checkbox"
                  checked={testimonialForm.is_active}
                  onChange={(e) => setTestimonialForm({ ...testimonialForm, is_active: e.target.checked })}
                />
                <span>Render as Active</span>
              </label>
            </div>
          </div>
        </div>
        <div className="admin-modal-footer">
          <button className="admin-btn admin-btn-secondary" onClick={() => setTestimonialModal(false)}>Cancel</button>
          <button className="admin-btn admin-btn-primary" onClick={saveTestimonial} disabled={testimonialSaving}>
            {testimonialSaving ? (
              <><i className="fa-light fa-sharp fa-spinner fa-spin" /> Saving...</>
            ) : (
              <><i className="fa-light fa-sharp fa-floppy-disk" /> {editingTestimonial ? 'Update Testimonial' : 'Add Testimonial'}</>
            )}
          </button>
        </div>
      </Modal>
    </div>
  );
}
