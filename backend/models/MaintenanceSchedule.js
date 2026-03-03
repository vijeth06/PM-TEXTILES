const mongoose = require('mongoose');

// Model for preventive maintenance scheduling
const maintenanceScheduleSchema = new mongoose.Schema({
  scheduleNumber: {
    type: String,
    required: true,
    unique: true
  },
  machineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine',
    required: true
  },
  machineCode: String,
  machineName: String,
  maintenanceType: {
    type: String,
    enum: ['preventive', 'predictive', 'corrective', 'breakdown', 'calibration'],
    required: true
  },
  frequency: {
    value: Number,
    unit: {
      type: String,
      enum: ['hours', 'days', 'weeks', 'months', 'years', 'cycles']
    }
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  estimatedDuration: {
    type: Number, // in hours
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  checklist: [{
    task: String,
    completed: { type: Boolean, default: false },
    notes: String
  }],
  spareParts: [{
    partId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory'
    },
    partCode: String,
    partName: String,
    quantity: Number,
    used: { type: Number, default: 0 }
  }],
  assignedTo: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    role: String
  }],
  actualStartDate: Date,
  actualEndDate: Date,
  actualDuration: Number,
  cost: {
    labor: { type: Number, default: 0 },
    spareParts: { type: Number, default: 0 },
    external: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  downtime: {
    type: Number, // in hours
    default: 0
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'overdue'],
    default: 'scheduled'
  },
  findings: String,
  actionsTaken: String,
  recommendations: String,
  nextScheduledDate: Date,
  attachments: [String],
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Generate schedule number
maintenanceScheduleSchema.pre('save', async function(next) {
  if (!this.scheduleNumber) {
    const count = await this.constructor.countDocuments();
    this.scheduleNumber = `MNT-${Date.now()}-${String(count + 1).padStart(4, '0')}`;
  }
  
  // Calculate total cost
  this.cost.total = this.cost.labor + this.cost.spareParts + this.cost.external;
  
  // Calculate actual duration if completed
  if (this.actualStartDate && this.actualEndDate) {
    this.actualDuration = (this.actualEndDate - this.actualStartDate) / (1000 * 60 * 60);
  }
  
  next();
});

maintenanceScheduleSchema.index({ machineId: 1, scheduledDate: 1 });
maintenanceScheduleSchema.index({ status: 1, priority: -1 });

module.exports = mongoose.model('MaintenanceSchedule', maintenanceScheduleSchema);
