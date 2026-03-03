const mongoose = require('mongoose');

// Model for Lead and Sales management (CRM)
const leadSchema = new mongoose.Schema({
  leadNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  source: {
    type: String,
    enum: ['website', 'phone', 'email', 'referral', 'trade_show', 'cold_call', 'social_media', 'other'],
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  contactPerson: {
    name: String,
    designation: String,
    email: String,
    phone: String,
    mobile: String
  },
  address: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    country: String,
    pincode: String
  },
  industry: String,
  requirements: {
    productType: String,
    estimatedQuantity: Number,
    estimatedValue: Number,
    timeline: String
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'converted', 'lost', 'on_hold'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  probability: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  followUps: [{
    date: Date,
    type: {
      type: String,
      enum: ['call', 'email', 'meeting', 'demo', 'other']
    },
    notes: String,
    nextAction: String,
    nextFollowUpDate: Date,
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  quotations: [{
    quotationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quotation'
    },
    quotationNo: String,
    date: Date,
    amount: Number,
    status: String
  }],
  convertedToCustomer: {
    type: Boolean,
    default: false
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  lostReason: String,
  expectedClosureDate: Date,
  actualClosureDate: Date,
  tags: [String],
  notes: String,
  attachments: [String]
}, {
  timestamps: true
});

// Generate lead number
leadSchema.pre('save', async function(next) {
  if (!this.leadNumber) {
    const count = await this.constructor.countDocuments();
    const year = new Date().getFullYear();
    this.leadNumber = `LEAD-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

leadSchema.index({ status: 1, assignedTo: 1 });

module.exports = mongoose.model('Lead', leadSchema);
