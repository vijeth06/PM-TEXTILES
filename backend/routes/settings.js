const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings,
  getSystemInfo,
  backup,
  restore
} = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getSettings);
router.get('/system-info', getSystemInfo);

// Admin only
router.use(authorize('admin'));
router.put('/', updateSettings);
router.post('/backup', backup);
router.post('/restore', restore);

module.exports = router;
