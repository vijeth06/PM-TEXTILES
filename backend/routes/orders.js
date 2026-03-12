const express = require('express');
const router = express.Router();
const {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  dispatchOrder,
  getOrdersByCustomer,
  getOrderProfit
} = require('../controllers/orderController');
const { protect, authorize, checkPermission } = require('../middleware/auth');
const { validate, idValidation, orderValidation } = require('../middleware/validation');

router.use(protect);

const { cache } = require('../middleware/cache');

router.route('/')
  .get(checkPermission('view_orders'), cache(300), getOrders)
  .post(checkPermission('manage_orders'), orderValidation, validate, createOrder);

router.get('/customer/:customerId', checkPermission('view_orders'), cache(300), getOrdersByCustomer);

router.route('/:id')
  .get(checkPermission('view_orders'), cache(600), idValidation, validate, getOrder)
  .put(checkPermission('manage_orders'), idValidation, validate, updateOrder)
  .delete(checkPermission('manage_orders'), authorize('admin', 'sales_executive'), idValidation, validate, deleteOrder);

router.post('/:id/dispatch', checkPermission('manage_orders'), idValidation, validate, dispatchOrder);
router.get('/:id/profit', checkPermission('view_reports'), cache(600), idValidation, validate, getOrderProfit);

router.post('/:id/dispatch', checkPermission('manage_orders'), dispatchOrder);
router.get('/:id/profit', checkPermission('view_orders'), getOrderProfit);

module.exports = router;
