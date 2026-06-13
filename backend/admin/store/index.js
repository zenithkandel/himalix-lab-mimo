const express = require('express');
const router = express.Router();
const { pool } = require('../../config/db');
const { authMiddleware, adminMiddleware } = require('../../middleware/auth');
const { sendNotificationEmail } = require('../../config/mail');

router.use(authMiddleware);
router.use(adminMiddleware);

const fs = require('fs');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.'));
    }
  }
});

// ============================================================
// FILE UPLOAD
// ============================================================
router.post('/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl: fileUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Upload failed' });
  }
});

router.post('/upload-multiple', upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    const fileUrls = req.files.map(file => `/uploads/${file.filename}`);
    res.json({ imageUrls: fileUrls });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Upload failed' });
  }
});

// ============================================================
// ANALYTICS
// ============================================================
router.get('/analytics', async (req, res) => {
  try {
    // Total revenue (all non-cancelled orders)
    const [[revenueRow]] = await pool.query(
      "SELECT COALESCE(SUM(total_amount), 0) AS total_revenue, COUNT(*) AS total_orders FROM orders WHERE status != 'cancelled'"
    );

    // Orders by status
    const [statusRows] = await pool.query(
      'SELECT status, COUNT(*) AS count, COALESCE(SUM(total_amount), 0) AS revenue FROM orders GROUP BY status'
    );

    // Average order value
    const [[avgRow]] = await pool.query(
      "SELECT COALESCE(AVG(total_amount), 0) AS avg_order_value FROM orders WHERE status != 'cancelled'"
    );

    // Revenue for last 7 days (including today)
    const [dailyRevenue] = await pool.query(`
      SELECT
        DATE(created_at) AS day,
        COUNT(*) AS order_count,
        COALESCE(SUM(total_amount), 0) AS revenue
      FROM orders
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        AND status != 'cancelled'
      GROUP BY DATE(created_at)
      ORDER BY day ASC
    `);

    // Build full 7-day array (fill missing days with 0)
    const dailyMap = {};
    dailyRevenue.forEach(r => {
      dailyMap[r.day.toISOString().split('T')[0]] = { order_count: r.order_count, revenue: Number(r.revenue) };
    });
    const daily7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      daily7.push({
        day: key,
        order_count: dailyMap[key]?.order_count || 0,
        revenue: dailyMap[key]?.revenue || 0,
      });
    }

    // Top 5 products by units ordered
    const [topProducts] = await pool.query(`
      SELECT p.id, p.name, p.sku, p.category, p.price,
             COALESCE(SUM(oi.quantity), 0) AS units_sold,
             COALESCE(SUM(oi.quantity * oi.price), 0) AS revenue_generated
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
      GROUP BY p.id
      ORDER BY units_sold DESC
      LIMIT 5
    `);

    // Category breakdown (stock & product count)
    const [categoryBreakdown] = await pool.query(`
      SELECT category,
             COUNT(*) AS product_count,
             SUM(stock_quantity) AS total_stock
      FROM products
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY product_count DESC
    `);

    // User counts by role
    const [userCounts] = await pool.query(
      'SELECT role, COUNT(*) AS count FROM himalix_auth.users GROUP BY role'
    );

    // Recent orders (last 10)
    const [recentOrders] = await pool.query(`
      SELECT o.id, o.total_amount, o.status, o.created_at, u.email
      FROM orders o
      LEFT JOIN himalix_auth.users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `);

    res.json({
      totalRevenue: Number(revenueRow.total_revenue),
      totalOrders: revenueRow.total_orders,
      avgOrderValue: Number(avgRow.avg_order_value),
      ordersByStatus: statusRows.map(r => ({ status: r.status, count: r.count, revenue: Number(r.revenue) })),
      daily7,
      topProducts: topProducts.map(p => ({
        ...p,
        units_sold: Number(p.units_sold),
        revenue_generated: Number(p.revenue_generated),
      })),
      categoryBreakdown,
      userCounts,
      recentOrders,
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ message: 'Server error fetching analytics' });
  }
});

// ============================================================
// PRODUCTS
// ============================================================
router.get('/products', async (req, res) => {
  try {
    const [products] = await pool.query('SELECT * FROM products ORDER BY name ASC');
    const [settingsRows] = await pool.query("SELECT key_value FROM settings WHERE key_name = 'low_stock_threshold'");
    const threshold = settingsRows.length > 0 ? parseInt(settingsRows[0].key_value, 10) || 5 : 5;

    const enriched = products.map(p => ({
      ...p,
      isLowStock: p.stock_quantity > 0 && p.stock_quantity <= threshold,
      isOutOfStock: p.stock_quantity === 0,
    }));

    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + p.stock_quantity, 0);
    const lowStockCount = enriched.filter(p => p.isLowStock).length;
    const outOfStockCount = enriched.filter(p => p.isOutOfStock).length;

    res.json({
      products: enriched,
      stats: { totalProducts, totalStock, lowStockCount, outOfStockCount },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/products', async (req, res) => {
  try {
    const { name, sku, description, technical_specs, price, cost_price, stock_quantity, image_url, image_urls, category, stock_type = 'in_stock', outsource_days = 0 } = req.body;

    if (!name || !sku || price === undefined || stock_quantity === undefined) {
      return res.status(400).json({ message: 'Name, sku, price, and stock_quantity are required' });
    }

    const specsJson = typeof technical_specs === 'object' ? JSON.stringify(technical_specs) : technical_specs || null;
    const imageUrlsJson = Array.isArray(image_urls) ? JSON.stringify(image_urls) : (typeof image_urls === 'string' ? image_urls : JSON.stringify([image_url || null]));
    const cost = cost_price !== undefined ? parseFloat(cost_price) : 0.00;

    const [result] = await pool.query(
      `INSERT INTO products (name, sku, description, technical_specs, price, cost_price, stock_quantity, image_url, image_urls, category, stock_type, outsource_days)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, sku, description || null, specsJson, price, cost, stock_quantity, image_url || null, imageUrlsJson, category || null, stock_type, Number(outsource_days)]
    );

    const [product] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    res.status(201).json(product[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/products/:id', async (req, res) => {
  try {
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(req.body)) {
      if (['name', 'sku', 'description', 'technical_specs', 'price', 'cost_price', 'stock_quantity', 'image_url', 'image_urls', 'category', 'stock_type', 'outsource_days'].includes(key)) {
        fields.push(`${key} = ?`);
        if (key === 'technical_specs' && typeof value === 'object') {
          values.push(JSON.stringify(value));
        } else if (key === 'image_urls' && Array.isArray(value)) {
          values.push(JSON.stringify(value));
        } else if (key === 'image_urls' && typeof value === 'string') {
          values.push(value);
        } else if (key === 'outsource_days') {
          values.push(Number(value));
        } else {
          values.push(value);
        }
      }
    }

    if (fields.length === 0) return res.status(400).json({ message: 'No valid fields to update' });

    values.push(req.params.id);
    await pool.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);

    // Trigger low stock check if stock_quantity was updated
    if (req.body.stock_quantity !== undefined) {
      const newStock = Number(req.body.stock_quantity);
      const [settingsRows] = await pool.query("SELECT key_value FROM settings WHERE key_name = 'low_stock_threshold'");
      const threshold = settingsRows.length > 0 ? parseInt(settingsRows[0].key_value, 10) || 5 : 5;
      if (newStock > 0 && newStock <= threshold) {
        const [prod] = await pool.query('SELECT name, sku FROM products WHERE id = ?', [req.params.id]);
        if (prod.length > 0) {
          sendNotificationEmail(
            'low_stock',
            `Low Stock Alert: ${prod[0].name}`,
            `<p>Product <strong>${prod[0].name}</strong> (SKU: <code>${prod[0].sku}</code>) has reached low stock level.</p>
             <p>Current Stock: <strong>${newStock}</strong> (Threshold: ${threshold})</p>`
          );
        }
      }
    }

    const [updated] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// USERS
// ============================================================
router.get('/users', async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT u.id, u.email, u.role, u.wallet_balance, u.avatar_url, u.created_at,
             CASE WHEN u.google_id IS NOT NULL THEN 'google' ELSE 'local' END AS auth_provider,
             COUNT(o.id) AS order_count
      FROM himalix_auth.users u
      LEFT JOIN orders o ON u.id = o.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { email, role } = req.body;
    const updateFields = [];
    const values = [];

    if (email) {
      updateFields.push('email = ?');
      values.push(email);
    }
    if (role) {
      if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      updateFields.push('role = ?');
      values.push(role);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'Nothing to update' });
    }

    values.push(req.params.id);
    await pool.query(`UPDATE himalix_auth.users SET ${updateFields.join(', ')} WHERE id = ?`, values);
    const [updated] = await pool.query('SELECT id, email, role, avatar_url, created_at FROM himalix_auth.users WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/users/:id/password', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    await pool.query('UPDATE himalix_auth.users SET password_hash = ? WHERE id = ?', [hashedPassword, req.params.id]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    await pool.query('UPDATE himalix_auth.users SET role = ? WHERE id = ?', [role, req.params.id]);
    res.json({ message: 'Role updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/users/:id/orders', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT o.id, o.total_amount, o.status, o.tracking_code, o.created_at,
             oi.product_id, oi.quantity, oi.price, p.name AS product_name
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `, [req.params.id]);

    const ordersMap = {};
    for (const row of rows) {
      if (!ordersMap[row.id]) {
        ordersMap[row.id] = {
          id: row.id,
          total: row.total_amount,
          status: row.status,
          tracking_code: row.tracking_code,
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

router.delete('/users/:id', async (req, res) => {
  try {
    if (Number(req.user.id) === Number(req.params.id)) {
      return res.status(400).json({ message: 'You cannot delete your own admin account' });
    }
    const [result] = await pool.query('DELETE FROM himalix_auth.users WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================================
// CART AUDITS
// ============================================================
router.get('/carts', async (req, res) => {
  try {
    const [cartItems] = await pool.query(`
      SELECT ci.id, ci.user_id, u.email, ci.product_id, p.name as product_name, p.sku, p.price, p.category, ci.quantity
      FROM cart_items ci
      JOIN himalix_auth.users u ON ci.user_id = u.id
      JOIN products p ON ci.product_id = p.id
      ORDER BY ci.user_id
    `);
    res.json(cartItems);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================================
// ORDERS
// ============================================================
router.get('/orders', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT o.id, o.user_id, u.email, o.total_amount, o.status, o.tracking_code, o.shipping_address, o.payment_method, o.payment_status, o.created_at,
             oi.product_id, oi.quantity, oi.price, p.name as product_name
      FROM orders o
      LEFT JOIN himalix_auth.users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      ORDER BY o.created_at DESC
    `);

    const ordersMap = {};
    for (const row of rows) {
      if (!ordersMap[row.id]) {
        ordersMap[row.id] = {
          id: row.id,
          user_id: row.user_id,
          email: row.email || 'Guest / Deleted',
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

router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status, tracking_code, payment_status } = req.body;

    const updates = [];
    const params = [];

    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    if (tracking_code !== undefined) {
      updates.push('tracking_code = ?');
      params.push(tracking_code);
    }
    if (payment_status !== undefined) {
      updates.push('payment_status = ?');
      params.push(payment_status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    params.push(req.params.id);
    const [result] = await pool.query(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ message: 'Order updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/orders/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM orders WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================================
// SETTINGS (Named keys)
// ============================================================
router.get('/settings', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT key_name, key_value FROM settings');
    const settings = {};
    rows.forEach(r => {
      if (r.key_name === 'google_client_id') settings.googleClientId = r.key_value;
      if (r.key_name === 'google_client_secret') settings.googleClientSecret = r.key_value;
      if (r.key_name === 'google_auth_enabled') settings.googleAuthEnabled = r.key_value === '1';
      if (r.key_name === 'low_stock_threshold') settings.lowStockThreshold = parseInt(r.key_value, 10) || 5;
      if (r.key_name === 'sales_tax_rate') settings.salesTaxRate = parseFloat(r.key_value) || 0;
      if (r.key_name === 'maintenance_mode') settings.maintenanceMode = r.key_value === '1';
      if (r.key_name === 'store_banner_text') settings.storeBannerText = r.key_value;
      if (r.key_name === 'delivery_per_km_rate') settings.deliveryPerKmRate = parseFloat(r.key_value) || 0;
      if (r.key_name === 'delivery_min_charge') settings.deliveryMinCharge = parseFloat(r.key_value) || 0;
      if (r.key_name === 'delivery_free_threshold') settings.deliveryFreeThreshold = parseFloat(r.key_value) || 0;
      // SMTP
      if (r.key_name === 'smtp_host') settings.smtpHost = r.key_value;
      if (r.key_name === 'smtp_port') settings.smtpPort = r.key_value;
      if (r.key_name === 'smtp_user') settings.smtpUser = r.key_value;
      if (r.key_name === 'smtp_pass') settings.smtpPass = r.key_value;
      if (r.key_name === 'smtp_secure') settings.smtpSecure = r.key_value === '1';
      // Emergency contact
      if (r.key_name === 'emergency_contact_phone') settings.emergencyContactPhone = r.key_value;
      if (r.key_name === 'emergency_contact_email') settings.emergencyContactEmail = r.key_value;
    });
    res.json(settings);
  } catch (err) {
    console.error('Fetch settings error:', err);
    res.status(500).json({ message: 'Server error fetching settings' });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const {
      googleClientId,
      googleClientSecret,
      googleAuthEnabled,
      lowStockThreshold,
      salesTaxRate,
      maintenanceMode,
      storeBannerText,
      deliveryPerKmRate,
      deliveryMinCharge,
      deliveryFreeThreshold,
      // SMTP
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      smtpSecure,
      // Emergency contact
      emergencyContactPhone,
      emergencyContactEmail,
    } = req.body;

    const updates = [
      ['google_client_id', googleClientId !== undefined ? googleClientId : null],
      ['google_client_secret', googleClientSecret !== undefined ? googleClientSecret : null],
      ['google_auth_enabled', googleAuthEnabled ? '1' : '0'],
      ['low_stock_threshold', String(lowStockThreshold !== undefined ? lowStockThreshold : '5')],
      ['sales_tax_rate', String(salesTaxRate !== undefined ? salesTaxRate : '0')],
      ['maintenance_mode', maintenanceMode ? '1' : '0'],
      ['store_banner_text', storeBannerText !== undefined ? storeBannerText : ''],
      ['delivery_per_km_rate', String(deliveryPerKmRate !== undefined ? deliveryPerKmRate : '15.00')],
      ['delivery_min_charge', String(deliveryMinCharge !== undefined ? deliveryMinCharge : '50.00')],
      ['delivery_free_threshold', String(deliveryFreeThreshold !== undefined ? deliveryFreeThreshold : '2000.00')],
      // SMTP
      ['smtp_host', smtpHost !== undefined ? smtpHost : ''],
      ['smtp_port', smtpPort !== undefined ? String(smtpPort) : '587'],
      ['smtp_user', smtpUser !== undefined ? smtpUser : ''],
      ['smtp_pass', smtpPass !== undefined ? smtpPass : ''],
      ['smtp_secure', smtpSecure ? '1' : '0'],
      // Emergency contact
      ['emergency_contact_phone', emergencyContactPhone !== undefined ? emergencyContactPhone : ''],
      ['emergency_contact_email', emergencyContactEmail !== undefined ? emergencyContactEmail : ''],
    ];

    for (const [key, value] of updates) {
      if (value !== null) {
        await pool.query('INSERT INTO settings (key_name, key_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE key_value = ?', [key, value, value]);
      }
    }

    res.json({ message: 'Settings updated successfully' });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ message: 'Server error updating settings' });
  }
});

// ============================================================
// SETTINGS (Raw key/value DB editor)
// ============================================================
router.get('/settings/raw', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT key_name, key_value FROM settings ORDER BY key_name ASC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/settings/raw', async (req, res) => {
  try {
    const { key_name, key_value } = req.body;
    if (!key_name) return res.status(400).json({ message: 'key_name is required' });
    await pool.query(
      'INSERT INTO settings (key_name, key_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE key_value = ?',
      [key_name, key_value || '', key_value || '']
    );
    res.json({ message: 'Setting upserted', key_name, key_value });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/settings/raw/:key', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM settings WHERE key_name = ?', [req.params.key]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Setting not found' });
    res.json({ message: 'Setting deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Manual Wallet Credit Deposit (eSewa manually processed by admin)
router.post('/users/:id/credit', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { amount, type = 'deposit', reference_id } = req.body;
    const userId = req.params.id;

    if (amount === undefined || isNaN(parseFloat(amount))) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    const parsedAmount = parseFloat(amount);

    await connection.beginTransaction();

    // Verify user exists
    const [users] = await connection.query('SELECT id, wallet_balance FROM himalix_auth.users WHERE id = ?', [userId]);
    if (users.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'User not found' });
    }

    // Increment wallet balance
    await connection.query('UPDATE himalix_auth.users SET wallet_balance = wallet_balance + ? WHERE id = ?', [parsedAmount, userId]);

    // Insert wallet transaction ledger record
    await connection.query(
      "INSERT INTO wallet_transactions (user_id, amount, type, reference_id) VALUES (?, ?, ?, ?)",
      [userId, parsedAmount, type, reference_id || `admin_deposit_by_${req.user.id}`]
    );

    await connection.commit();

    const [updatedUser] = await connection.query('SELECT id, email, wallet_balance FROM himalix_auth.users WHERE id = ?', [userId]);

    res.json({
      message: 'Wallet balance updated successfully',
      user: updatedUser[0],
      depositAmount: parsedAmount
    });
  } catch (err) {
    await connection.rollback();
    console.error('Manual credit error:', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
});

// GET /api/admin/reviews - Fetch all reviews in system
router.get('/reviews', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.id, r.rating, r.comment, r.created_at, r.product_id, p.name AS product_name, p.sku AS product_sku, u.email AS user_email
      FROM reviews r
      JOIN products p ON r.product_id = p.id
      JOIN himalix_auth.users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Fetch all reviews error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/admin/reviews/:id - Delete any review
router.delete('/reviews/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM reviews WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Review not found' });
    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    console.error('Delete review error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/wallet/transactions - Fetch all wallet transactions
router.get('/wallet/transactions', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT wt.id, wt.user_id, wt.amount, wt.type, wt.reference_id, wt.created_at, u.email AS user_email
      FROM wallet_transactions wt
      JOIN himalix_auth.users u ON wt.user_id = u.id
      ORDER BY wt.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Fetch wallet transactions error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/social-claims - Fetch all follow claims
router.get('/social-claims', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT sc.user_id, sc.platform, sc.claimed_at, u.email AS user_email
      FROM social_claims sc
      JOIN himalix_auth.users u ON sc.user_id = u.id
      ORDER BY sc.claimed_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Fetch social claims error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/notification-receivers
router.get('/notification-receivers', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM email_notification_receivers ORDER BY email_address ASC');
    res.json(rows);
  } catch (err) {
    console.error('Fetch notification receivers error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/notification-receivers
router.post('/notification-receivers', async (req, res) => {
  try {
    const { email_address, notify_on_order_placed = 1, notify_on_low_stock = 1, notify_on_user_registered = 1 } = req.body;
    if (!email_address) return res.status(400).json({ message: 'Email address is required' });

    const [result] = await pool.query(
      `INSERT INTO email_notification_receivers (email_address, notify_on_order_placed, notify_on_low_stock, notify_on_user_registered)
       VALUES (?, ?, ?, ?)`,
      [email_address.trim(), notify_on_order_placed ? 1 : 0, notify_on_low_stock ? 1 : 0, notify_on_user_registered ? 1 : 0]
    );
    res.status(201).json({ id: result.insertId, email_address, notify_on_order_placed, notify_on_low_stock, notify_on_user_registered });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Receiver email already exists' });
    }
    console.error('Create notification receiver error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/admin/notification-receivers/:id
router.put('/notification-receivers/:id', async (req, res) => {
  try {
    const { notify_on_order_placed, notify_on_low_stock, notify_on_user_registered } = req.body;
    const updates = [];
    const params = [];

    if (notify_on_order_placed !== undefined) {
      updates.push('notify_on_order_placed = ?');
      params.push(notify_on_order_placed ? 1 : 0);
    }
    if (notify_on_low_stock !== undefined) {
      updates.push('notify_on_low_stock = ?');
      params.push(notify_on_low_stock ? 1 : 0);
    }
    if (notify_on_user_registered !== undefined) {
      updates.push('notify_on_user_registered = ?');
      params.push(notify_on_user_registered ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'Nothing to update' });
    }

    params.push(req.params.id);
    const [result] = await pool.query(`UPDATE email_notification_receivers SET ${updates.join(', ')} WHERE id = ?`, params);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Receiver not found' });
    res.json({ message: 'Receiver updated successfully' });
  } catch (err) {
    console.error('Update notification receiver error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/admin/notification-receivers/:id
router.delete('/notification-receivers/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM email_notification_receivers WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Receiver not found' });
    res.json({ message: 'Receiver deleted successfully' });
  } catch (err) {
    console.error('Delete notification receiver error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/store/admin/logs — Fetch combined transaction logs, social claims, and contact helpline messages
router.get('/logs', async (req, res) => {
  try {
    // 1. Wallet transactions
    const [walletTx] = await pool.query(`
      SELECT wt.id, wt.user_id, wt.amount, wt.type, wt.reference_id, wt.created_at, u.email AS user_email
      FROM wallet_transactions wt
      LEFT JOIN himalix_auth.users u ON wt.user_id = u.id
      ORDER BY wt.created_at DESC
      LIMIT 100
    `);

    // 2. Social claims
    const [claims] = await pool.query(`
      SELECT sc.user_id, sc.platform, sc.claimed_at, u.email AS user_email
      FROM social_claims sc
      LEFT JOIN himalix_auth.users u ON sc.user_id = u.id
      ORDER BY sc.claimed_at DESC
      LIMIT 100
    `);

    // 3. Contact messages (from himalix_portfolio database)
    const [contactMsgs] = await pool.query(`
      SELECT * FROM himalix_portfolio.contact_messages
      ORDER BY created_at DESC
      LIMIT 100
    `);

    res.json({
      walletTransactions: walletTx,
      socialClaims: claims,
      contactMessages: contactMsgs
    });
  } catch (err) {
    console.error('Fetch logs error:', err);
    res.status(500).json({ message: 'Server error fetching logs' });
  }
});

module.exports = router;

