const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer
} = require('../controllers/customerController');
const { protect, authorize, checkPermission } = require('../middleware/auth');
const { validate, idValidation } = require('../middleware/validation');

router.use(protect);

router.route('/')
  .get(checkPermission('view_customers'), getCustomers)
  .post(checkPermission('manage_customers'), createCustomer);

router.route('/:id')
  .get(checkPermission('view_customers'), idValidation, validate, getCustomer)
  .put(checkPermission('manage_customers'), idValidation, validate, updateCustomer)
  .delete(checkPermission('manage_customers'), authorize('admin'), idValidation, validate, deleteCustomer);

module.exports = router;
