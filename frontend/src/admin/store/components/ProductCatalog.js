import React, { useState } from 'react';

export default function ProductCatalog({
  products,
  loading,
  onEdit,
  onDelete
}) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name_asc');

  if (loading) return <div className="spinner" />;

  // Dynamically extract unique categories
  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];

  // Filtering & Sorting logic
  const filteredAndSorted = products
    .filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                          (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
      const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
      
      let matchStock = true;
      if (stockFilter === 'in_stock') {
        matchStock = p.stock_quantity > 0;
      } else if (stockFilter === 'out_of_stock') {
        matchStock = p.stock_quantity <= 0;
      } else if (stockFilter === 'outsourced') {
        matchStock = p.stock_type === 'outsourced';
      }

      return matchSearch && matchCategory && matchStock;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') {
        return parseFloat(a.price) - parseFloat(b.price);
      } else if (sortBy === 'price_desc') {
        return parseFloat(b.price) - parseFloat(a.price);
      } else if (sortBy === 'stock_asc') {
        return a.stock_quantity - b.stock_quantity;
      } else if (sortBy === 'stock_desc') {
        return b.stock_quantity - a.stock_quantity;
      } else if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'name_desc') {
        return b.name.localeCompare(a.name);
      } else if (sortBy === 'id_desc') {
        return b.id - a.id;
      }
      return 0;
    });

  return (
    <div className="admin-products" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header and Controls */}
      <div className="admin-products__header" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <div>
            <h2 className="page-title" style={{ margin: 0 }}>Product Catalog</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-2)' }}>
              Showing {filteredAndSorted.length} of {products.length} products
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => onEdit('new')}>
            <i className="fa-light fa-sharp fa-plus" /> Add Product
          </button>
        </div>

        {/* Filter Controls Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)', width: '100%' }}>
          <div className="form-group mb-0">
            <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-3)' }}>Search</label>
            <input 
              className="form-input" 
              placeholder="Search by name or SKU..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          
          <div className="form-group mb-0">
            <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-3)' }}>Category</label>
            <select className="form-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'ALL CATEGORIES' : cat.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group mb-0">
            <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-3)' }}>Stock Status</label>
            <select className="form-select" value={stockFilter} onChange={e => setStockFilter(e.target.value)}>
              <option value="all">ALL STOCK STATES</option>
              <option value="in_stock">IN STOCK</option>
              <option value="out_of_stock">OUT OF STOCK</option>
              <option value="outsourced">OUTSOURCED</option>
            </select>
          </div>
          
          <div className="form-group mb-0">
            <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-3)' }}>Sort By</label>
            <select className="form-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="name_asc">Name: A to Z</option>
              <option value="name_desc">Name: Z to A</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="stock_asc">Stock: Low to High</option>
              <option value="stock_desc">Stock: High to Low</option>
              <option value="id_desc">Newest Added</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Product Cards */}
      {filteredAndSorted.length > 0 ? (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
          gap: 'var(--space-5)', 
          margin: 0,
          padding: 0
        }}>
          {filteredAndSorted.map(p => {
            const isOutOfStock = p.stock_quantity <= 0 && p.stock_type !== 'outsourced';
            const isOutsourced = p.stock_type === 'outsourced';

            return (
              <div 
                className="cms-section-card" 
                key={p.id}
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  background: 'var(--bg-1)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  border: '1px solid var(--border)',
                  transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
                }}
              >
                {/* Image Wrap */}
                <div style={{ 
                  position: 'relative', 
                  width: '100%', 
                  paddingBottom: '75%', // 4:3 Aspect Ratio
                  background: 'var(--bg-0)',
                  borderBottom: '1px solid var(--border)',
                  overflow: 'hidden'
                }}>
                  {p.image_url ? (
                    <img 
                      src={`http://localhost:5000${p.image_url}`} 
                      alt={p.name} 
                      style={{ 
                        position: 'absolute', 
                        inset: 0, 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover' 
                      }} 
                      onError={e => { e.target.src = '/placeholder.png'; }} 
                    />
                  ) : (
                    <div style={{ 
                      position: 'absolute', 
                      inset: 0, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      color: 'var(--text-3)' 
                    }}>
                      <i className="fa-light fa-sharp fa-image text-3xl" />
                    </div>
                  )}

                  {/* Stock Status Badge Overlay */}
                  <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 5 }}>
                    {isOutOfStock ? (
                      <span className="badge badge-danger" style={{ fontSize: '10px', padding: '2px 6px' }}>Out of Stock</span>
                    ) : isOutsourced ? (
                      <span className="badge badge-warning" style={{ fontSize: '10px', padding: '2px 6px', color: 'var(--bg-0)' }}>Outsourced</span>
                    ) : (
                      <span className="badge badge-success" style={{ fontSize: '10px', padding: '2px 6px' }}>{p.stock_quantity} In Stock</span>
                    )}
                  </div>
                </div>

                {/* Body Content */}
                <div style={{ padding: 'var(--space-4)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
                  <div>
                    {/* Category & SKU */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-3)', marginBottom: '4px' }}>
                      <span style={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>{p.category || 'Uncategorized'}</span>
                      <code style={{ fontFamily: 'var(--font-mono)' }}>{p.sku || 'NO-SKU'}</code>
                    </div>
                    {/* Product Name */}
                    <h3 style={{ 
                      fontSize: '14px', 
                      fontWeight: 600, 
                      color: 'var(--text-0)', 
                      margin: 0, 
                      lineHeight: '1.4',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      height: '38px'
                    }} title={p.name}>
                      {p.name}
                    </h3>
                  </div>

                  <div>
                    {/* Price Tag */}
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                      Rs. {Number(p.price).toLocaleString('en-NP')}
                    </div>

                    {/* Actions row */}
                    <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
                      <button 
                        className="btn btn-outline btn-sm" 
                        onClick={() => onEdit(p)}
                        style={{ flex: 1, padding: '4px 0' }}
                      >
                        <i className="fa-light fa-sharp fa-pen-to-square" /> Edit
                      </button>
                      <button 
                        className="btn btn-danger btn-sm" 
                        onClick={() => onDelete(p.id)}
                        style={{ flex: 1, padding: '4px 0' }}
                      >
                        <i className="fa-light fa-sharp fa-trash" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <i className="fa-light fa-sharp fa-box-open empty-state-icon" />
          <p>No products match your filters.</p>
        </div>
      )}
    </div>
  );
}
