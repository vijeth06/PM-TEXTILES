const AuditLog = require('../models/AuditLog');
const asyncHandler = require('express-async-handler');

// @desc    Get all audit logs
// @route   GET /api/audit
// @access  Private (Admin)
exports.getAuditLogs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = {};
  const allowedActions = ['create', 'update', 'delete', 'login', 'logout', 'view', 'export', 'import'];
  
  if (req.query.action) {
    if (!allowedActions.includes(req.query.action)) {
      return res.json({
        success: true,
        data: [],
        total: 0,
        page,
        pages: 0
      });
    }
    filter.action = req.query.action;
  }
  if (req.query.entity) filter.entityType = req.query.entity;
  if (req.query.user) {
    // Search by username
    const User = require('../models/User');
    const user = await User.findOne({ username: { $regex: req.query.user, $options: 'i' } });
    if (!user) {
      return res.json({
        success: true,
        data: [],
        total: 0,
        page,
        pages: 0
      });
    }
    filter.user = user._id;
  }
  if (req.query.startDate || req.query.endDate) {
    filter.timestamp = {};
    if (req.query.startDate) filter.timestamp.$gte = new Date(req.query.startDate);
    if (req.query.endDate) {
      const endDate = new Date(req.query.endDate);
      endDate.setHours(23, 59, 59, 999);
      filter.timestamp.$lte = endDate;
    }
  }

  const logs = await AuditLog.find(filter)
    .populate('user', 'username fullName email')
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit);

  const total = await AuditLog.countDocuments(filter);

  res.json({
    success: true,
    data: logs,
    total,
    page,
    pages: Math.ceil(total / limit)
  });
});

// @desc    Get single audit log
// @route   GET /api/audit/:id
// @access  Private (Admin)
exports.getAuditLog = asyncHandler(async (req, res) => {
  const log = await AuditLog.findById(req.params.id)
    .populate('user', 'username fullName email role');

  if (!log) {
    res.status(404);
    throw new Error('Audit log not found');
  }

  res.json({
    success: true,
    data: log
  });
});

// @desc    Get user activity logs
// @route   GET /api/audit/user/:userId
// @access  Private (Admin)
exports.getUserActivity = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const logs = await AuditLog.find({ user: req.params.userId })
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit);

  const total = await AuditLog.countDocuments({ user: req.params.userId });

  res.json({
    success: true,
    data: logs,
    total,
    page,
    pages: Math.ceil(total / limit)
  });
});

// @desc    Get entity history
// @route   GET /api/audit/entity/:entityType/:entityId
// @access  Private (Admin)
exports.getEntityHistory = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;

  const logs = await AuditLog.find({
    entityType,
    entityId
  })
    .populate('user', 'username fullName')
    .sort({ timestamp: -1 });

  res.json({
    success: true,
    data: logs
  });
});

// Helper function to create audit log (used by other controllers)
exports.createAuditLog = async (data) => {
  try {
    return await AuditLog.create(data);
  } catch (error) {
    console.error('Failed to create audit log:', error);
    return null;
  }
};
