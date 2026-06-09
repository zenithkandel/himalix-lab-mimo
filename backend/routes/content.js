const express = require('express');
const { pool } = require('../config/db');

const router = express.Router();

// GET / - Fetch all content for landing page
router.get('/', async (req, res) => {
  try {
    const [contentRows] = await pool.query('SELECT * FROM landing_content');
    const content = {};
    contentRows.forEach(row => {
      content[row.section_name] = {
        id: row.id,
        ...JSON.parse(row.content_value)
      };
    });

    const [services] = await pool.query(
      'SELECT * FROM services WHERE is_active = TRUE ORDER BY display_order ASC'
    );

    const [team] = await pool.query(
      'SELECT * FROM team_members WHERE is_active = TRUE ORDER BY display_order ASC'
    );

    const [testimonials] = await pool.query(
      'SELECT * FROM testimonials WHERE is_active = TRUE ORDER BY display_order ASC'
    );

    const [settingsRows] = await pool.query('SELECT * FROM site_settings');
    const settings = {};
    settingsRows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });

    res.json({ content, services, team, testimonials, settings });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /section/:section - Fetch content for a specific section
router.get('/section/:section', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM landing_content WHERE section_name = ?',
      [req.params.section]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Section not found' });
    }

    const row = rows[0];
    res.json({
      id: row.id,
      section_name: row.section_name,
      ...JSON.parse(row.content_value)
    });
  } catch (error) {
    console.error('Get section error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /contact - Submit contact message
router.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    await pool.query(
      'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
      [name, email, subject || '', message]
    );

    res.status(201).json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
