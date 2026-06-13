import React, { useState, useEffect, useMemo, useCallback } from 'react';
import StoreNavbar from './Navbar';
import ProductCard from './ProductCard';
import StoreFooter from './Footer';

const SORT_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
  { value: 'name_asc', label: 'Name A-Z' },
];

const CATEGORY_ICONS = {
  'Microcontrollers': 'fa-microchip',
  'Sensors': 'fa-satellite-dish',
  'Motors': 'fa-gear',
  'Raspberry Pi': 'fa-desktop',
  'Displays': 'fa-tv',
  'Power': 'fa-bolt',
  'Tools': 'fa-screwdriver-wrench',
  'default': 'fa-cube',
};

const STOCK_OPTIONS = [
  { value: 'all', label: 'All Stock' },
  { value: 'in', label: 'In Stock' },
  { value: 'low', label: 'Low Stock' },
  { value: 'out', label: 'Out of Stock' },
];

const PRICE_RANGES = [
  { value: 'all', label: 'Any Price' },
  { value: '0-500', label: 'Under Rs. 500' },
  { value: '500-1000', label: 'Rs. 500 - 1,000' },
  { value: '1000-5000', label: 'Rs. 1,000 - 5,000' },
  { value: '5000+', label: 'Over Rs. 5,000' },
];

export default function Storefront() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [activeCategory, setCategory] = useState('all');
  const [sort, setSort] = useState('default');
  const [stockFilter, setStockFilter] = useState('all');
  const [priceRange, setPriceRange] = useState('all');

  useEffect(() => {
    fetch('/api/store/products')
      .then(r => r.json())
      .then(data => {
        const prods = data.products || [];
        setProducts(prods);
      })
      .catch(() => setError('Failed to load products.'))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category).filter(Boolean))];
    return cats.sort();
  }, [products]);

  const categoryCounts = useMemo(() => {
    const counts = {};
    products.forEach(p => {
      if (p.category) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  const featuredProducts = useMemo(() => {
    return products
      .filter(p => p.stock_quantity > 0)
      .sort((a, b) => (b.is_new ? 1 : 0) - (a.is_new ? 1 : 0))
      .slice(0, 10);
  }, [products]);

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

    if (stockFilter !== 'all') {
      list = list.filter(p => {
        const qty = p.stock_quantity || 0;
        switch (stockFilter) {
          case 'in': return qty > 5;
          case 'low': return qty > 0 && qty <= 5;
          case 'out': return qty <= 0;
          default: return true;
        }
      });
    }

    if (priceRange !== 'all') {
      list = list.filter(p => {
        const price = p.price || 0;
        switch (priceRange) {
          case '0-500': return price < 500;
          case '500-1000': return price >= 500 && price <= 1000;
          case '1000-5000': return price > 1000 && price <= 5000;
          case '5000+': return price > 5000;
          default: return true;
        }
      });
    }

    switch (sort) {
      case 'price_asc': list.sort((a, b) => a.price - b.price); break;
      case 'price_desc': list.sort((a, b) => b.price - a.price); break;
      case 'newest': list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); break;
      case 'name_asc': list.sort((a, b) => a.name.localeCompare(b.name)); break;
      default: break;
    }

    return list;
  }, [products, activeCategory, search, sort, stockFilter, priceRange]);

  const clearAllFilters = useCallback(() => {
    setSearch('');
    setCategory('all');
    setSort('default');
    setStockFilter('all');
    setPriceRange('all');
  }, []);

  const hasActiveFilters = search || activeCategory !== 'all' || sort !== 'default' || stockFilter !== 'all' || priceRange !== 'all';

  return (
    <div className="store-page">
      <StoreNavbar />

      {/* Hero Header */}
      <section className="store-hero">
        <div className="store-hero__inner">
          <div className="store-hero__content">
            <div className="store-hero__eyebrow">
              <i className="fa-light fa-sharp fa-store" /> Himalix Store
            </div>
            <h1 className="store-hero__title">Electronics & Components</h1>
            <p className="store-hero__subtitle">Quality components delivered across Nepal</p>
          </div>

          {/* Search */}
          <div className="store-hero__search" role="search">
            <span className="store-hero__search-icon" aria-hidden="true">
              <i className="fa-light fa-sharp fa-magnifying-glass" />
            </span>
            <input
              className="store-hero__search-input"
              type="search"
              placeholder={`Search ${products.length > 0 ? products.length + '+' : ''} products...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search products"
            />
            {search && (
              <button
                className="store-hero__search-clear"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <i className="fa-light fa-sharp fa-xmark" />
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="store-hero__categories" role="group" aria-label="Category quick filters">
            <button
              className={`store-hero__cat-chip${activeCategory === 'all' ? ' store-hero__cat-chip--active' : ''}`}
              onClick={() => setCategory('all')}
            >
              <i className="fa-light fa-sharp fa-grid-2" />
              <span>All</span>
              <span className="store-hero__cat-count">{products.length}</span>
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                className={`store-hero__cat-chip${activeCategory === cat ? ' store-hero__cat-chip--active' : ''}`}
                onClick={() => setCategory(cat)}
              >
                <i className={`fa-light fa-sharp ${CATEGORY_ICONS[cat] || CATEGORY_ICONS.default}`} />
                <span>{cat}</span>
                <span className="store-hero__cat-count">{categoryCounts[cat] || 0}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {!loading && featuredProducts.length > 0 && !hasActiveFilters && (
        <section className="store-featured">
          <div className="store-featured__inner">
            <div className="store-featured__header">
              <h2 className="store-featured__title">Featured Products</h2>
              <span className="store-featured__subtitle">Handpicked for you</span>
            </div>
            <div className="store-featured__scroll">
              {featuredProducts.map(product => (
                <div key={product.id} className="store-featured__item">
                  <ProductCard product={product} featured />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sort / Filter Row */}
      <div className="store-toolbar">
        <div className="store-toolbar__inner">
          <div className="store-toolbar__left">
            <span className="store-toolbar__count">
              {filtered.length} {filtered.length === 1 ? 'product' : 'products'}
            </span>
          </div>
          <div className="store-toolbar__right">
            <select
              className="store-toolbar__select"
              value={stockFilter}
              onChange={e => setStockFilter(e.target.value)}
              aria-label="Filter by stock"
            >
              {STOCK_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              className="store-toolbar__select"
              value={priceRange}
              onChange={e => setPriceRange(e.target.value)}
              aria-label="Filter by price"
            >
              {PRICE_RANGES.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              className="store-toolbar__select"
              value={sort}
              onChange={e => setSort(e.target.value)}
              aria-label="Sort products"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="store-active-filters">
          <div className="store-active-filters__inner">
            <div className="store-active-filters__tags">
              {search && (
                <span className="store-active-filters__tag">
                  Search: "{search}"
                  <button onClick={() => setSearch('')} aria-label="Remove search filter">
                    <i className="fa-light fa-xmark" />
                  </button>
                </span>
              )}
              {activeCategory !== 'all' && (
                <span className="store-active-filters__tag">
                  {activeCategory}
                  <button onClick={() => setCategory('all')} aria-label="Remove category filter">
                    <i className="fa-light fa-xmark" />
                  </button>
                </span>
              )}
              {stockFilter !== 'all' && (
                <span className="store-active-filters__tag">
                  {STOCK_OPTIONS.find(o => o.value === stockFilter)?.label}
                  <button onClick={() => setStockFilter('all')} aria-label="Remove stock filter">
                    <i className="fa-light fa-xmark" />
                  </button>
                </span>
              )}
              {priceRange !== 'all' && (
                <span className="store-active-filters__tag">
                  {PRICE_RANGES.find(o => o.value === priceRange)?.label}
                  <button onClick={() => setPriceRange('all')} aria-label="Remove price filter">
                    <i className="fa-light fa-xmark" />
                  </button>
                </span>
              )}
            </div>
            <button className="store-active-filters__clear" onClick={clearAllFilters}>
              <i className="fa-light fa-xmark" /> Clear all
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="store-content">
        {loading && (
          <div className="product-grid" aria-label="Loading products">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-card__img" />
                <div className="skeleton-card__body">
                  <div className="skeleton-card__line skeleton-card__line--short" />
                  <div className="skeleton-card__line skeleton-card__line--medium" />
                  <div className="skeleton-card__line skeleton-card__line--long" />
                  <div className="skeleton-card__footer">
                    <div className="skeleton-card__line skeleton-card__line--price" />
                    <div className="skeleton-card__line skeleton-card__line--btn" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="store-error">
            <div className="store-error__icon">
              <i className="fa-light fa-sharp fa-circle-exclamation" />
            </div>
            <p className="store-error__text">{error}</p>
            <button className="btn btn-outline" onClick={() => window.location.reload()}>
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="store-empty">
            <div className="store-empty__icon">
              <i className="fa-light fa-sharp fa-box-open" />
            </div>
            <h3 className="store-empty__title">No products found</h3>
            <p className="store-empty__text">
              {search
                ? `No products match "${search}"`
                : 'No products match your current filters'}
            </p>
            <button className="btn btn-primary" onClick={clearAllFilters}>
              <i className="fa-light fa-xmark" /> Clear Filters
            </button>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="product-grid">
            {filtered.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <StoreFooter />
    </div>
  );
}
