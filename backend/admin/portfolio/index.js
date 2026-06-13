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

    // Load services
    const [services] = await pool.query('SELECT * FROM himalix_portfolio.services ORDER BY display_order ASC');
    content.services = {
      items: services.map(s => ({
        id: s.id,
        icon: s.icon_class,
        title: s.title,
        description: s.description,
        link: s.link_url,
        cta: s.subtitle,
        features: typeof s.features === 'string' ? JSON.parse(s.features) : (s.features || [])
      }))
    };

    // Load team members
    const [team] = await pool.query('SELECT * FROM himalix_portfolio.team_members ORDER BY display_order ASC');
    content.team = {
      members: team.map(t => {
        let links = {};
        try {
          links = typeof t.social_links === 'string' ? JSON.parse(t.social_links) : (t.social_links || {});
        } catch (e) {}
        return {
          id: t.id,
          name: t.name,
          role: t.role,
          bio: t.bio,
          avatar_url: t.image_url,
          instagram: links.instagram || '',
          linkedin: links.linkedin || '',
          github: links.github || ''
        };
      })
    };

    // Load testimonials
    const [testimonials] = await pool.query('SELECT * FROM himalix_portfolio.testimonials ORDER BY display_order ASC');
    content.testimonials = {
      items: testimonials.map(t => ({
        id: t.id,
        name: t.client_name,
        title: t.client_title,
        rating: t.rating,
        text: t.content,
        company: t.company || '',
        image_url: t.image_url || ''
      }))
    };

    res.json({ content });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /content/:section
router.put('/content/:section', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { section } = req.params;
    const data = req.body;

    await connection.beginTransaction();

    if (section === 'services') {
      const items = data.items || [];
      // Delete existing
      await connection.query('DELETE FROM himalix_portfolio.services');
      // Insert new
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const getFeaturesForTitle = (title) => {
          if (title.includes('Store')) {
            return ["Wide product catalog", "Wallet & referral system", "Order tracking", "Express delivery"];
          }
          if (title.includes('Print') || title.includes('3D')) {
            return ["FDM & resin printing", "Custom filament colors", "Design assistance", "Bulk orders"];
          }
          if (title.includes('Project')) {
            return ["School science exhibitions", "Competition projects", "Custom development", "Tech consulting"];
          }
          return [];
        };
        const features = Array.isArray(item.features) ? item.features : getFeaturesForTitle(item.title || '');

        await connection.query(
          `INSERT INTO himalix_portfolio.services (title, subtitle, description, icon_class, features, link_url, display_order)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [item.title || '', item.cta || '', item.description || '', item.icon || '', JSON.stringify(features), item.link || '', i + 1]
        );
      }
    } else if (section === 'team') {
      const members = data.members || [];
      // Delete existing
      await connection.query('DELETE FROM himalix_portfolio.team_members');
      // Insert new
      for (let i = 0; i < members.length; i++) {
        const member = members[i];
        const socialLinks = {
          instagram: member.instagram || '#',
          linkedin: member.linkedin || '#',
          github: member.github || '#'
        };
        await connection.query(
          `INSERT INTO himalix_portfolio.team_members (name, role, bio, image_url, social_links, display_order)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [member.name || '', member.role || '', member.bio || '', member.avatar_url || '', JSON.stringify(socialLinks), i + 1]
        );
      }
    } else if (section === 'testimonials') {
      const items = data.items || [];
      // Delete existing
      await connection.query('DELETE FROM himalix_portfolio.testimonials');
      // Insert new
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await connection.query(
          `INSERT INTO himalix_portfolio.testimonials (client_name, client_title, company, content, rating, image_url, display_order)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [item.name || '', item.title || '', item.company || '', item.text || '', item.rating || 5, item.image_url || '', i + 1]
        );
      }
    } else {
      // General section updates inside landing_content table
      for (const [key, val] of Object.entries(data)) {
        const isJson = typeof val === 'object';
        const contentVal = isJson ? JSON.stringify(val) : String(val);
        const contentType = isJson ? 'json' : 'text';

        await connection.query(
          `INSERT INTO himalix_portfolio.landing_content (section, content_key, content_value, content_type)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE content_value = ?, content_type = ?`,
          [section, key, contentVal, contentType, contentVal, contentType]
        );
      }
    }

    await connection.commit();
    res.json({ message: `Section ${section} updated successfully` });
  } catch (error) {
    await connection.rollback();
    console.error('Update section error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    connection.release();
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

    await pool.query(
      `INSERT INTO himalix_portfolio.labs_site_settings (setting_key, setting_value, setting_type)
       VALUES (?, ?, 'text')
       ON DUPLICATE KEY UPDATE setting_value = ?`,
      [req.params.key, String(setting_value), String(setting_value)]
    );

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

// POST /smtp/test - Test credentials & send verification email
router.post('/smtp/test', async (req, res) => {
  try {
    const { smtp_host, smtp_port, smtp_user, smtp_pass, smtp_secure, forward_email_addresses } = req.body;
    if (!smtp_host || !smtp_user || !smtp_pass || !forward_email_addresses) {
      return res.status(400).json({ error: 'SMTP Host, User, Pass and Recipient Email are required' });
    }

    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: smtp_host,
      port: parseInt(smtp_port, 10) || 587,
      secure: smtp_secure === '1' || smtp_port === '465',
      auth: {
        user: smtp_user,
        pass: smtp_pass
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      tls: {
        rejectUnauthorized: false
      }
    });

    await transporter.verify();

    // Send a test mail to the recipient(s)
    await transporter.sendMail({
      from: `"Himalix SMTP Test" <${smtp_user}>`,
      to: forward_email_addresses,
      subject: '[Himalix] SMTP Forwarding Test Successful',
      html: `
        <h2>SMTP Connection Verified</h2>
        <p>Your SMTP forwarding settings have been successfully verified!</p>
        <p>Submitted Details:</p>
        <ul>
          <li><strong>Host:</strong> ${smtp_host}</li>
          <li><strong>Port:</strong> ${smtp_port}</li>
          <li><strong>Username:</strong> ${smtp_user}</li>
          <li><strong>Security:</strong> ${smtp_secure === '1' ? 'SSL/TLS (Secure)' : 'None/StartTLS'}</li>
        </ul>
        <p>You will now receive landing page contact form inquiries at this email address.</p>
      `
    });

    res.json({ message: 'SMTP credentials verified. A test email was sent successfully!' });
  } catch (error) {
    console.error('SMTP testing error:', error);
    res.status(500).json({ error: error.message || 'SMTP connection failed' });
  }
});

module.exports = router;
