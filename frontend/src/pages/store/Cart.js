import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
const HQ_LAT = 27.7029;
const HQ_LNG = 85.3072;

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // km
}

const NEPAL_DATA = {
  "Koshi Province": [
    "Bhojpur", "Dhankuta", "Ilam", "Jhapa", "Khotang", "Morang", "Okhaldhunga",
    "Panchthar", "Sankhuwasabha", "Solukhumbu", "Sunsari", "Taplejung", "Terhathum", "Udayapur"
  ],
  "Madhesh Province": [
    "Bara", "Dhanusha", "Mahottari", "Parsa", "Rautahat", "Saptari", "Sarlahi", "Siraha"
  ],
  "Bagmati Province": [
    "Bhaktapur", "Chitwan", "Dhading", "Dolakha", "Kathmandu", "Kavrepalanchok",
    "Lalitpur", "Makwanpur", "Nuwakot", "Ramechhap", "Rasuwa", "Sindhuli", "Sindhupalchok"
  ],
  "Gandaki Province": [
    "Baglung", "Gorkha", "Kaski", "Lamjung", "Manang", "Mustang", "Myagdi",
    "Nawalpur", "Parbat", "Syangja", "Tanahun"
  ],
  "Lumbini Province": [
    "Arghakhanchi", "Banke", "Bardiya", "Dang", "Gulmi", "Kapilvastu", "Nawalparasi West", "Palpa", "Pyuthan", "Rolpa", "Rukum East", "Rupandehi"
  ],
  "Karnali Province": [
    "Dailekh", "Dolpa", "Humla", "Jajarkot", "Jumla", "Kalikot", "Mugu", "Rukum West", "Salyan", "Surkhet"
  ],
  "Sudurpashchim Province": [
    "Achham", "Baitadi", "Bajhang", "Bajura", "Dadeldhura", "Darchula", "Doti", "Kailali", "Kanchanpur"
  ]
};

export default function Cart() {
  const { items, loading, fetchCart, updateCartItem, removeFromCart } = useCart();
  const { user, token, systemConfig, walletBalance, fetchWalletBalance } = useAuth();
  const navigate = useNavigate();

  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccessData, setOrderSuccessData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    province: '',
    district: '',
    city: '',
    receivingLocation: '',
    additionalMessage: '',
  });

  const getDeliveryETA = () => {
    let maxProcessingTime = 1; // base 1 day processing delay
    items.forEach(item => {
      let itemProc = 1;
      if (item.stock_type === 'outsourced') {
        itemProc += Number(item.outsource_days || 0);
      }
      if (itemProc > maxProcessingTime) {
        maxProcessingTime = itemProc;
      }
    });

    const minDays = maxProcessingTime + 1; // processing + 1 day transit
    const maxDays = maxProcessingTime + 2; // processing + 2 days transit

    const orderDate = new Date();
    const minDate = new Date(orderDate);
    minDate.setDate(minDate.getDate() + minDays);

    const maxDate = new Date(orderDate);
    maxDate.setDate(maxDate.getDate() + maxDays);

    const minStr = minDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const maxStr = maxDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    if (minDate.getMonth() === maxDate.getMonth() && minDate.getFullYear() === maxDate.getFullYear()) {
      return `${minStr} - ${maxDate.getDate()}, ${minDate.getFullYear()}`;
    } else {
      return `${minStr} - ${maxStr}`;
    }
  };

  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // Dynamically load Leaflet assets
  useEffect(() => {
    if (window.L) {
      setLeafletLoaded(true);
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.crossOrigin = '';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.crossOrigin = '';
    script.onload = () => setLeafletLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!leafletLoaded) return;
    if (mapRef.current) return;

    const container = document.getElementById('map-container');
    if (!container) return;

    const initialLat = 27.7172;
    const initialLng = 85.3240;

    setForm(prev => ({
      ...prev,
      receivingLocation: `${initialLat.toFixed(6)}, ${initialLng.toFixed(6)}`
    }));

    const map = window.L.map(container).setView([initialLat, initialLng], 13);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const marker = window.L.marker([initialLat, initialLng], { draggable: true }).addTo(map);
    mapRef.current = map;
    markerRef.current = marker;

    const updateLocationState = (lat, lng) => {
      setForm(prev => ({
        ...prev,
        receivingLocation: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      }));
    };

    marker.on('dragend', (e) => {
      const { lat, lng } = e.target.getLatLng();
      updateLocationState(lat, lng);
    });

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      updateLocationState(lat, lng);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [leafletLoaded]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setToast({ type: 'error', message: 'Geolocation is not supported by your browser.' });
      return;
    }

    setToast({ type: 'info', message: 'Fetching GPS location...' });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setForm(prev => ({
          ...prev,
          receivingLocation: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        }));
        if (mapRef.current && markerRef.current) {
          mapRef.current.setView([latitude, longitude], 15);
          markerRef.current.setLatLng([latitude, longitude]);
        }
        setToast({ type: 'success', message: 'Location updated from GPS!' });
      },
      (error) => {
        setToast({ type: 'error', message: `GPS error: ${error.message}` });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    fetchCart().catch(() => {});
  }, [fetchCart]);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({ ...prev, email: user.email || '' }));
    }
  }, [user]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const taxRate = systemConfig?.salesTaxRate !== undefined ? systemConfig.salesTaxRate / 100 : 0.13;
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * taxRate;

  const perKmRate = systemConfig?.deliveryPerKmRate !== undefined ? Number(systemConfig.deliveryPerKmRate) : 15.00;
  const minCharge = systemConfig?.deliveryMinCharge !== undefined ? Number(systemConfig.deliveryMinCharge) : 50.00;
  const freeThreshold = systemConfig?.deliveryFreeThreshold !== undefined ? Number(systemConfig.deliveryFreeThreshold) : 2000.00;

  let distance = 0;
  let shippingFee = 0;

  if (form.receivingLocation) {
    try {
      const coords = form.receivingLocation.split(',').map(c => parseFloat(c.trim()));
      if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        distance = calculateHaversineDistance(HQ_LAT, HQ_LNG, coords[0], coords[1]);
        if (freeThreshold > 0 && subtotal >= freeThreshold) {
          shippingFee = 0;
        } else {
          shippingFee = Math.max(minCharge, distance * perKmRate);
        }
      }
    } catch (e) {
      console.error('Error calculating distance:', e);
      shippingFee = minCharge;
    }
  } else {
    shippingFee = minCharge;
  }

  const total = subtotal + tax + shippingFee;

  const handleQtyChange = (cartItemId, newQty) => {
    if (newQty < 1) return;
    updateCartItem(cartItemId, newQty).catch(() => {
      setToast({ type: 'error', message: 'Failed to update quantity.' });
    });
  };

  const handleRemove = (cartItemId) => {
    removeFromCart(cartItemId).catch(() => {
      setToast({ type: 'error', message: 'Failed to remove item.' });
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'province') {
      setForm(prev => ({ ...prev, province: value, district: '' }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const required = ['fullName', 'email', 'phone', 'province', 'district', 'city', 'receivingLocation'];
    const missing = required.find((f) => !form[f].trim());
    if (missing) {
      setToast({ type: 'error', message: 'Please fill in all required fields, including pinning your location on the map.' });
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    setShowConfirmModal(false);
    try {
      const response = await fetch(`/api/orders/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentMethod,
          shippingDetails: {
            fullName: form.fullName.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            province: form.province.trim(),
            district: form.district.trim(),
            city: form.city.trim(),
            receivingLocation: form.receivingLocation.trim(),
            additionalMessage: form.additionalMessage.trim(),
          }
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to place order');
      }

      setToast({ type: 'success', message: 'Order placed successfully!' });
      await fetchCart();
      if (paymentMethod === 'store_credit') {
        fetchWalletBalance();
      }
      setOrderSuccessData(data);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to place order.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (orderSuccessData) {
    return (
      <div className="cart-page">
        <div className="container" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center', padding: '40px 24px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}>
          <div style={{ fontSize: '4rem', color: '#16a34a', marginBottom: '24px' }}>
            <i className="fa-sharp-duotone fa-light fa-circle-check"></i>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '16px' }}>Order Confirmed!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.6' }}>
            Thank you for shopping with Himalix Store. Your order has been placed successfully!
            <br />
            <strong style={{ display: 'block', marginTop: '12px', color: 'var(--text-primary)' }}>You will be contacted soon by our team to confirm your order details and coordinate shipping.</strong>
          </p>

          <div style={{ backgroundColor: '#f8fafc', border: '1px solid var(--border)', padding: '16px', fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '24px', textAlign: 'left' }}>
            <h5 style={{ fontWeight: 700, marginTop: 0, marginBottom: '8px', color: 'var(--text-primary)' }}>
              <i className="fa-sharp-duotone fa-light fa-circle-info" style={{ marginRight: '6px', color: 'var(--accent)' }}></i>
              Emergency Support Details:
            </h5>
            <div style={{ marginBottom: '4px' }}>Phone: <strong>{systemConfig?.emergencyContactPhone || '9800000000'}</strong></div>
            <div style={{ marginBottom: '4px' }}>Email: <strong>{systemConfig?.emergencyContactEmail || 'support@himalix.store'}</strong></div>
            <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Expected Delivery ETA: <strong>{getDeliveryETA()}</strong>
            </div>
          </div>
          
          <div style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '20px 0', marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Tracking Code:</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{orderSuccessData.trackingCode}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Total Amount:</span>
              <strong style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>रु {Number(orderSuccessData.totalAmount).toFixed(2)}</strong>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link to="/profile" className="btn btn-outline" style={{ flex: 1, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <i className="fa-sharp-duotone fa-light fa-clock-history"></i>
              View Order History
            </Link>
            <Link to="/" className="btn btn-primary" style={{ flex: 1, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <i className="fa-sharp-duotone fa-light fa-bag-shopping"></i>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="page-header">
            <h1 className="page-title">Cart</h1>
          </div>
          <div className="cart-empty">
            <div className="cart-empty-icon">
              <i className="fa-sharp-duotone fa-light fa-cart-shopping"></i>
            </div>
            <h3>Your cart is empty</h3>
            <p>Add some products to get started.</p>
            <Link to="/" className="btn btn-primary">
              <i className="fa-sharp-duotone fa-light fa-arrow-left" style={{ marginRight: '6px' }}></i>
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        {toast && (
          <div className="toast-container">
            <div className={`toast toast-${toast.type}`}>
              <i className={`fa-sharp-duotone fa-light ${toast.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`} style={{ marginRight: '6px' }}></i>
              {toast.message}
            </div>
          </div>
        )}

        <div className="page-header">
          <h1 className="page-title">Cart</h1>
          <p className="page-subtitle">{items.length} item{items.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="cart-layout">
          <div>
            <div className="cart-items">
              {items.map((item) => (
                <div className="cart-item" key={item.id}>
                  <div className="cart-item-image">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} />
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        NO IMG
                      </span>
                    )}
                  </div>
                  <div className="cart-item-details">
                    <span className="cart-item-name">{item.name}</span>
                    <span className="cart-item-category">रु {Number(item.price).toFixed(2)} each</span>
                  </div>
                  <div className="quantity-control">
                    <button
                      className="quantity-btn"
                      onClick={() => handleQtyChange(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <i className="fa-sharp-duotone fa-light fa-minus"></i>
                    </button>
                    <span className="quantity-display">{item.quantity}</span>
                    <button
                      className="quantity-btn"
                      onClick={() => handleQtyChange(item.id, item.quantity + 1)}
                    >
                      <i className="fa-sharp-duotone fa-light fa-plus"></i>
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <span className="cart-item-price">रु {(item.price * item.quantity).toFixed(2)}</span>
                    <button className="cart-item-remove" onClick={() => handleRemove(item.id)}>
                      <i className="fa-sharp-duotone fa-light fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="cart-summary">
            <h4 className="cart-summary-title">Order Summary</h4>
            <div className="cart-summary-row">
              <span className="label">Subtotal</span>
              <span className="value font-mono">रु {subtotal.toFixed(2)}</span>
            </div>
            <div className="cart-summary-row">
              <span className="label">Shipping Fee</span>
              <span className="value font-mono" style={{ fontWeight: 700 }}>
                {shippingFee === 0 ? 'Free' : `रु ${shippingFee.toFixed(2)}`}
                {distance > 0 && <span style={{ fontSize: '0.78rem', fontWeight: 400, color: 'var(--text-secondary)', marginLeft: '4px' }}>({distance.toFixed(1)} km)</span>}
              </span>
            </div>
            <div className="cart-summary-row" style={{ borderTop: '1px dashed var(--border)', paddingTop: '10px', marginTop: '10px' }}>
              <span className="label">Estimated Delivery</span>
              <span className="value" style={{ fontWeight: 600 }}>{getDeliveryETA()}</span>
            </div>
            <div className="cart-summary-total">
              <span>Total</span>
              <span className="value font-mono">रु {total.toFixed(2)}</span>
            </div>

            <div className="checkout-form" style={{ paddingTop: 0 }}>
              <form onSubmit={handleSubmit}>
                <h4 className="cart-summary-title" style={{ marginTop: 24 }}>Shipping Details</h4>

                <div className="form-group">
                  <label className="form-label" htmlFor="fullName">Full Name *</label>
                  <input
                    className="form-input"
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="email">Email *</label>
                  <input
                    className="form-input"
                    type="email"
                    id="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="phone">Phone Number *</label>
                  <input
                    className="form-input"
                    type="tel"
                    id="phone"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    placeholder="e.g. 98XXXXXXXX"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="province">Province *</label>
                    <select
                      className="form-select"
                      id="province"
                      name="province"
                      value={form.province}
                      onChange={handleChange}
                      required
                      style={{ borderRadius: 0 }}
                    >
                      <option value="">Select Province</option>
                      {Object.keys(NEPAL_DATA).map(prov => (
                        <option key={prov} value={prov}>{prov}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="district">District *</label>
                    <select
                      className="form-select"
                      id="district"
                      name="district"
                      value={form.district}
                      onChange={handleChange}
                      required
                      disabled={!form.province}
                      style={{ borderRadius: 0 }}
                    >
                      <option value="">Select District</option>
                      {form.province && NEPAL_DATA[form.province].map(dist => (
                        <option key={dist} value={dist}>{dist}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="city">City *</label>
                  <input
                    className="form-input"
                    type="text"
                    id="city"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column' }}>
                  <label className="form-label">Receiving Location Pinpoint *</label>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Drag the marker or click on the map to pinpoint your exact address.
                  </p>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleUseCurrentLocation}
                    style={{ marginBottom: '8px', alignSelf: 'flex-start', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: 0 }}
                  >
                    <i className="fa-sharp-duotone fa-light fa-location-crosshairs"></i> Use Current GPS Location
                  </button>
                  <div
                    id="map-container"
                    style={{ height: '200px', width: '100%', border: '1px solid var(--border)', zIndex: 1, marginBottom: '8px' }}
                  ></div>
                  <input
                    type="text"
                    className="form-input"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', background: '#fafafa', borderRadius: 0 }}
                    value={form.receivingLocation}
                    readOnly
                    required
                    placeholder="Coordinates (Latitude, Longitude)"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="additionalMessage">Additional Message (Optional)</label>
                  <textarea
                    className="form-input"
                    id="additionalMessage"
                    name="additionalMessage"
                    value={form.additionalMessage}
                    onChange={handleChange}
                    placeholder="E.g., apartment number, nearby landmark, etc."
                    style={{ height: '80px', borderRadius: 0 }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '24px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                  <label className="form-label" style={{ fontWeight: 700, marginBottom: '12px' }}>Payment Method</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="cash" 
                        checked={paymentMethod === 'cash'} 
                        onChange={() => setPaymentMethod('cash')} 
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span>Cash on Delivery</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', cursor: 'pointer', opacity: walletBalance < total ? 0.6 : 1 }}>
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="store_credit" 
                        checked={paymentMethod === 'store_credit'} 
                        onChange={() => setPaymentMethod('store_credit')} 
                        disabled={walletBalance < total}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span>Pay with Store Credit (Available: रु {Number(walletBalance || 0).toFixed(2)})</span>
                    </label>
                    {walletBalance < total && (
                      <span style={{ fontSize: '0.75rem', color: '#b91c1c', marginTop: '-4px', marginLeft: '26px' }}>
                        * Insufficient store credits to choose this option.
                      </span>
                    )}
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem' }}>
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      style={{ width: '18px', height: '18px', borderRadius: 0 }}
                    />
                    <span>
                      I agree to the <Link to="/terms" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'underline' }}>Terms & Conditions</Link> *
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block btn-lg"
                  disabled={submitting || !agreeTerms}
                  style={{ borderRadius: 0 }}
                >
                  <i className="fa-sharp-duotone fa-light fa-credit-card" style={{ marginRight: '6px' }}></i>
                  Place Order
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {showConfirmModal && (
        <div className="admin-modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%', padding: '24px', borderRadius: 0 }}>
            <div className="admin-modal-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h4 style={{ fontWeight: 800, margin: 0 }}>Confirm Your Order</h4>
              <button className="btn-close" onClick={() => setShowConfirmModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.25rem' }}>
                <i className="fa-sharp-duotone fa-light fa-xmark"></i>
              </button>
            </div>
            
            <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: 0 }}>
              <div>
                <h5 style={{ fontWeight: 700, marginBottom: '8px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>Delivery Details</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.88rem' }}>
                  <div><strong>Name:</strong> {form.fullName}</div>
                  <div><strong>Email:</strong> {form.email}</div>
                  <div><strong>Phone Number:</strong> {form.phone}</div>
                  <div><strong>Address:</strong> {form.city}, {form.district}, {form.province}</div>
                  <div><strong>Coordinates:</strong> <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', background: '#f5f5f5', padding: '2px 6px' }}>{form.receivingLocation}</span></div>
                  <div><strong>Estimated Delivery:</strong> <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{getDeliveryETA()}</span></div>
                  {form.additionalMessage && <div><strong>Message:</strong> {form.additionalMessage}</div>}
                </div>
              </div>

              <div>
                <h5 style={{ fontWeight: 700, marginBottom: '8px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>Pricing & Payment</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subtotal:</span>
                    <span className="font-mono">रु {subtotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Tax ({(taxRate * 100).toFixed(0)}%):</span>
                    <span className="font-mono">रु {tax.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Shipping Fee:</span>
                    <span className="font-mono" style={{ fontWeight: 700 }}>
                      {shippingFee === 0 ? 'Free Shipping' : `रु ${shippingFee.toFixed(2)}`}
                      {distance > 0 && ` (${distance.toFixed(1)} km)`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '8px', fontWeight: 800, fontSize: '1rem' }}>
                    <span>Total Amount:</span>
                    <span className="font-mono" style={{ color: 'var(--accent)' }}>रु {total.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span>Payment Method:</span>
                    <span style={{ fontWeight: 700, color: paymentMethod === 'store_credit' ? 'var(--accent)' : 'inherit' }}>
                      {paymentMethod === 'store_credit' ? 'Store Credit' : 'Cash on Delivery (COD)'}
                    </span>
                  </div>
                </div>
              </div>

              {paymentMethod === 'cash' && (
                <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', padding: '12px', fontSize: '0.82rem', color: '#b45309' }}>
                  <i className="fa-sharp-duotone fa-light fa-circle-exclamation" style={{ marginRight: '6px' }}></i>
                  <strong>Cash on Delivery (COD):</strong> Dynamic delivery fee of <strong>रु {shippingFee.toFixed(2)}</strong> (calculated for {distance.toFixed(1)} km distance from Basantapur HQ) will be collected in cash upon delivery.
                </div>
              )}

              {paymentMethod === 'store_credit' && (
                <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', padding: '12px', fontSize: '0.82rem', color: '#047857' }}>
                  <i className="fa-sharp-duotone fa-light fa-circle-check" style={{ marginRight: '6px' }}></i>
                  <strong>Prepaid Wallet Checkout:</strong> Delivery fee of <strong>रु {shippingFee.toFixed(2)}</strong> (for {distance.toFixed(1)} km distance) is included. A total of <strong>रु {total.toFixed(2)}</strong> will be deducted from your wallet balance.
                </div>
              )}

              <div style={{ backgroundColor: '#f8fafc', border: '1px solid var(--border)', padding: '12px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <i className="fa-sharp-duotone fa-light fa-headset" style={{ marginRight: '6px', color: 'var(--accent)' }}></i>
                For emergency support, contact us at <strong>{systemConfig?.emergencyContactPhone || '9800000000'}</strong> or <strong>{systemConfig?.emergencyContactEmail || 'support@himalix.store'}</strong>.
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowConfirmModal(false)} disabled={submitting} style={{ borderRadius: 0 }}>
                Cancel & Edit
              </button>
              <button type="button" className="btn btn-primary" onClick={handleConfirmSubmit} disabled={submitting} style={{ borderRadius: 0 }}>
                {submitting ? 'Processing...' : 'Confirm & Place Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
