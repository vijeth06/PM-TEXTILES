const mongoose = require('mongoose');

// Model for Asset Lifecycle Management
const assetSchema = new mongoose.Schema({
  assetCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['machinery', 'equipment', 'vehicle', 'it', 'furniture', 'building', 'other'],
    required: true
  },
  type: String,
  description: String,
  manufacturer: String,
  model: String,
  serialNumber: String,
  purchaseInfo: {
    purchaseDate: Date,
    supplier: String,
    purchaseOrderNo: String,
    invoiceNo: String,
    cost: {
      type: Number,
      required: true,
      min: 0
    },
    warranty: {
      startDate: Date,
      endDate: Date,
      terms: String
    }
  },
  depreciation: {
    method: {
      type: String,
      enum: ['straight_line', 'declining_balance', 'units_of_production', 'none']
    },
    rate: Number, // Annual percentage
    residualValue: Number,
    depreciationPeriod: Number, // in years
    accumulatedDepreciation: {
      type: Number,
      default: 0
    },
    currentValue: Number
  },
  location: {
    facility: String,
    floor: String,
    section: String,
    gpsCoordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  status: {
    type: String,
    enum: ['active', 'under_maintenance', 'idle', 'retired', 'disposed', 'lost'],
    default: 'active'
  },
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'good'
  },
  assignedTo: {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    department: String,
    assignedDate: Date
  },
  maintenanceHistory: [{
    date: Date,
    type: String,
    description: String,
    cost: Number,
    performedBy: String
  }],
  calibration: {
    required: {
      type: Boolean,
      default: false
    },
    frequency: Number, // in months
    lastCalibrationDate: Date,
    nextCalibrationDate: Date,
    certificateNo: String
  },
  utilization: {
    totalHours: {
      type: Number,
      default: 0
    },
    lastUsedDate: Date,
    utilizationRate: Number // percentage
  },
  insurance: {
    policyNumber: String,
    provider: String,
    startDate: Date,
    endDate: Date,
    coverageAmount: Number
  },
  disposal: {
    disposalDate: Date,
    disposalMethod: {
      type: String,
      enum: ['sale', 'scrap', 'donation', 'trade_in', 'other']
    },
    disposalValue: Number,
    disposalReason: String,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  documents: [{
    type: String,
    url: String
  }],
  qrCode: String,
  barcode: String,
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Calculate current value based on depreciation
assetSchema.methods.calculateDepreciation = function() {
  if (this.depreciation.method === 'straight_line') {
    const yearsElapsed = (new Date() - this.purchaseInfo.purchaseDate) / (365 * 24 * 60 * 60 * 1000);
    const annualDepreciation = (this.purchaseInfo.cost - this.depreciation.residualValue) / this.depreciation.depreciationPeriod;
    this.depreciation.accumulatedDepreciation = Math.min(
      annualDepreciation * yearsElapsed,
      this.purchaseInfo.cost - this.depreciation.residualValue
    );
    this.depreciation.currentValue = this.purchaseInfo.cost - this.depreciation.accumulatedDepreciation;
  }
};

assetSchema.index({ assetCode: 1 });
assetSchema.index({ category: 1, status: 1 });

module.exports = mongoose.model('Asset', assetSchema);
