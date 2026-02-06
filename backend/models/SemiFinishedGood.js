const mongoose = require('mongoose');

const semiFinishedGoodSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Item code is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  uom: {
    type: String,
    required: [true, 'Unit of measurement is required'],
    enum: ['kg', 'ltr', 'mtr', 'pcs', 'roll']
  },
  description: String,
  specifications: {
    type: Map,
    of: String
  },
  standardCost: {
    type: Number,
    min: 0,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

semiFinishedGoodSchema.index({ code: 1, isActive: 1 });

module.exports = mongoose.model('SemiFinishedGood', semiFinishedGoodSchema);
