import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from './CartContext';
import { useAuth } from '../auth/AuthContext';

export default function ProductCard({ product, featured = false }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const {
    id, name, price, original_price,
    image_url, category, is_new, stock_quantity = 0,
    avg_rating, review_count
  } = product;

  const isOutOfStock = stock_quantity <= 0;
  const isLowStock = stock_quantity > 0 && stock_quantity <= 5;
  const hasDiscount = original_price && original_price > price;

  const formatPrice = (n) =>
    `Rs. ${Number(n).toLocaleString('en-NP')}`;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    if (!user) { navigate('/signin'); return; }
    addToCart(product, 1);
  };

  const renderStars = () => {
    const rating = avg_rating || 0;
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <i
          key={i}
          className={`fa-${i <= Math.round(rating) ? 'solid' : 'regular'} fa-star`}
          style={{ color: i <= Math.round(rating) ? 'var(--accent)' : 'var(--text-3)', fontSize: '10px' }}
        />
      );
    }
    return stars;
  };

  const getStockStatus = () => {
    if (isOutOfStock) return { class: 'out', text: 'Out of Stock', icon: 'fa-xmark-circle' };
    if (isLowStock) return { class: 'low', text: `Only ${stock_quantity} left`, icon: 'fa-exclamation-circle' };
    return { class: 'in', text: 'In Stock', icon: 'fa-check-circle' };
  };

  const stockStatus = getStockStatus();

  return (
    <article
      className={`product-card${featured ? ' product-card--featured' : ''}`}
      onClick={() => navigate(`/store/product/${id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/store/product/${id}`)}
      aria-label={`View ${name}`}
    >
      {/* Badges */}
      <div className="product-card__badges">
        {is_new && !isOutOfStock && (
          <span className="product-card__badge product-card__badge--new">New</span>
        )}
        {hasDiscount && !isOutOfStock && (
          <span className="product-card__badge product-card__badge--sale">
            {Math.round(((original_price - price) / original_price) * 100)}% OFF
          </span>
        )}
      </div>

      {/* Image */}
      <div className="product-card__image-wrap">
        <img
          className="product-card__image"
          src={image_url || '/placeholder.png'}
          alt={name}
          loading="lazy"
          onError={e => { e.target.src = '/placeholder.png'; }}
        />
        <div className="product-card__image-overlay">
          <span className="product-card__view-btn">
            <i className="fa-light fa-sharp fa-arrow-right" />
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="product-card__body">
        {category && (
          <span className="product-card__category">{category}</span>
        )}
        <h3 className="product-card__name">{name}</h3>

        {/* Rating */}
        <div className="product-card__rating">
          <div className="product-card__stars">{renderStars()}</div>
          {review_count > 0 && (
            <span className="product-card__review-count">({review_count})</span>
          )}
        </div>

        {/* Stock Status */}
        <div className={`product-card__stock product-card__stock--${stockStatus.class}`}>
          <i className={`fa-light fa-sharp ${stockStatus.icon}`} />
          {stockStatus.text}
        </div>
      </div>

      {/* Footer */}
      <div className="product-card__footer">
        <div className="product-card__price-group">
          <span className={`product-card__price${hasDiscount ? ' product-card__price--sale' : ''}`}>
            {formatPrice(price)}
          </span>
          {hasDiscount && (
            <span className="product-card__price-original">
              {formatPrice(original_price)}
            </span>
          )}
        </div>

        <button
          className={`product-card__add-btn${isOutOfStock ? ' product-card__add-btn--disabled' : ''}`}
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          aria-label={isOutOfStock ? 'Out of stock' : `Add ${name} to cart`}
          title={isOutOfStock ? 'Out of stock' : 'Add to cart'}
        >
          <i className={`fa-light fa-sharp fa-${isOutOfStock ? 'ban' : 'plus'}`} />
          <span>{isOutOfStock ? 'Unavailable' : 'Add to Cart'}</span>
        </button>
      </div>
    </article>
  );
}
