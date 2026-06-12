const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const rateLimit = require('express-rate-limit');
const { pool } = require('../config/db');
const { sendNotificationEmail } = require('../config/mail');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

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
    const { email, password, role, referredByCode } = req.body;

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
      'INSERT INTO himalix_auth.users (email, password_hash, role, referral_code, referred_by, wallet_balance) VALUES (?, ?, ?, ?, ?, ?)',
      [email, hashedPassword, role || 'user', myReferralCode, referredById, initialBalance]
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
       <p>Role: <strong>${role || 'user'}</strong></p>
       <p>Timestamp: <strong>${new Date().toLocaleString()}</strong></p>`
    ).catch(err => console.error('Mail error:', err));

    const token = jwt.sign(
      { id: newUserId, email, role: role || 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { id: newUserId, email, role: role || 'user', avatar_url: null, wallet_balance: initialBalance, referral_code: myReferralCode }
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
      user: { id: user.id, email: user.email, role: user.role, avatar_url: user.avatar_url, wallet_balance: user.wallet_balance, referral_code: user.referral_code }
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

    const { email, sub: googleId, picture: avatarUrl } = payload;
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
      await pool.query('UPDATE himalix_auth.users SET avatar_url = ? WHERE id = ?', [avatarUrl || null, user.id]);
      user.avatar_url = avatarUrl;
    } else {
      const [byEmail] = await pool.query('SELECT * FROM himalix_auth.users WHERE email = ?', [email]);
      if (byEmail.length > 0) {
        user = byEmail[0];
        if (!user.referral_code) {
          user.referral_code = await generateUniqueReferralCode();
        }
        await pool.query('UPDATE himalix_auth.users SET google_id = ?, avatar_url = ?, referral_code = ? WHERE id = ?', [googleId, avatarUrl || null, user.referral_code, user.id]);
        user.google_id = googleId;
        user.avatar_url = avatarUrl;
        console.log(`Linked existing email account ${email} to Google ID ${googleId}`);
      } else {
        const myReferralCode = await generateUniqueReferralCode();
        const [insertResult] = await pool.query(
          'INSERT INTO himalix_auth.users (email, google_id, avatar_url, role, referral_code) VALUES (?, ?, ?, ?, ?)',
          [email, googleId, avatarUrl || null, 'user', myReferralCode]
        );
        user = {
          id: insertResult.insertId,
          email,
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
           <p>Timestamp: <strong>${new Date().toLocaleString()}</strong></p>`
        ).catch(err => console.error('Mail error:', err));
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
      user: { id: user.id, email: user.email, role: user.role, avatar_url: user.avatar_url, wallet_balance: user.wallet_balance, referral_code: user.referral_code }
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Internal server error during Google login' });
  }
});

// GET /me — Get current user (from labs, kept for backward compatibility)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, email, role, avatar_url, wallet_balance, referral_code FROM himalix_auth.users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user: users[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
