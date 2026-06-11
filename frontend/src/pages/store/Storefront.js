import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import ProductCard from '../../components/store/ProductCard';

const CATEGORIES = ['All', 'Microcontrollers', 'Sensors', 'ICs', 'Modules', 'Development Boards', 'Components'];

const CATEGORY_ICONS = {
  'All': 'fa-grid-horizontal',
  'Microcontrollers': 'fa-microchip',
  'Sensors': 'fa-gauge-high',
  'ICs': 'fa-memory',
  'Modules': 'fa-puzzle-piece',
  'Development Boards': 'fa-laptop-code',
  'Components': 'fa-plug',
};

const STOCK_FILTERS = [
  { value: '', label: 'All', icon: 'fa-list' },
  { value: 'in_stock', label: 'In Stock', icon: 'fa-circle-check' },
  { value: 'low_stock', label: 'Low Stock', icon: 'fa-circle-exclamation' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price Low–High' },
  { value: 'price_desc', label: 'Price High–Low' },
];

export default function Storefront() {
  const { user, token, systemConfig } = useAuth();
  const { addToCart } = useCart();

  const [products, setProducts] = useState([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [bannerText, setBannerText] = useState('');

  useEffect(() => {
    if (systemConfig) {
      setMaintenanceMode(!!systemConfig.maintenanceMode);
      setBannerText(systemConfig.storeBannerText || '');
    }
  }, [systemConfig]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOption, setSortOption] = useState('newest');
  const [stockFilter, setStockFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const debounceTimer = useRef(null);

  // Debounce search input
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(debounceTimer.current);
  }, [searchQuery]);

  // Fetch products when filters change
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (selectedCategory !== 'All') params.set('category', selectedCategory);
      params.set('sort', sortOption);
      params.set('page', page);
      params.set('limit', '12');

      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`/api/store/products?${params.toString()}`, { headers });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch products');
      }

      let filtered = data.products || [];

      const threshold = systemConfig?.lowStockThreshold !== undefined ? systemConfig.lowStockThreshold : 5;

      if (stockFilter === 'in_stock') {
        filtered = filtered.filter((p) => p.stock_quantity > threshold);
      } else if (stockFilter === 'low_stock') {
        filtered = filtered.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= threshold);
      }

      setProducts(filtered);
      setTotalPages(data.totalPages || 1);
      setTotalProducts(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedCategory, sortOption, page, stockFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setPage(1);
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
    setPage(1);
  };

  const handleStockFilterChange = (value) => {
    setStockFilter(value);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
      buttons.push(
        <button
          key={1}
          className="pagination-btn"
          onClick={() => handlePageChange(1)}
        >
          1
        </button>
      );
      if (start > 2) {
        buttons.push(
          <span key="dots-start" className="pagination-btn" style={{ cursor: 'default', border: 'none' }}>
            ...
          </span>
        );
      }
    }

    for (let i = start; i <= end; i++) {
      buttons.push(
        <button
          key={i}
          className={`pagination-btn ${i === page ? 'active' : ''}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }

    if (end < totalPages) {
      if (end < totalPages - 1) {
        buttons.push(
          <span key="dots-end" className="pagination-btn" style={{ cursor: 'default', border: 'none' }}>
            ...
          </span>
        );
      }
      buttons.push(
        <button
          key={totalPages}
          className="pagination-btn"
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </button>
      );
    }

    return buttons;
  };

  if (maintenanceMode && user?.role !== 'admin') {
    return (
      <div className="container" style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ fontSize: '4.5rem', marginBottom: '24px' }}>🚧</div>
        <h1 style={{ fontWeight: 800, fontSize: '2.5rem', marginBottom: '16px', letterSpacing: '-0.02em' }}>Store Under Maintenance</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', fontSize: '1rem', marginBottom: '32px', lineHeight: '1.6' }}>
          We are currently updating our systems to improve your shopping experience. Normal storefront features are temporarily paused.
        </p>
        <div style={{ padding: '12px 24px', backgroundColor: '#f1f5f9', border: '1px solid var(--border)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
          HIMALIX OFFICIAL SYSTEM MANAGEMENT PORTAL
        </div>
      </div>
    );
  }

  return (
    <div className="container store-layout">
      <aside className="filter-panel">
        <div className="filter-section">
          <h4 className="filter-title">Category</h4>
          {CATEGORIES.map((cat) => (
            <div
              key={cat}
              className={`filter-option ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => handleCategoryChange(cat)}
            >
              <span className="filter-checkbox" />
              <i className={`fa-sharp-duotone fa-light ${CATEGORY_ICONS[cat] || 'fa-folder'}`} style={{ marginRight: '6px' }}></i>
              <span>{cat}</span>
            </div>
          ))}
        </div>

        <div className="filter-section">
          <h4 className="filter-title">Sort By</h4>
          <select
            className="form-select"
            value={sortOption}
            onChange={handleSortChange}
            style={{ width: '100%' }}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-section">
          <h4 className="filter-title">Stock Status</h4>
          {STOCK_FILTERS.map((sf) => (
            <div
              key={sf.value}
              className={`filter-option ${stockFilter === sf.value ? 'active' : ''}`}
              onClick={() => handleStockFilterChange(sf.value)}
            >
              <span className="filter-checkbox" />
              <i className={`fa-sharp-duotone fa-light ${sf.icon}`} style={{ marginRight: '6px' }}></i>
              <span>{sf.label}</span>
            </div>
          ))}
        </div>

        <button
          className="filter-clear"
          onClick={() => {
            setSearchQuery('');
            setSelectedCategory('All');
            setSortOption('newest');
            setStockFilter('');
            setPage(1);
          }}
        >
          <i className="fa-sharp-duotone fa-light fa-filter-slash" style={{ marginRight: '6px' }}></i>
          Clear All Filters
        </button>
      </aside>

      <main className="store-main">
        <div className="container" style={{ padding: 0 }}>
          {bannerText && (
            <div className="storefront-announcement-banner" style={{ backgroundColor: 'var(--accent)', color: '#ffffff', padding: '12px 20px', marginBottom: '24px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fa-sharp-duotone fa-light fa-bullhorn" style={{ color: '#fff' }}></i>
              <span>{bannerText}</span>
            </div>
          )}



          <div className="search-bar">
            <i className="fa-sharp-duotone fa-light fa-magnifying-glass search-bar-icon"></i>
            <input
              className="form-input search-input"
              type="text"
              placeholder="Search components, modules, sensors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="product-grid-header">
            <span className="product-count">
              {totalProducts} product{totalProducts !== 1 ? 's' : ''} found
            </span>
          </div>

          {loading ? (
            <div className="loading-spinner">
              <div className="spinner" />
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <i className="fa-sharp-duotone fa-light fa-magnifying-glass-minus"></i>
              </div>
              <h3>No products found</h3>
              <p>Try adjusting your search or filter criteria.</p>
              <button
                className="btn btn-outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setSortOption('newest');
                  setStockFilter('');
                  setPage(1);
                }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <>
              <div className="product-grid">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    disabled={page === 1}
                    onClick={() => handlePageChange(page - 1)}
                  >
                    <i className="fa-sharp-duotone fa-light fa-arrow-left"></i>
                  </button>
                  {renderPaginationButtons()}
                  <button
                    className="pagination-btn"
                    disabled={page === totalPages}
                    onClick={() => handlePageChange(page + 1)}
                  >
                    <i className="fa-sharp-duotone fa-light fa-arrow-right"></i>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
