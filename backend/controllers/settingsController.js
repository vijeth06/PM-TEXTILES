const Settings = require('../models/Settings');
const asyncHandler = require('express-async-handler');
const os = require('os');

// @desc    Get all settings
// @route   GET /api/settings
// @access  Private
exports.getSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.find().populate('updatedBy', 'fullName username');

  // Convert array to object for easier access
  const settingsObj = {};
  settings.forEach(setting => {
    settingsObj[setting.key] = {
      value: setting.value,
      category: setting.category,
      description: setting.description,
      updatedBy: setting.updatedBy,
      updatedAt: setting.updatedAt
    };
  });

  res.json({
    success: true,
    data: settingsObj
  });
});

// @desc    Update settings
// @route   PUT /api/settings
// @access  Private (Admin)
exports.updateSettings = asyncHandler(async (req, res) => {
  const { settings } = req.body;

  if (!settings || typeof settings !== 'object') {
    res.status(400);
    throw new Error('Settings object is required');
  }

  const updates = [];

  for (const [key, value] of Object.entries(settings)) {
    const updated = await Settings.findOneAndUpdate(
      { key },
      { 
        value: value.value || value,
        category: value.category,
        description: value.description,
        updatedBy: req.user.id
      },
      { upsert: true, new: true }
    );
    updates.push(updated);
  }

  res.json({
    success: true,
    message: 'Settings updated successfully',
    data: updates
  });
});

// @desc    Get system information
// @route   GET /api/settings/system-info
// @access  Private
exports.getSystemInfo = asyncHandler(async (req, res) => {
  const systemInfo = {
    platform: os.platform(),
    architecture: os.arch(),
    cpus: os.cpus().length,
    totalMemory: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
    freeMemory: (os.freemem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
    uptime: (os.uptime() / 3600).toFixed(2) + ' hours',
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development'
  };

  // Database stats
  const mongoose = require('mongoose');
  const dbStats = await mongoose.connection.db.stats();

  res.json({
    success: true,
    system: systemInfo,
    database: {
      collections: dbStats.collections,
      dataSize: (dbStats.dataSize / 1024 / 1024).toFixed(2) + ' MB',
      indexSize: (dbStats.indexSize / 1024 / 1024).toFixed(2) + ' MB',
      storageSize: (dbStats.storageSize / 1024 / 1024).toFixed(2) + ' MB'
    }
  });
});

// @desc    Create database backup
// @route   POST /api/settings/backup
// @access  Private (Admin)
exports.backup = asyncHandler(async (req, res) => {
  // This is a placeholder - actual backup implementation would depend on your infrastructure
  res.json({
    success: true,
    message: 'Backup functionality - to be implemented based on deployment environment',
    timestamp: new Date().toISOString()
  });
});

// @desc    Restore database from backup
// @route   POST /api/settings/restore
// @access  Private (Admin)
exports.restore = asyncHandler(async (req, res) => {
  // This is a placeholder - actual restore implementation would depend on your infrastructure
  res.json({
    success: true,
    message: 'Restore functionality - to be implemented based on deployment environment'
  });
});
