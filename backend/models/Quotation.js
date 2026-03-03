const mongoose = require('mongoose');

// Model for Sales Quotations
const quotationSchema = new mongoose.Schema({
  quotationNo: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  quotationDate: {
    type: Date,
    default: Date.now
  },
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead'
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  customerName: {
    type: String,
    required: true
  },
  customerContact: {
    email: String,
    phone: String
  },
  items: [{
    productCode: String,
    productName: {
      type: String,
      required: true
    },
    description: String,
    specifications: mongoose.Schema.Types.Mixed,
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    uom: String,
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    tax: {
      type: Number,
      default: 0
    },
    totalPrice: {
      type: Number,
      required: true
    }
  }],
  subtotal: {
    type: Number,
    required: true,
    default: 0
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  paymentTerms: String,
  deliveryTerms: String,
  deliveryTime: String,
  status: {
    type: String,
    enum: ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'converted'],
    default: 'draft'
  },
  sentDate: Date,
  viewedDate: Date,
  acceptedDate: Date,
  rejectedDate: Date,
  rejectionReason: String,
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  terms: String,
  notes: String,
  attachments: [String],
  revisionOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quotation'
  },
  revisionNumber: {
    type: Number,
    default: 1
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Calculate totals before saving
quotationSchema.pre('save', function(next) {
  let subtotal = 0;
  let taxAmount = 0;
  let discountAmount = 0;

  this.items.forEach(item => {
    const itemTotal = item.quantity * item.unitPrice;
    const itemDiscount = (itemTotal * item.discount) / 100;
    const itemTax = ((itemTotal - itemDiscount) * item.tax) / 100;
    
    item.totalPrice = itemTotal - itemDiscount + itemTax;
    subtotal += itemTotal;
    discountAmount += itemDiscount;
    taxAmount += itemTax;
  });

  this.subtotal = subtotal;
  this.discountAmount = discountAmount;
  this.taxAmount = taxAmount;
  this.totalAmount = subtotal - discountAmount + taxAmount;

  next();
});

// Generate quotation number
quotationSchema.pre('save', async function(next) {
  if (!this.quotationNo || this.quotationNo.startsWith('QUOT-NEW')) {
    const count = await this.constructor.countDocuments();
    const year = new Date().getFullYear();
    this.quotationNo = `QUOT-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

quotationSchema.index({ status: 1, validUntil: 1 });

module.exports = mongoose.model('Quotation', quotationSchema);
