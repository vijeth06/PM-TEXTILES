const mongoose = require('mongoose');

const qualityCheckSchema = new mongoose.Schema({
  checkNumber: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['raw_material', 'in_process', 'final_product'],
    required: true
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory'
  },
  checkDate: {
    type: Date,
    default: Date.now
  },
  checkedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  parameters: [{
    name: String,
    expectedValue: String,
    actualValue: String,
    passed: Boolean
  }],
  result: {
    type: String,
    enum: ['passed', 'failed', 'conditional'],
    required: true
  },
  defects: [{
    type: String,
    severity: {
      type: String,
      enum: ['minor', 'major', 'critical']
    },
    quantity: Number
  }],
  notes: String,
  images: [String], // URLs to uploaded images
  actionTaken: String
}, {
  timestamps: true
});

// Generate check number
qualityCheckSchema.pre('save', async function(next) {
  if (!this.checkNumber) {
    const count = await this.constructor.countDocuments();
    this.checkNumber = `QC-${Date.now()}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('QualityCheck', qualityCheckSchema);
