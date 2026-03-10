const express = require('express');
const router = express.Router();
const {
  getDashboardMetrics,
  getProductionTrend,
  getInventoryAging,
  getOrderFulfillment,
  getMachineUtilizationReport,
  getSupplierPerformance,
  getDashboardTrends,
  getOrderStatusDistribution,
  getQualityByStage,
  getMonthlyPerformance,
  getInventoryValueTrend
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');
const { cache, cacheKeys } = require('../middleware/cache');

router.use(protect);

// Cache dashboard data for 5 minutes (300 seconds)
router.get('/metrics', cache(300, cacheKeys.dashboard), getDashboardMetrics);
router.get('/trends', cache(300, cacheKeys.dashboard), getDashboardTrends);
router.get('/order-status-distribution', cache(300), getOrderStatusDistribution);
router.get('/quality-by-stage', cache(300), getQualityByStage);
router.get('/monthly-performance', cache(600), getMonthlyPerformance); // 10 minutes
router.get('/inventory-value-trend', cache(600), getInventoryValueTrend);
router.get('/production-trend', cache(300, cacheKeys.production), getProductionTrend);
router.get('/inventory-aging', cache(600, cacheKeys.inventory), getInventoryAging);
router.get('/order-fulfillment', cache(300, cacheKeys.orders), getOrderFulfillment);
router.get('/machine-utilization', cache(600), getMachineUtilizationReport);
router.get('/supplier-performance', cache(600), getSupplierPerformance);

module.exports = router;
