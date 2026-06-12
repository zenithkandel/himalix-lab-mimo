const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Web Service API Placeholder' });
});

module.exports = router;
