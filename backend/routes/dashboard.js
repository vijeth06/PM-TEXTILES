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

router.use(protect);

router.get('/metrics', getDashboardMetrics);
router.get('/trends', getDashboardTrends);
router.get('/order-status-distribution', getOrderStatusDistribution);
router.get('/quality-by-stage', getQualityByStage);
router.get('/monthly-performance', getMonthlyPerformance);
router.get('/inventory-value-trend', getInventoryValueTrend);
router.get('/production-trend', getProductionTrend);
router.get('/inventory-aging', getInventoryAging);
router.get('/order-fulfillment', getOrderFulfillment);
router.get('/machine-utilization', getMachineUtilizationReport);
router.get('/supplier-performance', getSupplierPerformance);

module.exports = router;
