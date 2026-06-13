import React, { useState, useEffect } from 'react';

export default function MessageManager({ token, authFetch }) {
  const [tab, setTab] = useState('inquiries');
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [activeMsg, setActiveMsg] = useState(null);

  // SMTP & Forwarding settings state
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [form, setForm] = useState({
    smtp_forward_enabled: '0',
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_pass: '',
    smtp_secure: '0',
    forward_email_addresses: ''
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // Fetch messages
  const fetchMessages = async () => {
    setMsgLoading(true);
    try {
      const res = await authFetch('/api/admin/messages');
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setMsgLoading(false);
    }
  };

  // Fetch SMTP forwarding settings
  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await authFetch('/api/admin/settings');
      const data = await res.json();
      const flat = {};
      if (Array.isArray(data)) {
        data.forEach(s => {
          flat[s.setting_key] = s.setting_value;
        });
      }
      setForm({
        smtp_forward_enabled: flat.smtp_forward_enabled || '0',
        smtp_host: flat.smtp_host || '',
        smtp_port: flat.smtp_port || '587',
        smtp_user: flat.smtp_user || '',
        smtp_pass: flat.smtp_pass || '',
        smtp_secure: flat.smtp_secure || '0',
        forward_email_addresses: flat.forward_email_addresses || ''
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'inquiries') {
      fetchMessages();
    } else {
      fetchSettings();
    }
  }, [tab]);

  const handleMarkAsRead = async (id) => {
    try {
      const res = await authFetch(`/api/admin/messages/${id}/read`, {
        method: 'PUT'
      });
      if (res.ok) {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: 1 } : m));
        if (activeMsg && activeMsg.id === id) {
          setActiveMsg(prev => ({ ...prev, is_read: 1 }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMessage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      const res = await authFetch(`/api/admin/messages/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== id));
        if (activeMsg && activeMsg.id === id) {
          setActiveMsg(null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const keys = ['smtp_forward_enabled', 'smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_secure', 'forward_email_addresses'];
      for (const key of keys) {
        await authFetch(`/api/admin/settings/${key}`, {
          method: 'PUT',
          body: JSON.stringify({ setting_value: String(form[key]) })
        });
      }
      alert('Forwarding settings saved successfully!');
    } catch (err) {
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestSMTP = async () => {
    setTesting(true);
    try {
      const res = await authFetch('/api/admin/smtp/test', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'SMTP connection verified and test email sent!');
      } else {
        alert(data.error || 'SMTP test failed.');
      }
    } catch (err) {
      alert('SMTP connection failed due to network error.');
    } finally {
      setTesting(false);
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    const d = new Date(isoStr);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="admin-messages" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Tabs */}
      <div className="flex gap-4" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-3)' }}>
        <button 
          className={`btn ${tab === 'inquiries' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => { setTab('inquiries'); setActiveMsg(null); }}
        >
          <i className="fa-light fa-sharp fa-inbox" style={{ marginRight: '8px' }} />
          Contact Inquiries ({messages.filter(m => !m.is_read).length} unread)
        </button>
        <button 
          className={`btn ${tab === 'forwarding' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setTab('forwarding')}
        >
          <i className="fa-light fa-sharp fa-paper-plane" style={{ marginRight: '8px' }} />
          Email Forwarding Config
        </button>
      </div>

      {tab === 'inquiries' && (
        <div style={{ display: 'grid', gridTemplateColumns: activeMsg ? '1fr 1.2fr' : '1fr', gap: 'var(--space-6)' }}>
          {/* Messages List */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>Inquiries Inbox</span>
              <button className="btn btn-ghost btn-sm" onClick={fetchMessages} disabled={msgLoading}>
                <i className="fa-light fa-sharp fa-rotate" /> Refresh
              </button>
            </div>

            {msgLoading ? <div className="spinner" /> : messages.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', maxHeight: '65vh', overflowY: 'auto' }}>
                {messages.map(m => (
                  <div 
                    key={m.id}
                    className="cms-section-card"
                    style={{ 
                      cursor: 'pointer',
                      borderLeft: m.is_read ? '1px solid var(--border)' : '3px solid var(--accent)',
                      background: activeMsg && activeMsg.id === m.id ? 'var(--bg-3)' : 'var(--bg-1)'
                    }}
                    onClick={() => {
                      setActiveMsg(m);
                      if (!m.is_read) handleMarkAsRead(m.id);
                    }}
                  >
                    <div className="cms-section-card__body" style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <div className="flex justify-between items-start">
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-0)' }}>{m.name}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{formatDate(m.created_at)}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {m.subject || 'No Subject'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <i className="fa-light fa-sharp fa-envelope-open empty-state-icon" />
                <p>No inquiries received yet.</p>
              </div>
            )}
          </div>

          {/* Details Pane */}
          {activeMsg && (
            <div className="cms-section-card" style={{ background: 'var(--bg-1)', display: 'flex', flexDirection: 'column' }}>
              <div className="cms-section-card__header">
                <div className="cms-section-card__title">
                  <i className="fa-light fa-sharp fa-message" /> Inquiry Details
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteMessage(activeMsg.id)}>
                    <i className="fa-light fa-sharp fa-trash" /> Delete
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setActiveMsg(null)}>
                    <i className="fa-light fa-sharp fa-xmark" /> Close
                  </button>
                </div>
              </div>
              <div className="cms-section-card__body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', fontSize: '13px', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-3)' }}>
                  <div><strong>From:</strong> {activeMsg.name}</div>
                  <div><strong>Email:</strong> <a href={`mailto:${activeMsg.email}`} style={{ color: 'var(--info)' }}>{activeMsg.email}</a></div>
                  <div><strong>Date:</strong> {formatDate(activeMsg.created_at)}</div>
                  <div><strong>Status:</strong> {activeMsg.is_read ? 'Read' : 'Unread'}</div>
                </div>

                <div style={{ fontSize: '13px' }}>
                  <strong>Subject:</strong> {activeMsg.subject || 'No Subject'}
                </div>

                <div style={{ flex: 1, background: 'var(--bg-0)', border: '1px solid var(--border)', padding: 'var(--space-4)', fontSize: '14px', whiteSpace: 'pre-line', color: 'var(--text-1)', minHeight: '150px' }}>
                  {activeMsg.message}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'forwarding' && (
        <div className="cms-section-card">
          <div className="cms-section-card__header">
            <div className="cms-section-card__title">SMTP & Email Forwarding Settings</div>
          </div>
          <div className="cms-section-card__body">
            {settingsLoading ? <div className="spinner" /> : (
              <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer' }}>
                    <input 
                      type="checkbox"
                      checked={form.smtp_forward_enabled === '1'}
                      onChange={e => setForm({ ...form, smtp_forward_enabled: e.target.checked ? '1' : '0' })}
                      style={{ display: 'none' }}
                    />
                    <span className="toggle__track" style={{ width: '40px', height: '20px', background: 'var(--bg-4)', borderRadius: '10px', position: 'relative', display: 'inline-block' }}>
                      <span 
                        className="toggle__thumb" 
                        style={{ 
                          width: '16px', 
                          height: '16px', 
                          background: form.smtp_forward_enabled === '1' ? 'var(--accent)' : 'var(--text-3)', 
                          borderRadius: '50%', 
                          position: 'absolute', 
                          top: '2px', 
                          left: form.smtp_forward_enabled === '1' ? '22px' : '2px',
                          transition: 'left var(--transition-fast)'
                        }} 
                      />
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>Enable SMTP Message Forwarding</span>
                  </label>
                </div>

                <div className="form-group">
                  <label className="form-label">Recipient Email Address(es)</label>
                  <input 
                    className="form-input"
                    placeholder="receiver1@example.com, receiver2@example.com"
                    value={form.forward_email_addresses}
                    onChange={e => setForm({ ...form, forward_email_addresses: e.target.value })}
                  />
                  <small style={{ color: 'var(--text-3)', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                    Separate multiple recipient email addresses with commas.
                  </small>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">SMTP Host</label>
                    <input 
                      className="form-input"
                      placeholder="smtp.gmail.com"
                      value={form.smtp_host}
                      onChange={e => setForm({ ...form, smtp_host: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SMTP Port</label>
                    <input 
                      className="form-input"
                      placeholder="587"
                      value={form.smtp_port}
                      onChange={e => setForm({ ...form, smtp_port: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">SMTP Username (Email)</label>
                    <input 
                      className="form-input"
                      placeholder="your-email@gmail.com"
                      value={form.smtp_user}
                      onChange={e => setForm({ ...form, smtp_user: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SMTP Password</label>
                    <input 
                      type="password"
                      className="form-input"
                      placeholder="••••••••••••••••"
                      value={form.smtp_pass}
                      onChange={e => setForm({ ...form, smtp_pass: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer' }}>
                    <input 
                      type="checkbox"
                      checked={form.smtp_secure === '1'}
                      onChange={e => setForm({ ...form, smtp_secure: e.target.checked ? '1' : '0' })}
                      style={{ display: 'none' }}
                    />
                    <span className="toggle__track" style={{ width: '40px', height: '20px', background: 'var(--bg-4)', borderRadius: '10px', position: 'relative', display: 'inline-block' }}>
                      <span 
                        className="toggle__thumb" 
                        style={{ 
                          width: '16px', 
                          height: '16px', 
                          background: form.smtp_secure === '1' ? 'var(--accent)' : 'var(--text-3)', 
                          borderRadius: '50%', 
                          position: 'absolute', 
                          top: '2px', 
                          left: form.smtp_secure === '1' ? '22px' : '2px',
                          transition: 'left var(--transition-fast)'
                        }} 
                      />
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>Use SSL/TLS (Port 465)</span>
                  </label>
                </div>

                <div className="flex gap-4 justify-between mt-4">
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    onClick={handleTestSMTP}
                    disabled={testing || saving}
                  >
                    {testing ? <i className="fa-light fa-sharp fa-spinner-third fa-spin" /> : <i className="fa-light fa-sharp fa-circle-nodes" />}
                    {testing ? ' Testing Connection...' : ' Test Connection & Send Email'}
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={saving || testing}
                  >
                    {saving ? <i className="fa-light fa-sharp fa-spinner-third fa-spin" /> : <i className="fa-light fa-sharp fa-floppy-disk" />}
                    {saving ? ' Saving...' : ' Save Settings'}
                  </button>
                </div>

              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
