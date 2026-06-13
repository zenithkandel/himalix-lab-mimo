import React, { useState, useEffect } from 'react';

export default function ReviewManager({ reviews, authFetch, onLoad }) {
  const [search, setSearch] = useState('');
  const [deleteModal, setDeleteModal] = useState(null); // holds review object
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setDeleteModal(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filtered = reviews.filter(r => 
    r.comment?.toLowerCase().includes(search.toLowerCase()) ||
    r.product_name.toLowerCase().includes(search.toLowerCase()) ||
    r.product_sku.toLowerCase().includes(search.toLowerCase()) ||
    r.user_email.toLowerCase().includes(search.toLowerCase())
  );

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <i 
          key={i} 
          className={`fa-sharp fa-star ${i <= rating ? 'fa-solid' : 'fa-light'}`} 
          style={{ color: i <= rating ? 'var(--accent)' : 'var(--text-3)', marginRight: 2 }} 
        />
      );
    }
    return stars;
  };

  const handleDeleteReview = async () => {
    if (!deleteModal) return;
    setLoading(true);
    try {
      const res = await authFetch(`/api/store/admin/reviews/${deleteModal.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete review');
      setDeleteModal(null);
      onLoad();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-reviews">
      <div className="flex justify-between items-center mb-6">
        <h2 className="page-title">Product Reviews ({reviews.length})</h2>
        <div className="form-group mb-0" style={{ maxWidth: 300, flex: 1 }}>
          <input 
            className="form-input" 
            placeholder="Search comment, product or user..." 
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
              <th>Product Info</th>
              <th>Customer</th>
              <th>Rating</th>
              <th>Comment</th>
              <th>Review Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id}>
                <td>#{r.id}</td>
                <td>
                  <div>
                    <span className="font-semibold" style={{ display: 'block' }}>{r.product_name}</span>
                    <code style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)' }}>{r.product_sku}</code>
                  </div>
                </td>
                <td>{r.user_email}</td>
                <td>
                  <div className="flex" title={`${r.rating} / 5 stars`}>
                    {renderStars(r.rating)}
                  </div>
                </td>
                <td>
                  <p className="admin-review-comment" style={{ maxWidth: 350, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.comment}>
                    {r.comment || <em style={{ color: 'var(--text-3)' }}>No comment left</em>}
                  </p>
                </td>
                <td>{new Date(r.created_at).toLocaleDateString()}</td>
                <td>
                  <div className="flex justify-end">
                    <button 
                      className="btn btn-danger btn-sm" 
                      onClick={() => setDeleteModal(r)}
                      title="Delete Review"
                    >
                      <i className="fa-light fa-sharp fa-trash" /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-3)' }}>
                  No reviews match your search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Review Confirmation Modal */}
      {deleteModal && (
        <div className="admin-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setDeleteModal(null); }}>
          <div className="admin-modal">
            <div className="admin-modal__content" style={{ maxWidth: 450 }}>
              <div className="admin-modal__header">
                <h2 className="page-title" style={{ color: 'var(--danger)' }}>Confirm Deletion</h2>
                <button type="button" className="btn btn-ghost" onClick={() => setDeleteModal(null)}>
                  <i className="fa-light fa-sharp fa-xmark" />
                </button>
              </div>
              <div className="admin-modal__body">
                <p className="mb-4">
                  Are you sure you want to permanently delete this product review? This action cannot be undone.
                </p>
                <div 
                  style={{ 
                    background: 'rgba(255,255,255,0.05)', 
                    borderLeft: '3px solid var(--accent)', 
                    padding: 'var(--space-3)', 
                    marginBottom: 'var(--space-4)',
                    fontSize: 'var(--text-sm)'
                  }}
                >
                  <strong>Customer:</strong> {deleteModal.user_email}<br/>
                  <strong>Product:</strong> {deleteModal.product_name}<br/>
                  <strong>Rating:</strong> {deleteModal.rating} / 5<br/>
                  <strong>Comment:</strong> "{deleteModal.comment || 'N/A'}"
                </div>
                <div className="admin-modal__footer flex justify-between mt-6">
                  <button type="button" className="btn btn-outline" onClick={() => setDeleteModal(null)}>Cancel</button>
                  <button type="button" className="btn btn-danger" onClick={handleDeleteReview} disabled={loading}>
                    {loading ? 'Deleting...' : 'Delete Permanently'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
