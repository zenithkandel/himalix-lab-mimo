import React, { useState, useEffect } from 'react';

const ORDER_STATUS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUS = ['paid', 'unpaid', 'refunded'];

export default function OrderManager({ orders, updateOrderDetails, loading }) {
  const [search, setSearch] = useState('');
  const [activeOrder, setActiveOrder] = useState(null);
  const [modalFields, setModalFields] = useState({ status: '', payment_status: '', tracking_code: '' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveOrder(null);
      }
    };
    if (activeOrder) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeOrder]);

  if (loading) return <div className="spinner" />;

  const filteredAndSorted = orders
    .filter(o => {
      const matchSearch = o.tracking_code.toLowerCase().includes(search.toLowerCase()) || 
                          o.id.toString().includes(search);
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchPayment = paymentFilter === 'all' || o.payment_status === paymentFilter;
      return matchSearch && matchStatus && matchPayment;
    })
    .sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (sortBy === 'date_asc') {
        return new Date(a.created_at) - new Date(b.created_at);
      } else if (sortBy === 'total_desc') {
        return parseFloat(b.total) - parseFloat(a.total);
      } else if (sortBy === 'total_asc') {
        return parseFloat(a.total) - parseFloat(b.total);
      } else if (sortBy === 'id_desc') {
        return b.id - a.id;
      } else if (sortBy === 'id_asc') {
        return a.id - b.id;
      }
      return 0;
    });

  const handleOpenModal = (order) => {
    setActiveOrder(order);
    setModalFields({
      status: order.status || 'pending',
      payment_status: order.payment_status || 'unpaid',
      tracking_code: order.tracking_code || ''
    });
  };

  const handleSaveModal = async () => {
    if (!activeOrder) return;
    await updateOrderDetails(activeOrder.id, modalFields);
    // Sync local activeOrder state
    setActiveOrder(prev => ({ ...prev, ...modalFields }));
    alert('Order updated successfully!');
    setActiveOrder(null);
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    const d = new Date(isoStr);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Safe parse shipping details helper
  const getShippingDetails = (order) => {
    if (!order || !order.shipping_address) return null;
    let addr = order.shipping_address;
    if (typeof addr === 'string') {
      try {
        addr = JSON.parse(addr);
      } catch (e) {
        return null;
      }
    }
    return addr;
  };

  const getCoordinates = (shipping) => {
    if (!shipping || !shipping.receivingLocation) return null;
    const parts = shipping.receivingLocation.split(',');
    if (parts.length === 2) {
      const lat = parts[0].trim();
      const lng = parts[1].trim();
      if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
    return null;
  };

  const handleCopyOrderDetails = (order) => {
    if (!order) return;
    const shipping = getShippingDetails(order);
    const coords = getCoordinates(shipping);
    
    let shippingStr = 'No shipping details';
    if (shipping) {
      const coordsStr = coords ? `${coords.lat}, ${coords.lng}` : 'N/A';
      const mapsUrl = coords ? `https://maps.google.com/?q=${coords.lat},${coords.lng}` : 'N/A';
      shippingStr = `Recipient: ${shipping.fullName || 'N/A'}
Phone: ${shipping.phone || 'N/A'}
Street Line: ${shipping.addressLine || 'N/A'}
City: ${shipping.city || 'N/A'}
District: ${shipping.district || 'N/A'}
Province: ${shipping.province || 'N/A'}
Coordinates: ${coordsStr}
Google Maps Location: ${mapsUrl}`;
    }

    const itemsStr = order.items && order.items.length > 0 
      ? order.items.map(item => 
          `- ${item.name || `Product #${item.product_id}`} (Qty: ${item.quantity}, Price: Rs. ${Number(item.price).toFixed(2)}, Total: Rs. ${(Number(item.price) * item.quantity).toFixed(2)})`
        ).join('\n')
      : 'No items in order';

    const details = `Order ID: #${order.id}
Tracking Code: ${order.tracking_code || 'N/A'}
Date: ${formatDate(order.created_at)}
Grand Total: Rs. ${Number(order.total).toFixed(2)}
Payment Method: ${order.payment_method.toUpperCase()}
Payment Status: ${order.payment_status.toUpperCase()}

Customer Profile:
Name: ${order.user_name || 'Guest'}
Email: ${order.email}
Phone: ${order.user_phone || 'N/A'}

Shipping Details:
${shippingStr}

Items Ordered:
${itemsStr}`;

    navigator.clipboard.writeText(details)
      .then(() => alert('Order details copied to clipboard!'))
      .catch((err) => alert('Failed to copy details: ' + err));
  };

  return (
    <div className="admin-orders">
      <div className="admin-orders__header" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="page-title" style={{ margin: 0 }}>Order Management</h2>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)' }}>
            Showing {filteredAndSorted.length} of {orders.length} orders
          </span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)', width: '100%' }}>
          <div className="form-group mb-0">
            <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-3)' }}>Search</label>
            <input 
              className="form-input" 
              placeholder="Tracking code or ID..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          
          <div className="form-group mb-0">
            <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-3)' }}>Order Status</label>
            <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">ALL STATUSES</option>
              {ORDER_STATUS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
            </select>
          </div>
          
          <div className="form-group mb-0">
            <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-3)' }}>Payment Status</label>
            <select className="form-select" value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)}>
              <option value="all">ALL PAYMENT STATES</option>
              {PAYMENT_STATUS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
            </select>
          </div>
          
          <div className="form-group mb-0">
            <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-3)' }}>Sort By</label>
            <select className="form-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="date_desc">Newest Orders</option>
              <option value="date_asc">Oldest Orders</option>
              <option value="total_desc">Total: High to Low</option>
              <option value="total_asc">Total: Low to High</option>
              <option value="id_desc">ID: High to Low</option>
              <option value="id_asc">ID: Low to High</option>
            </select>
          </div>
        </div>
      </div>

      {filteredAndSorted.length > 0 ? (
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
              {filteredAndSorted.map(o => (
                <tr key={o.id}>
                  <td data-label="ID">#{o.id}</td>
                  <td 
                    data-label="Tracking"
                    style={{ fontFamily: 'var(--font-mono)', cursor: 'pointer' }}
                    onClick={() => navigator.clipboard.writeText(o.tracking_code)}
                    title="Click to copy"
                  >
                    {o.tracking_code} <i className="fa-light fa-sharp fa-copy" style={{ opacity: 0.5 }} />
                  </td>
                  <td data-label="Total">Rs. {Number(o.total).toFixed(2)}</td>
                  <td data-label="Payment">
                    <span className={`badge badge-${o.payment_status === 'paid' ? 'success' : 'warning'}`}>
                      {o.payment_method.toUpperCase()} ({o.payment_status.toUpperCase()})
                    </span>
                  </td>
                  <td data-label="Status">
                    <select 
                      className="form-select" 
                      style={{ padding: '4px 8px', width: 'auto' }}
                      value={o.status}
                      onChange={(e) => updateOrderDetails(o.id, { status: e.target.value })}
                    >
                      {ORDER_STATUS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                    </select>
                  </td>
                  <td data-label="Actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => handleOpenModal(o)}>
                      <i className="fa-light fa-sharp fa-eye" /> View
                    </button>
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

      {/* Detailed Order Viewer & Editing Modal */}
      {activeOrder && (
        <div className="admin-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setActiveOrder(null); }}>
          <div className="admin-modal" style={{ maxWidth: '800px' }}>
            <div className="admin-modal__content">
              <div className="admin-modal__header">
                <h2 className="page-title">Order Details #{activeOrder.id}</h2>
                <button type="button" className="btn btn-ghost" onClick={() => setActiveOrder(null)} aria-label="Close dialog">
                  <i className="fa-light fa-sharp fa-xmark" />
                </button>
              </div>

              <div className="admin-modal__body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
                  
                  {/* Left Column: Summary & Manipulation */}
                  <div>
                    <h3 style={{ fontSize: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '12px' }}>Order Info</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', marginBottom: '16px' }}>
                      <div><strong>Order Timing:</strong> {formatDate(activeOrder.created_at)}</div>
                      <div><strong>Payment Mode:</strong> {activeOrder.payment_method.toUpperCase()}</div>
                      <div><strong>Grand Total:</strong> Rs. {Number(activeOrder.total).toFixed(2)}</div>
                    </div>

                    <h3 style={{ fontSize: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '12px' }}>Status Manipulation</h3>
                    <div className="form-group">
                      <label className="form-label">Order Status</label>
                      <select 
                        className="form-select"
                        value={modalFields.status}
                        onChange={e => setModalFields({ ...modalFields, status: e.target.value })}
                      >
                        {ORDER_STATUS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Payment Status</label>
                      <select 
                        className="form-select"
                        value={modalFields.payment_status}
                        onChange={e => setModalFields({ ...modalFields, payment_status: e.target.value })}
                      >
                        {PAYMENT_STATUS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Tracking Code</label>
                      <input 
                        className="form-input"
                        value={modalFields.tracking_code}
                        onChange={e => setModalFields({ ...modalFields, tracking_code: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Right Column: Customer Details & Shipping */}
                  <div>
                    <h3 style={{ fontSize: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '12px' }}>Customer Profile</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', marginBottom: '16px', background: 'var(--bg-1)', padding: '12px', border: '1px solid var(--border)' }}>
                      <div><strong>Email:</strong> {activeOrder.email}</div>
                      <div><strong>Name:</strong> {activeOrder.user_name || 'Guest'}</div>
                      <div><strong>Phone:</strong> {activeOrder.user_phone || 'N/A'}</div>
                      <div><strong>Wallet Balance:</strong> {activeOrder.user_wallet_balance != null ? `Rs. ${Number(activeOrder.user_wallet_balance).toFixed(2)}` : 'N/A'}</div>
                    </div>

                    <h3 style={{ fontSize: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '12px' }}>Shipping Address</h3>
                    {(() => {
                      const shipping = getShippingDetails(activeOrder);
                      if (!shipping) return <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>No shipping details available</div>;
                      const coords = getCoordinates(shipping);
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', background: 'var(--bg-1)', padding: '12px', border: '1px solid var(--border)' }}>
                          <div><strong>Recipient:</strong> {shipping.fullName || 'N/A'}</div>
                          <div><strong>Phone:</strong> {shipping.phone || 'N/A'}</div>
                          <div><strong>Street Line:</strong> {shipping.addressLine || 'N/A'}</div>
                          <div><strong>City:</strong> {shipping.city || 'N/A'}</div>
                          <div><strong>District:</strong> {shipping.district || 'N/A'}</div>
                          <div><strong>Province:</strong> {shipping.province || 'N/A'}</div>
                          {coords && (
                            <>
                              <div><strong>Coords:</strong> Lat: {coords.lat}, Lng: {coords.lng}</div>
                              <div>
                                <strong>Google Maps:</strong>{' '}
                                <a 
                                  href={`https://maps.google.com/?q=${coords.lat},${coords.lng}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  style={{ color: 'var(--accent)', textDecoration: 'underline', fontWeight: 600 }}
                                >
                                  View on Map
                                </a>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                </div>

                {/* Bottom Row: Ordered Items */}
                <div>
                  <h3 style={{ fontSize: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '10px' }}>Items Ordered</h3>
                  <div className="table-responsive">
                    <table className="admin-table" style={{ fontSize: '13px' }}>
                      <thead>
                        <tr>
                          <th>Item Name</th>
                          <th style={{ textAlign: 'center' }}>Price</th>
                          <th style={{ textAlign: 'center' }}>Qty</th>
                          <th style={{ textAlign: 'right' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeOrder.items && activeOrder.items.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.name || `Product #${item.product_id}`}</td>
                            <td style={{ textAlign: 'center' }}>Rs. {Number(item.price).toFixed(2)}</td>
                            <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right' }}>Rs. {(Number(item.price) * item.quantity).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="admin-modal__footer mt-6 flex justify-between">
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setActiveOrder(null)}>Close</button>
                  <button type="button" className="btn btn-outline" onClick={() => handleCopyOrderDetails(activeOrder)}>
                    <i className="fa-light fa-sharp fa-copy" /> Copy Details
                  </button>
                </div>
                <button type="button" className="btn btn-primary" onClick={handleSaveModal}>
                  <i className="fa-light fa-sharp fa-floppy-disk" /> Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
