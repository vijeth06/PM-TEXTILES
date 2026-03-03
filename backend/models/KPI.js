const mongoose = require('mongoose');

// Model for tracking Key Performance Indicators
const kpiSchema = new mongoose.Schema({
  kpiType: {
    type: String,
    enum: ['oee', 'fpy', 'otd', 'production_efficiency', 'quality_rate', 'machine_utilization', 'wastage_percentage', 'customer_satisfaction'],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
    required: true
  },
  periodDate: {
    type: Date,
    required: true
  },
  targetValue: {
    type: Number,
    required: true
  },
  actualValue: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    enum: ['percentage', 'hours', 'units', 'currency', 'score'],
    default: 'percentage'
  },
  department: {
    type: String,
    enum: ['production', 'quality', 'inventory', 'sales', 'maintenance', 'overall']
  },
  machineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine'
  },
  productionPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductionPlan'
  },
  performanceStatus: {
    type: String,
    enum: ['excellent', 'good', 'average', 'poor', 'critical'],
    default: 'average'
  },
  variance: {
    type: Number, // Difference between target and actual (percentage)
    default: 0
  },
  trend: {
    direction: {
      type: String,
      enum: ['improving', 'stable', 'declining']
    },
    percentageChange: Number
  },
  components: {
    availability: Number, // For OEE
    performance: Number, // For OEE
    quality: Number // For OEE
  },
  notes: String,
  calculatedBy: {
    type: String,
    enum: ['system', 'manual'],
    default: 'system'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

kpiSchema.index({ kpiType: 1, periodDate: -1 });
kpiSchema.index({ department: 1, period: 1 });

// Calculate performance status based on variance
kpiSchema.pre('save', function(next) {
  this.variance = ((this.actualValue - this.targetValue) / this.targetValue * 100).toFixed(2);
  
  if (this.variance >= 10) this.performanceStatus = 'excellent';
  else if (this.variance >= 0) this.performanceStatus = 'good';
  else if (this.variance >= -10) this.performanceStatus = 'average';
  else if (this.variance >= -20) this.performanceStatus = 'poor';
  else this.performanceStatus = 'critical';
  
  next();
});

module.exports = mongoose.model('KPI', kpiSchema);
