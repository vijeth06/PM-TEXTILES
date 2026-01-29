const mongoose = require('mongoose');

const productionStageSchema = new mongoose.Schema({
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductionPlan',
    required: true
  },
  planNo: {
    type: String,
    required: true
  },
  stageName: {
    type: String,
    enum: ['yarn_issue', 'weaving', 'dyeing', 'finishing', 'packing'],
    required: true
  },
  stageSequence: {
    type: Number,
    required: true
  },
  inputQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  outputQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  rejectedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  wastageQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  uom: {
    type: String,
    required: true,
    enum: ['kg', 'mtr', 'pcs', 'roll']
  },
  machineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine'
  },
  machineCode: String,
  assignedWorkers: [{
    workerId: String,
    workerName: String
  }],
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'on_hold', 'cancelled'],
    default: 'pending'
  },
  scheduledStartTime: Date,
  scheduledEndTime: Date,
  actualStartTime: Date,
  actualEndTime: Date,
  downtimeLog: [{
    reason: {
      type: String,
      enum: ['machine_breakdown', 'material_shortage', 'power_outage', 'quality_issue', 'other']
    },
    startTime: Date,
    endTime: Date,
    duration: Number, // in minutes
    notes: String
  }],
  qualityChecks: [{
    checkTime: Date,
    inspector: String,
    result: {
      type: String,
      enum: ['pass', 'fail', 'conditional']
    },
    remarks: String
  }],
  materialConsumption: [{
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RawMaterial'
    },
    materialCode: String,
    consumedQuantity: Number,
    uom: String
  }],
  notes: String,
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

productionStageSchema.index({ planId: 1, stageSequence: 1 });
productionStageSchema.index({ status: 1, scheduledStartTime: 1 });

// Calculate efficiency percentage
productionStageSchema.virtual('efficiency').get(function() {
  if (this.inputQuantity > 0) {
    return ((this.outputQuantity / this.inputQuantity) * 100).toFixed(2);
  }
  return 0;
});

module.exports = mongoose.model('ProductionStage', productionStageSchema);
