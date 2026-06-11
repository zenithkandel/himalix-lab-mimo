import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import ProductCard from '../../components/store/ProductCard';

export default function ProductDetail() {
  const { id } = useParams();
  const { user, token, systemConfig } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState(null);

  // New visual states
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [view3d, setView3d] = useState(false);

  // Review states
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState(null);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/store/reviews/${id}`);
      const data = await response.json();
      if (response.ok) {
        setReviews(data);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await fetch(`/api/store/products/${id}`, { headers });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Product not found');
        }

        setProduct(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    fetchReviews();
  }, [id, token]);

  const handleQuantityChange = (delta) => {
    setQuantity((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      const maxQty = 99;
      if (next > maxQty) return maxQty;
      return next;
    });
  };

  const handleAddToCart = async () => {
    if (!product || product.stock_quantity === 0) return;

    setAddingToCart(true);
    setCartMessage(null);

    try {
      await addToCart(product.id, quantity);
      setCartMessage({ type: 'success', text: `Added ${quantity} item${quantity > 1 ? 's' : ''} to cart.` });
    } catch (err) {
      setCartMessage({ type: 'error', text: err.message || 'Failed to add to cart.' });
    } finally {
      setAddingToCart(false);
      setTimeout(() => setCartMessage(null), 3000);
    }
  };

  const parseSpecs = (specs) => {
    if (!specs) return null;
    try {
      const parsed = typeof specs === 'string' ? JSON.parse(specs) : specs;
      if (typeof parsed !== 'object' || parsed === null) return null;
      return parsed;
    } catch {
      return null;
    }
  };

  const getStockStatus = (qty) => {
    if (product && product.stock_type === 'outsourced') {
      return { label: `Outsourced (ETA: +${product.outsource_days || 0} days)`, className: 'badge-neutral', icon: 'fa-light fa-circle-notch' };
    }
    if (product && qty <= 0) {
      return { label: 'Available (On-Demand)', className: 'badge-info', icon: 'fa-light fa-circle-notch' };
    }
    let threshold = 5;
    try {
      const stored = localStorage.getItem('himalix_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed.lowStockThreshold === 'number') threshold = parsed.lowStockThreshold;
        else if (parsed && typeof parsed.lowStockThreshold === 'string') threshold = parseInt(parsed.lowStockThreshold, 10) || 5;
      }
    } catch (e) {}
    if (qty === 0) return { label: 'Out of Stock', className: 'badge-danger', icon: 'fa-circle-exclamation' };
    if (qty <= threshold) return { label: 'Low Stock', className: 'badge-warning', icon: 'fa-circle-exclamation' };
    return { label: 'In Stock', className: 'badge-success', icon: 'fa-circle-check' };
  };

  if (loading) {
    return (
      <div className="product-detail">
        <div className="container">
          <div className="loading-spinner">
            <div className="spinner" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail">
        <div className="container">
          <div className="empty-state">
            <div className="empty-state-icon">
              <i className="fa-sharp-duotone fa-light fa-triangle-exclamation"></i>
            </div>
            <h3>Product Not Found</h3>
            <p>{error || 'The product you are looking for does not exist or has been removed.'}</p>
            <Link to="/store" className="btn btn-primary">
              <i className="fa-sharp-duotone fa-light fa-arrow-left" style={{ marginRight: '6px' }}></i>
              Back to Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const specs = parseSpecs(product.technical_specs);
  const stockStatus = getStockStatus(product.stock_quantity);

  const getImageList = () => {
    if (product.image_urls) {
      try {
        const parsed = typeof product.image_urls === 'string' ? JSON.parse(product.image_urls) : product.image_urls;
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(url => !!url);
        }
      } catch (e) {}
    }
    return product.image_url ? [product.image_url] : [];
  };

  const images = getImageList();

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setReviewMsg({ type: 'error', text: 'You must be logged in to write a review.' });
      return;
    }
    setReviewSubmitting(true);
    setReviewMsg(null);
    try {
      const response = await fetch(`/api/store/reviews/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating: ratingInput, comment: commentInput })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit review');
      }
      setReviewMsg({ type: 'success', text: 'Thank you for your review!' });
      setCommentInput('');
      setRatingInput(5);
      fetchReviews();
    } catch (err) {
      setReviewMsg({ type: 'error', text: err.message });
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="product-detail">
      <div className="container">
        <div className="product-detail-grid">
          <div className="product-detail-image">
            {view3d && (specs?.['3d_model'] || specs?.['3D Model']) ? (
              <div style={{ width: '100%', height: '400px', backgroundColor: '#f8fafc', border: '1px solid var(--border)' }}>
                <model-viewer
                  src={specs['3d_model'] || specs['3D Model']}
                  ar
                  ar-modes="webxr scene-viewer quick-look"
                  camera-controls
                  touch-action="pan-y"
                  alt="A 3D model"
                  style={{ width: '100%', height: '100%' }}
                ></model-viewer>
              </div>
            ) : images.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ width: '100%', height: '400px', backgroundColor: '#f8fafc', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <img src={images[activeImgIdx]} alt={product.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
                {images.length > 1 && (
                  <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px' }}>
                    {images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Thumbnail ${idx}`}
                        style={{
                          width: '64px',
                          height: '64px',
                          objectFit: 'cover',
                          border: activeImgIdx === idx ? '2px solid var(--accent)' : '1px solid var(--border)',
                          cursor: 'pointer',
                          opacity: activeImgIdx === idx ? 1 : 0.6,
                          transition: 'all 0.15s ease'
                        }}
                        onClick={() => setActiveImgIdx(idx)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="product-placeholder">
                <i className="fa-sharp-duotone fa-light fa-cpu"></i>
              </div>
            )}

            {(specs?.['3d_model'] || specs?.['3D Model']) && (
              <div style={{ marginTop: '16px' }}>
                <button
                  className="btn btn-secondary btn-block"
                  onClick={() => setView3d(!view3d)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <i className="fa-sharp-duotone fa-light fa-cube"></i>
                  {view3d ? 'View Photos' : 'View in 3D (AR)'}
                </button>
              </div>
            )}
          </div>

          <div className="product-detail-info">
            {product.category && (
              <span className="badge badge-neutral product-detail-category" style={{ marginBottom: '16px' }}>
                <i className="fa-sharp-duotone fa-light fa-folder" style={{ marginRight: '6px' }}></i>
                {product.category}
              </span>
            )}


            <h1 className="product-detail-name">{product.name}</h1>

            <p className="font-mono text-muted" style={{ marginBottom: '24px', fontSize: '0.875rem' }}>
              SKU: {product.sku}
            </p>

            <div className="product-detail-price">
              रु {Number(product.price).toFixed(2)}
            </div>

            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className={`badge ${stockStatus.className}`}>
                <i className={`fa-sharp-duotone fa-light ${stockStatus.icon}`}></i>
                {stockStatus.label}
              </span>
              <span className="font-mono text-muted" style={{ fontSize: '0.8125rem' }}>
                {product.stock_type === 'outsourced' ? `Sourced from partner: +${product.outsource_days || 0} days prep` : (product.stock_quantity > 0 ? `${product.stock_quantity} units ready` : 'Dispatched from connections on order')}
              </span>
            </div>

            {/* Shipping Cost Disclaimer */}
            <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c', fontSize: '0.825rem', fontWeight: 600 }}>
              <i className="fa-sharp-duotone fa-light fa-truck-container" style={{ color: '#b91c1c' }}></i>
              <span>* Extra Shipping Cost Applicable</span>
            </div>

            {product.description && (
              <p className="product-detail-description">{product.description}</p>
            )}

            {specs && Object.keys(specs).filter(k => k !== '3d_model' && k !== '3D Model').length > 0 && (
              <div className="product-detail-specs">
                <h4>
                  <i className="fa-sharp-duotone fa-light fa-microchip" style={{ marginRight: '8px', color: 'var(--text-secondary)' }}></i>
                  Technical Specifications
                </h4>
                {Object.entries(specs)
                  .filter(([key]) => key !== '3d_model' && key !== '3D Model')
                  .map(([key, value]) => (
                    <div className="spec-row" key={key}>
                      <span className="spec-label">{key}</span>
                      <span className="spec-value">{String(value)}</span>
                    </div>
                  ))}
              </div>
            )}

            <div className="product-detail-actions">
              <div className="quantity-control">
                <button
                  className="quantity-btn"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  <i className="fa-sharp-duotone fa-light fa-minus"></i>
                </button>
                <span className="quantity-display">{quantity}</span>
                <button
                  className="quantity-btn"
                  onClick={() => handleQuantityChange(1)}
                  aria-label="Increase quantity"
                >
                  <i className="fa-sharp-duotone fa-light fa-plus"></i>
                </button>
              </div>
 
              <button
                className="btn btn-primary btn-lg"
                onClick={handleAddToCart}
                disabled={addingToCart}
                style={{ flex: 1 }}
              >
                <i className="fa-sharp-duotone fa-light fa-cart-plus" style={{ marginRight: '6px' }}></i>
                {addingToCart ? 'Adding...' : (product.stock_quantity === 0 ? 'Pre-order (On-Demand)' : 'Add to Cart')}
              </button>
            </div>

            {cartMessage && (
              <div
                className={`alert ${cartMessage.type === 'success' ? 'alert-success' : 'alert-danger'}`}
                style={{ marginTop: '16px' }}
              >
                <span className="alert-icon">
                  <i className={`fa-sharp-duotone fa-light ${cartMessage.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
                </span>
                <span className="alert-content">{cartMessage.text}</span>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div style={{ marginTop: '56px', paddingTop: '40px', borderTop: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '24px', letterSpacing: '-0.02em' }}>
            Customer Reviews ({reviews.length})
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: token ? '2fr 1fr' : '1fr', gap: '40px' }}>
            {/* Reviews List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {reviewsLoading ? (
                <p>Loading reviews...</p>
              ) : reviews.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>No reviews yet. Be the first to review this product!</p>
                </div>
              ) : (
                reviews.map((rev) => (
                  <div key={rev.id} style={{ padding: '20px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {rev.avatar_url ? (
                          <img src={rev.avatar_url} alt="User Avatar" style={{ width: '28px', height: '28px', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '28px', height: '28px', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                            {rev.email[0].toUpperCase()}
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{rev.email}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {new Date(rev.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <div style={{ color: '#f59e0b', display: 'flex', gap: '2px', fontSize: '0.85rem' }}>
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <i
                            key={idx}
                            className={`fa-star ${idx < rev.rating ? 'fa-solid' : 'fa-light'}`}
                          ></i>
                        ))}
                      </div>
                    </div>
                    {rev.comment && <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>{rev.comment}</p>}
                  </div>
                ))
              )}
            </div>

            {/* Submit Review Form */}
            {token && (
              <div style={{ padding: '24px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', height: 'fit-content' }}>
                <h4 style={{ fontWeight: 700, marginBottom: '16px', fontSize: '1.1rem' }}>Write a Review</h4>
                <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label className="form-label">Rating</label>
                    <select 
                      className="form-select" 
                      value={ratingInput} 
                      onChange={(e) => setRatingInput(parseInt(e.target.value))}
                      style={{ width: '100%' }}
                    >
                      <option value="5">5 Stars - Excellent</option>
                      <option value="4">4 Stars - Good</option>
                      <option value="3">3 Stars - Average</option>
                      <option value="2">2 Stars - Poor</option>
                      <option value="1">1 Star - Terrible</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Comment</label>
                    <textarea 
                      className="form-input" 
                      rows="4" 
                      value={commentInput} 
                      onChange={(e) => setCommentInput(e.target.value)} 
                      placeholder="Share your thoughts about this product..."
                      style={{ width: '100%', resize: 'none', fontFamily: 'inherit' }}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary btn-block" disabled={reviewSubmitting}>
                    {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                  {reviewMsg && (
                    <div className={`alert ${reviewMsg.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginTop: '8px' }}>
                      <span className="alert-content">{reviewMsg.text}</span>
                    </div>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
