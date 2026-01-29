const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Customer = require('../models/Customer');
const Dispatch = require('../models/Dispatch');
const Inventory = require('../models/Inventory');
const ProductionStage = require('../models/ProductionStage');
const Wastage = require('../models/Wastage');
const { broadcastToAll, emitToUser, emitToRole } = require('../services/socketService');

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
exports.getOrders = async (req, res, next) => {
  try {
    const { status, priority, customerId, startDate, endDate, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (customerId) query.customerId = customerId;
    if (startDate || endDate) {
      query.orderDate = {};
      if (startDate) query.orderDate.$gte = new Date(startDate);
      if (endDate) query.orderDate.$lte = new Date(endDate);
    }

    const orders = await Order.find(query)
      .populate('customerId', 'name code')
      .populate('createdBy', 'fullName')
      .sort({ orderDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Order.countDocuments(query);

    res.json({
      success: true,
      count: orders.length,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId')
      .populate('productionPlanId')
      .populate('createdBy', 'fullName');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Get order items
    const items = await OrderItem.find({ orderId: order._id });

    res.json({
      success: true,
      data: {
        ...order.toObject(),
        items
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res, next) => {
  try {
    const { customerId, priority, promiseDate, items, deliveryAddress, deliveryInstructions, advanceAmount } = req.body;

    // Verify customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Generate order number
    const count = await Order.countDocuments();
    const orderNo = `ORD-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    // Calculate totals
    let totalQuantity = 0;
    let totalValue = 0;

    items.forEach(item => {
      const lineTotal = item.quantity * item.unitPrice;
      const discount = item.discount || 0;
      const taxAmount = (lineTotal - discount) * ((item.taxPercent || 0) / 100);
      totalQuantity += item.quantity;
      totalValue += lineTotal - discount + taxAmount;
    });

    // Create order
    const order = await Order.create({
      orderNo,
      customerId,
      customerCode: customer.code,
      customerName: customer.name,
      priority: priority || 'normal',
      promiseDate,
      totalQuantity,
      totalValue,
      advanceAmount: advanceAmount || 0,
      balanceAmount: totalValue - (advanceAmount || 0),
      paymentStatus: advanceAmount >= totalValue ? 'paid' : advanceAmount > 0 ? 'partial' : 'unpaid',
      deliveryAddress: deliveryAddress || customer.address,
      deliveryInstructions,
      status: 'pending',
      createdBy: req.user._id
    });

    // Create order items
    const orderItems = items.map(item => ({
      orderId: order._id,
      orderNo: order.orderNo,
      sku: item.sku,
      productName: item.productName,
      description: item.description,
      specifications: item.specifications,
      orderedQuantity: item.quantity,
      uom: item.uom,
      unitPrice: item.unitPrice,
      discount: item.discount || 0,
      taxPercent: item.taxPercent || 0,
      status: 'pending'
    }));

    await OrderItem.insertMany(orderItems);

    // Emit real-time event
    broadcastToAll('order_created', {
      orderNo: order.orderNo,
      customerId: order.customerId,
      customerName: order.customerName,
      totalValue: order.totalValue,
      priority: order.priority,
      timestamp: new Date()
    });

    // Check inventory availability
    for (const item of items) {
      const availableQty = await Inventory.aggregate([
        {
          $match: {
            itemCode: item.sku,
            status: 'available'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$qtyAvailable' }
          }
        }
      ]);

      const available = availableQty[0]?.total || 0;
      
      if (available < item.quantity) {
        // Mark for production
        await OrderItem.findOneAndUpdate(
          { orderId: order._id, sku: item.sku },
          { sourcedFrom: 'production' }
        );
      } else {
        await OrderItem.findOneAndUpdate(
          { orderId: order._id, sku: item.sku },
          { sourcedFrom: 'inventory', allocatedQuantity: item.quantity }
        );
      }
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Private
exports.updateOrder = async (req, res, next) => {
  try {
    let order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Prevent updates to dispatched or delivered orders
    if (order.status === 'dispatched' || order.status === 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update dispatched or delivered orders'
      });
    }

    order = await Order.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // Emit real-time event
    broadcastToAll('order_updated', {
      orderId: order._id,
      orderNo: order.orderNo,
      status: order.status,
      customerId: order.customerId,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private
exports.deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status !== 'pending' && order.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Can only delete pending or confirmed orders'
      });
    }

    await order.remove();
    await OrderItem.deleteMany({ orderId: order._id });

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Dispatch order
// @route   POST /api/orders/:id/dispatch
// @access  Private
exports.dispatchOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status !== 'packed') {
      return res.status(400).json({
        success: false,
        message: 'Only packed orders can be dispatched'
      });
    }

    const { transportDetails, packingDetails, scheduledDeliveryDate } = req.body;

    // Generate dispatch number
    const count = await Dispatch.countDocuments();
    const dispatchNo = `DISP-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    // Get order items
    const items = await OrderItem.find({ orderId: order._id });

    const dispatch = await Dispatch.create({
      dispatchNo,
      orderId: order._id,
      orderNo: order.orderNo,
      customerId: order.customerId,
      customerName: order.customerName,
      dispatchDate: new Date(),
      scheduledDeliveryDate,
      items: items.map(item => ({
        orderItemId: item._id,
        sku: item.sku,
        productName: item.productName,
        quantity: item.orderedQuantity,
        uom: item.uom
      })),
      transportDetails,
      packingDetails,
      deliveryAddress: order.deliveryAddress,
      invoiceNo: order.invoiceNo,
      invoiceValue: order.totalValue,
      status: 'pending',
      dispatchedBy: req.user._id
    });

    // Update order status
    order.status = 'dispatched';
    await order.save();

    // Emit real-time events
    broadcastToAll('order_dispatched', {
      orderNo: order.orderNo,
      dispatchNo: dispatch.dispatchNo,
      customerId: order.customerId,
      customerName: order.customerName,
      timestamp: new Date()
    });

    // Notify customer
    emitToUser(order.customerId, 'order_status_updated', {
      orderNo: order.orderNo,
      status: 'dispatched',
      dispatchNo: dispatch.dispatchNo
    });

    res.json({
      success: true,
      message: 'Order dispatched successfully',
      data: dispatch
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get orders by customer
// @route   GET /api/orders/customer/:customerId
// @access  Private
exports.getOrdersByCustomer = async (req, res, next) => {
  try {
    const orders = await Order.find({ customerId: req.params.customerId })
      .sort({ orderDate: -1 })
      .populate('createdBy', 'fullName');

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order profitability analysis
// @route   GET /api/orders/:id/profit
// @access  Private
exports.getOrderProfit = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'name code')
      .populate('productionPlanId');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Get order items
    const items = await OrderItem.find({ orderId: order._id });

    // Revenue
    const revenue = order.totalValue;

    // Calculate production cost
    let productionCost = 0;
    let rawMaterialCost = 0;
    let laborCost = 0;
    let wastageValue = 0;
    let overheadCost = 0;

    if (order.productionPlanId) {
      // Get production stages for this order
      const productionStages = await ProductionStage.find({ 
        planId: order.productionPlanId 
      }).populate('machineId');

      // Raw material cost
      for (const stage of productionStages) {
        if (stage.materialConsumption && stage.materialConsumption.length > 0) {
          for (const material of stage.materialConsumption) {
            // Get average cost from inventory
            const inventoryCost = await Inventory.findOne({
              itemCode: material.materialCode
            }).select('costPerUnit');
            
            if (inventoryCost) {
              rawMaterialCost += material.consumedQuantity * inventoryCost.costPerUnit;
            }
          }
        }

        // Labor cost (estimated based on duration and workers)
        if (stage.actualStartTime && stage.actualEndTime) {
          const durationHours = (new Date(stage.actualEndTime) - new Date(stage.actualStartTime)) / (1000 * 60 * 60);
          const workersCount = stage.assignedWorkers ? stage.assignedWorkers.length : 1;
          const laborRatePerHour = 150; // Rs. per hour per worker (configurable)
          laborCost += durationHours * workersCount * laborRatePerHour;
        }

        // Machine operating cost
        if (stage.machineId && stage.actualStartTime && stage.actualEndTime) {
          const durationHours = (new Date(stage.actualEndTime) - new Date(stage.actualStartTime)) / (1000 * 60 * 60);
          const machineOperatingCost = 200; // Rs. per hour (configurable)
          overheadCost += durationHours * machineOperatingCost;
        }
      }

      // Get wastage cost
      const wastageRecords = await Wastage.find({
        planId: order.productionPlanId
      });

      wastageValue = wastageRecords.reduce((sum, w) => sum + w.totalCost, 0);
    }

    // Inventory sourced items cost
    let inventoryIssueCost = 0;
    for (const item of items) {
      if (item.sourcedFrom === 'inventory') {
        const inventoryItems = await Inventory.find({
          itemCode: item.sku,
          status: { $in: ['reserved', 'issued'] }
        }).limit(1);

        if (inventoryItems.length > 0) {
          inventoryIssueCost += item.orderedQuantity * inventoryItems[0].costPerUnit;
        }
      }
    }

    // Total cost
    productionCost = rawMaterialCost + laborCost + wastageValue + overheadCost;
    const totalCost = productionCost + inventoryIssueCost;

    // Profit calculation
    const grossProfit = revenue - totalCost;
    const grossProfitMargin = revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(2) : 0;

    // Additional expenses (configurable)
    const packagingCost = order.totalQuantity * 10; // Rs. 10 per unit
    const transportCost = 500; // Fixed transport cost
    const adminOverhead = revenue * 0.05; // 5% of revenue

    const totalExpenses = packagingCost + transportCost + adminOverhead;
    const netProfit = grossProfit - totalExpenses;
    const netProfitMargin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        orderId: order._id,
        orderNo: order.orderNo,
        customerName: order.customerName,
        revenue,
        costs: {
          rawMaterialCost: rawMaterialCost.toFixed(2),
          laborCost: laborCost.toFixed(2),
          wastageValue: wastageValue.toFixed(2),
          overheadCost: overheadCost.toFixed(2),
          productionCost: productionCost.toFixed(2),
          inventoryIssueCost: inventoryIssueCost.toFixed(2),
          totalDirectCost: totalCost.toFixed(2)
        },
        expenses: {
          packagingCost: packagingCost.toFixed(2),
          transportCost: transportCost.toFixed(2),
          adminOverhead: adminOverhead.toFixed(2),
          totalExpenses: totalExpenses.toFixed(2)
        },
        profitability: {
          grossProfit: grossProfit.toFixed(2),
          grossProfitMargin: `${grossProfitMargin}%`,
          netProfit: netProfit.toFixed(2),
          netProfitMargin: `${netProfitMargin}%`
        },
        breakeven: {
          revenueRequired: totalCost + totalExpenses,
          achieved: revenue >= (totalCost + totalExpenses)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

