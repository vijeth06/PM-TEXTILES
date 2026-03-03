const express = require('express');
const router = express.Router();
const {
  createKPI,
  getKPIs,
  calculateOEE,
  calculateOTD,
  calculateFPY,
  getKPIDashboard,
  deleteKPI
} = require('../controllers/kpiController');

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getKPIs)
  .post(authorize('admin', 'production_manager', 'management'), createKPI);

router.post('/oee', calculateOEE);
router.post('/otd', calculateOTD);
router.post('/fpy', calculateFPY);
router.get('/dashboard', getKPIDashboard);

router.route('/:id')
  .delete(authorize('admin'), deleteKPI);

module.exports = router;
