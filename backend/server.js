require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const { initDB } = require('./config/db');

const app = express();
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
app.use('/api/auth', require('./routes/auth'));
app.use('/api/content', require('./routes/content'));
app.use('/api/admin', require('./routes/admin'));

// Store Routes
app.use('/api/store/products', require('./routes/store/products'));
app.use('/api/store/cart', require('./routes/store/cart'));
app.use('/api/store/orders', require('./routes/store/orders'));
app.use('/api/store/wallet', require('./routes/store/wallet'));
app.use('/api/store/reviews', require('./routes/store/reviews'));
app.use('/api/store/admin', require('./routes/store/admin'));

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
