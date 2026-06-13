import React, { useState, useEffect } from 'react';

export default function LogsManager({ authFetch }) {
  const [logs, setLogs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('wallet');
  const [search, setSearch] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch('/api/store/admin/logs');
      if (!res.ok) throw new Error('Failed to fetch logs');
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      setError(err.message || 'Error loading system logs');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="spinner" />;
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <i className="fa-light fa-sharp fa-circle-exclamation" /> {error}
      </div>
    );
  }

  // Get selected data array
  let dataArray = [];
  if (logs) {
    if (activeTab === 'wallet') dataArray = logs.walletTransactions || [];
    else if (activeTab === 'claims') dataArray = logs.socialClaims || [];
    else if (activeTab === 'contact') dataArray = logs.contactMessages || [];
  }

  // Filter based on search query
  const filtered = dataArray.filter(item => {
    if (!search) return true;
    const q = search.toLowerCase();
    if (activeTab === 'wallet') {
      return (
        (item.user_email || '').toLowerCase().includes(q) ||
        (item.type || '').toLowerCase().includes(q) ||
        (item.reference_id || '').toLowerCase().includes(q)
      );
    } else if (activeTab === 'claims') {
      return (
        (item.user_email || '').toLowerCase().includes(q) ||
        (item.platform || '').toLowerCase().includes(q)
      );
    } else if (activeTab === 'contact') {
      return (
        (item.name || '').toLowerCase().includes(q) ||
        (item.email || '').toLowerCase().includes(q) ||
        (item.subject || '').toLowerCase().includes(q) ||
        (item.message || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Paginate filtered array
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filtered.slice(startIndex, startIndex + itemsPerPage);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearch('');
    setCurrentPage(1);
  };

  const formatPrice = (n) => `Rs. ${Number(n).toFixed(2)}`;

  return (
    <div className="logs-manager">
      <div className="flex justify-between items-center mb-6">
        <h2 className="page-title">System & Action Logs</h2>
        <button className="btn btn-outline" onClick={fetchLogs}>
          <i className="fa-light fa-sharp fa-rotate" /> Refresh Logs
        </button>
      </div>

      {/* Tabs list */}
      <div className="admin-tabs" style={{ display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--border)', marginBottom: 'var(--space-6)', overflowX: 'auto' }}>
        <button
          className={`admin-tab-btn ${activeTab === 'wallet' ? 'admin-tab-btn--active' : ''}`}
          onClick={() => handleTabChange('wallet')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'wallet' ? '2px solid var(--text-0)' : '2px solid transparent',
            color: activeTab === 'wallet' ? 'var(--text-0)' : 'var(--text-2)',
            padding: 'var(--space-3) var(--space-4)',
            fontSize: 'var(--text-sm)',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          Wallet Ledger ({logs?.walletTransactions?.length || 0})
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'claims' ? 'admin-tab-btn--active' : ''}`}
          onClick={() => handleTabChange('claims')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'claims' ? '2px solid var(--text-0)' : '2px solid transparent',
            color: activeTab === 'claims' ? 'var(--text-0)' : 'var(--text-2)',
            padding: 'var(--space-3) var(--space-4)',
            fontSize: 'var(--text-sm)',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          Social Reward Claims ({logs?.socialClaims?.length || 0})
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'contact' ? 'admin-tab-btn--active' : ''}`}
          onClick={() => handleTabChange('contact')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'contact' ? '2px solid var(--text-0)' : '2px solid transparent',
            color: activeTab === 'contact' ? 'var(--text-0)' : 'var(--text-2)',
            padding: 'var(--space-3) var(--space-4)',
            fontSize: 'var(--text-sm)',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          Helpline Messages ({logs?.contactMessages?.length || 0})
        </button>
      </div>

      {/* Search Filter */}
      <div className="admin-filters mb-6">
        <div className="search-input-wrap" style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
          <i className="fa-light fa-sharp fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '36px' }}
            placeholder={`Search ${activeTab === 'wallet' ? 'by user email or transaction ID' : activeTab === 'claims' ? 'by user email or platform' : 'by name, email or message'}...`}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="admin-table-wrap">
        {paginatedItems.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
            <i className="fa-light fa-sharp fa-file-excel text-4xl mb-4" style={{ color: 'var(--text-3)' }} />
            <p>No matching logs found.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              {activeTab === 'wallet' && (
                <tr>
                  <th>ID</th>
                  <th>User Email</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Reference ID</th>
                  <th>Created At</th>
                </tr>
              )}
              {activeTab === 'claims' && (
                <tr>
                  <th>User Email</th>
                  <th>Platform</th>
                  <th>Claimed At</th>
                </tr>
              )}
              {activeTab === 'contact' && (
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Subject</th>
                  <th>Message</th>
                  <th>Date</th>
                </tr>
              )}
            </thead>
            <tbody>
              {activeTab === 'wallet' && paginatedItems.map((tx) => (
                <tr key={tx.id}>
                  <td data-label="ID" className="font-mono">#{tx.id}</td>
                  <td data-label="User Email">{tx.user_email || `User #${tx.user_id}`}</td>
                  <td data-label="Amount" className="font-mono" style={{ color: tx.amount < 0 ? 'var(--danger)' : 'var(--accent)' }}>
                    {tx.amount < 0 ? '-' : '+'}{formatPrice(Math.abs(tx.amount))}
                  </td>
                  <td data-label="Type">
                    <span className={`badge badge--${tx.type === 'deposit' ? 'success' : tx.type === 'purchase' ? 'info' : 'warning'}`} style={{ textTransform: 'uppercase' }}>
                      {tx.type}
                    </span>
                  </td>
                  <td data-label="Reference ID" className="font-mono">{tx.reference_id || 'N/A'}</td>
                  <td data-label="Created At">{new Date(tx.created_at).toLocaleString('en-NP')}</td>
                </tr>
              ))}
              {activeTab === 'claims' && paginatedItems.map((claim, index) => (
                <tr key={`${claim.user_id}-${claim.platform}-${index}`}>
                  <td data-label="User Email">{claim.user_email || `User #${claim.user_id}`}</td>
                  <td data-label="Platform" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }} className="font-mono">{claim.platform}</td>
                  <td data-label="Claimed At">{new Date(claim.claimed_at).toLocaleString('en-NP')}</td>
                </tr>
              ))}
              {activeTab === 'contact' && paginatedItems.map((msg) => (
                <tr key={msg.id}>
                  <td data-label="Name"><strong>{msg.name}</strong></td>
                  <td data-label="Email" className="font-mono">{msg.email}</td>
                  <td data-label="Subject">{msg.subject || 'No Subject'}</td>
                  <td data-label="Message" style={{ maxWidth: '300px', whiteSpace: 'normal', wordBreak: 'break-all' }}>{msg.message}</td>
                  <td data-label="Date">{new Date(msg.created_at).toLocaleString('en-NP')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div style={{ color: 'var(--text-2)', fontSize: 'var(--text-sm)' }}>
            Showing {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filtered.length)} of {filtered.length} logs
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span style={{ display: 'inline-flex', alignItems: 'center', px: 3, fontFamily: 'var(--font-mono)' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
