const express = require('express');
const router = express.Router();
const {
  getDailyProductionReport,
  getInventoryAgingReport,
  getWastageAnalysisReport,
  getOrderFulfillmentReport,
  getMachineUtilizationReport,
  getProfitPerOrderReport
} = require('../controllers/reportController');
const { protect, checkPermission } = require('../middleware/auth');

router.use(protect);
router.use(checkPermission('view_reports'));

router.get('/production-daily', getDailyProductionReport);
router.get('/inventory-aging', getInventoryAgingReport);
router.get('/wastage-analysis', getWastageAnalysisReport);
router.get('/order-fulfillment', getOrderFulfillmentReport);
router.get('/machine-utilization', getMachineUtilizationReport);
router.get('/profit-per-order', getProfitPerOrderReport);

module.exports = router;
