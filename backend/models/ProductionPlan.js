const mongoose = require('mongoose');

const productionPlanSchema = new mongoose.Schema({
  planNo: {
    type: String,
    required: [true, 'Plan number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  planDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  orderIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  productDetails: {
    sku: {
      type: String,
      required: true
    },
    productName: {
      type: String,
      required: true
    },
    targetQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    uom: {
      type: String,
      required: true,
      enum: ['kg', 'mtr', 'pcs', 'roll']
    }
  },
  stagesSequence: [{
    stageName: {
      type: String,
      enum: ['yarn_issue', 'weaving', 'dyeing', 'finishing', 'packing'],
      required: true
    },
    sequence: {
      type: Number,
      required: true
    },
    estimatedDuration: Number, // in hours
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'delayed'],
      default: 'pending'
    }
  }],
  assignedMachines: [{
    machineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Machine'
    },
    machineCode: String,
    stageName: String
  }],
  assignedWorkers: [{
    workerId: String,
    workerName: String,
    stageName: String
  }],
  rawMaterialRequirements: [{
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RawMaterial'
    },
    materialCode: String,
    materialName: String,
    requiredQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    issuedQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    uom: String
  }],
  status: {
    type: String,
    enum: ['draft', 'approved', 'in_progress', 'completed', 'cancelled'],
    default: 'draft'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  actualStartDate: Date,
  actualEndDate: Date,
  completionPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String
}, {
  timestamps: true
});

productionPlanSchema.index({ planNo: 1, status: 1, startDate: -1 });
productionPlanSchema.index({ 'orderIds': 1 });

module.exports = mongoose.model('ProductionPlan', productionPlanSchema);
