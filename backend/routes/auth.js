const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { 
  register, 
  login, 
  getMe, 
  updatePassword,
  refreshToken,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate, loginValidation, registerValidation } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  enable2FA,
  verify2FA,
  disable2FA,
  generateBackupCodes,
  check2FAStatus
} = require('../middleware/twoFactor');

// Public routes (with rate limiting)
router.post('/register', authLimiter, registerValidation, validate, register);
router.post('/login', authLimiter, loginValidation, validate, login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', authLimiter, [
  body('email').isEmail().withMessage('Valid email is required')
], validate, forgotPassword);
router.post('/reset-password/:token', authLimiter, [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], validate, resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/update-password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], validate, updatePassword);

// Two-Factor Authentication routes
router.get('/2fa/status', protect, async (req, res) => {
  try {
    const status = await check2FAStatus(req.user.id);
    res.json({ success: true, ...status });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/2fa/enable', protect, async (req, res) => {
  try {
    const result = await enable2FA(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/2fa/verify', protect, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Token required' });
    }
    const result = await verify2FA(req.user.id, token);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/2fa/disable', protect, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Token required for verification' });
    }
    const result = await disable2FA(req.user.id, token);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/2fa/backup-codes', protect, async (req, res) => {
  try {
    const codes = await generateBackupCodes(req.user.id);
    res.json({
      success: true,
      codes,
      message: 'Save these codes in a secure location. Each can only be used once.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
