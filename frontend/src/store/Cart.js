import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StoreNavbar from './Navbar';
import { useCart } from './CartContext';
import { useAuth } from '../auth/AuthContext';
import StoreFooter from './Footer';
import LocationPicker from '../components/LocationPicker';

export default function Cart() {
  const { items, itemCount, totalAmount, updateQty, removeItem, clearCart } = useCart();
  const { user, authFetch, systemConfig } = useAuth();
  const navigate = useNavigate();

  const [step, setStep]         = useState('cart');   // cart | checkout | success
  const [orderCode, setOrderCode] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  /* Wallet */
  const [wallet, setWallet]     = useState(null);
  const [walletUse, setWalletUse] = useState(false);

  /* Shipping */
  const [shipping, setShipping] = useState(null);

  /* Address form */
  const [address, setAddress] = useState({
    full_name: user?.name || '',
    phone: '',
    address_line: '',
    city: '',
    district: '',
    lat: '',
    lng: '',
  });

  useEffect(() => {
    if (!user) { navigate('/signin'); return; }
    authFetch('/api/store/wallet').then(r => r.json()).then(d => setWallet(d.wallet));
  }, [user, authFetch, navigate]);

  /* Calculate shipping when address has coords */
  useEffect(() => {
    const { lat, lng } = address;
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;
    authFetch(`/api/store/orders/shipping?lat=${lat}&lng=${lng}`)
      .then(r => r.json())
      .then(d => setShipping(d))
      .catch(() => {});
  }, [address.lat, address.lng, authFetch]);

  const walletBalance   = wallet?.balance || 0;
  const subtotal        = totalAmount;
  const taxRate         = (parseFloat(systemConfig?.salesTaxRate) || 0) / 100;
  const salesTax        = subtotal * taxRate;
  const shippingCost    = shipping?.shipping_cost || 0;
  const totalBeforeWallet = subtotal + salesTax + shippingCost;
  const walletDeduction = walletUse ? Math.min(walletBalance, totalBeforeWallet) : 0;
  const grandTotal      = Math.max(0, totalBeforeWallet - walletDeduction);

  const formatPrice = n => `Rs. ${Number(n).toLocaleString('en-NP')}`;

  const handleCheckout = async () => {
    if (!address.full_name || !address.phone || !address.address_line || !address.city || !address.district || !address.lat || !address.lng) {
      setCheckoutError('Please fill in all address fields and provide your map location.');
      return;
    }
    setCheckoutLoading(true);
    setCheckoutError('');
    try {
      const res = await authFetch('/api/store/orders', {
        method: 'POST',
        body: JSON.stringify({
          address,
          use_wallet: walletUse,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Checkout failed');
      setOrderCode(data.order_code || data.order?.order_code || '');
      await clearCart();
      setStep('success');
    } catch (err) {
      setCheckoutError(err.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const addrField = (id, label, name, placeholder, type = 'text', half = false) => (
    <div className="form-group" style={half ? {} : {}}>
      <label htmlFor={id} className="form-label">{label}</label>
      <input
        id={id}
        type={type}
        className="form-input"
        placeholder={placeholder}
        value={address[name] || ''}
        onChange={e => setAddress(p => ({ ...p, [name]: e.target.value }))}
        disabled={checkoutLoading}
      />
    </div>
  );

  /* ── ORDER SUCCESS ── */
  if (step === 'success') {
    return (
      <div className="store-page">
        <StoreNavbar />
        <div className="order-success">
          <div className="order-success__icon">
            <i className="fa-light fa-sharp fa-circle-check" />
          </div>
          <h1 className="order-success__title">Order Placed!</h1>
          {orderCode && (
            <div className="order-success__code">
              <i className="fa-light fa-sharp fa-hashtag" /> {orderCode}
            </div>
          )}
          <p style={{ color: 'var(--text-2)', fontSize: 'var(--text-sm)', maxWidth: 400, textAlign: 'center' }}>
            Your order has been received. You can track it from your profile.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link to="/store/profile" className="btn btn-primary">
              <i className="fa-light fa-sharp fa-user" /> View Orders
            </Link>
            <Link to="/store" className="btn btn-outline">
              <i className="fa-light fa-sharp fa-store" /> Continue Shopping
            </Link>
          </div>
        </div>
        <StoreFooter />
      </div>
    );
  }

  return (
    <div className="store-page">
      <StoreNavbar />

      <div className="cart-layout">
        {/* ── LEFT: Cart items OR Checkout form ── */}
        <div>
          {step === 'cart' ? (
            <div className="cart-items">
              <div className="cart-items__header">
                <span className="cart-items__title">Your Cart</span>
                <span className="cart-items__count">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
              </div>

              {items.length === 0 ? (
                <div className="cart-empty">
                  <div className="cart-empty__icon">
                    <i className="fa-light fa-sharp fa-bag-shopping" />
                  </div>
                  <p className="cart-empty__text">Your cart is empty.</p>
                  <Link to="/store" className="btn btn-outline">
                    <i className="fa-light fa-sharp fa-store" /> Browse Products
                  </Link>
                </div>
              ) : (
                <>
                  {items.map(item => (
                    <div key={item.product_id} className="cart-item">
                      <div className="cart-item__img">
                        <img
                          src={item.image_url || '/placeholder.png'}
                          alt={item.product_name}
                          onError={e => { e.target.src = '/placeholder.png'; }}
                        />
                      </div>
                      <div className="cart-item__body">
                        <div className="cart-item__category">{item.category}</div>
                        <div className="cart-item__name">{item.product_name}</div>
                        <div className="cart-item__actions">
                          <span className="cart-item__price">{formatPrice(item.price * item.quantity)}</span>
                          <div className="cart-item__controls">
                            <div className="qty-control">
                              <button className="qty-control__btn" onClick={() => updateQty(item.product_id, item.quantity - 1)} aria-label="Decrease">
                                <i className="fa-light fa-sharp fa-minus" />
                              </button>
                              <span className="qty-control__val" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {item.quantity}
                              </span>
                              <button className="qty-control__btn" onClick={() => updateQty(item.product_id, item.quantity + 1)} aria-label="Increase">
                                <i className="fa-light fa-sharp fa-plus" />
                              </button>
                            </div>
                            <button className="cart-item__remove" onClick={() => removeItem(item.product_id)} aria-label={`Remove ${item.product_name}`}>
                              <i className="fa-light fa-sharp fa-trash" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          ) : (
            /* ── CHECKOUT FORM ── */
            <div className="checkout-address">
              <div className="checkout-address__header">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setStep('cart')}
                  style={{ marginRight: 'var(--space-4)', float: 'left' }}
                >
                  <i className="fa-light fa-sharp fa-arrow-left" />
                </button>
                Delivery Address
              </div>
              <div className="checkout-address__body">
                {checkoutError && (
                  <div className="alert alert-danger">
                    <i className="fa-light fa-sharp fa-circle-exclamation" /> {checkoutError}
                  </div>
                )}
                <div className="checkout-address__row">
                  {addrField('addr-name', 'Full Name', 'full_name', 'Your full name')}
                  {addrField('addr-phone', 'Phone Number', 'phone', '98XXXXXXXX', 'tel')}
                </div>
                {addrField('addr-line', 'Address Line', 'address_line', 'Street, Ward, Area')}
                <div className="checkout-address__row">
                  {addrField('addr-city', 'City / Municipality', 'city', 'e.g. Kathmandu')}
                  {addrField('addr-district', 'District', 'district', 'e.g. Kathmandu')}
                </div>
                <div className="form-group">
                  <label className="form-label">Map Location (Pinpoint on map)</label>
                  <LocationPicker 
                    lat={address.lat} 
                    lng={address.lng} 
                    onChange={(lat, lng) => setAddress(p => ({ ...p, lat, lng }))} 
                  />
                </div>
                <div className="checkout-address__row" style={{ alignItems: 'flex-end' }}>
                  {addrField('addr-lat', 'Latitude', 'lat', '27.7029', 'number')}
                  {addrField('addr-lng', 'Longitude', 'lng', '85.3072', 'number')}
                  <div className="form-group" style={{ flex: '0 0 auto' }}>
                    <button 
                      type="button" 
                      className="btn btn-outline"
                      onClick={() => {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition(
                            (pos) => setAddress(p => ({ ...p, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) })),
                            (err) => alert('Could not fetch location: ' + err.message)
                          );
                        } else {
                          alert('Geolocation is not supported by your browser.');
                        }
                      }}
                    >
                      <i className="fa-light fa-sharp fa-location-crosshairs" /> Auto-Locate
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)' }}>
                  <i className="fa-light fa-sharp fa-circle-info" style={{ color: 'var(--accent)' }} />
                  {' '}Providing precise coordinates enables accurate shipping cost calculation.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Order Summary ── */}
        <div className="order-summary">
          {/* Wallet & Coupon */}
          <div className="order-summary__card">
            <div className="order-summary__header">Discounts</div>
            <div className="wallet-coupon">
              <div className="wallet-coupon__label">
                <i className="fa-light fa-sharp fa-wallet" /> Wallet Credit
              </div>
              {wallet && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>
                    {formatPrice(walletBalance)} available
                  </span>
                  <label className="toggle" style={{ flexShrink: 0 }}>
                    <input
                      type="checkbox"
                      checked={walletUse}
                      onChange={e => setWalletUse(e.target.checked)}
                      disabled={walletBalance <= 0}
                    />
                    <span className="toggle__track" />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Summary card */}
          <div className="order-summary__card">
            <div className="order-summary__header">Order Summary</div>
            <div className="order-summary__body">
              <div className="order-summary__row">
                <span>Subtotal ({itemCount} items)</span>
                <span className="order-summary__value">{formatPrice(subtotal)}</span>
              </div>
              <div className="order-summary__row">
                <span>Sales Tax ({systemConfig?.salesTaxRate || 0}%)</span>
                <span className="order-summary__value">{formatPrice(salesTax)}</span>
              </div>
              <div className="order-summary__row">
                <span>Shipping</span>
                <span className="order-summary__value">
                  {shipping ? formatPrice(shippingCost) : '—'}
                </span>
              </div>
              {walletUse && walletDeduction > 0 && (
                <div className="order-summary__row">
                  <span>Wallet Credit</span>
                  <span className="order-summary__value order-summary__value--discount">
                    −{formatPrice(walletDeduction)}
                  </span>
                </div>
              )}
              <div className="order-summary__row order-summary__row--total">
                <span>Total</span>
                <span className="order-summary__value order-summary__value--gold">
                  {formatPrice(grandTotal)}
                </span>
              </div>
            </div>

            {shipping && (
              <div style={{ padding: '0 var(--space-6) var(--space-4)' }}>
                <div className="shipping-info">
                  <div className="shipping-info__row">
                    <span className="shipping-info__label">Distance</span>
                    <span className="shipping-info__value">{shipping.distance_km?.toFixed(1)} km</span>
                  </div>
                  <div className="shipping-info__row">
                    <span className="shipping-info__label">ETA</span>
                    <span className="shipping-info__value">{shipping.eta_days} day{shipping.eta_days !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            )}

            <div style={{ padding: '0 var(--space-6) var(--space-5)' }}>
              {step === 'cart' ? (
                <button
                  className="btn btn-primary btn-full btn-lg"
                  onClick={() => { if (items.length > 0) setStep('checkout'); }}
                  disabled={items.length === 0}
                >
                  <i className="fa-light fa-sharp fa-arrow-right" /> Proceed to Checkout
                </button>
              ) : (
                <button
                  className="btn btn-primary btn-full btn-lg"
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                >
                  {checkoutLoading
                    ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Placing Order…</>
                    : <><i className="fa-light fa-sharp fa-check" /> Place Order</>
                  }
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <StoreFooter />
    </div>
  );
}
