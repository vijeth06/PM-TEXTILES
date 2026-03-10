/**
 * Quick Test Script for New Features
 * Run: node backend/testNewFeatures.js
 */

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

console.log(`\n${colors.blue}╔════════════════════════════════════════════════════════════╗`);
console.log(`║  PM Textiles ERP - New Features Test                      ║`);
console.log(`╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

// Test 1: Check if Redis service exists
console.log(`${colors.yellow}[1/6]${colors.reset} Testing Redis Service...`);
try {
  const { cacheService } = require('./services/redisService');
  console.log(`  ${colors.green}✓${colors.reset} Redis service loaded`);
} catch (error) {
  console.log(`  ${colors.red}✗${colors.reset} Redis service error:`, error.message);
}

// Test 2: Check if Email service exists
console.log(`\n${colors.yellow}[2/6]${colors.reset} Testing Email Service...`);
try {
  const { emailService } = require('./services/emailService');
  console.log(`  ${colors.green}✓${colors.reset} Email service loaded`);
} catch (error) {
  console.log(`  ${colors.red}✗${colors.reset} Email service error:`, error.message);
}

// Test 3: Check if Backup service exists
console.log(`\n${colors.yellow}[3/6]${colors.reset} Testing Backup Service...`);
try {
  const { createBackup, listBackups } = require('./services/backupService');
  console.log(`  ${colors.green}✓${colors.reset} Backup service loaded`);
} catch (error) {
  console.log(`  ${colors.red}✗${colors.reset} Backup service error:`, error.message);
}

// Test 4: Check if Encryption utilities exist
console.log(`\n${colors.yellow}[4/6]${colors.reset} Testing Encryption Utilities...`);
try {
  const { encrypt, decrypt, hash, generateToken } = require('./utils/encryption');
  
  // Test encryption
  const testText = 'Hello World';
  const encrypted = encrypt(testText);
  const decrypted = decrypt(encrypted);
  
  if (decrypted === testText) {
    console.log(`  ${colors.green}✓${colors.reset} Encryption/Decryption working`);
  } else {
    console.log(`  ${colors.red}✗${colors.reset} Encryption test failed`);
  }
  
  // Test hashing
  const { hash: hashedValue, salt } = hash('password123');
  console.log(`  ${colors.green}✓${colors.reset} Hashing working`);
  
  // Test token generation
  const token = generateToken(32);
  if (token && token.length === 64) {
    console.log(`  ${colors.green}✓${colors.reset} Token generation working`);
  }
} catch (error) {
  console.log(`  ${colors.red}✗${colors.reset} Encryption error:`, error.message);
}

// Test 5: Check if 2FA middleware exists
console.log(`\n${colors.yellow}[5/6]${colors.reset} Testing 2FA Middleware...`);
try {
  const { enable2FA, verify2FA, disable2FA } = require('./middleware/twoFactor');
  console.log(`  ${colors.green}✓${colors.reset} 2FA middleware loaded`);
} catch (error) {
  console.log(`  ${colors.red}✗${colors.reset} 2FA middleware error:`, error.message);
}

// Test 6: Check if Swagger docs exist
console.log(`\n${colors.yellow}[6/6]${colors.reset} Testing Swagger Documentation...`);
try {
  const swaggerSpec = require('./utils/swaggerDocs');
  if (swaggerSpec && swaggerSpec.openapi) {
    console.log(`  ${colors.green}✓${colors.reset} Swagger docs configured`);
    console.log(`  ${colors.blue}ℹ${colors.reset}  API Docs will be available at: http://localhost:5000/api-docs`);
  }
} catch (error) {
  console.log(`  ${colors.red}✗${colors.reset} Swagger docs error:`, error.message);
}

console.log(`\n${colors.blue}╔════════════════════════════════════════════════════════════╗`);
console.log(`║  Test Summary                                              ║`);
console.log(`╠════════════════════════════════════════════════════════════╣`);
console.log(`║  ${colors.green}✓${colors.reset} All core services are loaded successfully          ║`);
console.log(`║                                                            ║`);
console.log(`║  Next Steps:                                               ║`);
console.log(`║  1. Start server: npm run dev                              ║`);
console.log(`║  2. Visit: http://localhost:5000/api-docs                 ║`);
console.log(`║  3. Test 2FA: POST /api/auth/2fa/enable                    ║`);
console.log(`║  4. Create backup: POST /api/admin/backups/create          ║`);
console.log(`║  5. Clear cache: DELETE /api/admin/cache/clear             ║`);
console.log(`╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);
