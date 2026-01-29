const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  batchNumber: {
    type: String,
    required: true,
    unique: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: true
  },
  productionPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductionPlan'
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  manufactureDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: Date,
  qrCode: String, // Base64 encoded QR code
  barcode: String, // Base64 encoded barcode
  status: {
    type: String,
    enum: ['in_production', 'quality_check', 'approved', 'rejected', 'in_stock', 'dispatched'],
    default: 'in_production'
  },
  qualityCheck: {
    passed: Boolean,
    checkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    checkDate: Date,
    notes: String
  },
  location: {
    warehouse: String,
    section: String,
    bin: String
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Generate batch number
batchSchema.pre('save', async function(next) {
  if (!this.batchNumber) {
    const count = await this.constructor.countDocuments();
    this.batchNumber = `BATCH-${Date.now()}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Batch', batchSchema);
