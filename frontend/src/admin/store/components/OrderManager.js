import React, { useState } from 'react';

const ORDER_STATUS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function OrderManager({ orders, updateOrderStatus, loading }) {
  const [search, setSearch] = useState('');

  if (loading) return <div className="spinner" />;

  const filtered = orders.filter(o => 
    o.tracking_code.toLowerCase().includes(search.toLowerCase()) || 
    o.id.toString().includes(search)
  );

  return (
    <div className="admin-orders">
      <div className="admin-orders__header">
        <h2 className="page-title">Order Management</h2>
        <div className="form-group">
          <input 
            className="form-input" 
            placeholder="Search tracking code or ID..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tracking</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id}>
                  <td>#{o.id}</td>
                  <td 
                    style={{ fontFamily: 'var(--font-mono)', cursor: 'pointer' }}
                    onClick={() => navigator.clipboard.writeText(o.tracking_code)}
                    title="Click to copy"
                  >
                    {o.tracking_code} <i className="fa-light fa-sharp fa-copy" style={{ opacity: 0.5 }} />
                  </td>
                  <td>Rs. {Number(o.total_amount).toFixed(2)}</td>
                  <td><span className={`badge badge-${o.payment_status === 'paid' ? 'success' : 'warning'}`}>{o.payment_method} ({o.payment_status})</span></td>
                  <td>
                    <select 
                      className="form-select" 
                      style={{ padding: '4px 8px', width: 'auto' }}
                      value={o.status}
                      onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                    >
                      {ORDER_STATUS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                    </select>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => alert('View details implementation coming soon')}><i className="fa-light fa-sharp fa-eye" /> View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <i className="fa-light fa-sharp fa-box-open empty-state-icon" />
          <p>No orders found.</p>
        </div>
      )}
    </div>
  );
}
