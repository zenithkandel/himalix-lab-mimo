import React from 'react';

export default function Dashboard({ analytics }) {
  if (!analytics) return <div className="spinner" />;

  const totalUsers = analytics.userCounts
    ? analytics.userCounts.reduce((sum, item) => sum + item.count, 0)
    : 0;

  return (
    <div className="admin-dashboard">
      <h2 className="page-title">Dashboard Overview</h2>
      <p className="page-subtitle">Key metrics for Himalix Store</p>
      
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-card__header">
            <span className="admin-stat-card__label">Total Revenue</span>
            <span className="admin-stat-card__icon"><i className="fa-light fa-sharp fa-money-bill" /></span>
          </div>
          <div className="admin-stat-card__value">Rs. {Number(analytics.totalRevenue || 0).toFixed(2)}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card__header">
            <span className="admin-stat-card__label">Orders</span>
            <span className="admin-stat-card__icon"><i className="fa-light fa-sharp fa-box" /></span>
          </div>
          <div className="admin-stat-card__value">{analytics.totalOrders || 0}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card__header">
            <span className="admin-stat-card__label">Avg Order Value</span>
            <span className="admin-stat-card__icon"><i className="fa-light fa-sharp fa-chart-line" /></span>
          </div>
          <div className="admin-stat-card__value">Rs. {Number(analytics.avgOrderValue || 0).toFixed(2)}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card__header">
            <span className="admin-stat-card__label">Customers</span>
            <span className="admin-stat-card__icon"><i className="fa-light fa-sharp fa-users" /></span>
          </div>
          <div className="admin-stat-card__value">{totalUsers}</div>
        </div>
      </div>
      
      <div className="admin-dashboard__recent mt-6">
        <h3 className="mb-4" style={{ textTransform: 'uppercase', fontSize: '13px', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--text-2)' }}>Recent Orders</h3>
        {analytics.recentOrders && analytics.recentOrders.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recentOrders.map(o => (
                  <tr key={o.id}>
                    <td>#{o.id}</td>
                    <td>Rs. {Number(o.total_amount).toFixed(2)}</td>
                    <td><span className={`badge badge--${o.status === 'delivered' ? 'success' : o.status === 'cancelled' ? 'danger' : 'neutral'}`}>{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">No recent orders.</div>
        )}
      </div>
    </div>
  );
}

