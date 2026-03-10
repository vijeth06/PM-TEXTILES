const Redis = require('ioredis');

// Redis client configuration
let redisClient = null;

const initRedis = () => {
  try {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    redisClient.on('error', (err) => {
      console.warn('⚠️ Redis connection error (running without cache):', err.message);
      redisClient = null; // Disable Redis if connection fails
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis is ready');
    });

    // Attempt to connect
    redisClient.connect().catch((err) => {
      console.warn('⚠️ Redis not available (running without cache):', err.message);
      redisClient = null;
    });

    return redisClient;
  } catch (error) {
    console.warn('⚠️ Redis initialization failed (running without cache):', error.message);
    return null;
  }
};

// Cache wrapper functions
const cacheService = {
  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any>} Cached value or null
   */
  get: async (key) => {
    if (!redisClient) return null;
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Redis GET error:', error.message);
      return null;
    }
  },

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds (default: 300s/5min)
   * @returns {Promise<boolean>} Success status
   */
  set: async (key, value, ttl = 300) => {
    if (!redisClient) return false;
    try {
      await redisClient.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn('Redis SET error:', error.message);
      return false;
    }
  },

  /**
   * Delete key from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Success status
   */
  delete: async (key) => {
    if (!redisClient) return false;
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.warn('Redis DEL error:', error.message);
      return false;
    }
  },

  /**
   * Delete all keys matching pattern
   * @param {string} pattern - Key pattern (e.g., 'dashboard:*')
   * @returns {Promise<number>} Number of keys deleted
   */
  deletePattern: async (pattern) => {
    if (!redisClient) return 0;
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
        return keys.length;
      }
      return 0;
    } catch (error) {
      console.warn('Redis DELETE PATTERN error:', error.message);
      return 0;
    }
  },

  /**
   * Check if key exists
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} True if key exists
   */
  exists: async (key) => {
    if (!redisClient) return false;
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.warn('Redis EXISTS error:', error.message);
      return false;
    }
  },

  /**
   * Increment counter
   * @param {string} key - Cache key
   * @param {number} amount - Amount to increment (default: 1)
   * @returns {Promise<number>} New value
   */
  increment: async (key, amount = 1) => {
    if (!redisClient) return 0;
    try {
      return await redisClient.incrby(key, amount);
    } catch (error) {
      console.warn('Redis INCR error:', error.message);
      return 0;
    }
  },

  /**
   * Set expiration on key
   * @param {string} key - Cache key
   * @param {number} seconds - Seconds until expiration
   * @returns {Promise<boolean>} Success status
   */
  expire: async (key, seconds) => {
    if (!redisClient) return false;
    try {
      await redisClient.expire(key, seconds);
      return true;
    } catch (error) {
      console.warn('Redis EXPIRE error:', error.message);
      return false;
    }
  },

  /**
   * Get or set with callback (cache-aside pattern)
   * @param {string} key - Cache key
   * @param {Function} callback - Async function to get fresh data
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<any>} Cached or fresh data
   */
  getOrSet: async (key, callback, ttl = 300) => {
    // Try to get from cache first
    const cached = await cacheService.get(key);
    if (cached !== null) {
      return cached;
    }

    // Get fresh data
    const freshData = await callback();
    
    // Cache the result
    await cacheService.set(key, freshData, ttl);
    
    return freshData;
  },

  /**
   * Close Redis connection
   */
  close: async () => {
    if (redisClient) {
      await redisClient.quit();
      redisClient = null;
    }
  },

  /**
   * Get Redis client instance
   */
  getClient: () => redisClient
};

module.exports = { initRedis, cacheService };
