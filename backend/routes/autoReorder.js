const express = require('express');
const router = express.Router();
const {
  getAutoReorders,
  checkAndTriggerReorders,
  approveAutoReorder,
  rejectAutoReorder,
  updateReorderQuantity,
  deleteAutoReorder
} = require('../controllers/autoReorderController');

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getAutoReorders);

router.post('/check', checkAndTriggerReorders);

router.put('/:id/approve', authorize('admin', 'store_manager'), approveAutoReorder);
router.put('/:id/reject', authorize('admin', 'store_manager'), rejectAutoReorder);
router.put('/:id/quantity', updateReorderQuantity);

router.route('/:id')
  .delete(authorize('admin'), deleteAutoReorder);

module.exports = router;
