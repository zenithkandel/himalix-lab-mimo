import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const {
    id, name, description, price, original_price,
    image_url, category, is_new, stock_quantity = 0
  } = product;

  const isOutOfStock  = stock_quantity <= 0;
  const isLowStock    = stock_quantity > 0 && stock_quantity <= 5;
  const hasDiscount   = original_price && original_price > price;

  const formatPrice = (n) =>
    `Rs. ${Number(n).toLocaleString('en-NP')}`;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    if (!user) { navigate('/signin'); return; }
    addToCart(product, 1);
  };

  return (
    <article
      className="product-card"
      onClick={() => navigate(`/store/product/${id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/store/product/${id}`)}
      aria-label={`View ${name}`}
    >
      {/* Badges */}
      <div className="product-card__badge">
        {is_new && !isOutOfStock && (
          <div className="product-card__badge-item product-card__badge-new">New</div>
        )}
        {isOutOfStock && (
          <div className="product-card__badge-item product-card__badge-out">Out of Stock</div>
        )}
        {hasDiscount && !isOutOfStock && (
          <div className="product-card__badge-item product-card__badge-sale">
            {Math.round(((original_price - price) / original_price) * 100)}% OFF
          </div>
        )}
      </div>

      {/* Image */}
      <div className="product-card__img-wrap">
        <img
          className="product-card__img"
          src={image_url || '/placeholder.png'}
          alt={name}
          loading="lazy"
          onError={e => { e.target.src = '/placeholder.png'; }}
        />
      </div>

      {/* Body */}
      <div className="product-card__body">
        {category && (
          <span className="product-card__category">{category}</span>
        )}
        <h3 className="product-card__name">{name}</h3>
        {description && (
          <p className="product-card__desc">{description}</p>
        )}
        {isLowStock && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="fa-light fa-sharp fa-circle-exclamation" />
            Only {stock_quantity} left
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="product-card__footer">
        <div className="product-card__price-wrap">
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
          className={`product-card__add-btn${isOutOfStock ? ' product-card__add-btn--out' : ''}`}
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          aria-label={isOutOfStock ? 'Out of stock' : `Add ${name} to cart`}
          title={isOutOfStock ? 'Out of stock' : 'Add to cart'}
        >
          <i className={`fa-light fa-sharp fa-${isOutOfStock ? 'ban' : 'plus'}`} />
        </button>
      </div>
    </article>
  );
}
