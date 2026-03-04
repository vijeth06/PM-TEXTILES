const express = require('express');
const router = express.Router();
const colorLabController = require('../controllers/colorLabController');
const { protect, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(protect);

// Get all color lab requests
router.get('/', colorLabController.getAllColorLabRequests);

// Get shade matching queue
router.get('/queue', colorLabController.getShadeMatchingQueue);

// Get color lab statistics
router.get('/statistics', colorLabController.getColorLabStatistics);

// Get color lab request by ID
router.get('/:id', colorLabController.getColorLabRequestById);

// Create color lab request
router.post('/', authorize('admin', 'sales', 'dyeing_supervisor', 'colorist'), colorLabController.createColorLabRequest);

// Update color lab request
router.put('/:id', authorize('admin', 'dyeing_supervisor', 'colorist'), colorLabController.updateColorLabRequest);

// Delete color lab request
router.delete('/:id', authorize('admin', 'dyeing_supervisor'), colorLabController.deleteColorLabRequest);

// Submit shade for evaluation
router.post('/:id/submit-shade', authorize('admin', 'dyeing_supervisor', 'colorist'), colorLabController.submitShade);

// Approve shade
router.post('/:id/approve-shade', authorize('admin', 'dyeing_supervisor', 'qa_inspector'), colorLabController.approveShade);

// Reject shade
router.post('/:id/reject-shade', authorize('admin', 'dyeing_supervisor', 'colorist'), colorLabController.rejectShade);

// Record bulk production
router.post('/:id/bulk-production', authorize('admin', 'production_manager', 'dyeing_supervisor'), colorLabController.recordBulkProduction);

module.exports = router;
