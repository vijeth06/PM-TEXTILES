const express = require('express');
const router = express.Router();
const {
  getAuditLogs,
  getAuditLog,
  getUserActivity,
  getEntityHistory
} = require('../controllers/auditController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router.get('/', getAuditLogs);
router.get('/:id', getAuditLog);
router.get('/user/:userId', getUserActivity);
router.get('/entity/:entityType/:entityId', getEntityHistory);

module.exports = router;
