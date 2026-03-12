const express = require('express');
const budgetController = require('../controllers/budgetController');
const auth = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Get all budgets
router.get('/', budgetController.getBudgets);

// Get budget analytics
router.get('/analytics', budgetController.getBudgetAnalytics);

// Get single budget
router.get('/:id', budgetController.getBudget);

// Create budget
router.post('/', budgetController.createBudget);

// Update budget
router.put('/:id', budgetController.updateBudget);

// Delete budget
router.delete('/:id', budgetController.deleteBudget);

// Add allocation to budget
router.post('/:id/allocations', budgetController.addAllocation);

// Forecast budget utilization
router.post('/:id/forecast', budgetController.forecastBudgetUtilization);

module.exports = router;
