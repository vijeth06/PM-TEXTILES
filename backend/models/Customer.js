const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Customer code is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['individual', 'company', 'distributor', 'retailer'],
    default: 'company'
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
  creditLimit: {
    type: Number,
    default: 0,
    min: 0
  },
  creditPeriod: {
    type: Number,
    default: 30,
    min: 0
  },
  outstandingBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentTerms: {
    type: String,
    enum: ['advance', 'cod', 'credit', 'partial_advance'],
    default: 'credit'
  },
  bankDetails: {
    accountName: String,
    accountNumber: String,
    bankName: String,
    ifscCode: String,
    branch: String
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: String
}, {
  timestamps: true
});

customerSchema.index({ code: 1, name: 1 });

module.exports = mongoose.model('Customer', customerSchema);
