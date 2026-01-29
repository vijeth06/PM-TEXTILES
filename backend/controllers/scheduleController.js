const Schedule = require('../models/Schedule');
const { emitToUser } = require('../services/socketService');
const { sendEmail } = require('../services/emailService');

// Get all schedules
exports.getSchedules = async (req, res) => {
  try {
    const { type, status, startDate, endDate, assignedTo } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (startDate || endDate) {
      filter.scheduledDate = {};
      if (startDate) filter.scheduledDate.$gte = new Date(startDate);
      if (endDate) filter.scheduledDate.$lte = new Date(endDate);
    }

    const schedules = await Schedule.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ scheduledDate: 1 });

    res.json({ success: true, data: schedules });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single schedule
exports.getSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    res.json({ success: true, data: schedule });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create schedule
exports.createSchedule = async (req, res) => {
  try {
    const schedule = new Schedule({
      ...req.body,
      createdBy: req.user._id
    });

    await schedule.save();

    // Send notifications to assigned users
    if (schedule.assignedTo && schedule.assignedTo.length > 0) {
      schedule.assignedTo.forEach(userId => {
        emitToUser(userId, 'new_schedule', schedule);
      });
    }

    res.status(201).json({ success: true, data: schedule });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update schedule
exports.updateSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    res.json({ success: true, data: schedule });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete schedule
exports.deleteSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndDelete(req.params.id);

    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    res.json({ success: true, message: 'Schedule deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get upcoming schedules
exports.getUpcomingSchedules = async (req, res) => {
  try {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const schedules = await Schedule.find({
      scheduledDate: { $gte: now, $lte: nextWeek },
      status: { $in: ['pending', 'in_progress'] }
    })
      .populate('assignedTo', 'name email')
      .sort({ scheduledDate: 1 });

    res.json({ success: true, data: schedules });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = exports;
