const mongoose = require('mongoose');

// Model for RFQ (Request for Quotation) management
const rfqSchema = new mongoose.Schema({
  rfqNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  rfqDate: {
    type: Date,
    default: Date.now
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  suppliers: [{
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier'
    },
    supplierCode: String,
    supplierName: String,
    sentDate: Date,
    responseDate: Date,
    quotationReceived: { type: Boolean, default: false }
  }],
  items: [{
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RawMaterial'
    },
    materialCode: String,
    materialName: String,
    description: String,
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    uom: String,
    specifications: String,
    targetPrice: Number
  }],
  deadline: {
    type: Date,
    required: true
  },
  deliveryRequired: Date,
  paymentTerms: String,
  quotations: [{
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier'
    },
    submittedDate: Date,
    validUntil: Date,
    items: [{
      materialCode: String,
      unitPrice: Number,
      totalPrice: Number,
      deliveryTime: Number, // days
      moq: Number, // Minimum order quantity
      notes: String
    }],
    totalAmount: Number,
    paymentTerms: String,
    deliveryTerms: String,
    remarks: String,
    attachments: [String],
    score: Number,
    selected: { type: Boolean, default: false }
  }],
  status: {
    type: String,
    enum: ['draft', 'sent', 'received', 'evaluated', 'awarded', 'cancelled'],
    default: 'draft'
  },
  evaluation: {
    criteria: [{
      factor: String,
      weight: Number
    }],
    scores: mongoose.Schema.Types.Mixed,
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier'
    }
  },
  purchaseOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String
}, {
  timestamps: true
});

// Generate RFQ number
rfqSchema.pre('save', async function(next) {
  if (!this.rfqNumber || this.rfqNumber.startsWith('RFQ-NEW')) {
    const count = await this.constructor.countDocuments();
    const year = new Date().getFullYear();
    this.rfqNumber = `RFQ-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

rfqSchema.index({ status: 1, deadline: 1 });

module.exports = mongoose.model('RFQ', rfqSchema);
