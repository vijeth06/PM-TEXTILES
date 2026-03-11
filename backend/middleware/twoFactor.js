/**
 * Two-Factor Authentication (2FA) Middleware and Utilities
 */

const { encrypt, decrypt, generate2FASecret, verifyTOTP, sha256 } = require('../utils/encryption');
const User = require('../models/User');
const QRCode = require('qrcode');

const getUserWithTwoFactor = async (userId) => User.findById(userId).select('+twoFactorSecret +backupCodes');

const normalizeChallengeValue = (value) => String(value || '').trim().replace(/\s+/g, '').toUpperCase();

const verifyBackupCode = async (user, challenge) => {
  const hashedCode = sha256(challenge);
  const backupCode = (user.backupCodes || []).find((entry) => !entry.used && entry.code === hashedCode);

  if (!backupCode) {
    return false;
  }

  backupCode.used = true;
  await user.save();
  return true;
};

const verifyTwoFactorChallenge = async (userOrId, token) => {
  const user = typeof userOrId === 'string'
    ? await getUserWithTwoFactor(userOrId)
    : userOrId;

  if (!user) {
    throw new Error('User not found');
  }

  if (!user.twoFactorEnabled) {
    return { success: true };
  }

  const challenge = normalizeChallengeValue(token);
  if (!challenge) {
    return {
      success: false,
      message: '2FA token required',
      require2FA: true
    };
  }

  const decryptedSecret = user.twoFactorSecret ? decrypt(user.twoFactorSecret) : null;
  if (decryptedSecret && verifyTOTP(challenge, decryptedSecret)) {
    return { success: true };
  }

  const usedBackupCode = await verifyBackupCode(user, challenge);
  if (usedBackupCode) {
    return {
      success: true,
      message: 'Logged in using backup code'
    };
  }

  return {
    success: false,
    message: 'Invalid verification code',
    require2FA: true
  };
};

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

    user.twoFactorSecret = encrypt(secret);
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
    const user = await getUserWithTwoFactor(userId);
    if (!user || !user.twoFactorSecret) {
      throw new Error('2FA not set up for this user');
    }

    const secret = decrypt(user.twoFactorSecret);
    const isValid = verifyTOTP(token, secret);

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
    const user = await getUserWithTwoFactor(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.twoFactorEnabled) {
      const verification = await verifyTwoFactorChallenge(user, token);
      if (!verification.success) {
        return verification;
      }
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.backupCodes = [];
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
  const user = await getUserWithTwoFactor(userId);
  if (user) {
    user.backupCodes = codes.map(code => ({
      code: sha256(code),
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
    const token = req.headers['x-2fa-token'] || req.body?.twoFactorToken;

    const verification = await verifyTwoFactorChallenge(req.user.id, token);
    if (!verification.success) {
      return res.status(401).json(verification);
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
  check2FAStatus,
  verifyTwoFactorChallenge
};
