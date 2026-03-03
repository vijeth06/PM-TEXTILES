const express = require('express');
const router = express.Router();
const {
  createQuotation,
  getQuotations,
  getQuotation,
  sendQuotation,
  acceptQuotation,
  createOrderFromQuotation,
  updateQuotation,
  reviseQuotation,
  deleteQuotation
} = require('../controllers/quotationController');

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getQuotations)
  .post(createQuotation);

router.route('/:id')
  .get(getQuotation)
  .put(updateQuotation)
  .delete(authorize('admin'), deleteQuotation);

router.post('/:id/send', sendQuotation);
router.put('/:id/accept', acceptQuotation);
router.post('/:id/create-order', createOrderFromQuotation);
router.post('/:id/revise', reviseQuotation);

module.exports = router;
