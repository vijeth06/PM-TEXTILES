const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createBackup,
  restoreBackup,
  listBackups,
  BACKUP_DIR
} = require('../services/backupService');

// All routes require admin access
router.use(protect);
router.use(authorize('admin'));

/**
 * @route   GET /api/admin/backups
 * @desc    List all available backups
 * @access  Admin only
 */
router.get('/', async (req, res) => {
  try {
    const backups = listBackups();
    res.json({
      success: true,
      count: backups.length,
      backupDirectory: BACKUP_DIR,
      data: backups
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to list backups',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/admin/backups/create
 * @desc    Create a new database backup
 * @access  Admin only
 */
router.post('/create', async (req, res) => {
  try {
    const result = await createBackup();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Backup created successfully',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Backup failed',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create backup',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/admin/backups/restore
 * @desc    Restore database from backup
 * @access  Admin only
 */
router.post('/restore', async (req, res) => {
  try {
    const { backupName } = req.body;
    
    if (!backupName) {
      return res.status(400).json({
        success: false,
        message: 'Backup name is required'
      });
    }

    const result = await restoreBackup(backupName);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Database restored successfully',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Restore failed',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to restore backup',
      error: error.message
    });
  }
});

module.exports = router;
