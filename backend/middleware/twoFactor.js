/**
 * Two-Factor Authentication (2FA) Middleware and Utilities
 */

const { generate2FASecret, verifyTOTP, generateTOTP } = require('../utils/encryption');
const User = require('../models/User');
const QRCode = require('qrcode');

/**
 * Enable 2FA for user
 * @param {string} userId - User ID
 * @returns {Object} Secret and QR code
 */
const enable2FA = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate secret
    const secret = generate2FASecret();

    // Save secret to user (hashed or encrypted in production)
    user.twoFactorSecret = secret;
    user.twoFactorEnabled = false; // Enable after verification
    await user.save();

    // Generate QR code for authenticator apps
    const appName = 'PM Textiles ERP';
    const otpauthUrl = `otpauth://totp/${appName}:${user.email}?secret=${secret}&issuer=${appName}`;
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    return {
      success: true,
      secret,
      qrCode: qrCodeDataUrl,
      message: 'Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)'
    };
  } catch (error) {
    console.error('Enable 2FA error:', error.message);
    throw error;
  }
};

/**
 * Verify and activate 2FA
 * @param {string} userId - User ID
 * @param {string} token - 6-digit TOTP token
 * @returns {Object} Verification result
 */
const verify2FA = async (userId, token) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.twoFactorSecret) {
      throw new Error('2FA not set up for this user');
    }

    // Verify token
    const isValid = verifyTOTP(token, user.twoFactorSecret);

    if (isValid) {
      // Enable 2FA
      user.twoFactorEnabled = true;
      await user.save();

      return {
        success: true,
        message: '2FA enabled successfully'
      };
    } else {
      return {
        success: false,
        message: 'Invalid verification code'
      };
    }
  } catch (error) {
    console.error('Verify 2FA error:', error.message);
    throw error;
  }
};

/**
 * Disable 2FA
 * @param {string} userId - User ID
 * @param {string} token - 6-digit TOTP token for verification
 * @returns {Object} Result
 */
const disable2FA = async (userId, token) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify token before disabling
    if (user.twoFactorEnabled) {
      const isValid = verifyTOTP(token, user.twoFactorSecret);
      if (!isValid) {
        return {
          success: false,
          message: 'Invalid verification code'
        };
      }
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save();

    return {
      success: true,
      message: '2FA disabled successfully'
    };
  } catch (error) {
    console.error('Disable 2FA error:', error.message);
    throw error;
  }
};

/**
 * Generate backup codes
 * @param {string} userId - User ID
 * @returns {Array} Backup codes
 */
const generateBackupCodes = async (userId) => {
  const crypto = require('crypto');
  const codes = [];
  
  for (let i = 0; i < 10; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }

  // Save hashed backup codes to user
  const user = await User.findById(userId);
  if (user) {
    // In production, hash these codes before storing
    user.backupCodes = codes.map(code => ({
      code: crypto.createHash('sha256').update(code).digest('hex'),
      used: false
    }));
    await user.save();
  }

  return codes;
};

/**
 * 2FA Verification Middleware
 * Requires 2FA token for protected routes
 */
const require2FA = async (req, res, next) => {
  try {
    const token = req.headers['x-2fa-token'] || req.body.twoFactorToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '2FA token required',
        require2FA: true
      });
    }

    const user = await User.findById(req.user.id);
    
    if (!user || !user.twoFactorEnabled) {
      return next(); // 2FA not enabled, continue
    }

    // Verify token
    const isValid = verifyTOTP(token, user.twoFactorSecret);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid 2FA token'
      });
    }

    next();
  } catch (error) {
    console.error('2FA middleware error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

/**
 * Check if user has 2FA enabled
 */
const check2FAStatus = async (userId) => {
  try {
    const user = await User.findById(userId).select('twoFactorEnabled');
    return {
      enabled: user?.twoFactorEnabled || false
    };
  } catch (error) {
    return { enabled: false };
  }
};

module.exports = {
  enable2FA,
  verify2FA,
  disable2FA,
  generateBackupCodes,
  require2FA,
  check2FAStatus
};
