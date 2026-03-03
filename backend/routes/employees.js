const express = require('express');
const router = express.Router();
const {
  createEmployee,
  getEmployees,
  getEmployee,
  updateEmployee,
  markAttendance,
  getEmployeeAttendance,
  addTraining,
  addSkill,
  terminateEmployee,
  deleteEmployee
} = require('../controllers/employeeController');

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getEmployees)
  .post(authorize('admin', 'management'), createEmployee);

router.route('/:id')
  .get(getEmployee)
  .put(authorize('admin', 'management'), updateEmployee)
  .delete(authorize('admin'), deleteEmployee);

router.post('/:id/attendance', markAttendance);
router.get('/:id/attendance', getEmployeeAttendance);
router.post('/:id/training', authorize('admin', 'management'), addTraining);
router.post('/:id/skills', authorize('admin', 'management'), addSkill);
router.put('/:id/terminate', authorize('admin'), terminateEmployee);

module.exports = router;
