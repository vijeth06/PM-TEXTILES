const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'itemType'
  },
  itemType: {
    type: String,
    required: true,
    enum: ['RawMaterial', 'SemiFinishedGood', 'FinishedGood']
  },
  itemCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  itemName: {
    type: String,
    required: true
  },
  batchNo: {
    type: String,
    required: [true, 'Batch number is required'],
    trim: true,
    uppercase: true
  },
  barcode: {
    type: String,
    trim: true,
    // Optional (manual) or auto-generated. Unique when present.
    unique: true,
    sparse: true
  },
  qtyOnHand: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  qtyReserved: {
    type: Number,
    min: 0,
    default: 0
  },
  qtyAvailable: {
    type: Number,
    min: 0,
    default: 0
  },
  uom: {
    type: String,
    required: true,
    enum: ['kg', 'ltr', 'mtr', 'pcs', 'roll']
  },
  location: {
    warehouse: {
      type: String,
      default: 'Main Warehouse'
    },
    zone: String,
    rack: String,
    bin: String
  },
  fifoDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expiryDate: Date,
  costPerUnit: {
    type: Number,
    min: 0,
    default: 0
  },
  totalValue: {
    type: Number,
    min: 0,
    default: 0
  },
  status: {
    type: String,
    enum: ['available', 'reserved', 'quarantine', 'expired', 'scrapped'],
    default: 'available'
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  receivedDate: {
    type: Date,
    default: Date.now
  },
  grn: String, // Goods Receipt Note
  qualityStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  },
  notes: String
}, {
  timestamps: true
});

// Indexes for performance
inventorySchema.index({ itemCode: 1, batchNo: 1 });
inventorySchema.index({ itemType: 1, status: 1 });
inventorySchema.index({ fifoDate: 1 });

// Virtual for available quantity calculation
inventorySchema.virtual('availableQty').get(function() {
  return this.qtyOnHand - this.qtyReserved;
});

// Pre-save middleware to calculate available quantity and total value
inventorySchema.pre('save', function(next) {
  this.qtyAvailable = this.qtyOnHand - this.qtyReserved;
  this.totalValue = this.qtyOnHand * this.costPerUnit;
  next();
});

module.exports = mongoose.model('Inventory', inventorySchema);
