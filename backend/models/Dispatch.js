const mongoose = require('mongoose');

const dispatchSchema = new mongoose.Schema({
  dispatchNo: {
    type: String,
    required: [true, 'Dispatch number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  orderNo: String,
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  customerName: String,
  dispatchDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  scheduledDeliveryDate: Date,
  actualDeliveryDate: Date,
  items: [{
    orderItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OrderItem'
    },
    sku: String,
    productName: String,
    quantity: Number,
    uom: String,
    batchNumbers: [String]
  }],
  transportDetails: {
    mode: {
      type: String,
      enum: ['road', 'rail', 'air', 'courier'],
      default: 'road'
    },
    carrier: String,
    vehicleNumber: String,
    driverName: String,
    driverPhone: String,
    awb: String, // Airway Bill / Tracking Number
    freight: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  deliveryAddress: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    country: String,
    pincode: String
  },
  status: {
    type: String,
    enum: ['pending', 'in_transit', 'delivered', 'returned', 'cancelled'],
    default: 'pending'
  },
  invoiceNo: String,
  invoiceValue: {
    type: Number,
    min: 0
  },
  packingDetails: {
    numberOfPackages: Number,
    totalWeight: Number,
    dimensions: String
  },
  deliveryProof: {
    receivedBy: String,
    signatureUrl: String,
    receivedDate: Date,
    remarks: String
  },
  notes: String,
  dispatchedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

dispatchSchema.index({ dispatchNo: 1, orderId: 1, status: 1 });
dispatchSchema.index({ dispatchDate: -1 });

module.exports = mongoose.model('Dispatch', dispatchSchema);
