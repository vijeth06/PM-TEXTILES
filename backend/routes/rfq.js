const express = require('express');
const router = express.Router();
const {
  createRFQ,
  getRFQs,
  getRFQ,
  sendRFQ,
  submitQuotation,
  evaluateRFQ,
  createPOFromRFQ,
  updateRFQ,
  deleteRFQ
} = require('../controllers/rfqController');

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getRFQs)
  .post(authorize('admin', 'store_manager'), createRFQ);

router.route('/:id')
  .get(getRFQ)
  .put(authorize('admin', 'store_manager'), updateRFQ)
  .delete(authorize('admin'), deleteRFQ);

router.post('/:id/send', authorize('admin', 'store_manager'), sendRFQ);
router.post('/:id/quotation', submitQuotation);
router.post('/:id/evaluate', authorize('admin', 'store_manager', 'management'), evaluateRFQ);
router.post('/:id/create-po', authorize('admin', 'store_manager'), createPOFromRFQ);

module.exports = router;
