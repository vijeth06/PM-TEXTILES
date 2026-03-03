const MaintenanceSchedule = require('../models/MaintenanceSchedule');
const Machine = require('../models/Machine');
const { emitToRole } = require('../services/socketService');
const asyncHandler = require('express-async-handler');

// @desc    Create maintenance schedule
// @route   POST /api/maintenance/schedules
// @access  Private
exports.createSchedule = asyncHandler(async (req, res) => {
  const schedule = await MaintenanceSchedule.create(req.body);

  res.status(201).json({
    success: true,
    data: schedule
  });
});

// @desc    Get all maintenance schedules
// @route   GET /api/maintenance/schedules
// @access  Private
exports.getSchedules = asyncHandler(async (req, res) => {
  const { status, maintenanceType, machineId, startDate, endDate } = req.query;
  
  let query = {};
  if (status) query.status = status;
  if (maintenanceType) query.maintenanceType = maintenanceType;
  if (machineId) query.machineId = machineId;
  if (startDate && endDate) {
    query.scheduledDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const schedules = await MaintenanceSchedule.find(query)
    .populate('machineId')
    .populate('assignedTo.userId', 'username fullName')
    .populate('completedBy', 'username fullName')
    .sort({ scheduledDate: 1 });

  res.json({
    success: true,
    count: schedules.length,
    data: schedules
  });
});

// @desc    Get single maintenance schedule
// @route   GET /api/maintenance/schedules/:id
// @access  Private
exports.getSchedule = asyncHandler(async (req, res) => {
  const schedule = await MaintenanceSchedule.findById(req.params.id)
    .populate('machineId')
    .populate('assignedTo.userId')
    .populate('completedBy')
    .populate('verifiedBy');

  if (!schedule) {
    res.status(404);
    throw new Error('Maintenance schedule not found');
  }

  res.json({
    success: true,
    data: schedule
  });
});

// @desc    Start maintenance
// @route   PUT /api/maintenance/schedules/:id/start
// @access  Private
exports.startMaintenance = asyncHandler(async (req, res) => {
  const schedule = await MaintenanceSchedule.findById(req.params.id);

  if (!schedule) {
    res.status(404);
    throw new Error('Maintenance schedule not found');
  }

  schedule.status = 'in_progress';
  schedule.actualStartDate = new Date();

  // Update machine status
  if (schedule.machineId) {
    await Machine.findByIdAndUpdate(schedule.machineId, {
      status: 'maintenance'
    });
  }

  await schedule.save();

  emitToRole('production_manager', 'maintenance_started', {
    machine: schedule.machineCode,
    type: schedule.maintenanceType
  });

  res.json({
    success: true,
    data: schedule
  });
});

// @desc    Complete maintenance
// @route   PUT /api/maintenance/schedules/:id/complete
// @access  Private
exports.completeMaintenance = asyncHandler(async (req, res) => {
  const { findings, actionsTaken, recommendations, spareParts } = req.body;

  const schedule = await MaintenanceSchedule.findById(req.params.id);

  if (!schedule) {
    res.status(404);
    throw new Error('Maintenance schedule not found');
  }

  schedule.status = 'completed';
  schedule.actualEndDate = new Date();
  schedule.findings = findings;
  schedule.actionsTaken = actionsTaken;
  schedule.recommendations = recommendations;
  schedule.completedBy = req.user.id;

  // Update spare parts used
  if (spareParts) {
    schedule.spareParts.forEach(part => {
      const usedPart = spareParts.find(sp => sp.partCode === part.partCode);
      if (usedPart) {
        part.used = usedPart.used;
      }
    });
  }

  // Calculate next scheduled date based on frequency
  if (schedule.frequency) {
    const nextDate = new Date(schedule.scheduledDate);
    switch (schedule.frequency.unit) {
      case 'days':
        nextDate.setDate(nextDate.getDate() + schedule.frequency.value);
        break;
      case 'weeks':
        nextDate.setDate(nextDate.getDate() + (schedule.frequency.value * 7));
        break;
      case 'months':
        nextDate.setMonth(nextDate.getMonth() + schedule.frequency.value);
        break;
      case 'years':
        nextDate.setFullYear(nextDate.getFullYear() + schedule.frequency.value);
        break;
    }
    schedule.nextScheduledDate = nextDate;
  }

  // Update machine status back to operational
  if (schedule.machineId) {
    const machine = await Machine.findById(schedule.machineId);
    machine.status = 'operational';
    machine.maintenanceSchedule.lastMaintenance = new Date();
    machine.maintenanceSchedule.nextMaintenance = schedule.nextScheduledDate;
    await machine.save();
  }

  await schedule.save();

  emitToRole('production_manager', 'maintenance_completed', {
    machine: schedule.machineCode,
    type: schedule.maintenanceType
  });

  res.json({
    success: true,
    data: schedule
  });
});

// @desc    Update maintenance schedule
// @route   PUT /api/maintenance/schedules/:id
// @access  Private
exports.updateSchedule = asyncHandler(async (req, res) => {
  let schedule = await MaintenanceSchedule.findById(req.params.id);

  if (!schedule) {
    res.status(404);
    throw new Error('Maintenance schedule not found');
  }

  schedule = await MaintenanceSchedule.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    data: schedule
  });
});

// @desc    Get overdue maintenance
// @route   GET /api/maintenance/schedules/overdue
// @access  Private
exports.getOverdueMaintenance = asyncHandler(async (req, res) => {
  const schedules = await MaintenanceSchedule.find({
    status: { $in: ['scheduled', 'in_progress'] },
    scheduledDate: { $lt: new Date() }
  })
    .populate('machineId')
    .sort({ priority: -1, scheduledDate: 1 });

  // Update status to overdue
  await MaintenanceSchedule.updateMany(
    {
      status: 'scheduled',
      scheduledDate: { $lt: new Date() }
    },
    { status: 'overdue' }
  );

  res.json({
    success: true,
    count: schedules.length,
    data: schedules
  });
});

// @desc    Delete maintenance schedule
// @route   DELETE /api/maintenance/schedules/:id
// @access  Private (Admin)
exports.deleteSchedule = asyncHandler(async (req, res) => {
  const schedule = await MaintenanceSchedule.findById(req.params.id);

  if (!schedule) {
    res.status(404);
    throw new Error('Maintenance schedule not found');
  }

  await schedule.deleteOne();

  res.json({
    success: true,
    message: 'Maintenance schedule deleted successfully'
  });
});
