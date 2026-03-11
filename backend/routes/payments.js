const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(paymentController.getPayments)
  .post(authorize('admin', 'management'), paymentController.createPayment);

router.route('/:id')
  .get(paymentController.getPayment)
  .put(authorize('admin', 'management'), paymentController.updatePayment)
  .delete(authorize('admin'), paymentController.deletePayment);

router.get('/order/:orderId/summary', paymentController.getOrderPaymentSummary);

module.exports = router;
