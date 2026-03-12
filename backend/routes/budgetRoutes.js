const express = require('express');
const budgetController = require('../controllers/budgetController');
const { protect, authorize } = require('../middleware/auth');
const { cache, invalidateCacheAfter } = require('../middleware/cache');

const router = express.Router();

router.use(protect);

router.get('/', cache(300), budgetController.getBudgets);
router.get('/analytics', cache(300), budgetController.getBudgetAnalytics);
router.get('/:id', cache(300), budgetController.getBudget);

router.post(
  '/',
  authorize('admin', 'management', 'store_manager'),
  invalidateCacheAfter(['cache:/api/budgets*', 'cache:/api/budgets/analytics*']),
  budgetController.createBudget
);

router.put(
  '/:id',
  authorize('admin', 'management', 'store_manager'),
  invalidateCacheAfter(['cache:/api/budgets*', 'cache:/api/budgets/analytics*']),
  budgetController.updateBudget
);

router.delete(
  '/:id',
  authorize('admin', 'management'),
  invalidateCacheAfter(['cache:/api/budgets*', 'cache:/api/budgets/analytics*']),
  budgetController.deleteBudget
);

router.post(
  '/:id/allocations',
  authorize('admin', 'management', 'store_manager'),
  invalidateCacheAfter(['cache:/api/budgets*', 'cache:/api/budgets/analytics*']),
  budgetController.addAllocation
);

router.post('/:id/forecast', cache(120), budgetController.forecastBudgetUtilization);

module.exports = router;
