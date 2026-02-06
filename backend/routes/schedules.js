const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(scheduleController.getSchedules)
  .post(authorize('admin', 'management'), scheduleController.createSchedule);

router.route('/:id')
  .get(scheduleController.getSchedule)
  .put(authorize('admin', 'management'), scheduleController.updateSchedule)
  .delete(authorize('admin', 'management'), scheduleController.deleteSchedule);

router.get('/upcoming', scheduleController.getUpcomingSchedules);

module.exports = router;
