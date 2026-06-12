const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const { sendNotificationEmail } = require('../../config/mail');

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
router.post('/checkout', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { shippingDetails, paymentMethod = 'cash' } = req.body;
    if (!shippingDetails || !shippingDetails.fullName || !shippingDetails.email || !shippingDetails.phone || !shippingDetails.province || !shippingDetails.district || !shippingDetails.city || !shippingDetails.receivingLocation) {
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
      const coords = shippingDetails.receivingLocation.split(',').map(c => parseFloat(c.trim()));
      if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        distance = calculateHaversineDistance(HQ_LAT, HQ_LNG, coords[0], coords[1]);
        if (deliveryFreeThreshold > 0 && subtotal >= deliveryFreeThreshold) {
          shippingFee = 0;
        } else {
          shippingFee = Math.max(deliveryMinCharge, distance * deliveryPerKmRate);
        }
      }
    } catch (e) {
      console.error('Error calculating shipping fee:', e);
      shippingFee = deliveryMinCharge;
    }

    const totalAmount = subtotal + tax + shippingFee;

    // Verify wallet balance if paying with store credit
    if (paymentMethod === 'store_credit') {
      const [userRows] = await connection.query('SELECT wallet_balance FROM users WHERE id = ?', [req.user.id]);
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
      await connection.query('UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?', [totalAmount, req.user.id]);
      
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
});

// 2. Get User Order History
router.get('/history', async (req, res) => {
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
          total: row.total_amount,
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
});

module.exports = router;
