const mongoose = require('mongoose');

// Model for predictive analytics and demand forecasting
const forecastSchema = new mongoose.Schema({
  forecastType: {
    type: String,
    enum: ['demand', 'inventory', 'production', 'revenue', 'wastage', 'machine_failure'],
    required: true
  },
  targetPeriod: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'productType'
  },
  productType: {
    type: String,
    enum: ['FinishedGood', 'RawMaterial', 'SemiFinishedGood']
  },
  productCode: String,
  productName: String,
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  machineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine'
  },
  predictedValue: {
    type: Number,
    required: true
  },
  actualValue: Number,
  accuracy: Number, // Percentage accuracy when actual is known
  confidenceLevel: {
    type: Number,
    min: 0,
    max: 100,
    default: 80
  },
  model: {
    algorithm: String, // e.g., 'linear_regression', 'arima', 'exponential_smoothing'
    parameters: mongoose.Schema.Types.Mixed,
    trainedOn: Date
  },
  historicalDataPoints: {
    type: Number,
    default: 0
  },
  trends: {
    seasonality: String, // 'high', 'medium', 'low', 'none'
    growth: Number, // Percentage growth trend
    volatility: Number // Standard deviation
  },
  recommendations: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['draft', 'active', 'validated', 'expired'],
    default: 'active'
  },
  generatedBy: {
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

forecastSchema.index({ forecastType: 1, targetPeriod: 1 });
forecastSchema.index({ productCode: 1, createdAt: -1 });

module.exports = mongoose.model('Forecast', forecastSchema);
