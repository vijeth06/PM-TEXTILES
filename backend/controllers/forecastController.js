const Forecast = require('../models/Forecast');
const Order = require('../models/Order');
const Inventory = require('../models/Inventory');
const ProductionPlan = require('../models/ProductionPlan');
const asyncHandler = require('express-async-handler');

// @desc    Create forecast
// @route   POST /api/analytics/forecasts
// @access  Private (Admin, Management)
exports.createForecast = asyncHandler(async (req, res) => {
  const forecast = await Forecast.create({
    ...req.body,
    createdBy: req.user.id
  });

  res.status(201).json({
    success: true,
    data: forecast
  });
});

// @desc    Get all forecasts
// @route   GET /api/analytics/forecasts
// @access  Private
exports.getForecasts = asyncHandler(async (req, res) => {
  const { forecastType, type, status, startDate, endDate } = req.query;
  
  let query = {};
  
  if (forecastType || type) query.forecastType = forecastType || type;
  if (status) query.status = status;
  if (startDate && endDate) {
    query['targetPeriod.startDate'] = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const forecasts = await Forecast.find(query)
    .populate('createdBy', 'username fullName')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: forecasts.length,
    data: forecasts
  });
});

// @desc    Generate demand forecast
// @route   POST /api/analytics/forecasts/demand
// @access  Private
exports.generateDemandForecast = asyncHandler(async (req, res) => {
  const { productCode, months = 3 } = req.body;

  // Get historical order data
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const orders = await Order.aggregate([
    {
      $match: {
        orderDate: { $gte: sixMonthsAgo },
        status: { $nin: ['cancelled'] }
      }
    },
    {
      $unwind: '$items'
    },
    {
      $match: productCode ? { 'items.productCode': productCode } : {}
    },
    {
      $group: {
        _id: {
          year: { $year: '$orderDate' },
          month: { $month: '$orderDate' },
          product: '$items.productCode'
        },
        totalQuantity: { $sum: '$items.quantity' },
        totalValue: { $sum: '$items.totalPrice' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // Simple moving average forecast
  const forecast = [];
  const dataPoints = orders.length;

  if (dataPoints >= 3) {
    const avgQuantity = orders.reduce((sum, o) => sum + o.totalQuantity, 0) / dataPoints;
    const avgValue = orders.reduce((sum, o) => sum + o.totalValue, 0) / dataPoints;

    // Calculate growth trend
    const firstHalf = orders.slice(0, Math.floor(dataPoints / 2));
    const secondHalf = orders.slice(Math.floor(dataPoints / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, o) => sum + o.totalQuantity, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, o) => sum + o.totalQuantity, 0) / secondHalf.length;
    
    const growth = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

    for (let i = 1; i <= months; i++) {
      const targetMonth = new Date();
      targetMonth.setMonth(targetMonth.getMonth() + i);

      const predictionValue = avgQuantity * (1 + (growth / 100) * i);

      const forecastData = await Forecast.create({
        forecastType: 'demand',
        targetPeriod: {
          startDate: new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1),
          endDate: new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0)
        },
        productCode,
        predictedValue: Math.round(predictionValue),
        confidenceLevel: dataPoints >= 6 ? 85 : 70,
        model: {
          algorithm: 'moving_average_with_trend',
          parameters: { avgQuantity, growth },
          trainedOn: new Date()
        },
        historicalDataPoints: dataPoints,
        trends: {
          growth,
          seasonality: 'medium'
        },
        recommendations: [
          growth > 10 ? 'Increase inventory levels' : 'Maintain current inventory',
          'Monitor market trends closely'
        ],
        generatedBy: 'system',
        createdBy: req.user.id
      });

      forecast.push(forecastData);
    }
  }

  res.json({
    success: true,
    message: 'Demand forecast generated successfully',
    data: {
      historicalDataPoints: dataPoints,
      forecast
    }
  });
});

// @desc    Get forecast accuracy
// @route   GET /api/analytics/forecasts/accuracy
// @access  Private
exports.getForecastAccuracy = asyncHandler(async (req, res) => {
  const forecasts = await Forecast.find({
    actualValue: { $exists: true, $ne: null }
  });

  const accuracyData = forecasts.map(f => ({
    forecastType: f.forecastType,
    predicted: f.predictedValue,
    actual: f.actualValue,
    accuracy: f.accuracy || ((1 - Math.abs(f.predictedValue - f.actualValue) / f.actualValue) * 100).toFixed(2)
  }));

  const avgAccuracy = accuracyData.reduce((sum, d) => sum + parseFloat(d.accuracy), 0) / (accuracyData.length || 1);

  res.json({
    success: true,
    data: {
      averageAccuracy: avgAccuracy.toFixed(2),
      totalForecasts: forecasts.length,
      details: accuracyData
    }
  });
});

// @desc    Update forecast with actual value
// @route   PUT /api/analytics/forecasts/:id/actual
// @access  Private
exports.updateForecastActual = asyncHandler(async (req, res) => {
  const { actualValue } = req.body;
  
  const forecast = await Forecast.findById(req.params.id);
  
  if (!forecast) {
    res.status(404);
    throw new Error('Forecast not found');
  }

  forecast.actualValue = actualValue;
  forecast.accuracy = ((1 - Math.abs(forecast.predictedValue - actualValue) / actualValue) * 100).toFixed(2);
  forecast.status = 'validated';

  await forecast.save();

  res.json({
    success: true,
    data: forecast
  });
});

// @desc    Delete forecast
// @route   DELETE /api/analytics/forecasts/:id
// @access  Private (Admin)
exports.deleteForecast = asyncHandler(async (req, res) => {
  const forecast = await Forecast.findById(req.params.id);

  if (!forecast) {
    res.status(404);
    throw new Error('Forecast not found');
  }

  await forecast.deleteOne();

  res.json({
    success: true,
    message: 'Forecast deleted successfully'
  });
});
