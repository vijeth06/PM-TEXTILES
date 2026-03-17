const ProductionPlan = require('../models/ProductionPlan');
const ProductionStage = require('../models/ProductionStage');
const Inventory = require('../models/Inventory');
const Order = require('../models/Order');
const Machine = require('../models/Machine');
const Wastage = require('../models/Wastage');
const PurchaseOrder = require('../models/PurchaseOrder');

// @desc    Get dashboard metrics
// @route   GET /api/dashboard/metrics
// @access  Private
exports.getDashboardMetrics = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Production metrics
    const productionPlans = await ProductionPlan.countDocuments({
      status: { $in: ['in_progress', 'approved'] }
    });

    const completedToday = await ProductionStage.countDocuments({
      status: 'completed',
      actualEndTime: { $gte: today, $lt: tomorrow }
    });

    const productionTodayAgg = await ProductionStage.aggregate([
      {
        $match: {
          status: 'completed',
          actualEndTime: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $project: {
          outputQuantity: { $ifNull: ['$outputQuantity', 0] },
          efficiency: {
            $cond: [
              { $gt: ['$inputQuantity', 0] },
              { $multiply: [{ $divide: ['$outputQuantity', '$inputQuantity'] }, 100] },
              null
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalProduction: { $sum: '$outputQuantity' },
          avgEfficiency: { $avg: '$efficiency' }
        }
      }
    ]);

    let latestProductionAgg = [];
    if (!productionTodayAgg.length) {
      latestProductionAgg = await ProductionStage.aggregate([
        { $match: { status: 'completed', actualEndTime: { $exists: true } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$actualEndTime' }
            },
            totalProduction: { $sum: { $ifNull: ['$outputQuantity', 0] } },
            avgEfficiency: {
              $avg: {
                $cond: [
                  { $gt: ['$inputQuantity', 0] },
                  { $multiply: [{ $divide: ['$outputQuantity', '$inputQuantity'] }, 100] },
                  null
                ]
              }
            }
          }
        },
        { $sort: { _id: -1 } },
        { $limit: 1 }
      ]);
    }

    const effectiveProduction = productionTodayAgg[0] || latestProductionAgg[0] || {};

    const delayedStages = await ProductionStage.countDocuments({
      status: { $in: ['pending', 'in_progress'] },
      scheduledEndTime: { $lt: new Date() }
    });

    // Inventory metrics
    const inventoryValue = await Inventory.aggregate([
      {
        $match: {
          status: { $in: ['available', 'reserved'] }
        }
      },
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$totalValue' }
        }
      }
    ]);

    const lowStockItems = await Inventory.aggregate([
      {
        $match: {
          status: 'available'
        }
      },
      {
        $group: {
          _id: '$itemCode',
          totalQty: { $sum: '$qtyAvailable' }
        }
      },
      {
        $match: {
          totalQty: { $lt: 10 } // Simplified threshold
        }
      },
      {
        $count: 'count'
      }
    ]);

    // Order metrics
    const pendingOrders = await Order.countDocuments({
      status: { $in: ['pending', 'confirmed', 'in_production'] }
    });

    const urgentOrders = await Order.countDocuments({
      priority: 'urgent',
      status: { $nin: ['delivered', 'cancelled'] }
    });

    const overdueOrders = await Order.countDocuments({
      promiseDate: { $lt: today },
      status: { $nin: ['delivered', 'cancelled'] }
    });

    // Machine metrics
    const totalMachines = await Machine.countDocuments({ isActive: true });
    const operationalMachines = await Machine.countDocuments({
      status: 'operational',
      isActive: true
    });
    const machinesUnderMaintenance = await Machine.countDocuments({
      status: { $in: ['maintenance', 'breakdown'] }
    });

    const machineUtilization = totalMachines > 0
      ? Number(((operationalMachines / totalMachines) * 100).toFixed(2))
      : 0;

    const activeTargetAgg = await ProductionPlan.aggregate([
      {
        $match: {
          status: { $in: ['in_progress', 'approved'] }
        }
      },
      {
        $group: {
          _id: null,
          totalTarget: { $sum: { $ifNull: ['$productDetails.targetQuantity', 0] } }
        }
      }
    ]);

    const inventoryStockAgg = await Inventory.aggregate([
      {
        $match: {
          status: { $in: ['available', 'reserved'] }
        }
      },
      {
        $group: {
          _id: '$itemType',
          qty: { $sum: '$qtyAvailable' }
        }
      }
    ]);
    const yarnStock = inventoryStockAgg
      .filter((row) => row._id === 'RawMaterial')
      .reduce((sum, row) => sum + (row.qty || 0), 0);
    const fabricStock = inventoryStockAgg
      .filter((row) => row._id === 'FinishedGood' || row._id === 'SemiFinishedGood')
      .reduce((sum, row) => sum + (row.qty || 0), 0);

    // Wastage metrics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const wastageData = await Wastage.aggregate([
      {
        $match: {
          recordedDate: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: null,
          totalCost: { $sum: '$totalCost' },
          totalQuantity: { $sum: '$quantity' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent activities
    const recentOrders = await Order.find()
      .sort({ orderDate: -1 })
      .limit(5)
      .select('orderNo customerName orderDate status')
      .populate('customerId', 'name');

    const recentProduction = await ProductionStage.find({
      actualEndTime: { $gte: thirtyDaysAgo }
    })
      .sort({ actualEndTime: -1 })
      .limit(5)
      .select('planNo stageName outputQuantity status actualEndTime');

    res.json({
      success: true,
      data: {
        production: {
          activePlans: productionPlans,
          completedToday,
          delayedStages,
          totalProduction: effectiveProduction.totalProduction || 0,
          avgEfficiency: effectiveProduction.avgEfficiency || machineUtilization,
          targetQuantity: activeTargetAgg[0]?.totalTarget || 0
        },
        inventory: {
          totalValue: inventoryValue[0]?.totalValue || 0,
          lowStockItems: lowStockItems[0]?.count || 0,
          yarnStock,
          fabricStock
        },
        orders: {
          pending: pendingOrders,
          urgent: urgentOrders,
          overdue: overdueOrders
        },
        machines: {
          total: totalMachines,
          operational: operationalMachines,
          underMaintenance: machinesUnderMaintenance,
          utilization: machineUtilization
        },
        wastage: {
          totalCost: wastageData[0]?.totalCost || 0,
          totalQuantity: wastageData[0]?.totalQuantity || 0,
          recordCount: wastageData[0]?.count || 0,
          period: 'Last 30 days'
        },
        recentActivities: {
          orders: recentOrders,
          production: recentProduction
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get production trend data
// @route   GET /api/dashboard/production-trend
// @access  Private
exports.getProductionTrend = async (req, res, next) => {
  try {
    const { period = 'week' } = req.query; // week, month, year

    let startDate = new Date();
    let groupFormat;

    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
      groupFormat = { $dayOfWeek: '$actualEndTime' };
    } else if (period === 'month') {
      startDate.setDate(startDate.getDate() - 30);
      groupFormat = { $dayOfMonth: '$actualEndTime' };
    } else {
      startDate.setMonth(startDate.getMonth() - 12);
      groupFormat = { $month: '$actualEndTime' };
    }

    const productionData = await ProductionStage.aggregate([
      {
        $match: {
          status: 'completed',
          actualEndTime: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: groupFormat,
          totalOutput: { $sum: '$outputQuantity' },
          totalRejected: { $sum: '$rejectedQuantity' },
          totalWastage: { $sum: '$wastageQuantity' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      success: true,
      data: productionData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get inventory aging analysis
// @route   GET /api/dashboard/inventory-aging
// @access  Private
exports.getInventoryAging = async (req, res, next) => {
  try {
    const today = new Date();
    
    const agingData = await Inventory.aggregate([
      {
        $match: {
          status: 'available',
          qtyAvailable: { $gt: 0 }
        }
      },
      {
        $project: {
          itemCode: 1,
          itemName: 1,
          qtyAvailable: 1,
          totalValue: 1,
          ageDays: {
            $divide: [
              { $subtract: [today, '$receivedDate'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      {
        $bucket: {
          groupBy: '$ageDays',
          boundaries: [0, 30, 60, 90, 180, 365, 9999],
          default: 'Over 365 days',
          output: {
            count: { $sum: 1 },
            totalValue: { $sum: '$totalValue' },
            totalQty: { $sum: '$qtyAvailable' },
            items: {
              $push: {
                itemCode: '$itemCode',
                itemName: '$itemName',
                ageDays: { $floor: '$ageDays' }
              }
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: agingData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order fulfillment metrics
// @route   GET /api/dashboard/order-fulfillment
// @access  Private
exports.getOrderFulfillment = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = {};
    if (startDate || endDate) {
      query.orderDate = {};
      if (startDate) query.orderDate.$gte = new Date(startDate);
      if (endDate) query.orderDate.$lte = new Date(endDate);
    }

    const orders = await Order.find(query);

    const totalOrders = orders.length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    const onTimeDeliveries = orders.filter(o => {
      return o.status === 'delivered' && 
             o.actualDeliveryDate && 
             new Date(o.actualDeliveryDate) <= new Date(o.promiseDate);
    }).length;

    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
    const inProgressOrders = orders.filter(o => 
      ['confirmed', 'in_production', 'packed'].includes(o.status)
    ).length;

    const fulfillmentRate = totalOrders > 0 
      ? ((deliveredOrders / totalOrders) * 100).toFixed(2)
      : 0;
    
    const onTimeRate = deliveredOrders > 0 
      ? ((onTimeDeliveries / deliveredOrders) * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: {
        totalOrders,
        deliveredOrders,
        onTimeDeliveries,
        cancelledOrders,
        inProgressOrders,
        fulfillmentRate: `${fulfillmentRate}%`,
        onTimeDeliveryRate: `${onTimeRate}%`
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get machine utilization report
// @route   GET /api/dashboard/machine-utilization
// @access  Private
exports.getMachineUtilizationReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateQuery = {};
    if (startDate || endDate) {
      dateQuery.actualStartTime = {};
      if (startDate) dateQuery.actualStartTime.$gte = new Date(startDate);
      if (endDate) dateQuery.actualStartTime.$lte = new Date(endDate);
    }

    const utilizationData = await ProductionStage.aggregate([
      {
        $match: {
          ...dateQuery,
          status: 'completed',
          machineId: { $exists: true }
        }
      },
      {
        $lookup: {
          from: 'machines',
          localField: 'machineId',
          foreignField: '_id',
          as: 'machine'
        }
      },
      {
        $unwind: '$machine'
      },
      {
        $project: {
          machineCode: '$machine.code',
          machineName: '$machine.name',
          machineType: '$machine.type',
          duration: {
            $divide: [
              { $subtract: ['$actualEndTime', '$actualStartTime'] },
              1000 * 60 * 60 // Convert to hours
            ]
          },
          outputQuantity: 1,
          downtimeMinutes: {
            $sum: '$downtimeLog.duration'
          }
        }
      },
      {
        $group: {
          _id: '$machineCode',
          machineName: { $first: '$machineName' },
          machineType: { $first: '$machineType' },
          totalRunningHours: { $sum: '$duration' },
          totalDowntimeMinutes: { $sum: '$downtimeMinutes' },
          totalOutput: { $sum: '$outputQuantity' },
          usageCount: { $sum: 1 }
        }
      },
      {
        $project: {
          machineCode: '$_id',
          machineName: 1,
          machineType: 1,
          totalRunningHours: { $round: ['$totalRunningHours', 2] },
          totalDowntimeHours: { $round: [{ $divide: ['$totalDowntimeMinutes', 60] }, 2] },
          totalOutput: 1,
          usageCount: 1,
          utilizationRate: {
            $round: [
              {
                $multiply: [
                  {
                    $divide: [
                      '$totalRunningHours',
                      { $add: ['$totalRunningHours', { $divide: ['$totalDowntimeMinutes', 60] }] }
                    ]
                  },
                  100
                ]
              },
              2
            ]
          }
        }
      },
      {
        $sort: { totalRunningHours: -1 }
      }
    ]);

    res.json({
      success: true,
      data: utilizationData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get supplier performance summary
// @route   GET /api/dashboard/supplier-performance
// @access  Private
exports.getSupplierPerformance = async (req, res, next) => {
  try {
    const performanceData = await PurchaseOrder.aggregate([
      {
        $match: {
          status: { $in: ['received', 'partial'] }
        }
      },
      {
        $group: {
          _id: '$supplierId',
          supplierName: { $first: '$supplierName' },
          supplierCode: { $first: '$supplierCode' },
          totalOrders: { $sum: 1 },
          totalValue: { $sum: '$totalAmount' },
          onTimeDeliveries: {
            $sum: {
              $cond: ['$deliveryPerformance.onTimeDelivery', 1, 0]
            }
          },
          avgQualityRating: { $avg: '$qualityRating' },
          avgDelayDays: { $avg: '$deliveryPerformance.delayDays' }
        }
      },
      {
        $project: {
          supplierId: '$_id',
          supplierName: 1,
          supplierCode: 1,
          totalOrders: 1,
          totalValue: { $round: ['$totalValue', 2] },
          onTimeDeliveryRate: {
            $round: [
              { $multiply: [{ $divide: ['$onTimeDeliveries', '$totalOrders'] }, 100] },
              2
            ]
          },
          avgQualityRating: { $round: ['$avgQualityRating', 2] },
          avgDelayDays: { $round: ['$avgDelayDays', 2] }
        }
      },
      {
        $sort: { totalValue: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      success: true,
      data: performanceData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard trends for charts
// @route   GET /api/dashboard/trends
// @access  Private
exports.getDashboardTrends = async (req, res, next) => {
  try {
    const { period = '7days' } = req.query;
    
    let startDate = new Date();
    switch(period) {
      case '7days':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Production trend
    const productionTrend = await ProductionStage.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          planned: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Revenue trend
    const revenueTrend = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: startDate },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$orderDate' } },
          revenue: { $sum: '$totalValue' },
          orders: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Quality trend (output vs input)
    const qualityTrend = await ProductionStage.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          inputQuantity: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalInput: { $sum: '$inputQuantity' },
          totalOutput: { $sum: '$outputQuantity' }
        }
      },
      {
        $project: {
          date: '$_id',
          passRate: {
            $multiply: [
              { $divide: ['$totalOutput', '$totalInput'] },
              100
            ]
          }
        }
      },
      {
        $sort: { date: 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        productionTrend,
        revenueTrend,
        qualityTrend,
        period
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order status distribution
// @route   GET /api/dashboard/order-status-distribution
// @access  Private
exports.getOrderStatusDistribution = async (req, res, next) => {
  try {
    const distribution = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: distribution.map(d => ({ status: d._id, count: d.count }))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get quality pass rate by production stage
// @route   GET /api/dashboard/quality-by-stage
// @access  Private
exports.getQualityByStage = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const match = {};
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }
    match.inputQuantity = { $gt: 0 };

    const data = await ProductionStage.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$stageName',
          totalInput: { $sum: '$inputQuantity' },
          totalOutput: { $sum: '$outputQuantity' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          stage: '$_id',
          count: 1,
          passRate: {
            $round: [
              {
                $multiply: [
                  { $divide: ['$totalOutput', '$totalInput'] },
                  100
                ]
              },
              2
            ]
          }
        }
      },
      { $sort: { stage: 1 } }
    ]);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Monthly performance snapshot for charts
// @route   GET /api/dashboard/monthly-performance
// @access  Private
exports.getMonthlyPerformance = async (req, res, next) => {
  try {
    const { months = 6 } = req.query;
    const monthsInt = Math.max(1, Math.min(parseInt(months, 10) || 6, 24));

    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    start.setMonth(start.getMonth() - (monthsInt - 1));

    const ordersAgg = await Order.aggregate([
      { $match: { orderDate: { $gte: start } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$orderDate' } },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const productionAgg = await ProductionStage.aggregate([
      { $match: { actualEndTime: { $gte: start }, status: 'completed' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$actualEndTime' } },
          production: { $sum: '$outputQuantity' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const deliveryAgg = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: start },
          status: 'delivered',
          actualDeliveryDate: { $exists: true, $ne: null }
        }
      },
      {
        $project: {
          month: { $dateToString: { format: '%Y-%m', date: '$actualDeliveryDate' } },
          onTime: {
            $cond: [
              { $lte: ['$actualDeliveryDate', '$promiseDate'] },
              1,
              0
            ]
          }
        }
      },
      {
        $group: {
          _id: '$month',
          delivered: { $sum: 1 },
          onTime: { $sum: '$onTime' }
        }
      },
      {
        $project: {
          _id: 1,
          onTimeDeliveryRate: {
            $round: [
              {
                $multiply: [
                  {
                    $cond: [
                      { $gt: ['$delivered', 0] },
                      { $divide: ['$onTime', '$delivered'] },
                      0
                    ]
                  },
                  100
                ]
              },
              2
            ]
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const byMonth = new Map();
    for (const row of ordersAgg) byMonth.set(row._id, { month: row._id, orders: row.orders, production: 0, onTimeDeliveryRate: 0 });
    for (const row of productionAgg) {
      const existing = byMonth.get(row._id) || { month: row._id, orders: 0, production: 0, onTimeDeliveryRate: 0 };
      existing.production = row.production;
      byMonth.set(row._id, existing);
    }
    for (const row of deliveryAgg) {
      const existing = byMonth.get(row._id) || { month: row._id, orders: 0, production: 0, onTimeDeliveryRate: 0 };
      existing.onTimeDeliveryRate = row.onTimeDeliveryRate;
      byMonth.set(row._id, existing);
    }

    res.json({
      success: true,
      data: Array.from(byMonth.values()).sort((a, b) => a.month.localeCompare(b.month))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Inventory value trend by month
// @route   GET /api/dashboard/inventory-value-trend
// @access  Private
exports.getInventoryValueTrend = async (req, res, next) => {
  try {
    const { months = 7 } = req.query;
    const monthsInt = Math.max(1, Math.min(parseInt(months, 10) || 7, 24));

    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    start.setMonth(start.getMonth() - (monthsInt - 1));

    const trend = await Inventory.aggregate([
      {
        $match: {
          receivedDate: { $gte: start },
          status: { $in: ['available', 'reserved'] }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$receivedDate' } },
          totalValue: { $sum: '$totalValue' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: trend.map(t => ({ month: t._id, totalValue: t.totalValue }))
    });
  } catch (error) {
    next(error);
  }
};
