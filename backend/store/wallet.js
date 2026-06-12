const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// 1. Get Wallet balance and statistics (for cart/profile)
router.get('/', async (req, res) => {
  try {
    const [userRows] = await pool.query(
      'SELECT wallet_balance, referral_code FROM himalix_auth.users WHERE id = ?',
      [req.user.id]
    );
    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const [[earnedRow]] = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as earned FROM wallet_transactions WHERE user_id = ? AND amount > 0',
      [req.user.id]
    );

    const [[refCountRow]] = await pool.query(
      'SELECT COUNT(*) as count FROM himalix_auth.users WHERE referred_by = ?',
      [req.user.id]
    );

    res.json({
      wallet: {
        balance: parseFloat(userRows[0].wallet_balance),
        referral_code: userRows[0].referral_code,
        referral_count: refCountRow.count,
        total_earned: parseFloat(earnedRow.earned)
      }
    });
  } catch (err) {
    console.error('Wallet stats fetch error:', err);
    res.status(500).json({ message: 'Server error fetching wallet stats' });
  }
});

// 2. Get Wallet Balance and Transaction History
router.get('/history', async (req, res) => {
  try {
    const [userRows] = await pool.query('SELECT wallet_balance, referral_code, referred_by FROM himalix_auth.users WHERE id = ?', [req.user.id]);
    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const [transactions] = await pool.query(
      'SELECT id, amount, type, reference_id, created_at FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    const mappedHistory = transactions.map(tx => {
      const isCredit = Number(tx.amount) > 0;
      let description = '';
      if (tx.type === 'deposit') description = `Manual deposit via eSewa (Ref: ${tx.reference_id})`;
      else if (tx.type === 'purchase') description = `Purchase payment for Order (Ref: ${tx.reference_id})`;
      else if (tx.type === 'refund') description = `Refund for Order (Ref: ${tx.reference_id})`;
      else if (tx.type === 'referral') description = `Referral Bonus (Ref: ${tx.reference_id})`;
      else if (tx.type === 'social') description = `Social Share Bonus (${tx.reference_id})`;

      return {
        id: tx.id,
        amount: Math.abs(Number(tx.amount)),
        type: isCredit ? 'credit' : 'debit',
        description,
        created_at: tx.created_at
      };
    });

    res.json({
      walletBalance: parseFloat(userRows[0].wallet_balance),
      referralCode: userRows[0].referral_code,
      referredBy: userRows[0].referred_by,
      transactions,
      history: mappedHistory
    });
  } catch (err) {
    console.error('Wallet fetch error:', err);
    res.status(500).json({ message: 'Server error fetching wallet history' });
  }
});

// 2. Bind a Referral Code after Sign-Up
router.post('/referral', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { referralCode } = req.body;
    const newUserId = req.user.id;

    if (!referralCode) {
      return res.status(400).json({ message: 'Referral code is required' });
    }

    await connection.beginTransaction();

    // Verify current user's referral status
    const [userRows] = await connection.query('SELECT referred_by, referral_code FROM himalix_auth.users WHERE id = ?', [newUserId]);
    if (userRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'User not found' });
    }

    if (userRows[0].referred_by !== null) {
      await connection.rollback();
      return res.status(400).json({ message: 'You have already bound a referral code.' });
    }

    if (userRows[0].referral_code === referralCode) {
      await connection.rollback();
      return res.status(400).json({ message: 'You cannot use your own referral code.' });
    }

    // Verify referrer exists
    const [referrerRows] = await connection.query('SELECT id FROM himalix_auth.users WHERE referral_code = ?', [referralCode]);
    if (referrerRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Invalid referral code.' });
    }

    const referrerId = referrerRows[0].id;

    // Fetch referral bonus from settings
    const [bonusRows] = await connection.query("SELECT key_value FROM settings WHERE key_name = 'referral_bonus_amount'");
    const bonusAmount = bonusRows.length > 0 ? parseFloat(bonusRows[0].key_value) : 5.00;

    // Update user: bind referred_by, add balance
    await connection.query(
      'UPDATE himalix_auth.users SET referred_by = ?, wallet_balance = wallet_balance + ? WHERE id = ?',
      [referrerId, bonusAmount, newUserId]
    );

    // Log ledger record for referred user
    await connection.query(
      "INSERT INTO wallet_transactions (user_id, amount, type, reference_id) VALUES (?, ?, 'referral', ?)",
      [newUserId, bonusAmount, `referral_bound_bonus_from_${referrerId}`]
    );

    // Add balance to referrer
    await connection.query(
      'UPDATE himalix_auth.users SET wallet_balance = wallet_balance + ? WHERE id = ?',
      [bonusAmount, referrerId]
    );

    // Log ledger record for referrer
    await connection.query(
      "INSERT INTO wallet_transactions (user_id, amount, type, reference_id) VALUES (?, ?, 'referral', ?)",
      [referrerId, bonusAmount, `referral_bonus_for_inviting_${newUserId}`]
    );

    await connection.commit();

    res.json({
      message: 'Referral code successfully applied',
      bonusEarned: bonusAmount
    });
  } catch (err) {
    await connection.rollback();
    console.error('Referral binding error:', err);
    res.status(500).json({ message: 'Server error applying referral code' });
  } finally {
    connection.release();
  }
});

// 4. Claim credits for following social media (click-to-claim wrapper)
const claimSocialHandler = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { platform } = req.body; // 'instagram', 'facebook', or 'youtube'
    const userId = req.user.id;

    if (!platform || !['instagram', 'facebook', 'youtube'].includes(platform.toLowerCase())) {
      return res.status(400).json({ message: 'Valid platform (youtube, instagram or facebook) is required' });
    }

    const platformKey = platform.toLowerCase();

    await connection.beginTransaction();

    // Verify user hasn't claimed yet
    const [existingClaims] = await connection.query(
      'SELECT claimed_at FROM social_claims WHERE user_id = ? AND platform = ?',
      [userId, platformKey]
    );

    if (existingClaims.length > 0) {
      await connection.rollback();
      return res.status(400).json({ message: `You have already claimed credits for following our ${platform} page.` });
    }

    // Fetch social bonus amount from settings
    const [bonusRows] = await connection.query("SELECT key_value FROM settings WHERE key_name = 'social_bonus_amount'");
    let bonusAmount = bonusRows.length > 0 ? parseFloat(bonusRows[0].key_value) : 5.00;
    
    // Customize reward based on platform dynamically (e.g. youtube 50, instagram 25)
    if (platformKey === 'youtube') bonusAmount = 50.00;
    else if (platformKey === 'instagram') bonusAmount = 25.00;

    // Log the claim
    await connection.query('INSERT INTO social_claims (user_id, platform) VALUES (?, ?)', [userId, platformKey]);

    // Update balance
    await connection.query('UPDATE himalix_auth.users SET wallet_balance = wallet_balance + ? WHERE id = ?', [bonusAmount, userId]);

    // Log ledger record
    await connection.query(
      "INSERT INTO wallet_transactions (user_id, amount, type, reference_id) VALUES (?, ?, 'social', ?)",
      [userId, bonusAmount, `social_follow_claim_${platformKey}`]
    );

    await connection.commit();

    res.json({
      message: `Successfully claimed Rs. ${bonusAmount.toFixed(2)} store credit!`,
      bonusEarned: bonusAmount
    });
  } catch (err) {
    await connection.rollback();
    console.error('Social claim error:', err);
    res.status(500).json({ message: 'Server error processing social claim' });
  } finally {
    connection.release();
  }
};

router.post('/claim-social', claimSocialHandler);
router.post('/social-claim', claimSocialHandler);

module.exports = router;
