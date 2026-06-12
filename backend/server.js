require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const { initDB } = require('./config/db');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // allow images to be loaded by frontend
}));

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./auth'));
app.use('/api/content', require('./portfolio'));
app.use('/api/admin', require('./admin/portfolio'));

// Store Routes
app.use('/api/store/products', require('./store/products'));
app.use('/api/store/cart', require('./store/cart'));
app.use('/api/store/orders', require('./store/orders'));
app.use('/api/store/wallet', require('./store/wallet'));
app.use('/api/store/reviews', require('./store/reviews'));
app.use('/api/store/admin', require('./admin/store'));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack || err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function start() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();
