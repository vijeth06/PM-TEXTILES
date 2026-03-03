const mongoose = require('mongoose');

// Model for cost tracking and analysis
const costAnalysisSchema = new mongoose.Schema({
  referenceType: {
    type: String,
    enum: ['production_plan', 'order', 'batch', 'product', 'department', 'overall'],
    required: true
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  referenceNo: String,
  period: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  },
  costBreakdown: {
    rawMaterial: {
      type: Number,
      default: 0,
      min: 0
    },
    labor: {
      type: Number,
      default: 0,
      min: 0
    },
    machineOperation: {
      type: Number,
      default: 0,
      min: 0
    },
    energy: {
      type: Number,
      default: 0,
      min: 0
    },
    overhead: {
      type: Number,
      default: 0,
      min: 0
    },
    wastage: {
      type: Number,
      default: 0,
      min: 0
    },
    quality: {
      type: Number,
      default: 0,
      min: 0
    },
    maintenance: {
      type: Number,
      default: 0,
      min: 0
    },
    other: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  totalCost: {
    type: Number,
    required: true,
    min: 0
  },
  revenue: {
    type: Number,
    default: 0,
    min: 0
  },
  profit: {
    type: Number,
    default: 0
  },
  profitMargin: {
    type: Number, // Percentage
    default: 0
  },
  costPerUnit: Number,
  unitsProduced: Number,
  variance: {
    budgeted: Number,
    actual: Number,
    difference: Number,
    percentage: Number
  },
  stageWiseCosts: [{
    stageName: String,
    cost: Number,
    percentage: Number
  }],
  trends: {
    previousPeriodCost: Number,
    changePercentage: Number,
    costTrend: {
      type: String,
      enum: ['increasing', 'stable', 'decreasing']
    }
  },
  recommendations: [String],
  status: {
    type: String,
    enum: ['draft', 'approved', 'finalized'],
    default: 'draft'
  },
  analyzedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Calculate totals before saving
costAnalysisSchema.pre('save', function(next) {
  const breakdown = this.costBreakdown;
  this.totalCost = breakdown.rawMaterial + breakdown.labor + breakdown.machineOperation + 
                   breakdown.energy + breakdown.overhead + breakdown.wastage + 
                   breakdown.quality + breakdown.maintenance + breakdown.other;
  
  if (this.revenue > 0) {
    this.profit = this.revenue - this.totalCost;
    this.profitMargin = ((this.profit / this.revenue) * 100).toFixed(2);
  }
  
  if (this.unitsProduced > 0) {
    this.costPerUnit = (this.totalCost / this.unitsProduced).toFixed(2);
  }
  
  next();
});

costAnalysisSchema.index({ referenceType: 1, referenceId: 1 });
costAnalysisSchema.index({ 'period.startDate': 1, 'period.endDate': 1 });

module.exports = mongoose.model('CostAnalysis', costAnalysisSchema);
