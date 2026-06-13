const express = require('express');
const multer = require('multer');
const path = require('path');
const { pool } = require('../../config/db');
const { authMiddleware, adminMiddleware } = require('../../middleware/auth');

const router = express.Router();

// Apply auth + admin middleware to all routes
router.use(authMiddleware, adminMiddleware);

// Multer config for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// ==================== CONTENT MANAGEMENT ====================

// GET /content
router.get('/content', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM himalix_portfolio.landing_content ORDER BY id ASC');
    const content = {};
    rows.forEach(row => {
      if (!content[row.section]) {
        content[row.section] = {};
      }
      let val = row.content_value;
      if (row.content_type === 'json' && typeof val === 'string') {
        try { val = JSON.parse(val); } catch (e) {}
      }
      content[row.section][row.content_key] = val;
    });
    res.json({ content });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /content/:section
router.put('/content/:section', async (req, res) => {
  try {
    const { section } = req.params;
    const data = req.body;

    for (const [key, val] of Object.entries(data)) {
      const isJson = typeof val === 'object';
      const contentVal = isJson ? JSON.stringify(val) : String(val);
      const contentType = isJson ? 'json' : 'text';

      await pool.query(
        `INSERT INTO himalix_portfolio.landing_content (section, content_key, content_value, content_type)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE content_value = ?, content_type = ?`,
        [section, key, contentVal, contentType, contentVal, contentType]
      );
    }

    res.json({ message: `Section ${section} updated successfully` });
  } catch (error) {
    console.error('Update section error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /content/:id (legacy/individual)
router.put('/content/id/:id', async (req, res) => {
  try {
    const { content_value } = req.body;
    if (!content_value) {
      return res.status(400).json({ error: 'content_value is required' });
    }

    const [result] = await pool.query(
      'UPDATE himalix_portfolio.landing_content SET content_value = ? WHERE id = ?',
      [JSON.stringify(content_value), req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const [rows] = await pool.query('SELECT * FROM himalix_portfolio.landing_content WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /content/bulk
router.put('/content/bulk', async (req, res) => {
  try {
    const { updates } = req.body;
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'updates array is required' });
    }

    for (const update of updates) {
      await pool.query(
        'UPDATE himalix_portfolio.landing_content SET content_value = ? WHERE id = ?',
        [JSON.stringify(update.content_value), update.id]
      );
    }

    res.json({ message: 'Content updated successfully' });
  } catch (error) {
    console.error('Bulk update content error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== SERVICES ====================

// GET /services
router.get('/services', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM himalix_portfolio.services ORDER BY display_order ASC');
    res.json(rows);
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /services
router.post('/services', async (req, res) => {
  try {
    const { title, subtitle, description, icon_class, features, link_url, display_order, is_active } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const [result] = await pool.query(
      `INSERT INTO himalix_portfolio.services (title, subtitle, description, icon_class, features, link_url, display_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, subtitle || '', description || '', icon_class || '', JSON.stringify(features || []), link_url || '#', display_order || 0, is_active !== false]
    );

    const [rows] = await pool.query('SELECT * FROM himalix_portfolio.services WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /services/:id
router.put('/services/:id', async (req, res) => {
  try {
    const { title, subtitle, description, icon_class, features, link_url, display_order, is_active } = req.body;

    const [result] = await pool.query(
      `UPDATE himalix_portfolio.services SET title = ?, subtitle = ?, description = ?, icon_class = ?, features = ?, link_url = ?, display_order = ?, is_active = ?
       WHERE id = ?`,
      [title, subtitle || '', description || '', icon_class || '', JSON.stringify(features || []), link_url || '#', display_order || 0, is_active !== false, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const [rows] = await pool.query('SELECT * FROM himalix_portfolio.services WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /services/:id
router.delete('/services/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM himalix_portfolio.services WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== TEAM MEMBERS ====================

// GET /team
router.get('/team', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM himalix_portfolio.team_members ORDER BY display_order ASC');
    res.json(rows);
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /team
router.post('/team', async (req, res) => {
  try {
    const { name, role, bio, image_url, social_links, display_order, is_active } = req.body;

    if (!name || !role) {
      return res.status(400).json({ error: 'Name and role are required' });
    }

    const [result] = await pool.query(
      `INSERT INTO himalix_portfolio.team_members (name, role, bio, image_url, social_links, display_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, role, bio || '', image_url || '', JSON.stringify(social_links || {}), display_order || 0, is_active !== false]
    );

    const [rows] = await pool.query('SELECT * FROM himalix_portfolio.team_members WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create team member error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /team/:id
router.put('/team/:id', async (req, res) => {
  try {
    const { name, role, bio, image_url, social_links, display_order, is_active } = req.body;

    const [result] = await pool.query(
      `UPDATE himalix_portfolio.team_members SET name = ?, role = ?, bio = ?, image_url = ?, social_links = ?, display_order = ?, is_active = ?
       WHERE id = ?`,
      [name, role, bio || '', image_url || '', JSON.stringify(social_links || {}), display_order || 0, is_active !== false, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    const [rows] = await pool.query('SELECT * FROM himalix_portfolio.team_members WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Update team member error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /team/:id
router.delete('/team/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM himalix_portfolio.team_members WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Team member not found' });
    }
    res.json({ message: 'Team member deleted successfully' });
  } catch (error) {
    console.error('Delete team member error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== TESTIMONIALS ====================

// GET /testimonials
router.get('/testimonials', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM himalix_portfolio.testimonials ORDER BY display_order ASC');
    res.json(rows);
  } catch (error) {
    console.error('Get testimonials error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /testimonials
router.post('/testimonials', async (req, res) => {
  try {
    const { client_name, client_title, company, content, rating, image_url, is_active, display_order } = req.body;

    if (!client_name || !content) {
      return res.status(400).json({ error: 'Client name and content are required' });
    }

    const [result] = await pool.query(
      `INSERT INTO himalix_portfolio.testimonials (client_name, client_title, company, content, rating, image_url, is_active, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [client_name, client_title || '', company || '', content, rating || 5, image_url || '', is_active !== false, display_order || 0]
    );

    const [rows] = await pool.query('SELECT * FROM himalix_portfolio.testimonials WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create testimonial error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /testimonials/:id
router.put('/testimonials/:id', async (req, res) => {
  try {
    const { client_name, client_title, company, content, rating, image_url, is_active, display_order } = req.body;

    const [result] = await pool.query(
      `UPDATE himalix_portfolio.testimonials SET client_name = ?, client_title = ?, company = ?, content = ?, rating = ?, image_url = ?, is_active = ?, display_order = ?
       WHERE id = ?`,
      [client_name, client_title || '', company || '', content, rating || 5, image_url || '', is_active !== false, display_order || 0, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }

    const [rows] = await pool.query('SELECT * FROM himalix_portfolio.testimonials WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Update testimonial error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /testimonials/:id
router.delete('/testimonials/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM himalix_portfolio.testimonials WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }
    res.json({ message: 'Testimonial deleted successfully' });
  } catch (error) {
    console.error('Delete testimonial error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== SITE SETTINGS ====================

// GET /settings
router.get('/settings', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM himalix_portfolio.labs_site_settings');
    res.json(rows);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /settings/:key
router.put('/settings/:key', async (req, res) => {
  try {
    const { setting_value } = req.body;
    if (setting_value === undefined) {
      return res.status(400).json({ error: 'setting_value is required' });
    }

    const [result] = await pool.query(
      'UPDATE himalix_portfolio.labs_site_settings SET setting_value = ? WHERE setting_key = ?',
      [setting_value, req.params.key]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    const [rows] = await pool.query('SELECT * FROM himalix_portfolio.labs_site_settings WHERE setting_key = ?', [req.params.key]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== CONTACT MESSAGES ====================

// GET /messages
router.get('/messages', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM himalix_portfolio.contact_messages ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /messages/:id/read
router.put('/messages/:id/read', async (req, res) => {
  try {
    const [result] = await pool.query(
      'UPDATE himalix_portfolio.contact_messages SET is_read = TRUE WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /messages/:id
router.delete('/messages/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM himalix_portfolio.contact_messages WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== IMAGE UPLOAD ====================

// POST /upload
router.post('/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    res.json({ url: `/uploads/${req.file.filename}` });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Server error during upload' });
  }
});

// ==================== DASHBOARD STATS ====================

// GET /stats
router.get('/stats', async (req, res) => {
  try {
    const [services] = await pool.query('SELECT COUNT(*) as count FROM himalix_portfolio.services');
    const [team] = await pool.query('SELECT COUNT(*) as count FROM himalix_portfolio.team_members');
    const [testimonials] = await pool.query('SELECT COUNT(*) as count FROM himalix_portfolio.testimonials');
    const [messages] = await pool.query('SELECT COUNT(*) as count FROM himalix_portfolio.contact_messages');
    const [unread] = await pool.query('SELECT COUNT(*) as count FROM himalix_portfolio.contact_messages WHERE is_read = FALSE');

    res.json({
      total_services: services[0].count,
      total_team: team[0].count,
      total_testimonials: testimonials[0].count,
      total_messages: messages[0].count,
      unread_messages: unread[0].count
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
