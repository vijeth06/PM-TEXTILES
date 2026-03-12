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
const { cache, invalidateCacheAfter } = require('../middleware/cache');

router.use(protect);

router.route('/')
  .get(cache(300), getRFQs)
  .post(
    authorize('admin', 'store_manager'),
    invalidateCacheAfter('cache:/api/procurement/rfq*'),
    createRFQ
  );

router.route('/:id')
  .get(cache(300), getRFQ)
  .put(
    authorize('admin', 'store_manager'),
    invalidateCacheAfter('cache:/api/procurement/rfq*'),
    updateRFQ
  )
  .delete(
    authorize('admin'),
    invalidateCacheAfter('cache:/api/procurement/rfq*'),
    deleteRFQ
  );

router.post('/:id/send', authorize('admin', 'store_manager'), invalidateCacheAfter('cache:/api/procurement/rfq*'), sendRFQ);
router.post('/:id/quotation', invalidateCacheAfter('cache:/api/procurement/rfq*'), submitQuotation);
router.post('/:id/evaluate', authorize('admin', 'store_manager', 'management'), invalidateCacheAfter('cache:/api/procurement/rfq*'), evaluateRFQ);
router.post('/:id/create-po', authorize('admin', 'store_manager'), invalidateCacheAfter('cache:/api/procurement/rfq*'), createPOFromRFQ);

module.exports = router;
