const express = require('express');
const router = express.Router();
const loomProductionController = require('../controllers/loomProductionController');
const { protect, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(protect);

// Get all loom productions
router.get('/', loomProductionController.getAllLoomProductions);

// Get efficiency dashboard
router.get('/efficiency-dashboard', loomProductionController.getEfficiencyDashboard);

// Get live loom status
router.get('/live-status', loomProductionController.getLiveLoomStatus);

// Get loom production by ID
router.get('/:id', loomProductionController.getLoomProductionById);

// Create loom production
router.post('/', authorize('admin', 'production_manager', 'supervisor'), loomProductionController.createLoomProduction);

// Update loom production
router.put('/:id', authorize('admin', 'production_manager', 'supervisor'), loomProductionController.updateLoomProduction);

// Delete loom production
router.delete('/:id', authorize('admin', 'production_manager'), loomProductionController.deleteLoomProduction);

// Record defect
router.post('/:id/defects', authorize('admin', 'production_manager', 'supervisor', 'qa_inspector'), loomProductionController.recordDefect);

// Record stoppage
router.post('/:id/stoppages', authorize('admin', 'production_manager', 'supervisor'), loomProductionController.recordStoppage);

module.exports = router;
