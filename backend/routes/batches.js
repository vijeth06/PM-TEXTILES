const express = require('express');
const router = express.Router();
const batchController = require('../controllers/batchController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(batchController.getBatches)
  .post(authorize('admin', 'manager', 'production'), batchController.createBatch);

router.route('/:id')
  .get(batchController.getBatch)
  .put(authorize('admin', 'manager', 'production'), batchController.updateBatch);

router.put('/:id/quality-check', 
  authorize('admin', 'manager', 'quality'),
  batchController.performQualityCheck
);

router.get('/code/:code', batchController.getBatchByCode);

module.exports = router;
