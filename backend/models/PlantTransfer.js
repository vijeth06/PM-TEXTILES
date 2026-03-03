const mongoose = require('mongoose');

// Model for Inter-Plant Transfers
const plantTransferSchema = new mongoose.Schema({
  transferNo: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  transferDate: {
    type: Date,
    default: Date.now
  },
  fromPlant: {
    plantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plant',
      required: true
    },
    plantCode: String,
    plantName: String
  },
  toPlant: {
    plantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plant',
      required: true
    },
    plantCode: String,
    plantName: String
  },
  items: [{
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory'
    },
    itemCode: String,
    itemName: String,
    itemType: {
      type: String,
      enum: ['raw_material', 'semi_finished', 'finished_good']
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    uom: String,
    batchNo: String,
    cost: Number
  }],
  totalValue: {
    type: Number,
    default: 0
  },
  reason: {
    type: String,
    enum: ['stock_balancing', 'production_requirement', 'customer_order', 'quality_issue', 'other'],
    required: true
  },
  transportDetails: {
    mode: {
      type: String,
      enum: ['road', 'rail', 'air', 'self']
    },
    vehicleNo: String,
    driverName: String,
    driverContact: String,
    expectedDeliveryDate: Date,
    actualDeliveryDate: Date
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'in_transit', 'delivered', 'cancelled'],
    default: 'pending'
  },
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: Date,
  deliveryDate: Date,
  notes: String,
  attachments: [String]
}, {
  timestamps: true
});

// Calculate total value
plantTransferSchema.pre('save', function(next) {
  this.totalValue = this.items.reduce((sum, item) => sum + (item.cost || 0) * item.quantity, 0);
  next();
});

// Generate transfer number
plantTransferSchema.pre('save', async function(next) {
  if (!this.transferNo) {
    const count = await this.constructor.countDocuments();
    const year = new Date().getFullYear();
    this.transferNo = `PT-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

plantTransferSchema.index({ transferNo: 1 });
plantTransferSchema.index({ 'fromPlant.plantId': 1, 'toPlant.plantId': 1 });

module.exports = mongoose.model('PlantTransfer', plantTransferSchema);
