const express = require('express');
const router = express.Router();
const {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier
} = require('../controllers/supplierController');
const { protect, authorize, checkPermission } = require('../middleware/auth');
const { validate, idValidation } = require('../middleware/validation');

router.use(protect);

router.route('/')
  .get(checkPermission('view_suppliers'), getSuppliers)
  .post(checkPermission('manage_suppliers'), createSupplier);

router.route('/:id')
  .get(checkPermission('view_suppliers'), idValidation, validate, getSupplier)
  .put(checkPermission('manage_suppliers'), idValidation, validate, updateSupplier)
  .delete(checkPermission('manage_suppliers'), authorize('admin'), idValidation, validate, deleteSupplier);

module.exports = router;
