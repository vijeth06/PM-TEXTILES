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

let passed = 0;
let failed = 0;

const pass = (message) => {
  passed += 1;
  console.log(`  ${colors.green}✓${colors.reset} ${message}`);
};

const fail = (message) => {
  failed += 1;
  console.log(`  ${colors.red}✗${colors.reset} ${message}`);
};

console.log(`\n${colors.blue}╔════════════════════════════════════════════════════════════╗`);
console.log(`║  PM Textiles ERP - New Features Test                      ║`);
console.log(`╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

// Test 1: Check if Redis service exists
console.log(`${colors.yellow}[1/6]${colors.reset} Testing Redis Service...`);
try {
  const { cacheService } = require('./services/redisService');
  if (!cacheService || typeof cacheService.get !== 'function') {
    throw new Error('cacheService API is incomplete');
  }
  pass('Redis service loaded');
} catch (error) {
  fail(`Redis service error: ${error.message}`);
}

// Test 2: Check if Email service exists
console.log(`\n${colors.yellow}[2/6]${colors.reset} Testing Email Service...`);
try {
  const { initEmailService, sendEmail } = require('./services/emailService');
  if (typeof initEmailService !== 'function' || typeof sendEmail !== 'function') {
    throw new Error('emailService exports are incomplete');
  }
  pass('Email service loaded');
} catch (error) {
  fail(`Email service error: ${error.message}`);
}

// Test 3: Check if Backup service exists
console.log(`\n${colors.yellow}[3/6]${colors.reset} Testing Backup Service...`);
try {
  const { createBackup, listBackups } = require('./services/backupService');
  if (typeof createBackup !== 'function' || typeof listBackups !== 'function') {
    throw new Error('backupService exports are incomplete');
  }
  pass('Backup service loaded');
} catch (error) {
  fail(`Backup service error: ${error.message}`);
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
    pass('Encryption/Decryption working');
  } else {
    fail('Encryption test failed');
  }
  
  // Test hashing
  const { hash: hashedValue, salt } = hash('password123');
  if (!hashedValue || !salt) {
    throw new Error('Hash output is incomplete');
  }
  pass('Hashing working');
  
  // Test token generation
  const token = generateToken(32);
  if (token && token.length === 64) {
    pass('Token generation working');
  } else {
    fail('Token generation test failed');
  }
} catch (error) {
  fail(`Encryption error: ${error.message}`);
}

// Test 5: Check if 2FA middleware exists
console.log(`\n${colors.yellow}[5/6]${colors.reset} Testing 2FA Middleware...`);
try {
  const { enable2FA, verify2FA, disable2FA } = require('./middleware/twoFactor');
  if (typeof enable2FA !== 'function' || typeof verify2FA !== 'function' || typeof disable2FA !== 'function') {
    throw new Error('2FA middleware exports are incomplete');
  }
  pass('2FA middleware loaded');
} catch (error) {
  fail(`2FA middleware error: ${error.message}`);
}

// Test 6: Check if Swagger docs exist
console.log(`\n${colors.yellow}[6/6]${colors.reset} Testing Swagger Documentation...`);
try {
  const swaggerSpec = require('./utils/swaggerDocs');
  if (swaggerSpec && swaggerSpec.openapi) {
    pass('Swagger docs configured');
    console.log(`  ${colors.blue}ℹ${colors.reset}  API Docs will be available at: http://localhost:5055/api-docs`);
  } else {
    fail('Swagger docs are not configured correctly');
  }
} catch (error) {
  fail(`Swagger docs error: ${error.message}`);
}

console.log(`\n${colors.blue}╔════════════════════════════════════════════════════════════╗`);
console.log(`║  Test Summary                                              ║`);
console.log(`╠════════════════════════════════════════════════════════════╣`);
console.log(`║  Passed: ${passed.toString().padEnd(3)}  Failed: ${failed.toString().padEnd(3)}                                  ║`);
console.log(`║                                                            ║`);
console.log(`║  Next Steps:                                               ║`);
console.log(`║  1. Start server: npm run dev                              ║`);
console.log(`║  2. Visit: http://localhost:5055/api-docs                 ║`);
console.log(`║  3. Test 2FA: POST /api/auth/2fa/enable                    ║`);
console.log(`║  4. Create backup: POST /api/admin/backups/create          ║`);
console.log(`║  5. Clear cache: DELETE /api/admin/cache/clear             ║`);
console.log(`╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

if (failed > 0) {
  process.exitCode = 1;
}
