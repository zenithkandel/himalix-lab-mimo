import React, { useState } from 'react';

export default function UserManager({ users, authFetch, onLoad }) {
  const [search, setSearch] = useState('');
  const [balanceModal, setBalanceModal] = useState(null); // holds user object
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceType, setBalanceType] = useState('deposit'); // 'deposit' or 'refund'
  const [balanceRef, setBalanceRef] = useState('');
  const [passwordModal, setPasswordModal] = useState(null); // holds user object
  const [newPassword, setNewPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filtered = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleRole = async (u) => {
    const nextRole = u.role === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Are you sure you want to change ${u.email}'s role to ${nextRole}?`)) return;

    try {
      const res = await authFetch(`/api/store/admin/users/${u.id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: nextRole })
      });
      if (!res.ok) throw new Error('Failed to update role');
      onLoad();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`DANGER: Are you sure you want to delete the account for ${u.email}? This action is permanent.`)) return;

    try {
      const res = await authFetch(`/api/store/admin/users/${u.id}`, {
        method: 'DELETE'
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Failed to delete user');
      alert(d.message || 'User deleted successfully');
      onLoad();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAdjustBalance = async (e) => {
    e.preventDefault();
    if (!balanceAmount || isNaN(balanceAmount) || Number(balanceAmount) <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // If we are deducting (e.g. refund/purchase reversal but negative), amount is negative
      const amountSign = balanceType === 'purchase' ? -Number(balanceAmount) : Number(balanceAmount);
      const res = await authFetch(`/api/store/admin/users/${balanceModal.id}/credit`, {
        method: 'POST',
        body: JSON.stringify({
          amount: amountSign,
          type: balanceType,
          reference_id: balanceRef.trim() || undefined
        })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Failed to adjust balance');
      
      setBalanceModal(null);
      setBalanceAmount('');
      setBalanceRef('');
      onLoad();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authFetch(`/api/store/admin/users/${passwordModal.id}/password`, {
        method: 'PUT',
        body: JSON.stringify({ password: newPassword })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Failed to reset password');
      
      setPasswordModal(null);
      setNewPassword('');
      alert('Password updated successfully');
      onLoad();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-users">
      <div className="flex justify-between items-center mb-6">
        <h2 className="page-title">User Accounts ({users.length})</h2>
        <div className="form-group mb-0" style={{ maxWidth: 300, flex: 1 }}>
          <input 
            className="form-input" 
            placeholder="Search email or role..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer Email</th>
              <th>Role</th>
              <th>Auth Provider</th>
              <th>Wallet Balance</th>
              <th>Orders Placed</th>
              <th>Joined Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td>#{u.id}</td>
                <td>
                  <div className="flex items-center gap-2">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                    ) : (
                      <i className="fa-light fa-sharp fa-user-circle text-lg" style={{ color: 'var(--text-3)' }} />
                    )}
                    <span className="font-semibold">{u.email}</span>
                  </div>
                </td>
                <td>
                  <span className={`badge badge--${u.role === 'admin' ? 'warning' : 'info'}`} style={{ textTransform: 'uppercase' }}>
                    {u.role}
                  </span>
                </td>
                <td style={{ textTransform: 'capitalize' }}>{u.auth_provider || 'local'}</td>
                <td className="font-mono" style={{ color: 'var(--accent)' }}>
                  Rs. {Number(u.wallet_balance).toFixed(2)}
                </td>
                <td>{u.order_count || 0}</td>
                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                <td>
                  <div className="flex gap-2 justify-end">
                    <button 
                      className="btn btn-outline btn-sm" 
                      onClick={() => {
                        setBalanceModal(u);
                        setBalanceType('deposit');
                        setError('');
                      }}
                      title="Adjust Wallet Balance"
                    >
                      <i className="fa-light fa-sharp fa-wallet" /> Credit
                    </button>
                    {u.auth_provider !== 'google' && (
                      <button 
                        className="btn btn-ghost btn-sm" 
                        onClick={() => {
                          setPasswordModal(u);
                          setError('');
                        }}
                        title="Reset Password"
                      >
                        <i className="fa-light fa-sharp fa-key" /> PW
                      </button>
                    )}
                    <button 
                      className="btn btn-ghost btn-sm" 
                      onClick={() => handleToggleRole(u)}
                      title="Toggle Role"
                    >
                      <i className="fa-light fa-sharp fa-arrows-repeat" /> Role
                    </button>
                    <button 
                      className="btn btn-danger btn-sm" 
                      onClick={() => handleDeleteUser(u)}
                      title="Delete User Account"
                    >
                      <i className="fa-light fa-sharp fa-trash" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-3)' }}>
                  No users match your search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Adjust Wallet Balance Modal */}
      {balanceModal && (
        <div className="admin-modal">
          <div className="admin-modal__content" style={{ maxWidth: 450 }}>
            <div className="admin-modal__header">
              <h2 className="page-title">Adjust Wallet Balance</h2>
              <button className="btn btn-ghost" onClick={() => setBalanceModal(null)}>
                <i className="fa-light fa-sharp fa-xmark" />
              </button>
            </div>
            <form onSubmit={handleAdjustBalance} className="admin-modal__body">
              {error && <div className="alert alert-danger mb-4">{error}</div>}
              
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <strong>User Email:</strong> {balanceModal.email}<br/>
                <strong>Current Balance:</strong> Rs. {Number(balanceModal.wallet_balance).toFixed(2)}
              </div>

              <div className="form-group">
                <label className="form-label">Adjustment Type</label>
                <select className="form-select" value={balanceType} onChange={e => setBalanceType(e.target.value)}>
                  <option value="deposit">Deposit (Credit Account)</option>
                  <option value="refund">Refund (Credit Account)</option>
                  <option value="purchase">Debit Adjustment (Charge Account)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Amount (Rs.)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  className="form-input" 
                  required 
                  placeholder="e.g. 1000.00" 
                  value={balanceAmount} 
                  onChange={e => setBalanceAmount(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reference / Reason</label>
                <input 
                  className="form-input" 
                  placeholder="e.g. eSewa manual deposit ref #81728" 
                  value={balanceRef} 
                  onChange={e => setBalanceRef(e.target.value)} 
                />
              </div>

              <div className="admin-modal__footer mt-6 flex justify-between">
                <button type="button" className="btn btn-outline" onClick={() => setBalanceModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Processing...' : 'Confirm Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {passwordModal && (
        <div className="admin-modal">
          <div className="admin-modal__content" style={{ maxWidth: 400 }}>
            <div className="admin-modal__header">
              <h2 className="page-title">Reset Password</h2>
              <button className="btn btn-ghost" onClick={() => setPasswordModal(null)}>
                <i className="fa-light fa-sharp fa-xmark" />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="admin-modal__body">
              {error && <div className="alert alert-danger mb-4">{error}</div>}
              
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <strong>User Email:</strong> {passwordModal.email}
              </div>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  required 
                  placeholder="Enter at least 6 characters" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                />
              </div>

              <div className="admin-modal__footer mt-6 flex justify-between">
                <button type="button" className="btn btn-outline" onClick={() => setPasswordModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
