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
          delayedStages
        },
        inventory: {
          totalValue: inventoryValue[0]?.totalValue || 0,
          lowStockItems: lowStockItems[0]?.count || 0
        },
        orders: {
          pending: pendingOrders,
          urgent: urgentOrders,
          overdue: overdueOrders
        },
        machines: {
          total: totalMachines,
          operational: operationalMachines,
          underMaintenance: machinesUnderMaintenance
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
