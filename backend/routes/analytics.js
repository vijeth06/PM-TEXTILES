const express = require('express');
const router = express.Router();
const {
  createCostAnalysis,
  getCostAnalyses,
  analyzeProductionCost,
  getCostBreakdown,
  getProfitabilityReport,
  updateCostAnalysis,
  deleteCostAnalysis
} = require('../controllers/costController');

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getCostAnalyses)
  .post(authorize('admin', 'management'), createCostAnalysis);

router.post('/production/:planId', analyzeProductionCost);
router.get('/breakdown', getCostBreakdown);
router.get('/profitability', getProfitabilityReport);

router.route('/:id')
  .put(authorize('admin', 'management'), updateCostAnalysis)
  .delete(authorize('admin'), deleteCostAnalysis);

module.exports = router;
