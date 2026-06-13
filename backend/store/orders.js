const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const { sendNotificationEmail, sendEmail } = require('../config/mail');

router.use(authMiddleware);

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

// 1. Place an Order (Checkout)
const checkoutHandler = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    let shippingDetails = req.body.shippingDetails;
    let paymentMethod = req.body.paymentMethod || 'cash';

    if (req.body.address) {
      const addr = req.body.address;
      shippingDetails = {
        fullName: addr.full_name || '',
        email: addr.email || req.user.email || '',
        phone: addr.phone || '',
        province: addr.province || 'Bagmati',
        district: addr.district || '',
        city: addr.city || '',
        addressLine: addr.address_line || '',
        receivingLocation: (addr.lat && addr.lng) ? `${addr.lat},${addr.lng}` : ''
      };
      if (req.body.use_wallet) {
        paymentMethod = 'store_credit';
      }
    }

    if (!shippingDetails || !shippingDetails.fullName || !shippingDetails.email || !shippingDetails.phone || !shippingDetails.province || !shippingDetails.district || !shippingDetails.city || !shippingDetails.addressLine) {
      return res.status(400).json({ message: 'Shipping details are incomplete' });
    }

    await connection.beginTransaction();

    const [cartItems] = await connection.query(
      `SELECT ci.product_id, ci.quantity, p.name, p.price, p.stock_quantity, p.stock_type, p.outsource_days
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = ?`,
      [req.user.id]
    );

    if (cartItems.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Your cart is empty' });
    }

    // Verify stock and calculate subtotal
    let subtotal = 0;
    for (const item of cartItems) {
      if (item.stock_type !== 'outsourced' && item.stock_quantity < item.quantity) {
        await connection.rollback();
        return res.status(400).json({ message: `Insufficient stock for product: ${item.name}` });
      }
      subtotal += Number(item.price) * item.quantity;
    }

    // Fetch tax rate, per-KM rate, base delivery fee, and free threshold dynamically from settings table
    const [settingsRows] = await connection.query(
      "SELECT key_name, key_value FROM settings WHERE key_name IN ('sales_tax_rate', 'delivery_per_km_rate', 'delivery_min_charge', 'delivery_free_threshold')"
    );
    let taxRate = 0.13;
    let deliveryPerKmRate = 15.00;
    let deliveryMinCharge = 50.00;
    let deliveryFreeThreshold = 2000.00;

    settingsRows.forEach(row => {
      if (row.key_name === 'sales_tax_rate') {
        taxRate = parseFloat(row.key_value) / 100;
      } else if (row.key_name === 'delivery_per_km_rate') {
        deliveryPerKmRate = parseFloat(row.key_value);
      } else if (row.key_name === 'delivery_min_charge') {
        deliveryMinCharge = parseFloat(row.key_value);
      } else if (row.key_name === 'delivery_free_threshold') {
        deliveryFreeThreshold = parseFloat(row.key_value);
      }
    });

    const tax = subtotal * taxRate;
    let distance = 0;
    let shippingFee = 0;

    try {
      if (shippingDetails.receivingLocation) {
        const coords = shippingDetails.receivingLocation.split(',').map(c => parseFloat(c.trim()));
        if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
          distance = calculateHaversineDistance(HQ_LAT, HQ_LNG, coords[0], coords[1]);
          if (deliveryFreeThreshold > 0 && subtotal >= deliveryFreeThreshold) {
            shippingFee = 0;
          } else {
            shippingFee = Math.max(deliveryMinCharge, distance * deliveryPerKmRate);
          }
        } else {
          shippingFee = deliveryMinCharge;
        }
      } else {
        shippingFee = deliveryMinCharge;
      }
    } catch (e) {
      console.error('Error calculating shipping fee:', e);
      shippingFee = deliveryMinCharge;
    }

    // Apply settings-based coupon discount if requested
    let couponDiscount = 0;
    if (req.body.coupon_code) {
      const [rows] = await connection.query(
        "SELECT key_name, key_value FROM settings WHERE key_name IN ('coupon_code', 'coupon_value')"
      );
      let dbCouponCode = 'SAVE100';
      let dbCouponValue = 100.00;
      rows.forEach(r => {
        if (r.key_name === 'coupon_code') dbCouponCode = r.key_value;
        if (r.key_name === 'coupon_value') dbCouponValue = parseFloat(r.key_value) || 0.00;
      });
      if (req.body.coupon_code.toUpperCase() === dbCouponCode.toUpperCase()) {
        couponDiscount = dbCouponValue;
      }
    }

    const totalAmount = Math.max(0, subtotal + tax + shippingFee - couponDiscount);

    // Verify wallet balance if paying with store credit
    if (paymentMethod === 'store_credit') {
      const [userRows] = await connection.query('SELECT wallet_balance FROM himalix_auth.users WHERE id = ?', [req.user.id]);
      const walletBalance = userRows.length > 0 ? parseFloat(userRows[0].wallet_balance) : 0.00;
      if (walletBalance < totalAmount) {
        await connection.rollback();
        return res.status(400).json({ message: `Insufficient store credit. Required: Rs. ${totalAmount.toFixed(2)}, available: Rs. ${walletBalance.toFixed(2)}` });
      }
    }

    // Generate custom tracking code (e.g., HMX-123456-ABCD)
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const timestampPart = Date.now().toString().slice(-6);
    const trackingCode = `HMX-${timestampPart}-${randomSuffix}`;

    // Calculate ETA range dynamically
    let maxProcessingTime = 1; // base 1 day processing delay
    cartItems.forEach(item => {
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
    let etaString = '';
    if (minDate.getMonth() === maxDate.getMonth() && minDate.getFullYear() === maxDate.getFullYear()) {
      etaString = `${minStr} - ${maxDate.getDate()}, ${minDate.getFullYear()}`;
    } else {
      etaString = `${minStr} - ${maxStr}`;
    }

    // Finalize shipping details to save computed shipping fee, distance, and ETA
    const finalizedShippingDetails = {
      ...shippingDetails,
      distanceKm: parseFloat(distance.toFixed(2)),
      shippingFee: parseFloat(shippingFee.toFixed(2)),
      expectedDeliveryETA: etaString
    };

    // Insert order record
    const initialStatus = 'pending';
    const paymentStatus = paymentMethod === 'store_credit' ? 'paid' : 'unpaid';
    const [orderResult] = await connection.query(
      `INSERT INTO orders (user_id, total_amount, status, tracking_code, shipping_address, payment_method, payment_status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, totalAmount, initialStatus, trackingCode, JSON.stringify(finalizedShippingDetails), paymentMethod, paymentStatus]
    );

    const orderId = orderResult.insertId;

    // Deduct wallet balance if paying with store credit
    if (paymentMethod === 'store_credit') {
      await connection.query('UPDATE himalix_auth.users SET wallet_balance = wallet_balance - ? WHERE id = ?', [totalAmount, req.user.id]);
      
      // Log wallet transaction ledger record (negative value indicates debit)
      await connection.query(
        "INSERT INTO wallet_transactions (user_id, amount, type, reference_id) VALUES (?, ?, 'purchase', ?)",
        [req.user.id, -totalAmount, `order_purchase_${orderId}`]
      );
    }

    // Insert order items and deduct stock
    for (const item of cartItems) {
      // Record order item
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES (?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, item.price]
      );

      // Update product inventory
      if (item.stock_type !== 'outsourced') {
        await connection.query(
          `UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?`,
          [item.quantity, item.product_id]
        );
      }
    }

    // Clear user's shopping cart
    await connection.query('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);

    await connection.commit();

    // Send notifications after transaction commits
    const itemsHtml = cartItems.map(item => `<li>${item.name} (Qty: ${item.quantity}) - रु ${(item.price * item.quantity).toFixed(2)}</li>`).join('');
    sendNotificationEmail(
      'order_placed',
      `New Order Placed: #${orderId}`,
      `<p>A new order has been placed on the Himalix Store.</p>
       <p>Order ID: <strong>#${orderId}</strong></p>
       <p>Tracking Code: <code>${trackingCode}</code></p>
       <p>Total Amount: <strong>रु ${totalAmount.toFixed(2)}</strong></p>
       <p>Payment Method: <strong>${paymentMethod}</strong></p>
       <p>Expected Delivery ETA: <strong>${etaString}</strong></p>
       <h6>Items Ordered:</h6>
       <ul>${itemsHtml}</ul>
       <h6>Shipping Details:</h6>
       <p>Name: ${shippingDetails.fullName}<br/>Phone: ${shippingDetails.phone}<br/>Address: ${shippingDetails.city}, ${shippingDetails.district}, ${shippingDetails.province}</p>`
    ).catch(err => console.error('Order notification email error:', err));

    const itemsHtmlUser = cartItems.map(item => `
      <li>
        <span style="font-weight: bold; color: #ffffff;">${item.name}</span> (Qty: ${item.quantity})
        <div style="float: right; color: #ffffff;">रु ${(item.price * item.quantity).toFixed(2)}</div>
      </li>
    `).join('');

    sendEmail({
      to: req.user.email,
      subject: `Order Confirmation #${orderId}`,
      title: 'Order Placed Successfully',
      htmlBody: `
        <p>Dear Customer,</p>
        <p>Thank you for shopping at the Himalix Store! We have received your order and are processing it.</p>
        <p><strong>Order Summary:</strong></p>
        <div class="highlight-box">
          <p>Order ID: <strong>#${orderId}</strong></p>
          <p>Tracking Code: <code>${trackingCode}</code></p>
          <p>Expected Delivery ETA: <strong>${etaString}</strong></p>
        </div>
        
        <p><strong>Items Ordered:</strong></p>
        <ul class="item-list">${itemsHtmlUser}</ul>
        
        <div style="margin-top: 20px; font-size: 16px; font-weight: bold; color: #ffffff;">
          Total Paid/Payable: <span style="float: right; color: #d4a017;">रु ${totalAmount.toFixed(2)}</span>
        </div>
        
        <p style="margin-top: 30px;"><strong>Shipping Details:</strong></p>
        <div class="highlight-box">
          <p><strong>Name:</strong> ${shippingDetails.fullName}</p>
          <p><strong>Phone:</strong> ${shippingDetails.phone}</p>
          <p><strong>Address:</strong> ${shippingDetails.addressLine || ''}, ${shippingDetails.city}, ${shippingDetails.district}, ${shippingDetails.province}</p>
        </div>
        
        <p>You can track the status of your order anytime in your profile page:</p>
        <a href="http://localhost:3000/store" class="btn">Track Order</a>
        <br/><br/>
        <p>Best regards,<br/>The Himalix Team</p>
      `
    }).catch(err => console.error('Order confirmation email error:', err));

    // Check for stock thresholds and send low stock emails
    for (const item of cartItems) {
      const remainingStock = item.stock_quantity - item.quantity;
      const [settingsRows] = await pool.query("SELECT key_value FROM settings WHERE key_name = 'low_stock_threshold'");
      const threshold = settingsRows.length > 0 ? parseInt(settingsRows[0].key_value, 10) || 5 : 5;
      if (remainingStock > 0 && remainingStock <= threshold) {
        sendNotificationEmail(
          'low_stock',
          `Low Stock Alert: ${item.name}`,
          `<p>Product <strong>${item.name}</strong> (SKU: <code>${item.product_id || item.name}</code>) has reached low stock level.</p>
           <p>Current Stock: <strong>${remainingStock}</strong> (Threshold: ${threshold})</p>`
        ).catch(err => console.error('Low stock email error:', err));
      }
    }

    res.status(201).json({
      message: 'Order created successfully',
      orderId,
      trackingCode,
      order_code: trackingCode,
      order: { order_code: trackingCode },
      totalAmount,
      status: initialStatus
    });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: 'Failed to process order' });
  } finally {
    connection.release();
  }
};
router.post('/checkout', checkoutHandler);
router.post('/', checkoutHandler);

// 2. Get User Order History
const historyHandler = async (req, res) => {
  try {
    // Fetch orders with order items joined
    const [rows] = await pool.query(
      `SELECT o.id, o.total_amount, o.status, o.tracking_code, o.shipping_address, o.payment_method, o.payment_status, o.created_at,
              oi.product_id, oi.quantity, oi.price, p.name as product_name
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    // Group items into nested order lists
    const ordersMap = {};
    for (const row of rows) {
      if (!ordersMap[row.id]) {
        ordersMap[row.id] = {
          id: row.id,
          total_amount: row.total_amount,
          status: row.status,
          tracking_code: row.tracking_code,
          shipping_address: row.shipping_address ? JSON.parse(row.shipping_address) : null,
          payment_method: row.payment_method,
          payment_status: row.payment_status,
          created_at: row.created_at,
          items: [],
        };
      }
      if (row.product_id) {
        ordersMap[row.id].items.push({
          product_id: row.product_id,
          name: row.product_name,
          quantity: row.quantity,
          price: row.price,
        });
      }
    }

    res.json(Object.values(ordersMap));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
router.get('/history', historyHandler);
router.get('/my', historyHandler);

// 3. Distance-based Shipping Cost Calculation
router.get('/shipping', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ message: 'Latitude and Longitude are required' });
    }

    const [settingsRows] = await pool.query(
      "SELECT key_name, key_value FROM settings WHERE key_name IN ('delivery_per_km_rate', 'delivery_min_charge', 'delivery_free_threshold')"
    );
    let deliveryPerKmRate = 15.00;
    let deliveryMinCharge = 50.00;
    let deliveryFreeThreshold = 2000.00;

    settingsRows.forEach(row => {
      if (row.key_name === 'delivery_per_km_rate') {
        deliveryPerKmRate = parseFloat(row.key_value);
      } else if (row.key_name === 'delivery_min_charge') {
        deliveryMinCharge = parseFloat(row.key_value);
      } else if (row.key_name === 'delivery_free_threshold') {
        deliveryFreeThreshold = parseFloat(row.key_value);
      }
    });

    const distance = calculateHaversineDistance(HQ_LAT, HQ_LNG, parseFloat(lat), parseFloat(lng));
    const shippingFee = Math.max(deliveryMinCharge, distance * deliveryPerKmRate);
    res.json({
      distance: parseFloat(distance.toFixed(2)),
      shipping_cost: parseFloat(shippingFee.toFixed(2))
    });
  } catch (err) {
    console.error('Error in shipping route:', err);
    res.status(500).json({ message: 'Server error calculating shipping fee' });
  }
});

// 4. Validate and Apply Coupon (Settings dynamic lookups)
router.post('/apply-coupon', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Coupon code is required' });

    const [rows] = await pool.query(
      "SELECT key_name, key_value FROM settings WHERE key_name IN ('coupon_code', 'coupon_value')"
    );
    let dbCouponCode = 'SAVE100';
    let dbCouponValue = 100.00;
    rows.forEach(r => {
      if (r.key_name === 'coupon_code') dbCouponCode = r.key_value;
      if (r.key_name === 'coupon_value') dbCouponValue = parseFloat(r.key_value) || 0.00;
    });

    if (code.toUpperCase() === dbCouponCode.toUpperCase()) {
      res.json({
        code: dbCouponCode,
        discount_amount: dbCouponValue
      });
    } else {
      res.status(400).json({ message: 'Invalid or expired coupon code' });
    }
  } catch (err) {
    console.error('Coupon validation error:', err);
    res.status(500).json({ message: 'Server error validating coupon code' });
  }
});

module.exports = router;
