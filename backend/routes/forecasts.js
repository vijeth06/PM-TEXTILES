const express = require('express');
const router = express.Router();
const {
  createForecast,
  getForecasts,
  generateDemandForecast,
  getForecastAccuracy,
  updateForecastActual,
  deleteForecast
} = require('../controllers/forecastController');

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getForecasts)
  .post(authorize('admin', 'management'), createForecast);

router.post('/demand', generateDemandForecast);
router.get('/accuracy', getForecastAccuracy);

router.route('/:id')
  .delete(authorize('admin'), deleteForecast);

router.put('/:id/actual', updateForecastActual);

module.exports = router;
