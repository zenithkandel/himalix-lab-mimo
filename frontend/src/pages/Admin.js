import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const SECTIONS = [
  { id: 'hero',         icon: 'house',       label: 'Hero Section' },
  { id: 'services',     icon: 'grid-2',      label: 'Services' },
  { id: 'about',        icon: 'building',    label: 'About' },
  { id: 'stats',        icon: 'chart-bar',   label: 'Statistics' },
  { id: 'team',         icon: 'users',       label: 'Team Members' },
  { id: 'testimonials', icon: 'star',        label: 'Testimonials' },
  { id: 'contact',      icon: 'envelope',    label: 'Contact Info' },
];

export default function PortfolioAdmin() {
  const { user, authFetch, logout } = useAuth();
  const navigate = useNavigate();

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
      setContent(data.content || {});
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
      const res = await authFetch(`/api/admin/content/${section}`, {
        method: 'PUT',
        body: JSON.stringify(newData),
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
          <button className="admin-sidebar__logout" onClick={() => { logout(); navigate('/signin'); }} aria-label="Sign out">
            <i className="fa-light fa-sharp fa-right-from-bracket" />
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main">
        <div className="admin-topbar">
          <div className="admin-topbar__breadcrumb">
            <button className="btn btn-ghost btn-sm" onClick={() => setMobileOpen(o => !o)} style={{ display: 'none' }} aria-label="Toggle sidebar" id="admin-sidebar-toggle">
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
          ) : (
            <ContentEditor
              section={activeSection}
              data={content[activeSection]}
              onSave={(data) => handleSave(activeSection, data)}
              saving={saving}
            />
          )}
        </div>
      </main>
    </div>
  );
}

/* ── Section-specific editors ── */
function ContentEditor({ section, data, onSave, saving }) {
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

  if (section === 'stats') {
    return (
      <ArrayEditor
        label="Statistics"
        items={local.items || []}
        schema={[
          { key: 'icon', label: 'Icon (FA name)', placeholder: 'users' },
          { key: 'value', label: 'Value', placeholder: '500', type: 'number' },
          { key: 'suffix', label: 'Suffix', placeholder: '+' },
          { key: 'label', label: 'Label', placeholder: 'Happy Customers' },
        ]}
        onChange={(items) => setLocal({ items })}
        onSave={() => onSave(local)}
        saving={saving}
      />
    );
  }

  if (section === 'team') {
    return (
      <ArrayEditor
        label="Team Members"
        items={local.members || []}
        schema={[
          { key: 'name',       label: 'Name' },
          { key: 'role',       label: 'Role / Title' },
          { key: 'bio',        label: 'Short Bio', multiline: true },
          { key: 'avatar_url', label: 'Avatar URL' },
        ]}
        onChange={(members) => setLocal({ members })}
        onSave={() => onSave(local)}
        saving={saving}
      />
    );
  }

  if (section === 'testimonials') {
    return (
      <ArrayEditor
        label="Testimonials"
        items={local.items || []}
        schema={[
          { key: 'name',   label: 'Client Name' },
          { key: 'title',  label: 'Title / City' },
          { key: 'rating', label: 'Rating (1–5)', type: 'number' },
          { key: 'text',   label: 'Testimonial Text', multiline: true },
        ]}
        onChange={(items) => setLocal({ items })}
        onSave={() => onSave(local)}
        saving={saving}
      />
    );
  }

  if (section === 'services') {
    return (
      <ArrayEditor
        label="Services"
        items={local.items || []}
        schema={[
          { key: 'icon',        label: 'Icon (FA name)', placeholder: 'store' },
          { key: 'title',       label: 'Title' },
          { key: 'description', label: 'Description', multiline: true },
          { key: 'link',        label: 'Link (optional)', placeholder: '/store' },
          { key: 'cta',         label: 'CTA Text', placeholder: 'Shop Now' },
        ]}
        onChange={(items) => setLocal({ items })}
        onSave={() => onSave(local)}
        saving={saving}
      />
    );
  }

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

function ArrayEditor({ label, items, schema, onChange, onSave, saving }) {
  const addItem = () => {
    const blank = {};
    schema.forEach(f => { blank[f.key] = ''; });
    onChange([...items, blank]);
  };

  const updateItem = (i, key, val) => {
    const next = items.map((item, idx) =>
      idx === i ? { ...item, [key]: val } : item
    );
    onChange(next);
  };

  const removeItem = (i) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-0)' }}>{label}</span>
        <button className="btn btn-outline btn-sm" onClick={addItem}>
          <i className="fa-light fa-sharp fa-plus" /> Add Item
        </button>
      </div>

      {items.length === 0 && (
        <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
          <p>No items yet. Click "Add Item" to begin.</p>
        </div>
      )}

      {items.map((item, i) => (
        <div key={i} className="cms-section-card">
          <div className="cms-section-card__header">
            <div className="cms-section-card__title">
              <i className="fa-light fa-sharp fa-grip-dots" />
              Item {i + 1}
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => removeItem(i)}
              style={{ color: 'var(--danger)' }}
              aria-label="Remove item"
            >
              <i className="fa-light fa-sharp fa-trash" />
            </button>
          </div>
          <div className="cms-section-card__body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              {schema.map(field => (
                <div
                  key={field.key}
                  className="form-group"
                  style={{ gridColumn: field.multiline ? 'span 2' : 'auto' }}
                >
                  <label className="form-label">{field.label}</label>
                  {field.multiline ? (
                    <textarea
                      className="form-textarea"
                      value={item[field.key] || ''}
                      onChange={e => updateItem(i, field.key, e.target.value)}
                      style={{ minHeight: 80 }}
                    />
                  ) : (
                    <input
                      type={field.type || 'text'}
                      className="form-input"
                      placeholder={field.placeholder || ''}
                      value={item[field.key] || ''}
                      onChange={e => updateItem(i, field.key, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      <button className="btn btn-primary" onClick={onSave} disabled={saving}>
        {saving
          ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving…</>
          : <><i className="fa-light fa-sharp fa-floppy-disk" /> Save All</>
        }
      </button>
    </div>
  );
}
