const mongoose = require('mongoose');

const rawMaterialSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Material code is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Material name is required'],
    trim: true
  },
  category: {
    type: String,
    enum: ['yarn', 'dye', 'chemical', 'other'],
    required: true
  },
  uom: {
    type: String,
    required: [true, 'Unit of measurement is required'],
    enum: ['kg', 'ltr', 'mtr', 'pcs', 'roll'],
    default: 'kg'
  },
  description: String,
  specifications: {
    type: Map,
    of: String
  },
  supplierIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  }],
  standardCost: {
    type: Number,
    min: 0,
    default: 0
  },
  leadTimeDays: {
    type: Number,
    min: 0,
    default: 7
  },
  safetyStock: {
    type: Number,
    min: 0,
    default: 0
  },
  reorderPoint: {
    type: Number,
    min: 0,
    default: 0
  },
  reorderQuantity: {
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

rawMaterialSchema.index({ code: 1, category: 1 });

module.exports = mongoose.model('RawMaterial', rawMaterialSchema);
