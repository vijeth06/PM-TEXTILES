const rateLimit = require('express-rate-limit');

const isDev = process.env.NODE_ENV !== 'production';

const toInt = (value, fallback) => {
  const n = parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) ? n : fallback;
};

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  // The UI makes many requests on load (including CORS preflight OPTIONS).
  // Keep production conservative, but allow a higher ceiling in development.
  max: toInt(process.env.API_RATE_LIMIT_MAX, isDev ? 2000 : 100),
  // Don't count CORS preflight requests, and avoid double-limiting auth routes
  // (auth endpoints have their own stricter limiter).
  skip: (req) => {
    const url = String(req.originalUrl || '');
    if (req.method === 'OPTIONS') return true;
    if (url.startsWith('/api/auth/')) return true;
    return false;
  },
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Auth rate limiter (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per 15 minutes
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes.'
  }
});

// File upload rate limiter
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: {
    success: false,
    message: 'Too many file uploads, please try again later.'
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  uploadLimiter
};
