const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const [items] = await pool.query(
      `SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price, p.image_url, p.stock_quantity, p.stock_type, p.outsource_days
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = ?`,
      [req.user.id]
    );
    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/add', async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const [productRows] = await pool.query('SELECT id, name, stock_quantity FROM products WHERE id = ?', [productId]);
    if (productRows.length === 0) return res.status(404).json({ message: 'Product not found' });

    const product = productRows[0];



    const [existing] = await pool.query(
      'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?',
      [req.user.id, productId]
    );

    let cartItem;
    if (existing.length > 0) {
      const newQty = existing[0].quantity + quantity;

      await pool.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, existing[0].id]);
      const [updated] = await pool.query('SELECT id, product_id, quantity FROM cart_items WHERE id = ?', [existing[0].id]);
      cartItem = updated[0];
    } else {
      const [result] = await pool.query(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [req.user.id, productId, quantity]
      );
      cartItem = { id: result.insertId, product_id: productId, quantity };
    }

    res.status(201).json(cartItem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/update', async (req, res) => {
  try {
    const { cartItemId, quantity } = req.body;

    const [cartRows] = await pool.query(
      'SELECT ci.id, ci.product_id, ci.quantity FROM cart_items ci WHERE ci.id = ? AND ci.user_id = ?',
      [cartItemId, req.user.id]
    );
    if (cartRows.length === 0) return res.status(404).json({ message: 'Cart item not found' });

    const [productRows] = await pool.query('SELECT name, stock_quantity FROM products WHERE id = ?', [cartRows[0].product_id]);
    const product = productRows[0];

    await pool.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, cartItemId]);
    const [updated] = await pool.query('SELECT id, product_id, quantity FROM cart_items WHERE id = ?', [cartItemId]);
    res.json(updated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/remove/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM cart_items WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Cart item not found' });
    res.json({ message: 'Item removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
