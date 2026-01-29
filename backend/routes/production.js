const express = require('express');
const router = express.Router();
const {
  getProductionPlans,
  getProductionPlan,
  createProductionPlan,
  updateProductionPlan,
  deleteProductionPlan,
  getProductionStages,
  updateProductionStage,
  getMachines,
  getMachineUtilization
} = require('../controllers/productionController');
const { protect, authorize, checkPermission } = require('../middleware/auth');
const { validate, idValidation, productionPlanValidation } = require('../middleware/validation');

// All routes are protected
router.use(protect);

// Production Plans
router.route('/plans')
  .get(checkPermission('view_production'), getProductionPlans)
  .post(checkPermission('manage_production'), productionPlanValidation, validate, createProductionPlan);

router.route('/plans/:id')
  .get(checkPermission('view_production'), idValidation, validate, getProductionPlan)
  .put(checkPermission('manage_production'), idValidation, validate, updateProductionPlan)
  .delete(checkPermission('manage_production'), authorize('admin', 'production_manager'), idValidation, validate, deleteProductionPlan);

// Production Stages
router.get('/stages/:planId', checkPermission('view_production'), getProductionStages);
router.put('/stages/:id', checkPermission('manage_production'), updateProductionStage);

// Machines
router.get('/machines', checkPermission('view_production'), getMachines);
router.get('/machines/:id/utilization', checkPermission('view_production'), getMachineUtilization);

module.exports = router;
