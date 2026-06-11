const express = require('express');
const router = express.Router();
const { pool } = require('../../config/db');
const { authMiddleware } = require('../../middleware/auth');

// 1. Get Reviews for a Product
router.get('/:product_id', async (req, res) => {
  try {
    const productId = req.params.product_id;
    const [rows] = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.email, u.avatar_url
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC`,
      [productId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Fetch reviews error:', err);
    res.status(500).json({ message: 'Server error fetching reviews' });
  }
});

// 2. Submit a Product Review
router.post('/:product_id', authMiddleware, async (req, res) => {
  try {
    const productId = req.params.product_id;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    if (rating === undefined || isNaN(parseInt(rating)) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Valid rating (1-5) is required' });
    }

    // Check if product exists
    const [products] = await pool.query('SELECT id FROM products WHERE id = ?', [productId]);
    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Insert the review
    const [result] = await pool.query(
      'INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)',
      [userId, productId, parseInt(rating), comment || null]
    );

    const [insertedReview] = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.email, u.avatar_url
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: 'Review submitted successfully',
      review: insertedReview[0]
    });
  } catch (err) {
    console.error('Submit review error:', err);
    res.status(500).json({ message: 'Server error submitting review' });
  }
});

module.exports = router;
