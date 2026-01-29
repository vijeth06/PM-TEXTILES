const PurchaseOrder = require('../models/PurchaseOrder');
const Supplier = require('../models/Supplier');
const Inventory = require('../models/Inventory');

// @desc    Get all purchase orders
// @route   GET /api/inventory/purchase-orders
// @access  Private
exports.getPurchaseOrders = async (req, res, next) => {
  try {
    const { status, supplierId, category, startDate, endDate, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (supplierId) query.supplierId = supplierId;
    if (category) query.category = category;
    if (startDate || endDate) {
      query.poDate = {};
      if (startDate) query.poDate.$gte = new Date(startDate);
      if (endDate) query.poDate.$lte = new Date(endDate);
    }

    const purchaseOrders = await PurchaseOrder.find(query)
      .populate('supplierId', 'name code contactPerson')
      .populate('createdBy', 'fullName')
      .sort({ poDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await PurchaseOrder.countDocuments(query);

    res.json({
      success: true,
      count: purchaseOrders.length,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: purchaseOrders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single purchase order
// @route   GET /api/inventory/purchase-orders/:id
// @access  Private
exports.getPurchaseOrder = async (req, res, next) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id)
      .populate('supplierId')
      .populate('items.materialId')
      .populate('createdBy', 'fullName')
      .populate('approvedBy', 'fullName');

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    res.json({
      success: true,
      data: purchaseOrder
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create purchase order
// @route   POST /api/inventory/purchase-orders
// @access  Private
exports.createPurchaseOrder = async (req, res, next) => {
  try {
    // Generate PO number
    const count = await PurchaseOrder.countDocuments();
    const poNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    // Get supplier details
    const supplier = await Supplier.findById(req.body.supplierId);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    const poData = {
      ...req.body,
      poNumber,
      supplierCode: supplier.code,
      supplierName: supplier.name,
      createdBy: req.user._id
    };

    const purchaseOrder = await PurchaseOrder.create(poData);

    res.status(201).json({
      success: true,
      message: 'Purchase order created successfully',
      data: purchaseOrder
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update purchase order
// @route   PUT /api/inventory/purchase-orders/:id
// @access  Private
exports.updatePurchaseOrder = async (req, res, next) => {
  try {
    let purchaseOrder = await PurchaseOrder.findById(req.params.id);

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    // Don't allow editing received or cancelled orders
    if (purchaseOrder.status === 'received' || purchaseOrder.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot edit ${purchaseOrder.status} purchase order`
      });
    }

    purchaseOrder = await PurchaseOrder.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Purchase order updated successfully',
      data: purchaseOrder
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Receive materials from purchase order
// @route   POST /api/inventory/purchase-orders/:id/receive
// @access  Private
exports.receiveMaterials = async (req, res, next) => {
  try {
    const { items, receiveDate, invoiceNo, remarks } = req.body;

    const purchaseOrder = await PurchaseOrder.findById(req.params.id);

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    if (purchaseOrder.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot receive materials from cancelled purchase order'
      });
    }

    // Update received quantities
    const inventoryEntries = [];
    
    for (const receivedItem of items) {
      const poItem = purchaseOrder.items.id(receivedItem.itemId);
      
      if (!poItem) {
        return res.status(400).json({
          success: false,
          message: `Item not found in purchase order: ${receivedItem.itemId}`
        });
      }

      if (receivedItem.quantity > (poItem.quantity - poItem.receivedQuantity)) {
        return res.status(400).json({
          success: false,
          message: `Received quantity exceeds pending quantity for item: ${poItem.materialName}`
        });
      }

      poItem.receivedQuantity += receivedItem.quantity;

      // Create inventory entry
      const inventoryData = {
        itemType: 'raw_material',
        itemId: poItem.materialId,
        itemCode: poItem.materialCode,
        itemName: poItem.materialName,
        batchNo: receivedItem.batchNo || `BATCH-${Date.now()}`,
        supplierId: purchaseOrder.supplierId,
        purchaseOrderId: purchaseOrder._id,
        poNumber: purchaseOrder.poNumber,
        qtyReceived: receivedItem.quantity,
        qtyOnHand: receivedItem.quantity,
        qtyAvailable: receivedItem.quantity,
        uom: poItem.uom,
        costPerUnit: poItem.ratePerUnit,
        totalValue: receivedItem.quantity * poItem.ratePerUnit,
        receivedDate: receiveDate || new Date(),
        fifoDate: receiveDate || new Date(),
        status: 'available',
        location: {
          warehouse: req.body.warehouse || 'Main Warehouse',
          rack: req.body.rack || '',
          bin: req.body.bin || ''
        },
        qualityStatus: receivedItem.qualityStatus || 'approved',
        remarks: remarks || ''
      };

      const inventoryEntry = await Inventory.create(inventoryData);
      inventoryEntries.push(inventoryEntry);
    }

    // Update PO status
    const allReceived = purchaseOrder.items.every(item => 
      item.receivedQuantity >= item.quantity
    );
    const partialReceived = purchaseOrder.items.some(item => 
      item.receivedQuantity > 0 && item.receivedQuantity < item.quantity
    );

    if (allReceived) {
      purchaseOrder.status = 'received';
      purchaseOrder.actualDeliveryDate = receiveDate || new Date();
      
      // Calculate delivery performance
      const expectedDate = new Date(purchaseOrder.expectedDeliveryDate);
      const actualDate = new Date(purchaseOrder.actualDeliveryDate);
      purchaseOrder.deliveryPerformance.onTimeDelivery = actualDate <= expectedDate;
      purchaseOrder.deliveryPerformance.delayDays = Math.max(0, 
        Math.ceil((actualDate - expectedDate) / (1000 * 60 * 60 * 24))
      );
    } else if (partialReceived || purchaseOrder.status === 'confirmed') {
      purchaseOrder.status = 'partial';
    }

    await purchaseOrder.save();

    res.json({
      success: true,
      message: 'Materials received successfully',
      data: {
        purchaseOrder,
        inventoryEntries
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel purchase order
// @route   PUT /api/inventory/purchase-orders/:id/cancel
// @access  Private
exports.cancelPurchaseOrder = async (req, res, next) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    if (purchaseOrder.status === 'received') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel received purchase order'
      });
    }

    purchaseOrder.status = 'cancelled';
    purchaseOrder.remarks = req.body.reason || 'Cancelled by user';
    await purchaseOrder.save();

    res.json({
      success: true,
      message: 'Purchase order cancelled successfully',
      data: purchaseOrder
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get supplier performance metrics
// @route   GET /api/inventory/purchase-orders/supplier/:supplierId/performance
// @access  Private
exports.getSupplierPerformance = async (req, res, next) => {
  try {
    const { supplierId } = req.params;
    const { startDate, endDate } = req.query;

    const query = {
      supplierId: supplierId,
      status: { $in: ['received', 'partial'] }
    };

    if (startDate || endDate) {
      query.poDate = {};
      if (startDate) query.poDate.$gte = new Date(startDate);
      if (endDate) query.poDate.$lte = new Date(endDate);
    }

    const purchaseOrders = await PurchaseOrder.find(query);

    const totalOrders = purchaseOrders.length;
    const onTimeDeliveries = purchaseOrders.filter(po => 
      po.deliveryPerformance.onTimeDelivery === true
    ).length;
    const delayedDeliveries = totalOrders - onTimeDeliveries;
    
    const totalValue = purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);
    
    const avgDelay = purchaseOrders.reduce((sum, po) => 
      sum + (po.deliveryPerformance.delayDays || 0), 0
    ) / totalOrders;

    const qualityRatings = purchaseOrders.filter(po => po.qualityRating).map(po => po.qualityRating);
    const avgQualityRating = qualityRatings.length > 0
      ? qualityRatings.reduce((sum, rating) => sum + rating, 0) / qualityRatings.length
      : null;

    res.json({
      success: true,
      data: {
        supplierId,
        totalOrders,
        onTimeDeliveries,
        delayedDeliveries,
        onTimeDeliveryPercent: totalOrders > 0 ? ((onTimeDeliveries / totalOrders) * 100).toFixed(2) : 0,
        totalValue,
        avgDelay: avgDelay.toFixed(2),
        avgQualityRating: avgQualityRating ? avgQualityRating.toFixed(2) : null,
        performanceRating: totalOrders > 0 
          ? ((onTimeDeliveries / totalOrders) * 60 + (avgQualityRating || 3) * 8).toFixed(2)
          : 'N/A'
      }
    });
  } catch (error) {
    next(error);
  }
};
