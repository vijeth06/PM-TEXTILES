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
    const { date = new Date().toISOString().split('T')[0] } = req.query;
    
    // Parse date properly
    const reportDate = new Date(date);
    const startOfDay = new Date(reportDate.getFullYear(), reportDate.getMonth(), reportDate.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(reportDate.getFullYear(), reportDate.getMonth(), reportDate.getDate(), 23, 59, 59, 999);

    // Get stages completed/in progress on this date
    const stages = await ProductionStage.find({
      $or: [
        { actualStartTime: { $gte: startOfDay, $lte: endOfDay } },
        { actualEndTime: { $gte: startOfDay, $lte: endOfDay } }
      ]
    }).populate('planId', 'planNo productDetails');

    // Aggregate by stage
    const stageWise = {};
    let totalOutput = 0;
    let totalWastage = 0;
    let totalRejection = 0;

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
        const output = stage.outputQuantity || 0;
        stageWise[stage.stageName].totalOutput += output;
        totalOutput += output;
      } else if (stage.status === 'in_progress') {
        stageWise[stage.stageName].inProgress++;
      }

      const wastage = stage.wastageQuantity || 0;
      const rejection = stage.rejectedQuantity || 0;
      stageWise[stage.stageName].totalWastage += wastage;
      stageWise[stage.stageName].totalRejection += rejection;
      totalWastage += wastage;
      totalRejection += rejection;
    });

    res.json({
      success: true,
      reportDate: startOfDay.toISOString().split('T')[0],
      summary: {
        totalStages: stages.length,
        totalOutput,
        totalWastage,
        totalRejection,
        stageWise
      },
      details: stages
    });
  } catch (error) {
    console.error('Daily production report error:', error);
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

    let totalValue = 0;
    let totalItems = 0;

    inventory.forEach(item => {
      if (!item.fifoDate) return; // Skip items without fifoDate
      
      const ageInDays = Math.floor((now - new Date(item.fifoDate)) / (1000 * 60 * 60 * 24));
      let bucket;

      if (ageInDays <= 30) bucket = '0-30';
      else if (ageInDays <= 60) bucket = '31-60';
      else if (ageInDays <= 90) bucket = '61-90';
      else bucket = '90+';

      const itemValue = item.totalValue || 0;
      agingBuckets[bucket].count++;
      agingBuckets[bucket].value += itemValue;
      totalValue += itemValue;
      totalItems++;

      agingBuckets[bucket].items.push({
        itemCode: item.itemCode,
        itemName: item.itemName,
        batchNo: item.batchNo,
        quantity: item.qtyOnHand || 0,
        ageInDays,
        value: itemValue
      });
    });

    res.json({
      success: true,
      reportDate: now.toISOString(),
      summary: {
        totalItems,
        totalValue
      },
      agingBuckets
    });
  } catch (error) {
    console.error('Inventory aging report error:', error);
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
        totalCost: parseFloat(totalCost.toFixed(2))
      },
      byStage,
      byType,
      byReason
    });
  } catch (error) {
    console.error('Wastage analysis report error:', error);
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
        if (order.actualDeliveryDate && order.actualDeliveryDate <= order.promiseDate) {
          metrics.onTime++;
        } else if (order.actualDeliveryDate && order.actualDeliveryDate > order.promiseDate) {
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

    metrics.otif = metrics.delivered > 0 ? parseFloat(((metrics.onTime / metrics.delivered) * 100).toFixed(2)) : 0;

    res.json({
      success: true,
      period: { startDate, endDate },
      metrics
    });
  } catch (error) {
    console.error('Order fulfillment report error:', error);
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
      const uptime = machine.utilizationMetrics?.totalUptime || 0;
      const downtime = machine.utilizationMetrics?.totalDowntime || 0;
      const totalTime = uptime + downtime;
      const utilizationPercent = totalTime > 0
        ? parseFloat(((uptime / totalTime) * 100).toFixed(2))
        : 0;

      return {
        machineCode: machine.code,
        machineName: machine.name,
        type: machine.type,
        status: machine.status,
        totalUptime: uptime,
        totalDowntime: downtime,
        totalTime: totalTime,
        utilizationPercent
      };
    });

    const avgUtilization = report.length > 0
      ? parseFloat((report.reduce((sum, m) => sum + parseFloat(m.utilizationPercent), 0) / report.length).toFixed(2))
      : 0;

    res.json({
      success: true,
      count: report.length,
      avgUtilization,
      data: report
    });
  } catch (error) {
    console.error('Machine utilization report error:', error);
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
      .populate('customerId', 'name');

    // Note: Full profit calculation would require cost data
    // This is a simplified version showing revenue
    const report = orders.map(order => ({
      orderNo: order.orderNo,
      customerName: order.customerName || (order.customerId?.name || 'N/A'),
      orderDate: order.orderDate,
      totalQuantity: order.totalQuantity || 0,
      revenue: order.totalValue || 0,
      status: order.status
    }));

    const totalRevenue = parseFloat(orders.reduce((sum, o) => sum + (o.totalValue || 0), 0).toFixed(2));
    const deliveredCount = orders.filter(o => o.status === 'delivered').length;

    res.json({
      success: true,
      period: { startDate, endDate },
      count: report.length,
      deliveredCount,
      totalRevenue,
      avgOrderValue: report.length > 0 ? parseFloat((totalRevenue / report.length).toFixed(2)) : 0,
      data: report
    });
  } catch (error) {
    console.error('Profit per order report error:', error);
    next(error);
  }
};
