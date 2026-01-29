const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(scheduleController.getSchedules)
  .post(authorize('admin', 'manager'), scheduleController.createSchedule);

router.route('/:id')
  .get(scheduleController.getSchedule)
  .put(authorize('admin', 'manager'), scheduleController.updateSchedule)
  .delete(authorize('admin', 'manager'), scheduleController.deleteSchedule);

router.get('/upcoming', scheduleController.getUpcomingSchedules);

module.exports = router;
