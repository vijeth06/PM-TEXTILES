const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNo: {
    type: String,
    required: [true, 'Order number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  orderDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customerCode: String,
  customerName: String,
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  promiseDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_production', 'packed', 'dispatched', 'delivered', 'cancelled'],
    default: 'pending'
  },
  productionPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductionPlan'
  },
  totalQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  totalValue: {
    type: Number,
    required: true,
    min: 0
  },
  advanceAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  balanceAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid'],
    default: 'unpaid'
  },
  deliveryAddress: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    country: String,
    pincode: String
  },
  deliveryInstructions: String,
  actualDeliveryDate: Date,
  invoiceNo: String,
  invoiceDate: Date,
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

orderSchema.index({ orderNo: 1, status: 1, customerId: 1 });
orderSchema.index({ orderDate: -1, promiseDate: 1 });

// Check if order is delayed
orderSchema.virtual('isDelayed').get(function() {
  if (this.status !== 'delivered' && this.status !== 'cancelled') {
    return new Date() > this.promiseDate;
  }
  return false;
});

module.exports = mongoose.model('Order', orderSchema);
