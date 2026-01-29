const mongoose = require('mongoose');

const wastageSchema = new mongoose.Schema({
  referenceType: {
    type: String,
    enum: ['production_stage', 'inventory_adjustment', 'quality_rejection', 'material_issue'],
    required: true
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  referenceNo: String,
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductionPlan'
  },
  planNo: String,
  stageName: {
    type: String,
    enum: ['yarn_issue', 'weaving', 'dyeing', 'finishing', 'packing', 'storage', 'other']
  },
  materialId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'materialType'
  },
  materialType: {
    type: String,
    enum: ['RawMaterial', 'SemiFinishedGood', 'FinishedGood']
  },
  materialCode: String,
  materialName: String,
  wastageType: {
    type: String,
    enum: ['scrap', 'rejection', 'spillage', 'damage', 'expiry', 'theft', 'other'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  uom: {
    type: String,
    required: true,
    enum: ['kg', 'ltr', 'mtr', 'pcs', 'roll']
  },
  costPerUnit: {
    type: Number,
    default: 0,
    min: 0
  },
  totalCost: {
    type: Number,
    default: 0,
    min: 0
  },
  reason: {
    type: String,
    required: true
  },
  reasonCategory: {
    type: String,
    enum: ['machine_fault', 'quality_issue', 'human_error', 'material_defect', 'process_loss', 'other'],
    default: 'other'
  },
  disposition: {
    type: String,
    enum: ['discarded', 'recycled', 'reworked', 'sold_as_scrap', 'pending'],
    default: 'pending'
  },
  dispositionValue: {
    type: Number,
    default: 0,
    min: 0
  },
  recordedDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  approvalRequired: {
    type: Boolean,
    default: false
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedDate: Date,
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String
}, {
  timestamps: true
});

wastageSchema.index({ referenceType: 1, referenceId: 1 });
wastageSchema.index({ stageName: 1, wastageType: 1 });
wastageSchema.index({ recordedDate: -1 });

// Calculate net loss (total cost - disposition value)
wastageSchema.virtual('netLoss').get(function() {
  return this.totalCost - this.dispositionValue;
});

// Pre-save hook to calculate total cost
wastageSchema.pre('save', function(next) {
  this.totalCost = this.quantity * this.costPerUnit;
  next();
});

module.exports = mongoose.model('Wastage', wastageSchema);
