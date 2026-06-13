const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET / - Retrieve cart items
router.get('/', async (req, res) => {
  try {
    const [items] = await pool.query(
      `SELECT ci.id, ci.product_id, ci.quantity, p.name, p.name AS product_name, p.price, p.image_url, p.stock_quantity, p.stock_type, p.outsource_days
       FROM himalix_store.cart_items ci
       JOIN himalix_store.products p ON ci.product_id = p.id
       WHERE ci.user_id = ?`,
      [req.user.id]
    );
    res.json({ success: true, cart: items, items: items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Helper: Add item logic
const addCartItem = async (req, res) => {
  try {
    const { product_id, productId, quantity = 1 } = req.body;
    const targetProductId = product_id || productId;
    if (!targetProductId) {
      return res.status(400).json({ success: false, message: 'product_id or productId is required' });
    }

    const [productRows] = await pool.query('SELECT id, name, stock_quantity FROM himalix_store.products WHERE id = ?', [targetProductId]);
    if (productRows.length === 0) return res.status(404).json({ success: false, message: 'Product not found' });

    const [existing] = await pool.query(
      'SELECT id, quantity FROM himalix_store.cart_items WHERE user_id = ? AND product_id = ?',
      [req.user.id, targetProductId]
    );

    let cartItem;
    if (existing.length > 0) {
      const newQty = existing[0].quantity + quantity;
      await pool.query('UPDATE himalix_store.cart_items SET quantity = ? WHERE id = ?', [newQty, existing[0].id]);
      cartItem = { id: existing[0].id, product_id: targetProductId, quantity: newQty };
    } else {
      const [result] = await pool.query(
        'INSERT INTO himalix_store.cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [req.user.id, targetProductId, quantity]
      );
      cartItem = { id: result.insertId, product_id: targetProductId, quantity };
    }

    res.status(201).json({ success: true, message: 'Added to cart', ...cartItem });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST / and POST /add
router.post('/', addCartItem);
router.post('/add', addCartItem);

// Helper: Update item logic
const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { cartItemId, quantity } = req.body;

    let targetProductId = productId;
    
    if (cartItemId) {
      const [rows] = await pool.query('SELECT product_id FROM himalix_store.cart_items WHERE id = ? AND user_id = ?', [cartItemId, req.user.id]);
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Cart item not found' });
      targetProductId = rows[0].product_id;
    }

    if (!targetProductId) {
      return res.status(400).json({ success: false, message: 'productId or cartItemId is required' });
    }

    await pool.query(
      'UPDATE himalix_store.cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?',
      [quantity, req.user.id, targetProductId]
    );

    const [updated] = await pool.query('SELECT id, product_id, quantity FROM himalix_store.cart_items WHERE user_id = ? AND product_id = ?', [req.user.id, targetProductId]);
    res.json({ success: true, message: 'Cart updated', ...(updated[0] || {}) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /update and PUT /:productId
router.put('/update', updateCartItem);
router.put('/:productId', updateCartItem);

// Helper: Delete item logic
const deleteCartItem = async (req, res) => {
  try {
    const { productId, id } = req.params;
    let result;
    if (id) {
      [result] = await pool.query('DELETE FROM himalix_store.cart_items WHERE id = ? AND user_id = ?', [id, req.user.id]);
    } else {
      [result] = await pool.query('DELETE FROM himalix_store.cart_items WHERE product_id = ? AND user_id = ?', [productId, req.user.id]);
    }

    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Cart item not found' });
    res.json({ success: true, message: 'Item removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /remove/:id and DELETE /:productId
router.delete('/remove/:id', deleteCartItem);
router.delete('/:productId', deleteCartItem);

// DELETE / - Clear Cart
router.delete('/', async (req, res) => {
  try {
    await pool.query('DELETE FROM himalix_store.cart_items WHERE user_id = ?', [req.user.id]);
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
