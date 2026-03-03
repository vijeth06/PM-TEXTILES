const express = require('express');
const router = express.Router();
const {
  createSchedule,
  getSchedules,
  getSchedule,
  startMaintenance,
  completeMaintenance,
  updateSchedule,
  getOverdueMaintenance,
  deleteSchedule
} = require('../controllers/maintenanceController');

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getSchedules)
  .post(authorize('admin', 'production_manager'), createSchedule);

router.get('/overdue', getOverdueMaintenance);

router.route('/:id')
  .get(getSchedule)
  .put(authorize('admin', 'production_manager'), updateSchedule)
  .delete(authorize('admin'), deleteSchedule);

router.put('/:id/start', startMaintenance);
router.put('/:id/complete', completeMaintenance);

module.exports = router;
