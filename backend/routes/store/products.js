const express = require('express');
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/db');

const router = express.Router();

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Ignore token errors
    }
  }
  next();
};

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { search, category, sort, page = 1, limit = 12 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 12));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('(name LIKE ? OR description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }



    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    let orderClause = 'ORDER BY created_at DESC';
    if (sort === 'price_asc') orderClause = 'ORDER BY price ASC';
    else if (sort === 'price_desc') orderClause = 'ORDER BY price DESC';
    else if (sort === 'newest') orderClause = 'ORDER BY created_at DESC';

    const countQuery = `SELECT COUNT(*) as total FROM products ${whereClause}`;
    const [countRows] = await pool.query(countQuery, params);
    const total = countRows[0].total;
    const totalPages = Math.ceil(total / limitNum);

    const dataQuery = `SELECT * FROM products ${whereClause} ${orderClause} LIMIT ? OFFSET ?`;
    const [products] = await pool.query(dataQuery, [...params, limitNum, offset]);

    res.json({ products, total, page: pageNum, totalPages });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const product = rows[0];

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
