const CostAnalysis = require('../models/CostAnalysis');
const ProductionPlan = require('../models/ProductionPlan');
const Order = require('../models/Order');
const Wastage = require('../models/Wastage');
const asyncHandler = require('express-async-handler');

// @desc    Create cost analysis
// @route   POST /api/analytics/cost-analysis
// @access  Private
exports.createCostAnalysis = asyncHandler(async (req, res) => {
  const costAnalysis = await CostAnalysis.create({
    ...req.body,
    analyzedBy: req.user.id
  });

  res.status(201).json({
    success: true,
    data: costAnalysis
  });
});

// @desc    Get all cost analyses
// @route   GET /api/analytics/cost-analysis
// @access  Private
exports.getCostAnalyses = asyncHandler(async (req, res) => {
  const { referenceType, startDate, endDate } = req.query;
  
  let query = {};
  
  if (referenceType) query.referenceType = referenceType;
  if (startDate && endDate) {
    query['period.startDate'] = { $gte: new Date(startDate) };
    query['period.endDate'] = { $lte: new Date(endDate) };
  }

  const costAnalyses = await CostAnalysis.find(query)
    .populate('analyzedBy', 'username fullName')
    .sort({ 'period.endDate': -1 });

  res.json({
    success: true,
    count: costAnalyses.length,
    data: costAnalyses
  });
});

// @desc    Generate cost analysis for production plan
// @route   POST /api/analytics/cost-analysis/production/:planId
// @access  Private
exports.analyzeProductionCost = asyncHandler(async (req, res) => {
  const plan = await ProductionPlan.findById(req.params.planId)
    .populate('rawMaterialRequirements.materialId');

  if (!plan) {
    res.status(404);
    throw new Error('Production plan not found');
  }

  // Calculate raw material cost
  let rawMaterialCost = 0;
  plan.rawMaterialRequirements?.forEach(req => {
    rawMaterialCost += (req.estimatedCost || 0) * (req.quantity || 0);
  });

  // Get wastage cost
  const wastage = await Wastage.find({ planId: plan._id });
  const wastageCost = wastage.reduce((sum, w) => sum + (w.totalValue || 0), 0);

  // Estimate other costs (simplified)
  const laborCost = plan.productDetails.targetQuantity * 10; // ₹10 per unit labor
  const machineCost = plan.assignedMachines?.length * 500 || 0; // ₹500 per machine
  const energyCost = plan.productDetails.targetQuantity * 2; // ₹2 per unit energy
  const overheadCost = (rawMaterialCost + laborCost) * 0.15; // 15% overhead

  const totalCost = rawMaterialCost + laborCost + machineCost + energyCost + overheadCost + wastageCost;

  const costAnalysis = await CostAnalysis.create({
    referenceType: 'production_plan',
    referenceId: plan._id,
    referenceNo: plan.planNo,
    period: {
      startDate: plan.startDate,
      endDate: plan.endDate
    },
    costBreakdown: {
      rawMaterial: rawMaterialCost,
      labor: laborCost,
      machineOperation: machineCost,
      energy: energyCost,
      overhead: overheadCost,
      wastage: wastageCost
    },
    totalCost,
    unitsProduced: plan.actualProduction || plan.productDetails.targetQuantity,
    status: 'finalized',
    analyzedBy: req.user.id
  });

  res.json({
    success: true,
    data: costAnalysis
  });
});

// @desc    Get cost breakdown chart data
// @route   GET /api/analytics/cost-analysis/breakdown
// @access  Private
exports.getCostBreakdown = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const analyses = await CostAnalysis.find({
    'period.startDate': { $gte: new Date(startDate) },
    'period.endDate': { $lte: new Date(endDate) }
  });

  const breakdown = {
    rawMaterial: 0,
    labor: 0,
    machineOperation: 0,
    energy: 0,
    overhead: 0,
    wastage: 0,
    quality: 0,
    maintenance: 0,
    other: 0
  };

  analyses.forEach(analysis => {
    Object.keys(breakdown).forEach(key => {
      breakdown[key] += analysis.costBreakdown[key] || 0;
    });
  });

  const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  const percentages = {};
  Object.keys(breakdown).forEach(key => {
    percentages[key] = total > 0 ? ((breakdown[key] / total) * 100).toFixed(2) : 0;
  });

  res.json({
    success: true,
    data: {
      breakdown,
      percentages,
      total
    }
  });
});

// @desc    Get profitability report
// @route   GET /api/analytics/cost-analysis/profitability
// @access  Private
exports.getProfitabilityReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const analyses = await CostAnalysis.find({
    'period.startDate': { $gte: new Date(startDate) },
    'period.endDate': { $lte: new Date(endDate) },
    revenue: { $gt: 0 }
  });

  const summary = {
    totalRevenue: 0,
    totalCost: 0,
    totalProfit: 0,
    avgProfitMargin: 0
  };

  analyses.forEach(analysis => {
    summary.totalRevenue += analysis.revenue || 0;
    summary.totalCost += analysis.totalCost || 0;
    summary.totalProfit += analysis.profit || 0;
  });

  summary.avgProfitMargin = summary.totalRevenue > 0 
    ? ((summary.totalProfit / summary.totalRevenue) * 100).toFixed(2)
    : 0;

  const byReference = analyses.reduce((acc, analysis) => {
    const type = analysis.referenceType;
    if (!acc[type]) {
      acc[type] = {
        revenue: 0,
        cost: 0,
        profit: 0,
        count: 0
      };
    }
    acc[type].revenue += analysis.revenue || 0;
    acc[type].cost += analysis.totalCost || 0;
    acc[type].profit += analysis.profit || 0;
    acc[type].count++;
    return acc;
  }, {});

  res.json({
    success: true,
    data: {
      summary,
      byReference
    }
  });
});

// @desc    Update cost analysis
// @route   PUT /api/analytics/cost-analysis/:id
// @access  Private
exports.updateCostAnalysis = asyncHandler(async (req, res) => {
  let costAnalysis = await CostAnalysis.findById(req.params.id);

  if (!costAnalysis) {
    res.status(404);
    throw new Error('Cost analysis not found');
  }

  costAnalysis = await CostAnalysis.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    data: costAnalysis
  });
});

// @desc    Delete cost analysis
// @route   DELETE /api/analytics/cost-analysis/:id
// @access  Private (Admin)
exports.deleteCostAnalysis = asyncHandler(async (req, res) => {
  const costAnalysis = await CostAnalysis.findById(req.params.id);

  if (!costAnalysis) {
    res.status(404);
    throw new Error('Cost analysis not found');
  }

  await costAnalysis.deleteOne();

  res.json({
    success: true,
    message: 'Cost analysis deleted successfully'
  });
});
