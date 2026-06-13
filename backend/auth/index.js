const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/db');
const { sendNotificationEmail, sendEmail } = require('../config/mail');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.'));
    }
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: { message: 'Too many login attempts, please try again after 15 minutes' }
});

async function generateUniqueReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let isUnique = false;
  let code = '';
  while (!isUnique) {
    code = 'HMX-REF-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const [existing] = await pool.query('SELECT id FROM himalix_auth.users WHERE referral_code = ?', [code]);
    if (existing.length === 0) {
      isUnique = true;
    }
  }
  return code;
}

// POST /register
router.post('/register', authLimiter, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { email, password, name, role, referredByCode } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const [existing] = await connection.query('SELECT id FROM himalix_auth.users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    let referredById = null;
    if (referredByCode) {
      const [refUsers] = await connection.query('SELECT id FROM himalix_auth.users WHERE referral_code = ?', [referredByCode]);
      if (refUsers.length > 0) {
        referredById = refUsers[0].id;
      }
    }

    await connection.beginTransaction();

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const myReferralCode = await generateUniqueReferralCode();

    const [bonusRows] = await connection.query("SELECT key_value FROM settings WHERE key_name = 'referral_bonus_amount'");
    const bonusAmount = bonusRows.length > 0 ? parseFloat(bonusRows[0].key_value) : 20.00;

    // Check if new user is referred
    const initialBalance = referredById ? bonusAmount : 0.00;

    const [result] = await connection.query(
      'INSERT INTO himalix_auth.users (email, name, password_hash, role, referral_code, referred_by, wallet_balance) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [email, name || null, hashedPassword, role || 'user', myReferralCode, referredById, initialBalance]
    );

    const newUserId = result.insertId;

    if (referredById) {
      // Log ledger entry for referred user (the sign-up user)
      await connection.query(
        "INSERT INTO wallet_transactions (user_id, amount, type, reference_id) VALUES (?, ?, 'referral', ?)",
        [newUserId, bonusAmount, `referral_signup_bonus_from_${referredById}`]
      );

      // Add credit to the referrer
      await connection.query(
        'UPDATE himalix_auth.users SET wallet_balance = wallet_balance + ? WHERE id = ?',
        [bonusAmount, referredById]
      );

      // Log ledger entry for referrer
      await connection.query(
        "INSERT INTO wallet_transactions (user_id, amount, type, reference_id) VALUES (?, ?, 'referral', ?)",
        [referredById, bonusAmount, `referral_bonus_for_inviting_${newUserId}`]
      );
    }

    await connection.commit();

    sendNotificationEmail(
      'user_registered',
      `New User Registration: ${email}`,
      `<p>A new user account has been registered on Himalix.</p>
       <p>Email: <strong>${email}</strong></p>
       <p>Name: <strong>${name || '—'}</strong></p>
       <p>Role: <strong>${role || 'user'}</strong></p>
       <p>Timestamp: <strong>${new Date().toLocaleString()}</strong></p>`
    ).catch(err => console.error('Mail error:', err));

    sendEmail({
      to: email,
      subject: 'Welcome to Himalix!',
      title: 'Account Created Successfully',
      htmlBody: `
        <p>Dear ${name || 'User'},</p>
        <p>Thank you for creating an account on Himalix. You now have access to our Store, custom 3D printing services, and tracking systems.</p>
        <p><strong>Your Account Details:</strong></p>
        <div class="highlight-box">
          <p>Email Address: <strong>${email}</strong></p>
          <p>Referral Code: <strong>${myReferralCode}</strong> (Share this to earn credits!)</p>
        </div>
        <p>To visit your profile or explore products, please click below:</p>
        <a href="http://localhost:3000/store" class="btn">Explore Store</a>
        <br/><br/>
        <p>Best regards,<br/>The Himalix Team</p>
      `
    }).catch(err => console.error('Welcome email error:', err));

    const token = jwt.sign(
      { id: newUserId, email, role: role || 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { id: newUserId, email, name: name || null, role: role || 'user', avatar_url: null, wallet_balance: initialBalance, referral_code: myReferralCode, phone: null, shipping_address: null }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Register error:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
});

// POST /login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const [rows] = await pool.query('SELECT * FROM himalix_auth.users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar_url: user.avatar_url, wallet_balance: user.wallet_balance, referral_code: user.referral_code, phone: user.phone, shipping_address: user.shipping_address }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /config — Public settings for frontend (Google auth config, etc.)
router.get('/config', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT key_name, key_value FROM settings');
    const config = {};
    rows.forEach(r => {
      if (r.key_name === 'google_client_id') config.googleClientId = r.key_value;
      if (r.key_name === 'google_auth_enabled') config.googleAuthEnabled = r.key_value === '1';
      if (r.key_name === 'sales_tax_rate') config.salesTaxRate = parseFloat(r.key_value) || 0;
      if (r.key_name === 'low_stock_threshold') config.lowStockThreshold = parseInt(r.key_value, 10) || 5;
      if (r.key_name === 'maintenance_mode') config.maintenanceMode = r.key_value === '1';
      if (r.key_name === 'store_banner_text') config.storeBannerText = r.key_value;
      if (r.key_name === 'delivery_per_km_rate') config.deliveryPerKmRate = parseFloat(r.key_value) || 0;
      if (r.key_name === 'delivery_min_charge') config.deliveryMinCharge = parseFloat(r.key_value) || 0;
      if (r.key_name === 'delivery_free_threshold') config.deliveryFreeThreshold = parseFloat(r.key_value) || 0;
      if (r.key_name === 'emergency_contact_phone') config.emergencyContactPhone = r.key_value;
      if (r.key_name === 'emergency_contact_email') config.emergencyContactEmail = r.key_value;
    });
    res.json(config);
  } catch (error) {
    console.error('Config fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch public settings config.' });
  }
});

// POST /google — Google OAuth sign-in
router.post('/google', authLimiter, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    const [settingsRows] = await pool.query(
      'SELECT key_name, key_value FROM settings WHERE key_name IN (?, ?)',
      ['google_client_id', 'google_auth_enabled']
    );
    
    let googleClientId = '';
    let googleAuthEnabled = false;
    
    settingsRows.forEach(row => {
      if (row.key_name === 'google_client_id') googleClientId = row.key_value;
      if (row.key_name === 'google_auth_enabled') googleAuthEnabled = row.key_value === '1';
    });

    if (!googleAuthEnabled) {
      return res.status(400).json({ message: 'Google sign-in is disabled.' });
    }

    if (!googleClientId) {
      return res.status(500).json({ message: 'Google client ID is not configured.' });
    }

    const client = new OAuth2Client(googleClientId);
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: googleClientId,
      });
      payload = ticket.getPayload();
    } catch (err) {
      console.error('Google token verification failed:', err);
      return res.status(401).json({ message: 'Invalid Google token.' });
    }

    const { email, sub: googleId, picture: avatarUrl, name } = payload;
    if (!email) {
      return res.status(400).json({ message: 'Email not provided by Google account.' });
    }

    let user;
    const [byGoogleId] = await pool.query('SELECT * FROM himalix_auth.users WHERE google_id = ?', [googleId]);
    if (byGoogleId.length > 0) {
      user = byGoogleId[0];
      if (!user.referral_code) {
        user.referral_code = await generateUniqueReferralCode();
        await pool.query('UPDATE himalix_auth.users SET referral_code = ? WHERE id = ?', [user.referral_code, user.id]);
      }
      await pool.query('UPDATE himalix_auth.users SET avatar_url = ?, name = ? WHERE id = ?', [avatarUrl || null, name || user.name || null, user.id]);
      user.avatar_url = avatarUrl;
      user.name = name || user.name || null;
    } else {
      const [byEmail] = await pool.query('SELECT * FROM himalix_auth.users WHERE email = ?', [email]);
      if (byEmail.length > 0) {
        user = byEmail[0];
        if (!user.referral_code) {
          user.referral_code = await generateUniqueReferralCode();
        }
        await pool.query('UPDATE himalix_auth.users SET google_id = ?, avatar_url = ?, referral_code = ?, name = ? WHERE id = ?', [googleId, avatarUrl || null, user.referral_code, name || user.name || null, user.id]);
        user.google_id = googleId;
        user.avatar_url = avatarUrl;
        user.name = name || user.name || null;
        console.log(`Linked existing email account ${email} to Google ID ${googleId}`);
      } else {
        const myReferralCode = await generateUniqueReferralCode();
        const [insertResult] = await pool.query(
          'INSERT INTO himalix_auth.users (email, name, google_id, avatar_url, role, referral_code) VALUES (?, ?, ?, ?, ?, ?)',
          [email, name || null, googleId, avatarUrl || null, 'user', myReferralCode]
        );
        user = {
          id: insertResult.insertId,
          email,
          name,
          google_id: googleId,
          avatar_url: avatarUrl,
          role: 'user',
          wallet_balance: 0.00,
          referral_code: myReferralCode
        };
        console.log(`Created new Google sign-in user ${email}`);
        sendNotificationEmail(
          'user_registered',
          `New Google User Registration: ${email}`,
          `<p>A new user account has registered using Google Sign-In.</p>
           <p>Email: <strong>${email}</strong></p>
           <p>Name: <strong>${name || '—'}</strong></p>
           <p>Timestamp: <strong>${new Date().toLocaleString()}</strong></p>`
        ).catch(err => console.error('Mail error:', err));

        sendEmail({
          to: email,
          subject: 'Welcome to Himalix!',
          title: 'Account Created Successfully',
          htmlBody: `
            <p>Dear ${name || 'User'},</p>
            <p>Thank you for registering on Himalix using Google Sign-In.</p>
            <p><strong>Your Account Details:</strong></p>
            <div class="highlight-box">
              <p>Email Address: <strong>${email}</strong></p>
              <p>Referral Code: <strong>${myReferralCode}</strong> (Share this to earn credits!)</p>
            </div>
            <p>To visit your profile or explore products, please click below:</p>
            <a href="http://localhost:3000/store" class="btn">Explore Store</a>
            <br/><br/>
            <p>Best regards,<br/>The Himalix Team</p>
          `
        }).catch(err => console.error('Google welcome email error:', err));
      }
    }

    // Refresh user details to obtain correct wallet_balance
    const [freshUsers] = await pool.query('SELECT * FROM himalix_auth.users WHERE id = ?', [user.id]);
    if (freshUsers.length > 0) {
      user = freshUsers[0];
    }

    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token: jwtToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar_url: user.avatar_url, wallet_balance: user.wallet_balance, referral_code: user.referral_code, phone: user.phone, shipping_address: user.shipping_address }
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Internal server error during Google login' });
  }
});

// GET /me — Get current user (from labs, kept for backward compatibility)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, email, name, role, avatar_url, google_id, phone, shipping_address, wallet_balance, referral_code FROM himalix_auth.users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user: users[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /update — Update profile parameters (name, phone, shipping_address)
router.put('/update', authMiddleware, async (req, res) => {
  try {
    const { name, phone, shipping_address, avatar_url } = req.body;
    
    const updates = [];
    const params = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name.trim() || null);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone.trim() || null);
    }
    if (shipping_address !== undefined) {
      updates.push('shipping_address = ?');
      params.push(shipping_address ? JSON.stringify(shipping_address) : null);
    }
    if (avatar_url !== undefined) {
      updates.push('avatar_url = ?');
      params.push(avatar_url.trim() || null);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    params.push(req.user.id);
    await pool.query(`UPDATE himalix_auth.users SET ${updates.join(', ')} WHERE id = ?`, params);
    
    const [rows] = await pool.query('SELECT id, email, name, role, avatar_url, google_id, phone, shipping_address, wallet_balance, referral_code FROM himalix_auth.users WHERE id = ?', [req.user.id]);
    res.json({ message: 'Profile updated successfully', user: rows[0] });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Failed to update profile info' });
  }
});

// PUT /password — Update password for local users
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const [rows] = await pool.query('SELECT * FROM himalix_auth.users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = rows[0];
    if (!user.password_hash) {
      return res.status(400).json({ message: 'Google OAuth accounts do not have passwords set.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHashed = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE himalix_auth.users SET password_hash = ? WHERE id = ?', [newHashed, req.user.id]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ message: 'Failed to update password' });
  }
});

// POST /upload-avatar — Upload profile picture
router.post('/upload-avatar', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }
    const avatarUrl = `/uploads/${req.file.filename}`;
    await pool.query('UPDATE himalix_auth.users SET avatar_url = ? WHERE id = ?', [avatarUrl, req.user.id]);
    res.json({ message: 'Avatar uploaded successfully', avatarUrl });
  } catch (err) {
    console.error('Avatar upload error:', err);
    res.status(500).json({ message: 'Avatar upload failed' });
  }
});

module.exports = router;

