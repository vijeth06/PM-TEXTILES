/**
 * Data Encryption Utilities
 * Provides encryption/decryption for sensitive data
 */

const crypto = require('crypto');

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

// Get encryption key from environment or generate one
const getEncryptionKey = () => {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_SECRET environment variable must be set in production');
    }
    // Development-only fallback — not safe for production
    console.warn('⚠️  ENCRYPTION_SECRET is not set. Set it in your .env file before deploying.');
    return crypto.scryptSync('default-secret-please-change-in-production', 'salt', KEY_LENGTH);
  }
  return crypto.scryptSync(secret, 'salt', KEY_LENGTH);
};

/**
 * Encrypt data
 * @param {string} text - Plain text to encrypt
 * @returns {string} Encrypted text with IV and auth tag
 */
const encrypt = (text) => {
  try {
    if (!text) return text;

    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Combine IV + encrypted data + auth tag
    return iv.toString('hex') + ':' + encrypted + ':' + authTag.toString('hex');
  } catch (error) {
    console.error('Encryption error:', error.message);
    throw new Error('Encryption failed');
  }
};

/**
 * Decrypt data
 * @param {string} encryptedText - Encrypted text with IV and auth tag
 * @returns {string} Decrypted plain text
 */
const decrypt = (encryptedText) => {
  try {
    if (!encryptedText) return encryptedText;

    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const key = getEncryptionKey();
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const authTag = Buffer.from(parts[2], 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message);
    throw new Error('Decryption failed');
  }
};

/**
 * Hash data (one-way, for passwords)
 * @param {string} text - Text to hash
 * @param {string} salt - Optional salt (generated if not provided)
 * @returns {Object} Hash and salt
 */
const hash = (text, salt = null) => {
  try {
    const actualSalt = salt || crypto.randomBytes(SALT_LENGTH).toString('hex');
    const hash = crypto.pbkdf2Sync(text, actualSalt, ITERATIONS, KEY_LENGTH, 'sha512').toString('hex');

    return {
      hash,
      salt: actualSalt
    };
  } catch (error) {
    console.error('Hashing error:', error.message);
    throw new Error('Hashing failed');
  }
};

/**
 * Verify hashed data
 * @param {string} text - Plain text to verify
 * @param {string} hash - Hash to compare against
 * @param {string} salt - Salt used for hashing
 * @returns {boolean} True if match
 */
const verifyHash = (text, hash, salt) => {
  try {
    const newHash = crypto.pbkdf2Sync(text, salt, ITERATIONS, KEY_LENGTH, 'sha512').toString('hex');
    return newHash === hash;
  } catch (error) {
    console.error('Hash verification error:', error.message);
    return false;
  }
};

/**
 * Generate random token (for API keys, reset tokens, etc.)
 * @param {number} length - Token length in bytes (default: 32)
 * @returns {string} Random hex string
 */
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate UUID
 * @returns {string} UUID v4
 */
const generateUUID = () => {
  return crypto.randomUUID();
};

/**
 * Hash string with SHA256 (for checksums)
 * @param {string} text - Text to hash
 * @returns {string} SHA256 hash
 */
const sha256 = (text) => {
  return crypto.createHash('sha256').update(text).digest('hex');
};

/**
 * Generate HMAC signature
 * @param {string} data - Data to sign
 * @param {string} secret - Secret key
 * @returns {string} HMAC signature
 */
const generateHMAC = (data, secret) => {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
};

/**
 * Verify HMAC signature
 * @param {string} data - Original data
 * @param {string} signature - Signature to verify
 * @param {string} secret - Secret key
 * @returns {boolean} True if valid
 */
const verifyHMAC = (data, signature, secret) => {
  const expectedSignature = generateHMAC(data, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};

/**
 * Mask sensitive data (for logging)
 * @param {string} text - Text to mask
 * @param {number} visibleChars - Number of characters to show (default: 4)
 * @returns {string} Masked text
 */
const maskSensitiveData = (text, visibleChars = 4) => {
  if (!text || text.length <= visibleChars) return '****';
  return text.slice(0, visibleChars) + '*'.repeat(text.length - visibleChars);
};

/**
 * Encrypt object fields
 * @param {Object} obj - Object with fields to encrypt
 * @param {Array} fields - Field names to encrypt
 * @returns {Object} Object with encrypted fields
 */
const encryptFields = (obj, fields) => {
  const result = { ...obj };
  fields.forEach(field => {
    if (result[field]) {
      result[field] = encrypt(result[field].toString());
    }
  });
  return result;
};

/**
 * Decrypt object fields
 * @param {Object} obj - Object with encrypted fields
 * @param {Array} fields - Field names to decrypt
 * @returns {Object} Object with decrypted fields
 */
const decryptFields = (obj, fields) => {
  const result = { ...obj };
  fields.forEach(field => {
    if (result[field]) {
      try {
        result[field] = decrypt(result[field]);
      } catch (error) {
        console.warn(`Failed to decrypt field: ${field}`);
      }
    }
  });
  return result;
};

/**
 * Generate 2FA secret (TOTP)
 * @returns {string} Base32 encoded secret
 */
const generate2FASecret = () => {
  const secret = crypto.randomBytes(20);
  return base32Encode(secret);
};

/**
 * Base32 encoding (for 2FA secrets)
 */
const base32Encode = (buffer) => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }

  return output;
};

/**
 * Base32 decoding (for 2FA secrets)
 */
const base32Decode = (value) => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const normalized = String(value || '')
    .toUpperCase()
    .replace(/=+$/g, '')
    .replace(/\s+/g, '');

  let bits = 0;
  let accumulator = 0;
  const bytes = [];

  for (const char of normalized) {
    const index = alphabet.indexOf(char);
    if (index === -1) {
      throw new Error('Invalid Base32 secret');
    }

    accumulator = (accumulator << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((accumulator >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
};

/**
 * Verify TOTP token
 * @param {string} token - 6-digit token
 * @param {string} secret - Base32 secret
 * @returns {boolean} True if valid
 */
const verifyTOTP = (token, secret, window = 1) => {
  try {
    const normalizedToken = String(token || '').replace(/\s+/g, '');
    if (!/^\d{6}$/.test(normalizedToken)) {
      return false;
    }

    const currentCounter = Math.floor(Date.now() / 30000);
    for (let offset = -window; offset <= window; offset += 1) {
      const expectedToken = generateTOTP(secret, currentCounter + offset);
      if (crypto.timingSafeEqual(Buffer.from(normalizedToken), Buffer.from(expectedToken))) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('TOTP verification error:', error.message);
    return false;
  }
};

/**
 * Generate TOTP token
 * @param {string} secret - Base32 secret
 * @param {number} time - Time counter
 * @returns {string} 6-digit token
 */
const generateTOTP = (secret, time = Math.floor(Date.now() / 30000)) => {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(time));

  const decodedSecret = base32Decode(secret);
  const hmac = crypto.createHmac('sha1', decodedSecret);
  hmac.update(buffer);
  const hash = hmac.digest();

  const offset = hash[hash.length - 1] & 0xf;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
};

module.exports = {
  encrypt,
  decrypt,
  hash,
  verifyHash,
  generateToken,
  generateUUID,
  sha256,
  generateHMAC,
  verifyHMAC,
  maskSensitiveData,
  encryptFields,
  decryptFields,
  generate2FASecret,
  verifyTOTP,
  generateTOTP
};
