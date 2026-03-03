const mongoose = require('mongoose');

// Model for automatic reorder system
const autoReorderSchema = new mongoose.Schema({
  materialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RawMaterial',
    required: true
  },
  materialCode: {
    type: String,
    required: true
  },
  materialName: String,
  reorderPoint: {
    type: Number,
    required: true,
    min: 0
  },
  currentStock: {
    type: Number,
    required: true,
    min: 0
  },
  economicOrderQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  suggestedOrderQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  leadTime: {
    type: Number, // in days
    default: 7
  },
  safetyStock: {
    type: Number,
    default: 0,
    min: 0
  },
  preferredSupplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  supplierCode: String,
  supplierName: String,
  estimatedCost: {
    type: Number,
    default: 0
  },
  estimatedDeliveryDate: Date,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['triggered', 'pending_approval', 'approved', 'po_created', 'cancelled'],
    default: 'triggered'
  },
  triggerReason: {
    type: String,
    enum: ['low_stock', 'stockout', 'scheduled', 'manual'],
    default: 'low_stock'
  },
  autoGenerate: {
    type: Boolean,
    default: false // If true, automatically create PO without approval
  },
  purchaseOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedDate: Date,
  rejectionReason: String,
  historicalConsumption: {
    last30Days: Number,
    last90Days: Number,
    averageDaily: Number
  },
  forecast: {
    nextMonthDemand: Number,
    confidence: Number
  },
  notes: String
}, {
  timestamps: true
});

autoReorderSchema.index({ materialCode: 1, status: 1 });
autoReorderSchema.index({ status: 1, priority: -1 });

module.exports = mongoose.model('AutoReorder', autoReorderSchema);
