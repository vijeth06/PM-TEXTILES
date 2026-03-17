const KPI = require('../models/KPI');
const ProductionPlan = require('../models/ProductionPlan');
const ProductionStage = require('../models/ProductionStage');
const Order = require('../models/Order');
const Machine = require('../models/Machine');
const QualityCheck = require('../models/QualityCheck');
const asyncHandler = require('express-async-handler');

// @desc    Calculate and save KPI
// @route   POST /api/analytics/kpis
// @access  Private
exports.createKPI = asyncHandler(async (req, res) => {
  const kpi = await KPI.create({
    ...req.body,
    createdBy: req.user.id
  });

  res.status(201).json({
    success: true,
    data: kpi
  });
});

// @desc    Get all KPIs
// @route   GET /api/analytics/kpis
// @access  Private
exports.getKPIs = asyncHandler(async (req, res) => {
  const { kpiType, department, period, startDate, endDate } = req.query;
  
  let query = {};
  
  if (kpiType) query.kpiType = kpiType;
  if (department) query.department = department;
  if (period) query.period = period;
  if (startDate && endDate) {
    query.periodDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const kpis = await KPI.find(query)
    .populate('createdBy', 'username fullName')
    .sort({ periodDate: -1 });

  res.json({
    success: true,
    count: kpis.length,
    data: kpis
  });
});

// @desc    Calculate OEE (Overall Equipment Effectiveness)
// @route   POST /api/analytics/kpis/oee
// @access  Private
exports.calculateOEE = asyncHandler(async (req, res) => {
  const { machineId, startDate, endDate } = req.body;

  const machine = await Machine.findById(machineId);
  if (!machine) {
    res.status(404);
    throw new Error('Machine not found');
  }

  // Get production stages for the machine
  const stages = await ProductionStage.find({
    machineId,
    $or: [
      { actualStartTime: { $gte: new Date(startDate), $lte: new Date(endDate) } },
      { actualEndTime: { $gte: new Date(startDate), $lte: new Date(endDate) } }
    ]
  });

  // Calculate availability
  const totalTime = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60); // hours
  const plannedProductionTime = totalTime * 0.9; // Assuming 90% is planned production time
  const downtime = stages.reduce((sum, s) => {
    const stageDowntimeMinutes = Array.isArray(s.downtimeLog)
      ? s.downtimeLog.reduce((dSum, d) => dSum + (d.duration || 0), 0)
      : 0;
    return sum + (stageDowntimeMinutes / 60);
  }, 0);
  const operatingTime = plannedProductionTime - downtime;
  const availability = (operatingTime / plannedProductionTime) * 100;

  // Calculate performance
  const idealCycleTime = machine.capacity?.value || 100; // units per hour
  const actualOutput = stages.reduce((sum, s) => sum + (s.outputQuantity || 0), 0);
  const performance = ((actualOutput / (operatingTime * idealCycleTime)) * 100);

  // Calculate quality
  const qualityChecks = await QualityCheck.find({
    checkedAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
    machineId
  });
  const passedChecks = qualityChecks.filter(q => q.result === 'passed').length;
  const quality = qualityChecks.length > 0 ? (passedChecks / qualityChecks.length) * 100 : 100;

  // Calculate OEE
  const oee = (availability * performance * quality) / 10000;

  const kpi = await KPI.create({
    kpiType: 'oee',
    name: `OEE - ${machine.name}`,
    period: 'daily',
    periodDate: new Date(endDate),
    targetValue: 85,
    actualValue: oee.toFixed(2),
    unit: 'percentage',
    department: 'production',
    machineId,
    components: {
      availability: availability.toFixed(2),
      performance: performance.toFixed(2),
      quality: quality.toFixed(2)
    },
    calculatedBy: 'system',
    createdBy: req.user.id
  });

  res.json({
    success: true,
    data: kpi
  });
});

// @desc    Calculate On-Time Delivery (OTD)
// @route   POST /api/analytics/kpis/otd
// @access  Private
exports.calculateOTD = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.body;

  const deliveredOrders = await Order.find({
    status: 'delivered',
    actualDeliveryDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
  });

  const onTimeDeliveries = deliveredOrders.filter(order => 
    order.actualDeliveryDate <= order.promiseDate
  ).length;

  const otd = deliveredOrders.length > 0 
    ? (onTimeDeliveries / deliveredOrders.length) * 100 
    : 0;

  const kpi = await KPI.create({
    kpiType: 'otd',
    name: 'On-Time Delivery Rate',
    period: 'monthly',
    periodDate: new Date(endDate),
    targetValue: 95,
    actualValue: otd.toFixed(2),
    unit: 'percentage',
    department: 'sales',
    notes: `${onTimeDeliveries} out of ${deliveredOrders.length} orders delivered on time`,
    calculatedBy: 'system',
    createdBy: req.user.id
  });

  res.json({
    success: true,
    data: kpi
  });
});

// @desc    Calculate First Pass Yield (FPY)
// @route   POST /api/analytics/kpis/fpy
// @access  Private
exports.calculateFPY = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.body;

  const qualityChecks = await QualityCheck.find({
    checkedAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
    stage: 'final_inspection'
  });

  const firstPassUnits = qualityChecks.filter(q => q.result === 'passed').length;
  const totalUnits = qualityChecks.length;

  const fpy = totalUnits > 0 ? (firstPassUnits / totalUnits) * 100 : 0;

  const kpi = await KPI.create({
    kpiType: 'fpy',
    name: 'First Pass Yield',
    period: 'monthly',
    periodDate: new Date(endDate),
    targetValue: 98,
    actualValue: fpy.toFixed(2),
    unit: 'percentage',
    department: 'quality',
    notes: `${firstPassUnits} passed out of ${totalUnits} total units`,
    calculatedBy: 'system',
    createdBy: req.user.id
  });

  res.json({
    success: true,
    data: kpi
  });
});

// @desc    Get KPI dashboard
// @route   GET /api/analytics/kpis/dashboard
// @access  Private
exports.getKPIDashboard = asyncHandler(async (req, res) => {
  const { period = 'monthly' } = req.query;

  const startDate = new Date();
  if (period === 'daily') startDate.setDate(startDate.getDate() - 30);
  else if (period === 'monthly') startDate.setMonth(startDate.getMonth() - 6);
  else startDate.setFullYear(startDate.getFullYear() - 1);

  const kpis = await KPI.find({ periodDate: { $gte: startDate } })
    .sort({ periodDate: -1 })
    .limit(300);

  const byType = {};
  for (const kpi of kpis) {
    if (!byType[kpi.kpiType]) byType[kpi.kpiType] = [];
    byType[kpi.kpiType].push(kpi);
  }

  const summary = Object.entries(byType).map(([type, rows]) => {
    const latest = rows[0];
    const previous = rows[1];
    const average = rows.reduce((sum, r) => sum + (r.actualValue || 0), 0) / rows.length;
    let trend = 'stable';
    if (previous) {
      if ((latest.actualValue || 0) > (previous.actualValue || 0)) trend = 'improving';
      else if ((latest.actualValue || 0) < (previous.actualValue || 0)) trend = 'declining';
    }

    return {
      type,
      average: Number(average.toFixed(2)),
      target: Number((latest?.targetValue || 0).toFixed(2)),
      trend,
      performanceStatus: latest?.performanceStatus || 'average'
    };
  });

  res.json({
    success: true,
    data: {
      summary,
      kpis
    }
  });
});

// @desc    Delete KPI
// @route   DELETE /api/analytics/kpis/:id
// @access  Private (Admin)
exports.deleteKPI = asyncHandler(async (req, res) => {
  const kpi = await KPI.findById(req.params.id);

  if (!kpi) {
    res.status(404);
    throw new Error('KPI not found');
  }

  await kpi.deleteOne();

  res.json({
    success: true,
    message: 'KPI deleted successfully'
  });
});
