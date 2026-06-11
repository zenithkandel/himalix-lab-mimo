import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { id, name, sku, price, stock_quantity, image_url, category, description, stock_type, outsource_days } = product;

  const getLowStockThreshold = () => {
    try {
      const stored = localStorage.getItem('himalix_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed.lowStockThreshold === 'number') return parsed.lowStockThreshold;
        if (parsed && typeof parsed.lowStockThreshold === 'string') return parseInt(parsed.lowStockThreshold, 10) || 5;
      }
    } catch (e) {}
    return 5;
  };
  const threshold = getLowStockThreshold();

  const stockStatus =
    stock_type === 'outsourced'
      ? { label: `Outsourced (ETA: +${outsource_days || 0} days)`, className: 'badge-neutral', icon: 'fa-light fa-circle-notch' }
      : stock_quantity === 0
        ? { label: 'Available (On-Demand)', className: 'badge-info', icon: 'fa-light fa-circle-notch' }
        : stock_quantity <= threshold
          ? { label: 'Low Stock', className: 'badge-warning', icon: 'fa-circle-exclamation' }
          : { label: 'In Stock', className: 'badge-success', icon: 'fa-circle-check' };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product.id, 1);
  };

  return (
    <div className="product-card">
      <Link to={`/store/product/${id}`} className="product-card-link">
        <div className="product-card-image">
          {image_url ? (
            <img src={image_url} alt={name} loading="lazy" />
          ) : (
            <div className="product-card-placeholder">No Image</div>
          )}
        </div>

        <div className="product-card-body">
          {category && <span className="product-card-category">{category}</span>}
          <h3 className="product-card-name">{name}</h3>
          <p className="product-card-sku">{sku}</p>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <span className={`badge ${stockStatus.className}`} style={{ marginBottom: 0 }}>
              <i className={`fa-sharp-duotone fa-light ${stockStatus.icon}`}></i>
              {stockStatus.label}
            </span>
          </div>

          {description && (
            <p className="product-card-description">
              {description.length > 80 ? description.substring(0, 80) + '...' : description}
            </p>
          )}

          <p className="product-card-price">रु {Number(price).toFixed(2)}</p>
        </div>
      </Link>

      <button
        className="btn btn-primary product-card-btn"
        onClick={handleAddToCart}
      >
        <i className="fa-sharp-duotone fa-light fa-cart-plus"></i>
        {stock_quantity === 0 ? 'Pre-Order' : 'Add to Cart'}
      </button>
    </div>
  );
}
