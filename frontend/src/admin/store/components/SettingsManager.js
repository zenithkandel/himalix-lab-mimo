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

  useEffect(() => {
    fetchSettings();
  }, []);

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

      <div className="flex gap-6" style={{ maxWidth: 800 }}>
        {/* Settings categories sidebar */}
        <div style={{ width: 180, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <button 
            type="button"
            className={`btn btn-sm ${activeTab === 'general' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('general')}
            style={{ textAlign: 'left', justifyContent: 'flex-start' }}
          >
            <i className="fa-light fa-sharp fa-sliders" /> General
          </button>
          <button 
            type="button"
            className={`btn btn-sm ${activeTab === 'shipping' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('shipping')}
            style={{ textAlign: 'left', justifyContent: 'flex-start' }}
          >
            <i className="fa-light fa-sharp fa-truck" /> Shipping Rules
          </button>
          <button 
            type="button"
            className={`btn btn-sm ${activeTab === 'smtp' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('smtp')}
            style={{ textAlign: 'left', justifyContent: 'flex-start' }}
          >
            <i className="fa-light fa-sharp fa-envelope" /> SMTP Configuration
          </button>
          <button 
            type="button"
            className={`btn btn-sm ${activeTab === 'google' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('google')}
            style={{ textAlign: 'left', justifyContent: 'flex-start' }}
          >
            <i className="fa-brands fa-google" /> Google OAuth
          </button>
        </div>

        {/* Configurations Form */}
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
      </div>
    </div>
  );
}
