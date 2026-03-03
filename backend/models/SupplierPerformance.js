const mongoose = require('mongoose');

// Model for supplier performance tracking
const supplierPerformanceSchema = new mongoose.Schema({
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  supplierCode: String,
  supplierName: String,
  evaluationPeriod: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  },
  metrics: {
    qualityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    deliveryScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    priceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    responseScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    complianceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  overallScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  rating: {
    type: String,
    enum: ['excellent', 'good', 'average', 'poor', 'blacklisted'],
    default: 'average'
  },
  statistics: {
    totalOrders: { type: Number, default: 0 },
    completedOrders: { type: Number, default: 0 },
    onTimeDeliveries: { type: Number, default: 0 },
    lateDeliveries: { type: Number, default: 0 },
    rejectedMaterials: { type: Number, default: 0 },
    totalValue: { type: Number, default: 0 },
    averageLeadTime: { type: Number, default: 0 }
  },
  qualityMetrics: {
    acceptanceRate: Number,
    defectRate: Number,
    returnRate: Number
  },
  deliveryMetrics: {
    onTimeDeliveryRate: Number,
    averageDelay: Number, // in days
    deliveryConsistency: Number
  },
  priceMetrics: {
    priceCompetitiveness: Number,
    priceStability: Number,
    discountOffered: Number
  },
  incidents: [{
    type: {
      type: String,
      enum: ['quality_issue', 'delay', 'price_dispute', 'compliance_violation', 'other']
    },
    date: Date,
    description: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    resolved: { type: Boolean, default: false }
  }],
  status: {
    type: String,
    enum: ['preferred', 'approved', 'probation', 'blacklisted', 'inactive'],
    default: 'approved'
  },
  recommendations: [String],
  nextReviewDate: Date,
  evaluatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Calculate overall score
supplierPerformanceSchema.pre('save', function(next) {
  const weights = { quality: 0.35, delivery: 0.30, price: 0.20, response: 0.10, compliance: 0.05 };
  
  this.overallScore = (
    (this.metrics.qualityScore * weights.quality) +
    (this.metrics.deliveryScore * weights.delivery) +
    (this.metrics.priceScore * weights.price) +
    (this.metrics.responseScore * weights.response) +
    (this.metrics.complianceScore * weights.compliance)
  ).toFixed(2);
  
  // Determine rating
  if (this.overallScore >= 90) this.rating = 'excellent';
  else if (this.overallScore >= 75) this.rating = 'good';
  else if (this.overallScore >= 60) this.rating = 'average';
  else if (this.overallScore >= 40) this.rating = 'poor';
  else this.rating = 'blacklisted';
  
  next();
});

supplierPerformanceSchema.index({ supplierId: 1, evaluationPeriod: -1 });
supplierPerformanceSchema.index({ rating: 1, overallScore: -1 });

module.exports = mongoose.model('SupplierPerformance', supplierPerformanceSchema);
