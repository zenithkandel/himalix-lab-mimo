import React, { useState, useEffect, useMemo } from 'react';
import StoreNavbar from './Navbar';
import ProductCard from './ProductCard';

const SORT_OPTIONS = [
  { value: 'default',   label: 'Default' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc',label: 'Price: High to Low' },
  { value: 'newest',    label: 'Newest First' },
  { value: 'name_asc',  label: 'Name A–Z' },
];

export default function Storefront() {
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  const [search, setSearch]         = useState('');
  const [activeCategory, setCategory] = useState('all');
  const [sort, setSort]             = useState('default');

  useEffect(() => {
    fetch('/api/store/products')
      .then(r => r.json())
      .then(data => {
        const prods = data.products || [];
        setProducts(prods);
        const cats = [...new Set(prods.map(p => p.category).filter(Boolean))];
        setCategories(cats);
      })
      .catch(() => setError('Failed to load products.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = [...products];

    if (activeCategory !== 'all') {
      list = list.filter(p => p.category === activeCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
      );
    }

    switch (sort) {
      case 'price_asc':  list.sort((a, b) => a.price - b.price); break;
      case 'price_desc': list.sort((a, b) => b.price - a.price); break;
      case 'newest':     list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); break;
      case 'name_asc':   list.sort((a, b) => a.name.localeCompare(b.name)); break;
      default: break;
    }

    return list;
  }, [products, activeCategory, search, sort]);

  return (
    <div className="store-page">
      <StoreNavbar />

      {/* Banner */}
      <div className="store-banner">
        <div className="store-banner__inner">
          <div className="store-banner__eyebrow">
            <i className="fa-light fa-sharp fa-store" /> Himalix Store
          </div>
          <h1 className="store-banner__title">Electronics & Tech</h1>
          <p className="store-banner__subtitle">Quality components and gadgets, delivered across Nepal</p>
        </div>
      </div>

      {/* Controls */}
      <div className="store-controls">
        <div className="store-controls__inner">
          {/* Search */}
          <div className="store-search" role="search">
            <span className="store-search__icon" aria-hidden="true">
              <i className="fa-light fa-sharp fa-magnifying-glass" />
            </span>
            <input
              className="store-search__input"
              type="search"
              placeholder="Search products…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search products"
            />
          </div>

          {/* Categories */}
          <div className="store-filter-group" role="group" aria-label="Category filter">
            <button
              className={`store-filter-btn${activeCategory === 'all' ? ' store-filter-btn--active' : ''}`}
              onClick={() => setCategory('all')}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                className={`store-filter-btn${activeCategory === cat ? ' store-filter-btn--active' : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="store-sort">
            <label htmlFor="store-sort-select">Sort:</label>
            <select
              id="store-sort-select"
              value={sort}
              onChange={e => setSort(e.target.value)}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="store-layout">
        {loading && (
          <div className="loading-page">
            <div className="spinner" role="status" aria-label="Loading products" />
          </div>
        )}

        {error && (
          <div className="alert alert-danger" style={{ margin: '32px 0' }}>
            <i className="fa-light fa-sharp fa-circle-exclamation" /> {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <i className="fa-light fa-sharp fa-box-open" />
            </div>
            <p>No products found{search ? ` for "${search}"` : ''}.</p>
            {search && (
              <button className="btn btn-outline" onClick={() => setSearch('')}>
                Clear search
              </button>
            )}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)', marginBottom: 'var(--space-4)' }}>
              {filtered.length} {filtered.length === 1 ? 'product' : 'products'} found
            </p>
            <div className="product-grid">
              {filtered.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
