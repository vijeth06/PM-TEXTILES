const express = require('express');
const router = express.Router();
const {
  getNotifications,
  getNotification,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAll
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getNotifications)
  .post(authorize('admin'), createNotification);

router.put('/read-all', markAllAsRead);
router.delete('/clear-all', clearAll);

router.route('/:id')
  .get(getNotification)
  .delete(deleteNotification);

router.put('/:id/read', markAsRead);

module.exports = router;
