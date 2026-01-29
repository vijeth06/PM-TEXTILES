const express = require('express');
const router = express.Router();
const qualityController = require('../controllers/qualityController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(qualityController.getQualityChecks)
  .post(authorize('admin', 'manager', 'quality'), qualityController.createQualityCheck);

router.route('/:id')
  .get(qualityController.getQualityCheck)
  .put(authorize('admin', 'manager', 'quality'), qualityController.updateQualityCheck);

router.get('/statistics', qualityController.getQualityStatistics);

module.exports = router;
