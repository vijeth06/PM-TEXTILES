const express = require('express');
const router = express.Router();
const {
  getDashboardMetrics,
  getProductionTrend,
  getInventoryAging,
  getOrderFulfillment,
  getMachineUtilizationReport,
  getSupplierPerformance
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/metrics', getDashboardMetrics);
router.get('/production-trend', getProductionTrend);
router.get('/inventory-aging', getInventoryAging);
router.get('/order-fulfillment', getOrderFulfillment);
router.get('/machine-utilization', getMachineUtilizationReport);
router.get('/supplier-performance', getSupplierPerformance);

module.exports = router;
