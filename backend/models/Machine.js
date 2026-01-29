const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Machine code is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Machine name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['weaving', 'dyeing', 'finishing', 'packing', 'other'],
    required: true
  },
  manufacturer: String,
  model: String,
  serialNumber: String,
  purchaseDate: Date,
  capacity: {
    value: {
      type: Number,
      min: 0
    },
    uom: {
      type: String,
      enum: ['kg/hr', 'mtr/hr', 'pcs/hr', 'roll/hr']
    }
  },
  specifications: {
    type: Map,
    of: String
  },
  location: {
    floor: String,
    section: String
  },
  status: {
    type: String,
    enum: ['operational', 'maintenance', 'breakdown', 'idle'],
    default: 'operational'
  },
  maintenanceSchedule: {
    lastMaintenance: Date,
    nextMaintenance: Date,
    frequency: {
      value: Number,
      unit: {
        type: String,
        enum: ['days', 'weeks', 'months']
      }
    }
  },
  utilizationMetrics: {
    totalUptime: {
      type: Number,
      default: 0,
      min: 0
    },
    totalDowntime: {
      type: Number,
      default: 0,
      min: 0
    },
    utilizationPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: String
}, {
  timestamps: true
});

machineSchema.index({ code: 1, type: 1, status: 1 });

module.exports = mongoose.model('Machine', machineSchema);
