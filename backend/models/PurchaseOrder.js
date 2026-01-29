const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
  poNumber: {
    type: String,
    required: [true, 'Purchase order number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  poDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  supplierCode: String,
  supplierName: String,
  category: {
    type: String,
    enum: ['yarn', 'dye', 'chemical', 'machinery', 'consumables', 'other'],
    required: true
  },
  expectedDeliveryDate: {
    type: Date,
    required: true
  },
  actualDeliveryDate: Date,
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
    uom: {
      type: String,
      required: true
    },
    ratePerUnit: {
      type: Number,
      required: true,
      min: 0
    },
    taxPercent: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true
    },
    receivedQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    pendingQuantity: {
      type: Number,
      default: 0
    }
  }],
  subTotal: {
    type: Number,
    required: true,
    min: 0
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  otherCharges: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'confirmed', 'partial', 'received', 'cancelled'],
    default: 'draft'
  },
  paymentTerms: {
    type: String,
    enum: ['advance', 'cod', 'net15', 'net30', 'net45', 'net60', 'custom'],
    default: 'net30'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid'],
    default: 'unpaid'
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  deliveryPerformance: {
    onTimeDelivery: {
      type: Boolean,
      default: null
    },
    delayDays: {
      type: Number,
      default: 0
    }
  },
  qualityRating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  remarks: String,
  termsAndConditions: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date
}, {
  timestamps: true
});

// Indexes
purchaseOrderSchema.index({ poNumber: 1, status: 1 });
purchaseOrderSchema.index({ supplierId: 1, poDate: -1 });
purchaseOrderSchema.index({ expectedDeliveryDate: 1 });

// Virtual to check if PO is delayed
purchaseOrderSchema.virtual('isDelayed').get(function() {
  if (this.status !== 'received' && this.status !== 'cancelled') {
    return new Date() > this.expectedDeliveryDate;
  }
  return false;
});

// Calculate pending quantity before save
purchaseOrderSchema.pre('save', function(next) {
  this.items.forEach(item => {
    item.pendingQuantity = item.quantity - item.receivedQuantity;
  });
  next();
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
