const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { invalidateCache } = require('../middleware/cache');
const { cacheService } = require('../services/redisService');

// All routes require admin access
router.use(protect);
router.use(authorize('admin'));

/**
 * @route   GET /api/admin/cache/status
 * @desc    Check if Redis cache is available
 * @access  Admin only
 */
router.get('/status', (req, res) => {
  const client = cacheService.getClient();
  const isConnected = client !== null;
  
  res.json({
    success: true,
    cacheEnabled: isConnected,
    status: isConnected ? 'connected' : 'disconnected'
  });
});

/**
 * @route   DELETE /api/admin/cache/clear
 * @desc    Clear all cache or specific pattern
 * @access  Admin only
 */
router.delete('/clear', async (req, res) => {
  try {
    const { pattern } = req.query;
    const cachePattern = pattern || 'cache:*';
    
    const count = await invalidateCache(cachePattern);
    
    res.json({
      success: true,
      message: `Cleared ${count} cache entries`,
      pattern: cachePattern,
      count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/admin/cache/test
 * @desc    Test cache functionality
 * @access  Admin only
 */
router.post('/test', async (req, res) => {
  try {
    const testKey = 'cache:test:key';
    const testValue = { test: 'data', timestamp: Date.now() };
    
    // Test SET
    const setResult = await cacheService.set(testKey, testValue, 60);
    
    // Test GET
    const getValue = await cacheService.get(testKey);
    
    // Test DELETE
    const delResult = await cacheService.delete(testKey);
    
    res.json({
      success: true,
      message: 'Cache test completed',
      results: {
        set: setResult,
        get: getValue !== null && getValue.test === 'data',
        delete: delResult
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Cache test failed',
      error: error.message
    });
  }
});

module.exports = router;
