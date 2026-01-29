const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  orderNo: {
    type: String,
    required: true
  },
  sku: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  productName: {
    type: String,
    required: true
  },
  description: String,
  specifications: {
    type: Map,
    of: String
  },
  orderedQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  allocatedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  producedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  dispatchedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  uom: {
    type: String,
    required: true,
    enum: ['kg', 'mtr', 'pcs', 'roll']
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  lineTotal: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  taxPercent: {
    type: Number,
    default: 0,
    min: 0
  },
  finalAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'allocated', 'in_production', 'ready', 'dispatched', 'cancelled'],
    default: 'pending'
  },
  sourcedFrom: {
    type: String,
    enum: ['inventory', 'production', 'hybrid'],
    default: 'inventory'
  },
  notes: String
}, {
  timestamps: true
});

orderItemSchema.index({ orderId: 1, sku: 1 });

// Calculate pending quantity
orderItemSchema.virtual('pendingQuantity').get(function() {
  return this.orderedQuantity - this.dispatchedQuantity;
});

// Pre-save hook to calculate final amount
orderItemSchema.pre('save', function(next) {
  this.lineTotal = this.orderedQuantity * this.unitPrice;
  const taxAmount = (this.lineTotal - this.discount) * (this.taxPercent / 100);
  this.finalAmount = this.lineTotal - this.discount + taxAmount;
  next();
});

module.exports = mongoose.model('OrderItem', orderItemSchema);
