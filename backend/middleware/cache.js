/**
 * Caching Middleware for Express Routes
 * Automatically caches GET requests using Redis
 */

const { cacheService } = require('../services/redisService');

/**
 * Cache middleware factory
 * @param {number} ttl - Time to live in seconds (default: 300s/5min)
 * @param {Function} keyGenerator - Optional custom key generator function
 * @returns {Function} Express middleware
 */
const cache = (ttl = 300, keyGenerator = null) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Generate cache key
      const cacheKey = keyGenerator
        ? keyGenerator(req)
        : `cache:${req.originalUrl}:user:${req.user?.id || 'anonymous'}`;

      // Try to get from cache
      const cachedData = await cacheService.get(cacheKey);

      if (cachedData) {
        console.log('✅ Cache HIT:', cacheKey);
        return res.json(cachedData);
      }

      console.log('❌ Cache MISS:', cacheKey);

      // Store original res.json function
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = (body) => {
        // Cache successful responses only
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheService.set(cacheKey, body, ttl).catch(err => {
            console.warn('Cache set error:', err.message);
          });
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      console.warn('Cache middleware error:', error.message);
      next();
    }
  };
};

/**
 * Invalidate cache for specific pattern
 * @param {string} pattern - Cache key pattern (e.g., 'cache:dashboard:*')
 */
const invalidateCache = async (pattern) => {
  try {
    const count = await cacheService.deletePattern(pattern);
    console.log(`🗑️ Invalidated ${count} cache entries for pattern: ${pattern}`);
    return count;
  } catch (error) {
    console.warn('Cache invalidation error:', error.message);
    return 0;
  }
};

/**
 * Middleware to invalidate cache after mutations (POST, PUT, DELETE)
 * @param {string|Array} patterns - Cache patterns to invalidate
 */
const invalidateCacheAfter = (patterns) => {
  return async (req, res, next) => {
    // Store original res.json
    const originalJson = res.json.bind(res);

    // Override res.json to invalidate cache after successful response
    res.json = async (body) => {
      // Invalidate cache for successful mutations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const patternsArray = Array.isArray(patterns) ? patterns : [patterns];
        for (const pattern of patternsArray) {
          await invalidateCache(pattern);
        }
      }
      return originalJson(body);
    };

    next();
  };
};

/**
 * Cache key generators for common patterns
 */
const cacheKeys = {
  dashboard: (req) => `cache:dashboard:user:${req.user?.id || 'all'}`,
  orders: (req) => `cache:orders:${req.query.status || 'all'}:user:${req.user?.id}`,
  inventory: (req) => `cache:inventory:${req.query.category || 'all'}`,
  production: (req) => `cache:production:${req.query.status || 'all'}`,
  reports: (req) => `cache:reports:${req.params.reportType}:${JSON.stringify(req.query)}`,
  analytics: (req) => `cache:analytics:${req.path}:${JSON.stringify(req.query)}`
};

module.exports = {
  cache,
  invalidateCache,
  invalidateCacheAfter,
  cacheKeys
};
