const express = require('express');
const { pool } = require('../config/db');
const { sendContactForwardEmail } = require('../config/mail');

const router = express.Router();

// GET / - Fetch all content for landing page
router.get('/', async (req, res) => {
  try {
    const [contentRows] = await pool.query('SELECT * FROM himalix_portfolio.landing_content');
    const content = {};
    contentRows.forEach(row => {
      if (!content[row.section]) {
        content[row.section] = {};
      }
      let val = row.content_value;
      if (row.content_type === 'json' && typeof val === 'string') {
        try { val = JSON.parse(val); } catch (e) {}
      }
      content[row.section][row.content_key] = val;
    });

    const [services] = await pool.query(
      'SELECT * FROM himalix_portfolio.services WHERE is_active = TRUE ORDER BY display_order ASC'
    );
    const parsedServices = services.map(s => ({
      id: s.id,
      title: s.title,
      description: s.description,
      icon: s.icon_class,
      link: s.link_url,
      cta: s.subtitle,
      features: typeof s.features === 'string' ? JSON.parse(s.features) : (s.features || [])
    }));

    const [team] = await pool.query(
      'SELECT * FROM himalix_portfolio.team_members WHERE is_active = TRUE ORDER BY display_order ASC'
    );
    const parsedTeam = team.map(t => {
      let socials = [];
      try {
        const links = typeof t.social_links === 'string' ? JSON.parse(t.social_links) : (t.social_links || {});
        socials = Object.entries(links).map(([platform, url]) => ({ platform, url }));
      } catch (e) {}
      return {
        id: t.id,
        name: t.name,
        role: t.role,
        bio: t.bio,
        avatar_url: t.image_url,
        socials
      };
    });

    const [testimonials] = await pool.query(
      'SELECT * FROM himalix_portfolio.testimonials WHERE is_active = TRUE ORDER BY display_order ASC'
    );
    const parsedTestimonials = testimonials.map(t => ({
      id: t.id,
      name: t.client_name,
      title: t.client_title,
      rating: t.rating,
      text: t.content,
      company: t.company || '',
      image_url: t.image_url || ''
    }));

    const [statisticsRows] = await pool.query(
      'SELECT * FROM himalix_portfolio.statistics WHERE is_active = TRUE ORDER BY display_order ASC'
    );
    const parsedStatistics = statisticsRows.map(s => ({
      id: s.id,
      icon: s.icon_class,
      value: s.stat_value,
      suffix: s.suffix,
      label: s.label
    }));

    const [settingsRows] = await pool.query('SELECT * FROM himalix_portfolio.labs_site_settings');
    const settings = {};
    settingsRows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });

    res.json({ content, services: parsedServices, team: parsedTeam, testimonials: parsedTestimonials, statistics: parsedStatistics, settings });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /section/:section - Fetch content for a specific section
router.get('/section/:section', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM himalix_portfolio.landing_content WHERE section = ?',
      [req.params.section]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Section not found' });
    }

    const sectionData = {};
    rows.forEach(row => {
      sectionData[row.content_key] = row.content_value;
    });

    res.json(sectionData);
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
      'INSERT INTO himalix_portfolio.contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
      [name, email, subject || '', message]
    );

    // Forward the message to email in the background
    sendContactForwardEmail({ name, email, subject, message }).catch(err => {
      console.error('SMTP message forwarding background error:', err);
    });

    res.status(201).json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
