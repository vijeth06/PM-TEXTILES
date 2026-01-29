const ProductionPlan = require('../models/ProductionPlan');
const ProductionStage = require('../models/ProductionStage');
const Inventory = require('../models/Inventory');
const Wastage = require('../models/Wastage');
const Order = require('../models/Order');
const Machine = require('../models/Machine');

// @desc    Daily production report
// @route   GET /api/reports/production-daily
// @access  Private
exports.getDailyProductionReport = async (req, res, next) => {
  try {
    const { date = new Date() } = req.query;
    const reportDate = new Date(date);
    const startOfDay = new Date(reportDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(reportDate.setHours(23, 59, 59, 999));

    // Get stages completed/in progress on this date
    const stages = await ProductionStage.find({
      $or: [
        { actualStartTime: { $gte: startOfDay, $lte: endOfDay } },
        { actualEndTime: { $gte: startOfDay, $lte: endOfDay } }
      ]
    }).populate('planId', 'planNo productDetails');

    // Aggregate by stage
    const stageWise = {};
    stages.forEach(stage => {
      if (!stageWise[stage.stageName]) {
        stageWise[stage.stageName] = {
          completed: 0,
          inProgress: 0,
          totalOutput: 0,
          totalWastage: 0,
          totalRejection: 0
        };
      }

      if (stage.status === 'completed') {
        stageWise[stage.stageName].completed++;
        stageWise[stage.stageName].totalOutput += stage.outputQuantity;
      } else if (stage.status === 'in_progress') {
        stageWise[stage.stageName].inProgress++;
      }

      stageWise[stage.stageName].totalWastage += stage.wastageQuantity;
      stageWise[stage.stageName].totalRejection += stage.rejectedQuantity;
    });

    res.json({
      success: true,
      reportDate: reportDate.toISOString().split('T')[0],
      summary: {
        totalStages: stages.length,
        stageWise
      },
      details: stages
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Inventory aging report
// @route   GET /api/reports/inventory-aging
// @access  Private
exports.getInventoryAgingReport = async (req, res, next) => {
  try {
    const now = new Date();

    const inventory = await Inventory.find({
      status: { $in: ['available', 'reserved'] }
    }).populate('itemId');

    // Categorize by age
    const agingBuckets = {
      '0-30': { count: 0, value: 0, items: [] },
      '31-60': { count: 0, value: 0, items: [] },
      '61-90': { count: 0, value: 0, items: [] },
      '90+': { count: 0, value: 0, items: [] }
    };

    inventory.forEach(item => {
      const ageInDays = Math.floor((now - item.fifoDate) / (1000 * 60 * 60 * 24));
      let bucket;

      if (ageInDays <= 30) bucket = '0-30';
      else if (ageInDays <= 60) bucket = '31-60';
      else if (ageInDays <= 90) bucket = '61-90';
      else bucket = '90+';

      agingBuckets[bucket].count++;
      agingBuckets[bucket].value += item.totalValue;
      agingBuckets[bucket].items.push({
        itemCode: item.itemCode,
        itemName: item.itemName,
        batchNo: item.batchNo,
        quantity: item.qtyOnHand,
        ageInDays,
        value: item.totalValue
      });
    });

    res.json({
      success: true,
      reportDate: now.toISOString(),
      agingBuckets
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Wastage analysis report
// @route   GET /api/reports/wastage-analysis
// @access  Private
exports.getWastageAnalysisReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate && endDate) {
      query.recordedDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const wastageRecords = await Wastage.find(query);

    // Aggregate by stage
    const byStage = {};
    const byType = {};
    const byReason = {};
    let totalCost = 0;
    let totalQuantity = 0;

    wastageRecords.forEach(record => {
      totalCost += record.totalCost;
      totalQuantity += record.quantity;

      // By stage
      if (record.stageName) {
        if (!byStage[record.stageName]) {
          byStage[record.stageName] = { quantity: 0, cost: 0, count: 0 };
        }
        byStage[record.stageName].quantity += record.quantity;
        byStage[record.stageName].cost += record.totalCost;
        byStage[record.stageName].count++;
      }

      // By type
      if (!byType[record.wastageType]) {
        byType[record.wastageType] = { quantity: 0, cost: 0, count: 0 };
      }
      byType[record.wastageType].quantity += record.quantity;
      byType[record.wastageType].cost += record.totalCost;
      byType[record.wastageType].count++;

      // By reason category
      if (!byReason[record.reasonCategory]) {
        byReason[record.reasonCategory] = { quantity: 0, cost: 0, count: 0 };
      }
      byReason[record.reasonCategory].quantity += record.quantity;
      byReason[record.reasonCategory].cost += record.totalCost;
      byReason[record.reasonCategory].count++;
    });

    res.json({
      success: true,
      period: { startDate, endDate },
      summary: {
        totalRecords: wastageRecords.length,
        totalQuantity,
        totalCost
      },
      byStage,
      byType,
      byReason
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Order fulfillment report
// @route   GET /api/reports/order-fulfillment
// @access  Private
exports.getOrderFulfillmentReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate && endDate) {
      query.promiseDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const orders = await Order.find(query);

    const metrics = {
      total: orders.length,
      delivered: 0,
      onTime: 0,
      delayed: 0,
      pending: 0,
      cancelled: 0,
      otif: 0 // On-Time In-Full
    };

    orders.forEach(order => {
      if (order.status === 'delivered') {
        metrics.delivered++;
        if (order.actualDeliveryDate <= order.promiseDate) {
          metrics.onTime++;
        } else {
          metrics.delayed++;
        }
      } else if (order.status === 'cancelled') {
        metrics.cancelled++;
      } else if (new Date() > order.promiseDate && order.status !== 'delivered') {
        metrics.delayed++;
      } else {
        metrics.pending++;
      }
    });

    metrics.otif = metrics.delivered > 0 ? ((metrics.onTime / metrics.delivered) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      period: { startDate, endDate },
      metrics
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Machine utilization report
// @route   GET /api/reports/machine-utilization
// @access  Private
exports.getMachineUtilizationReport = async (req, res, next) => {
  try {
    const machines = await Machine.find({ isActive: true });

    const report = machines.map(machine => {
      const totalTime = machine.utilizationMetrics.totalUptime + machine.utilizationMetrics.totalDowntime;
      const utilizationPercent = totalTime > 0
        ? ((machine.utilizationMetrics.totalUptime / totalTime) * 100).toFixed(2)
        : 0;

      return {
        machineCode: machine.code,
        machineName: machine.name,
        type: machine.type,
        status: machine.status,
        totalUptime: machine.utilizationMetrics.totalUptime,
        totalDowntime: machine.utilizationMetrics.totalDowntime,
        utilizationPercent
      };
    });

    res.json({
      success: true,
      count: report.length,
      data: report
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Profit per order report
// @route   GET /api/reports/profit-per-order
// @access  Private
exports.getProfitPerOrderReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {
      status: { $in: ['dispatched', 'delivered'] }
    };

    if (startDate && endDate) {
      query.orderDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const orders = await Order.find(query)
      .populate('customerId', 'name')
      .select('orderNo customerName totalValue orderDate status');

    // Note: Full profit calculation would require cost data
    // This is a simplified version
    const report = orders.map(order => ({
      orderNo: order.orderNo,
      customerName: order.customerName,
      orderDate: order.orderDate,
      revenue: order.totalValue,
      // profit: would require cost calculation
      status: order.status
    }));

    res.json({
      success: true,
      period: { startDate, endDate },
      count: report.length,
      totalRevenue: orders.reduce((sum, o) => sum + o.totalValue, 0),
      data: report
    });
  } catch (error) {
    next(error);
  }
};
