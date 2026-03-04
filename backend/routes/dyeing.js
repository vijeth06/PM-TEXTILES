const express = require('express');
const router = express.Router();
const dyeingController = require('../controllers/dyeingController');
const { protect, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(protect);

// Get all dyeing batches
router.get('/', dyeingController.getAllDyeingBatches);

// Get dyeing statistics
router.get('/statistics', dyeingController.getDyeingStatistics);

// Get shade matching queue
router.get('/shade-matching-queue', dyeingController.getShadeMatchingQueue);

// Get dyeing batch by ID
router.get('/:id', dyeingController.getDyeingBatchById);

// Create dyeing batch
router.post('/', authorize('admin', 'production_manager', 'dyeing_supervisor'), dyeingController.createDyeingBatch);

// Update dyeing batch
router.put('/:id', authorize('admin', 'production_manager', 'dyeing_supervisor'), dyeingController.updateDyeingBatch);

// Delete dyeing batch
router.delete('/:id', authorize('admin', 'production_manager'), dyeingController.deleteDyeingBatch);

// Submit shade for matching
router.post('/:id/shade-matching', authorize('admin', 'dyeing_supervisor', 'colorist'), dyeingController.submitShadeMatching);

// Approve shade matching
router.post('/:id/approve-shade', authorize('admin', 'dyeing_supervisor', 'qa_inspector'), dyeingController.approveShadeMatching);

// Reject shade and request redip
router.post('/:id/reject-shade', authorize('admin', 'dyeing_supervisor', 'qa_inspector'), dyeingController.rejectShadeMatching);

// Record quality check
router.post('/:id/quality-check', authorize('admin', 'qa_inspector'), dyeingController.recordQualityCheck);

module.exports = router;
