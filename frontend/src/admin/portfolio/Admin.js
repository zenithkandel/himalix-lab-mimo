import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import CrudSection from './components/CrudSection';
import MessageManager from './components/MessageManager';

const SECTIONS = [
  { id: 'hero',         icon: 'house',       label: 'Hero Section' },
  { id: 'services',     icon: 'grid-2',      label: 'Services' },
  { id: 'about',        icon: 'building',    label: 'About' },
  { id: 'stats',        icon: 'chart-bar',   label: 'Statistics' },
  { id: 'team',         icon: 'users',       label: 'Team Members' },
  { id: 'testimonials', icon: 'star',        label: 'Testimonials' },
  { id: 'contact',      icon: 'envelope',    label: 'Contact Info' },
  { id: 'messages',     icon: 'inbox',       label: 'Inquiries' },
];

export default function PortfolioAdmin() {
  const { user, authFetch, logout, token } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [activeSection, setActiveSection] = useState('hero');
  const [content, setContent]             = useState({});
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [msg, setMsg]                     = useState('');
  const [mobileOpen, setMobileOpen]       = useState(false);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await authFetch('/api/admin/content');
      const data = await res.json();
      const rawContent = data.content || {};

      if (rawContent.services && Array.isArray(rawContent.services.items)) {
        rawContent.services.items = rawContent.services.items.map(item => ({
          ...item,
          features: Array.isArray(item.features) ? item.features.join('\n') : (item.features || '')
        }));
      }

      setContent(rawContent);
    } catch {}
    finally { setLoading(false); }
  }, [authFetch]);

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return; }
    fetchContent();
  }, [user, navigate, fetchContent]);

  const handleSave = async (section, newData) => {
    setSaving(true);
    setMsg('');
    try {
      let payload = newData;
      if (section === 'services' && Array.isArray(newData.items)) {
        payload = {
          items: newData.items.map(item => ({
            ...item,
            features: typeof item.features === 'string' ? item.features.split('\n').map(f => f.trim()).filter(Boolean) : (item.features || [])
          }))
        };
      }

      const res = await authFetch(`/api/admin/content/${section}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      setContent(prev => ({ ...prev, [section]: newData }));
      setMsg('Saved successfully!');
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setMsg('Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <aside className={`admin-sidebar${mobileOpen ? ' admin-sidebar--mobile-open' : ''}`}>
        <div className="admin-sidebar__top">
          <div className="admin-sidebar__logo">
            HX <span style={{ color: 'var(--accent)' }}>LABS</span>
            <span className="admin-sidebar__module-tag">CMS</span>
          </div>
        </div>

        <nav className="admin-sidebar__nav">
          <div className="admin-sidebar__section-label">Portfolio Sections</div>
          {SECTIONS.map(s => (
            <button
              key={s.id}
              className={`admin-sidebar__item${activeSection === s.id ? ' admin-sidebar__item--active' : ''}`}
              onClick={() => { setActiveSection(s.id); setMobileOpen(false); }}
            >
              <i className={`fa-light fa-sharp fa-${s.icon}`} />
              {s.label}
            </button>
          ))}

          <div className="admin-sidebar__section-label" style={{ marginTop: 'var(--space-4)' }}>Navigation</div>
          <button className="admin-sidebar__item" onClick={() => navigate('/store/admin')}>
            <i className="fa-light fa-sharp fa-store" /> Store Admin
          </button>
          <button className="admin-sidebar__item" onClick={() => navigate('/')}>
            <i className="fa-light fa-sharp fa-arrow-left" /> View Site
          </button>
        </nav>

        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__user-info">
            <div className="admin-sidebar__user-name">{user?.name}</div>
            <div className="admin-sidebar__user-role">Administrator</div>
          </div>
          <button 
            className="admin-sidebar__logout" 
            onClick={toggleTheme} 
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{ marginRight: 'var(--space-2)' }}
            aria-label="Toggle theme"
          >
            <i className={`fa-light fa-sharp fa-${theme === 'dark' ? 'sun' : 'moon'}`} />
          </button>
          <button className="admin-sidebar__logout" onClick={() => { logout(); navigate('/signin'); }} aria-label="Sign out">
            <i className="fa-light fa-sharp fa-right-from-bracket" />
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main">
        <div className="admin-topbar">
          <div className="admin-topbar__breadcrumb">
            <button className="btn btn-ghost btn-sm admin-topbar__hamburger" onClick={() => setMobileOpen(o => !o)} aria-label="Toggle sidebar" id="admin-sidebar-toggle">
              <i className="fa-light fa-sharp fa-bars" />
            </button>
            <span>Portfolio CMS</span>
            <i className="fa-light fa-sharp fa-chevron-right" />
            <span>{SECTIONS.find(s => s.id === activeSection)?.label}</span>
          </div>
          <div className="admin-topbar__actions">
            {msg && (
              <span style={{ fontSize: 'var(--text-xs)', color: msg.includes('!') ? 'var(--success)' : 'var(--danger)' }}>
                {msg}
              </span>
            )}
          </div>
        </div>

        <div className="admin-content">
          {loading ? (
            <div className="loading-page"><div className="spinner" /></div>
          ) : activeSection === 'messages' ? (
            <MessageManager token={token} authFetch={authFetch} />
          ) : ['stats', 'team', 'testimonials', 'services'].includes(activeSection) ? (
            <CrudSection
              sectionName={activeSection === 'stats' ? 'statistics' : activeSection}
              label={SECTIONS.find(s => s.id === activeSection)?.label}
              schema={getSchema(activeSection)}
              token={token}
              apiUrl="/api"
              authFetch={authFetch}
            />
          ) : (
            <ContentEditor
              section={activeSection}
              data={content[activeSection]}
              onSave={(data) => handleSave(activeSection, data)}
              saving={saving}
              token={token}
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

/* ── Schemas for CrudSection ── */
const getSchema = (section) => {
  if (section === 'stats') {
    return [
      { key: 'icon_class', label: 'Icon (FA name)', placeholder: 'users' },
      { key: 'stat_value', label: 'Value', placeholder: '500' },
      { key: 'suffix', label: 'Suffix', placeholder: '+' },
      { key: 'label', label: 'Label', placeholder: 'Happy Customers' },
    ];
  }
  if (section === 'team') {
    return [
      { key: 'name',       label: 'Name' },
      { key: 'role',       label: 'Role / Title' },
      { key: 'bio',        label: 'Short Bio', multiline: true },
      { key: 'image_url',  label: 'Avatar Image', type: 'image' },
      { key: 'instagram',  label: 'Instagram Link', placeholder: '#' },
      { key: 'linkedin',   label: 'LinkedIn Link', placeholder: '#' },
      { key: 'github',     label: 'GitHub Link', placeholder: '#' },
    ];
  }
  if (section === 'testimonials') {
    return [
      { key: 'client_name',label: 'Client Name' },
      { key: 'client_title',label: 'Title / City' },
      { key: 'company',    label: 'Company', placeholder: 'e.g. Nepal Telecom' },
      { key: 'image_url',  label: 'Client Image', type: 'image' },
      { key: 'rating',     label: 'Rating (1–5)', type: 'number' },
      { key: 'content',    label: 'Testimonial Text', multiline: true },
    ];
  }
  if (section === 'services') {
    return [
      { key: 'icon_class',  label: 'Icon (FA name)', placeholder: 'store' },
      { key: 'title',       label: 'Title' },
      { key: 'description', label: 'Description', multiline: true },
      { key: 'features',    label: 'Features (one per line)', multiline: true, placeholder: 'Feature 1\nFeature 2' },
      { key: 'link_url',    label: 'Link (optional)', placeholder: '/store' },
      { key: 'subtitle',    label: 'CTA Text', placeholder: 'Shop Now' },
    ];
  }
  return [];
};

/* ── Section-specific editors ── */
function ContentEditor({ section, data, onSave, saving, token }) {
  const [local, setLocal] = useState(data || {});

  useEffect(() => { setLocal(data || {}); }, [section, data]);

  const set = (key, val) => setLocal(prev => ({ ...prev, [key]: val }));

  const renderField = (id, label, key, multiline = false) => (
    <div className="form-group" key={key}>
      <label htmlFor={id} className="form-label">{label}</label>
      {multiline ? (
        <textarea id={id} className="form-textarea" value={local[key] || ''} onChange={e => set(key, e.target.value)} />
      ) : (
        <input id={id} className="form-input" value={local[key] || ''} onChange={e => set(key, e.target.value)} />
      )}
    </div>
  );

  const fields = {
    hero: [
      renderField('hero-before', 'Title Before (italic)', 'title_before'),
      renderField('hero-em', 'Title Italic Word', 'title_em'),
      renderField('hero-after', 'Title After', 'title_after'),
      renderField('hero-subtitle', 'Subtitle', 'subtitle', true),
    ],
    about: [
      renderField('about-title', 'Section Title', 'title'),
      renderField('about-desc', 'Description', 'description', true),
    ],
    contact: [
      renderField('contact-email', 'Contact Email', 'email'),
      renderField('contact-phone', 'Phone', 'phone'),
      renderField('contact-address', 'Address', 'address'),
    ],
  };

  return (
    <div className="cms-section-list">
      <div className="cms-section-card">
        <div className="cms-section-card__body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            {fields[section] || (
              <div className="empty-state">
                <p>No editor configured for this section.</p>
              </div>
            )}
            <button
              className="btn btn-primary"
              onClick={() => onSave(local)}
              disabled={saving}
            >
              {saving
                ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving…</>
                : <><i className="fa-light fa-sharp fa-floppy-disk" /> Save Changes</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
