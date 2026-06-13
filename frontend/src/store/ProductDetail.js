import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import StoreNavbar from './Navbar';
import { useCart } from './CartContext';
import { useAuth } from '../auth/AuthContext';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user, authFetch } = useAuth();

  const [product, setProduct]   = useState(null);
  const [reviews, setReviews]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setTab]     = useState('description');
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty]           = useState(1);
  const [addedMsg, setAddedMsg] = useState('');

  /* Review form */
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/store/products/${id}`).then(r => r.json()),
      fetch(`/api/store/reviews/${id}`).then(r => r.json()),
    ])
      .then(([prodData, reviewData]) => {
        if (!prodData.product) { navigate('/store'); return; }
        setProduct(prodData.product);
        setReviews(reviewData.reviews || []);
      })
      .catch(() => navigate('/store'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleAddToCart = () => {
    if (!user) { navigate('/signin'); return; }
    addToCart(product, qty);
    setAddedMsg('Added to cart!');
    setTimeout(() => setAddedMsg(''), 2500);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/signin'); return; }
    setReviewLoading(true);
    setReviewError('');
    try {
      const res = await authFetch(`/api/store/reviews/${id}`, {
        method: 'POST',
        body: JSON.stringify(reviewForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit review');
      setReviewSuccess(true);
      setReviews(prev => [data.review, ...prev]);
      setReviewForm({ rating: 5, comment: '' });
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setReviewLoading(false);
    }
  };

  const formatPrice = (n) => `Rs. ${Number(n).toLocaleString('en-NP')}`;

  if (loading) {
    return (
      <div className="store-page">
        <StoreNavbar />
        <div className="loading-page"><div className="spinner" /></div>
      </div>
    );
  }

  if (!product) return null;

  let images = [];
  if (product.image_urls) {
    try {
      const parsed = typeof product.image_urls === 'string' ? JSON.parse(product.image_urls) : product.image_urls;
      if (Array.isArray(parsed) && parsed.length > 0) {
        images = parsed.map(url => ({ url }));
      }
    } catch (e) {
      console.error("Error parsing product.image_urls", e);
    }
  }
  if (images.length === 0) {
    images = [{ url: product.image_url || '/placeholder.png' }];
  }

  const isOutOfStock = (product.stock_quantity || 0) <= 0;
  const hasDiscount  = product.original_price && product.original_price > product.price;
  const avgRating    = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="store-page">
      <StoreNavbar />

      <div className="product-detail">
        {/* Breadcrumb */}
        <nav className="product-detail__breadcrumb" aria-label="Breadcrumb">
          <Link to="/store">Store</Link>
          <i className="fa-light fa-sharp fa-chevron-right" />
          {product.category && (
            <>
              <span>{product.category}</span>
              <i className="fa-light fa-sharp fa-chevron-right" />
            </>
          )}
          <span style={{ color: 'var(--text-0)' }}>{product.name}</span>
        </nav>

        {/* Main grid */}
        <div className="product-detail__grid">
          {/* Gallery */}
          <div className="product-detail__gallery">
            <div className="product-detail__main-img">
              <img
                src={images[activeImg]?.url || '/placeholder.png'}
                alt={product.name}
                onError={e => { e.target.src = '/placeholder.png'; }}
              />
            </div>
            {images.length > 1 && (
              <div className="product-detail__thumbs">
                {images.map((img, i) => (
                  <div
                    key={i}
                    className={`product-detail__thumb${i === activeImg ? ' product-detail__thumb--active' : ''}`}
                    onClick={() => setActiveImg(i)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setActiveImg(i)}
                    aria-label={`Image ${i + 1}`}
                  >
                    <img src={img.url} alt={`${product.name} ${i + 1}`} onError={e => { e.target.src = '/placeholder.png'; }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="product-detail__info">
            {product.category && (
              <div className="product-detail__category">{product.category}</div>
            )}
            <h1 className="product-detail__name">{product.name}</h1>

            {avgRating && (
              <div className="product-detail__rating">
                <div className="product-detail__stars" aria-label={`${avgRating} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <i key={i}
                      className={`fa-${i < Math.round(parseFloat(avgRating)) ? 'solid' : 'light'} fa-sharp fa-star`}
                    />
                  ))}
                </div>
                <span className="product-detail__rating-count">
                  {avgRating} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            )}

            {/* Price */}
            <div className="product-detail__price-wrap">
              <span className="product-detail__price">{formatPrice(product.price)}</span>
              {hasDiscount && (
                <span className="product-detail__price-original">
                  {formatPrice(product.original_price)}
                </span>
              )}
            </div>

            {/* Stock */}
            <div className={`product-detail__stock stock--${isOutOfStock ? 'out' : product.stock_quantity <= 5 ? 'low' : 'in'}`}>
              <i className={`fa-light fa-sharp fa-circle${isOutOfStock ? '-xmark' : product.stock_quantity <= 5 ? '-exclamation' : '-check'}`} />
              {isOutOfStock ? 'Out of stock' : product.stock_quantity <= 5 ? `Only ${product.stock_quantity} left` : 'In stock'}
            </div>

            {/* Qty + Add to cart */}
            {!isOutOfStock && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="product-detail__qty">
                  <span className="product-detail__qty-label">Quantity</span>
                  <div className="qty-control">
                    <button
                      className="qty-control__btn"
                      onClick={() => setQty(q => Math.max(1, q - 1))}
                      aria-label="Decrease quantity"
                    >
                      <i className="fa-light fa-sharp fa-minus" />
                    </button>
                    <input
                      type="number"
                      className="qty-control__val"
                      value={qty}
                      min={1}
                      max={product.stock_quantity}
                      onChange={e => setQty(Math.min(product.stock_quantity, Math.max(1, Number(e.target.value))))}
                      aria-label="Quantity"
                    />
                    <button
                      className="qty-control__btn"
                      onClick={() => setQty(q => Math.min(product.stock_quantity, q + 1))}
                      aria-label="Increase quantity"
                    >
                      <i className="fa-light fa-sharp fa-plus" />
                    </button>
                  </div>
                </div>

                <div className="product-detail__actions">
                  <button
                    className="btn product-detail__cta-massive"
                    onClick={handleAddToCart}
                    style={{ flex: 1 }}
                  >
                    <i className="fa-light fa-sharp fa-bag-shopping" />
                    {addedMsg || 'Add to Cart'}
                  </button>
                </div>
              </div>
            )}

            {/* Quick specs */}
            {product.specs && Object.keys(product.specs).length > 0 && (
              <div className="product-detail__spec-list">
                {Object.entries(product.specs).slice(0, 5).map(([k, v]) => (
                  <div key={k} className="product-detail__spec-item">
                    <span className="product-detail__spec-key">{k}</span>
                    <span className="product-detail__spec-value">{String(v)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="product-detail__tabs">
          <div className="product-detail__tabs-header" role="tablist">
            {['description', 'specs', 'reviews'].map(tab => (
              <button
                key={tab}
                className={`product-detail__tab-btn${activeTab === tab ? ' product-detail__tab-btn--active' : ''}`}
                onClick={() => setTab(tab)}
                role="tab"
                aria-selected={activeTab === tab}
                id={`tab-${tab}`}
                aria-controls={`panel-${tab}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'reviews' && reviews.length > 0 && (
                  <span style={{ marginLeft: 6, opacity: 0.6 }}>({reviews.length})</span>
                )}
              </button>
            ))}
          </div>

          <div className="product-detail__tab-content" role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
            {activeTab === 'description' && (
              <div style={{ color: 'var(--text-1)', lineHeight: 1.8, fontSize: 'var(--text-sm)' }}>
                {product.description || 'No description available.'}
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="product-detail__spec-list">
                {product.specs && Object.keys(product.specs).length > 0
                  ? Object.entries(product.specs).map(([k, v]) => (
                      <div key={k} className="product-detail__spec-item">
                        <span className="product-detail__spec-key">{k}</span>
                        <span className="product-detail__spec-value">{String(v)}</span>
                      </div>
                    ))
                  : <p style={{ color: 'var(--text-2)', fontSize: 'var(--text-sm)' }}>No specifications listed.</p>
                }
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                {reviews.length > 0 ? (
                  <div className="review-list">
                    {reviews.map((r, i) => (
                      <div key={r.id || i} className="review-item">
                        <div className="review-item__header">
                          <div className="review-item__author">
                            <div>
                              <div className="review-item__name">{r.user_name || 'Anonymous'}</div>
                              <div className="review-item__date">
                                {new Date(r.created_at).toLocaleDateString('en-NP', { year: 'numeric', month: 'short', day: 'numeric' })}
                              </div>
                            </div>
                          </div>
                          <div className="review-item__stars" aria-label={`${r.rating} stars`}>
                            {Array.from({ length: 5 }).map((_, si) => (
                              <i key={si} className={`fa-${si < r.rating ? 'solid' : 'light'} fa-sharp fa-star`} />
                            ))}
                          </div>
                        </div>
                        <p className="review-item__text">{r.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                    <div className="empty-state-icon"><i className="fa-light fa-sharp fa-star" /></div>
                    <p>No reviews yet. Be the first!</p>
                  </div>
                )}

                {/* Review form */}
                {user && !reviewSuccess && (
                  <form className="review-form" onSubmit={handleReviewSubmit}>
                    <div className="review-form__title">
                      <i className="fa-light fa-sharp fa-pen" /> Write a Review
                    </div>

                    {reviewError && (
                      <div className="alert alert-danger">
                        <i className="fa-light fa-sharp fa-circle-exclamation" /> {reviewError}
                      </div>
                    )}

                    <div className="form-group">
                      <label className="form-label">Rating</label>
                      <div className="star-picker" role="group" aria-label="Rating">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            className={`star-picker__btn${reviewForm.rating >= star ? ' star-picker__btn--active' : ''}`}
                            onClick={() => setReviewForm(p => ({ ...p, rating: star }))}
                            aria-label={`${star} star${star > 1 ? 's' : ''}`}
                          >
                            <i className="fa-light fa-sharp fa-star" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="review-comment" className="form-label">Your Review</label>
                      <textarea
                        id="review-comment"
                        className="form-textarea"
                        placeholder="Share your experience…"
                        value={reviewForm.comment}
                        onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))}
                        required
                        disabled={reviewLoading}
                      />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={reviewLoading}>
                      {reviewLoading
                        ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Submitting…</>
                        : <><i className="fa-light fa-sharp fa-paper-plane" /> Submit Review</>
                      }
                    </button>
                  </form>
                )}

                {reviewSuccess && (
                  <div className="alert alert-success" style={{ marginTop: 'var(--space-4)' }}>
                    <i className="fa-light fa-sharp fa-circle-check" /> Review submitted — thank you!
                  </div>
                )}

                {!user && (
                  <div style={{ padding: 'var(--space-5)', borderTop: '1px solid var(--border)', fontSize: 'var(--text-sm)', color: 'var(--text-2)' }}>
                    <Link to="/signin" style={{ color: 'var(--accent)' }}>Sign in</Link> to write a review.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
