import React, { useState, useEffect } from 'react';

export default function SettingsManager({ authFetch }) {
  const [form, setForm] = useState({
    googleClientId: '',
    googleClientSecret: '',
    googleAuthEnabled: false,
    lowStockThreshold: 5,
    salesTaxRate: 13,
    maintenanceMode: false,
    storeBannerText: '',
    deliveryPerKmRate: 15,
    deliveryMinCharge: 50,
    deliveryFreeThreshold: 2000,
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPass: '',
    smtpSecure: false,
    emergencyContactPhone: '',
    emergencyContactEmail: '',
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null); // { type: 'success' | 'danger', text: '' }
  const [activeTab, setActiveTab] = useState('general');

  // Raw DB Settings State
  const [rawSettings, setRawSettings] = useState([]);
  const [rawLoading, setRawLoading] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [editingKey, setEditingKey] = useState(null);
  const [editingValue, setEditingValue] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/store/admin/settings');
      const data = await res.json();
      setForm(prev => ({ ...prev, ...data }));
    } catch (err) {
      console.error(err);
      setMsg({ type: 'danger', text: 'Failed to load system settings' });
    } finally {
      setLoading(false);
    }
  };

  const fetchRawSettings = async () => {
    setRawLoading(true);
    setMsg(null);
    try {
      const res = await authFetch('/api/store/admin/settings/raw');
      if (!res.ok) throw new Error('Failed to fetch raw settings');
      const data = await res.json();
      setRawSettings(data || []);
    } catch (err) {
      console.error(err);
      setMsg({ type: 'danger', text: 'Failed to load raw settings' });
    } finally {
      setRawLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setMsg(null);
    if (tab === 'raw') {
      fetchRawSettings();
    } else {
      fetchSettings();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await authFetch('/api/store/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(form)
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Failed to save settings');
      setMsg({ type: 'success', text: 'System settings saved successfully!' });
    } catch (err) {
      setMsg({ type: 'danger', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  // Raw Settings Handlers
  const handleAddRaw = async (e) => {
    e.preventDefault();
    if (!newKey.trim()) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await authFetch('/api/store/admin/settings/raw', {
        method: 'POST',
        body: JSON.stringify({ key_name: newKey.trim(), key_value: newValue })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Failed to save setting');
      setNewKey('');
      setNewValue('');
      setMsg({ type: 'success', text: `Setting "${d.key_name}" added/updated successfully!` });
      await fetchRawSettings();
    } catch (err) {
      setMsg({ type: 'danger', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRaw = async (key) => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await authFetch('/api/store/admin/settings/raw', {
        method: 'POST',
        body: JSON.stringify({ key_name: key, key_value: editingValue })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Failed to update setting');
      setEditingKey(null);
      setMsg({ type: 'success', text: `Setting "${key}" updated successfully!` });
      await fetchRawSettings();
    } catch (err) {
      setMsg({ type: 'danger', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRaw = async (key) => {
    if (!window.confirm(`Are you sure you want to delete setting: "${key}"?`)) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await authFetch(`/api/store/admin/settings/raw/${key}`, {
        method: 'DELETE'
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Failed to delete setting');
      setMsg({ type: 'success', text: `Setting "${key}" deleted successfully!` });
      await fetchRawSettings();
    } catch (err) {
      setMsg({ type: 'danger', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-page"><div className="spinner" /></div>;
  }

  return (
    <div className="admin-settings">
      <div className="flex justify-between items-center mb-6">
        <h2 className="page-title">System Settings</h2>
      </div>

      {msg && (
        <div className={`alert alert-${msg.type} mb-6`} style={{ maxWidth: 800 }}>
          <i className={`fa-light fa-sharp fa-${msg.type === 'success' ? 'circle-check' : 'circle-exclamation'}`} />
          {msg.text}
        </div>
      )}

      <div className="flex gap-6" style={{ maxWidth: 900 }}>
        {/* Settings categories sidebar */}
        <div style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <button 
            type="button"
            className={`btn btn-sm ${activeTab === 'general' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => handleTabChange('general')}
            style={{ textAlign: 'left', justifyContent: 'flex-start' }}
          >
            <i className="fa-light fa-sharp fa-sliders" /> General
          </button>
          <button 
            type="button"
            className={`btn btn-sm ${activeTab === 'shipping' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => handleTabChange('shipping')}
            style={{ textAlign: 'left', justifyContent: 'flex-start' }}
          >
            <i className="fa-light fa-sharp fa-truck" /> Shipping Rules
          </button>
          <button 
            type="button"
            className={`btn btn-sm ${activeTab === 'smtp' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => handleTabChange('smtp')}
            style={{ textAlign: 'left', justifyContent: 'flex-start' }}
          >
            <i className="fa-light fa-sharp fa-envelope" /> SMTP Configuration
          </button>
          <button 
            type="button"
            className={`btn btn-sm ${activeTab === 'google' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => handleTabChange('google')}
            style={{ textAlign: 'left', justifyContent: 'flex-start' }}
          >
            <i className="fa-brands fa-google" /> Google OAuth
          </button>
          <button 
            type="button"
            className={`btn btn-sm ${activeTab === 'raw' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => handleTabChange('raw')}
            style={{ textAlign: 'left', justifyContent: 'flex-start' }}
          >
            <i className="fa-light fa-sharp fa-database" /> Raw DB Settings
          </button>
        </div>

        {/* Configurations Form or Raw Table */}
        {activeTab !== 'raw' ? (
          <form onSubmit={handleSubmit} style={{ flex: 1 }} className="form-settings-grid">
            {activeTab === 'general' && (
              <div className="settings-section">
                <h3 className="section-title mb-4" style={{ fontSize: 'var(--text-sm)' }}>General Store Parameters</h3>
                
                <div className="form-group">
                  <label className="form-label">Store Announcement Banner</label>
                  <input 
                    className="form-input" 
                    placeholder="Welcome message or discount alert" 
                    value={form.storeBannerText} 
                    onChange={e => setForm({...form, storeBannerText: e.target.value})} 
                  />
                </div>

                <div className="flex gap-4">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Sales VAT/Tax Rate (%)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="e.g. 13" 
                      value={form.salesTaxRate} 
                      onChange={e => setForm({...form, salesTaxRate: e.target.value})} 
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Low Stock Warning Threshold</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="e.g. 5" 
                      value={form.lowStockThreshold} 
                      onChange={e => setForm({...form, lowStockThreshold: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Emergency Helpline Phone</label>
                    <input 
                      className="form-input" 
                      placeholder="e.g. 9801234567" 
                      value={form.emergencyContactPhone} 
                      onChange={e => setForm({...form, emergencyContactPhone: e.target.value})} 
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Emergency Support Email</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      placeholder="e.g. support@himalix.store" 
                      value={form.emergencyContactEmail} 
                      onChange={e => setForm({...form, emergencyContactEmail: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="form-group flex items-center gap-2 mt-4">
                  <input 
                    type="checkbox" 
                    id="maintenanceMode" 
                    checked={form.maintenanceMode} 
                    onChange={e => setForm({...form, maintenanceMode: e.target.checked})} 
                  />
                  <label htmlFor="maintenanceMode" className="form-label" style={{ marginBottom: 0, cursor: 'pointer' }}>
                    Enable Maintenance Mode (Restricts public storefront browsing)
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="settings-section">
                <h3 className="section-title mb-4" style={{ fontSize: 'var(--text-sm)' }}>Distance-Based Delivery Fees</h3>
                
                <div className="form-group">
                  <label className="form-label">Minimum Shipping Charge (Rs.)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-input" 
                    placeholder="e.g. 50.00" 
                    value={form.deliveryMinCharge} 
                    onChange={e => setForm({...form, deliveryMinCharge: e.target.value})} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Rate Per Kilometer (Rs. / KM)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-input" 
                    placeholder="e.g. 15.00" 
                    value={form.deliveryPerKmRate} 
                    onChange={e => setForm({...form, deliveryPerKmRate: e.target.value})} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Free Delivery Minimum Order Threshold (Rs.)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-input" 
                    placeholder="e.g. 2000.00" 
                    value={form.deliveryFreeThreshold} 
                    onChange={e => setForm({...form, deliveryFreeThreshold: e.target.value})} 
                  />
                </div>
              </div>
            )}

            {activeTab === 'smtp' && (
              <div className="settings-section">
                <h3 className="section-title mb-4" style={{ fontSize: 'var(--text-sm)' }}>SMTP Email Server Credentials</h3>
                
                <div className="form-group">
                  <label className="form-label">SMTP Host Server</label>
                  <input 
                    className="form-input" 
                    placeholder="e.g. smtp.mailtrap.io or smtp.gmail.com" 
                    value={form.smtpHost} 
                    onChange={e => setForm({...form, smtpHost: e.target.value})} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">SMTP Port</label>
                  <input 
                    className="form-input" 
                    placeholder="e.g. 587 (TLS) or 465 (SSL) or 2525" 
                    value={form.smtpPort} 
                    onChange={e => setForm({...form, smtpPort: e.target.value})} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">SMTP Username</label>
                  <input 
                    className="form-input" 
                    placeholder="Username / client account key" 
                    value={form.smtpUser} 
                    onChange={e => setForm({...form, smtpUser: e.target.value})} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">SMTP Password</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="Account authentication password" 
                    value={form.smtpPass} 
                    onChange={e => setForm({...form, smtpPass: e.target.value})} 
                  />
                </div>

                <div className="form-group flex items-center gap-2 mt-4">
                  <input 
                    type="checkbox" 
                    id="smtpSecure" 
                    checked={form.smtpSecure} 
                    onChange={e => setForm({...form, smtpSecure: e.target.checked})} 
                  />
                  <label htmlFor="smtpSecure" className="form-label" style={{ marginBottom: 0, cursor: 'pointer' }}>
                    Use SSL / Secure Connection (Port 465)
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'google' && (
              <div className="settings-section">
                <h3 className="section-title mb-4" style={{ fontSize: 'var(--text-sm)' }}>Google Client Credentials</h3>
                
                <div className="form-group">
                  <label className="form-label">Google Client ID</label>
                  <input 
                    className="form-input" 
                    placeholder="XXXXXX-XXXXXX.apps.googleusercontent.com" 
                    value={form.googleClientId} 
                    onChange={e => setForm({...form, googleClientId: e.target.value})} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Google Client Secret</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="Google Developer Console OAuth Secret" 
                    value={form.googleClientSecret} 
                    onChange={e => setForm({...form, googleClientSecret: e.target.value})} 
                  />
                </div>

                <div className="form-group flex items-center gap-2 mt-4">
                  <input 
                    type="checkbox" 
                    id="googleAuthEnabled" 
                    checked={form.googleAuthEnabled} 
                    onChange={e => setForm({...form, googleAuthEnabled: e.target.checked})} 
                  />
                  <label htmlFor="googleAuthEnabled" className="form-label" style={{ marginBottom: 0, cursor: 'pointer' }}>
                    Enable Google One-Tap/Social Authentication
                  </label>
                </div>
              </div>
            )}

            <div style={{ marginTop: 'var(--space-6)', borderTop: '1px solid var(--border)', paddingTop: 'var(--space-4)' }} className="flex justify-end">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <i className="fa-light fa-sharp fa-spinner-third fa-spin" /> : <i className="fa-light fa-sharp fa-floppy-disk" />}
                {saving ? ' Saving...' : ' Save Configurations'}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ flex: 1 }}>
            <h3 className="section-title mb-4" style={{ fontSize: 'var(--text-sm)' }}>Raw Key-Value Settings Database</h3>

            {/* Add New Key Form */}
            <form onSubmit={handleAddRaw} className="flex gap-2 mb-6 items-end" style={{ border: '1px solid var(--border)', padding: 'var(--space-4)', background: '#141414' }}>
              <div className="form-group mb-0" style={{ flex: 1 }}>
                <label className="form-label">Key Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. custom_config_key" 
                  value={newKey} 
                  onChange={e => setNewKey(e.target.value)} 
                  required
                />
              </div>
              <div className="form-group mb-0" style={{ flex: 1 }}>
                <label className="form-label">Key Value</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. 100 or true or text-value" 
                  value={newValue} 
                  onChange={e => setNewValue(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ height: '38px', minWidth: '100px' }} disabled={saving}>
                Add Key
              </button>
            </form>

            {/* Spreadsheet Table View */}
            {rawLoading ? <div className="spinner" /> : (
              <div className="admin-table-wrap">
                <table className="admin-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Key Name</th>
                      <th>Key Value</th>
                      <th style={{ textAlign: 'right', minWidth: '120px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rawSettings.map((item) => (
                      <tr key={item.key_name}>
                        <td className="font-mono" style={{ fontWeight: 'bold', color: 'var(--text-1)' }}>
                          {item.key_name}
                        </td>
                        <td>
                          {editingKey === item.key_name ? (
                            <input
                              type="text"
                              className="form-input"
                              style={{ width: '100%', height: '30px', padding: 'var(--space-1) var(--space-2)' }}
                              value={editingValue}
                              onChange={e => setEditingValue(e.target.value)}
                            />
                          ) : (
                            <span className="font-mono" style={{ whiteSpace: 'normal', wordBreak: 'break-all' }}>
                              {item.key_value}
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="flex gap-2 justify-end">
                            {editingKey === item.key_name ? (
                              <>
                                <button 
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleUpdateRaw(item.key_name)}
                                  disabled={saving}
                                >
                                  Save
                                </button>
                                <button 
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => setEditingKey(null)}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button 
                                  className="btn btn-outline btn-sm"
                                  onClick={() => {
                                    setEditingKey(item.key_name);
                                    setEditingValue(item.key_value || '');
                                  }}
                                >
                                  Edit
                                </button>
                                <button 
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleDeleteRaw(item.key_name)}
                                  disabled={saving}
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
