const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Supplier code is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['manufacturer', 'distributor', 'wholesaler', 'agent'],
    default: 'distributor'
  },
  category: {
    type: String,
    enum: ['yarn', 'dye', 'chemical', 'machinery', 'consumables', 'other'],
    required: true
  },
  contactPerson: {
    name: String,
    designation: String,
    phone: String,
    email: String
  },
  address: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    country: {
      type: String,
      default: 'India'
    },
    pincode: String
  },
  phone: String,
  email: {
    type: String,
    lowercase: true
  },
  gstin: String,
  pan: String,
  paymentTerms: {
    type: String,
    enum: ['advance', 'cod', 'credit', 'partial_advance'],
    default: 'credit'
  },
  creditPeriod: {
    type: Number,
    default: 30,
    min: 0
  },
  bankDetails: {
    accountName: String,
    accountNumber: String,
    bankName: String,
    ifscCode: String,
    branch: String
  },
  performanceMetrics: {
    totalOrders: {
      type: Number,
      default: 0
    },
    onTimeDeliveries: {
      type: Number,
      default: 0
    },
    qualityRejections: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: String
}, {
  timestamps: true
});

supplierSchema.index({ code: 1, category: 1 });

// Calculate on-time delivery percentage
supplierSchema.virtual('otdPercent').get(function() {
  if (this.performanceMetrics.totalOrders > 0) {
    return ((this.performanceMetrics.onTimeDeliveries / this.performanceMetrics.totalOrders) * 100).toFixed(2);
  }
  return 0;
});

module.exports = mongoose.model('Supplier', supplierSchema);
