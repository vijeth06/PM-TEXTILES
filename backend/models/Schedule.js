const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['maintenance', 'production', 'delivery', 'meeting', 'reminder', 'payment_due'],
    required: true
  },
  description: String,
  scheduledDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  relatedTo: {
    model: String, // 'Order', 'ProductionPlan', 'Machine', etc.
    id: mongoose.Schema.Types.ObjectId
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderTime: {
    type: Number, // Minutes before event
    default: 60
  },
  recurring: {
    enabled: Boolean,
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly']
    },
    endDate: Date
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Schedule', scheduleSchema);
