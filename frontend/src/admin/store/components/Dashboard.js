import React from 'react';

export default function Dashboard({ analytics }) {
  if (!analytics) return <div className="spinner" />;

  return (
    <div className="admin-dashboard">
      <h2 className="page-title">Dashboard Overview</h2>
      <p className="page-subtitle">Key metrics for Himalix Store</p>
      
      <div className="admin-dashboard__grid">
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon"><i className="fa-light fa-sharp fa-money-bill" /></div>
          <div className="admin-stat-card__info">
            <div className="admin-stat-card__label">Total Revenue</div>
            <div className="admin-stat-card__val">Rs. {Number(analytics.totalRevenue || 0).toFixed(2)}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon"><i className="fa-light fa-sharp fa-box" /></div>
          <div className="admin-stat-card__info">
            <div className="admin-stat-card__label">Orders</div>
            <div className="admin-stat-card__val">{analytics.totalOrders || 0}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon"><i className="fa-light fa-sharp fa-users" /></div>
          <div className="admin-stat-card__info">
            <div className="admin-stat-card__label">Customers</div>
            <div className="admin-stat-card__val">{analytics.totalUsers || 0}</div>
          </div>
        </div>
      </div>
      
      <div className="admin-dashboard__recent">
        <h3>Recent Orders</h3>
        {analytics.recentOrders && analytics.recentOrders.length > 0 ? (
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
                  <td><span className={`badge badge-${o.status === 'delivered' ? 'success' : o.status === 'cancelled' ? 'danger' : 'neutral'}`}>{o.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">No recent orders.</div>
        )}
      </div>
    </div>
  );
}
