const Inventory = require('../models/Inventory');
const RawMaterial = require('../models/RawMaterial');
const PurchaseOrder = require('../models/PurchaseOrder');
const { broadcastToAll, emitToRole } = require('../services/socketService');
const { v4: uuidv4 } = require('uuid');

// Purchase Order Controllers
const {
  getPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  updatePurchaseOrder,
  receiveMaterials,
  cancelPurchaseOrder,
  getSupplierPerformance
} = require('./purchaseOrderController');

module.exports.getPurchaseOrders = getPurchaseOrders;
module.exports.getPurchaseOrder = getPurchaseOrder;
module.exports.createPurchaseOrder = createPurchaseOrder;
module.exports.updatePurchaseOrder = updatePurchaseOrder;
module.exports.receiveMaterials = receiveMaterials;
module.exports.cancelPurchaseOrder = cancelPurchaseOrder;
module.exports.getSupplierPerformance = getSupplierPerformance;

// @desc    Get all inventory
// @route   GET /api/inventory
// @access  Private
exports.getInventory = async (req, res, next) => {
  try {
    const { itemType, status, location, page = 1, limit = 50 } = req.query;

    const query = {};
    if (itemType) query.itemType = itemType;
    if (status) query.status = status;
    if (location) query['location.warehouse'] = location;

    const inventory = await Inventory.find(query)
      .populate('itemId')
      .populate('supplierId', 'name code')
      .sort({ fifoDate: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Inventory.countDocuments(query);

    // Calculate totals
    const totals = await Inventory.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$itemType',
          totalValue: { $sum: '$totalValue' },
          totalQty: { $sum: '$qtyOnHand' }
        }
      }
    ]);

    res.json({
      success: true,
      count: inventory.length,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      summary: totals,
      totals,
      data: inventory
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single inventory item
// @route   GET /api/inventory/:id
// @access  Private
exports.getInventoryItem = async (req, res, next) => {
  try {
    const item = await Inventory.findById(req.params.id)
      .populate('itemId')
      .populate('supplierId');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Issue material (FIFO)
// @route   POST /api/inventory/issue
// @access  Private
exports.issueMaterial = async (req, res, next) => {
  try {
    const { itemCode, itemType, quantity, purpose, referenceNo } = req.body;

    // Find available inventory batches (FIFO)
    const availableBatches = await Inventory.find({
      itemCode,
      itemType,
      status: 'available',
      qtyAvailable: { $gt: 0 }
    }).sort({ fifoDate: 1 });

    if (availableBatches.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No available inventory for this item'
      });
    }

    let remainingQty = quantity;
    const issuedBatches = [];

    for (const batch of availableBatches) {
      if (remainingQty <= 0) break;

      const issueQty = Math.min(batch.qtyAvailable, remainingQty);
      
      batch.qtyOnHand -= issueQty;
      batch.qtyAvailable = batch.qtyOnHand - batch.qtyReserved;
      
      if (batch.qtyOnHand <= 0) {
        batch.status = 'depleted';
      }

      await batch.save();

      issuedBatches.push({
        batchNo: batch.batchNo,
        quantity: issueQty,
        costPerUnit: batch.costPerUnit
      });

      remainingQty -= issueQty;
    }

    if (remainingQty > 0) {
      return res.status(400).json({
        success: false,
        message: `Insufficient inventory. Short by ${remainingQty} ${availableBatches[0].uom}`
      });
    }

    // Emit real-time event
    broadcastToAll('inventory_updated', {
      type: 'material_issued',
      itemCode,
      quantity,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Material issued successfully',
      data: {
        itemCode,
        issuedQuantity: quantity,
        batches: issuedBatches,
        purpose,
        referenceNo
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Receive material
// @route   POST /api/inventory/receive
// @access  Private
exports.receiveMaterial = async (req, res, next) => {
  try {
    const {
      itemId,
      itemType,
      itemCode,
      itemName,
      batchNo,
      barcode,
      quantity,
      uom,
      costPerUnit,
      supplierId,
      location,
      grn,
      qualityStatus
    } = req.body;

    // Check if batch already exists
    const existingBatch = await Inventory.findOne({ batchNo, itemCode });
    if (existingBatch) {
      return res.status(400).json({
        success: false,
        message: 'Batch number already exists for this item'
      });
    }

    // Barcode supports BOTH:
    // - manual entry (if provided)
    // - auto-generation (if not provided)
    let resolvedBarcode = barcode ? String(barcode).trim() : '';
    if (!resolvedBarcode) {
      const normalizedItemCode = String(itemCode || '').trim().toUpperCase();
      const normalizedBatchNo = String(batchNo || '').trim().toUpperCase();
      resolvedBarcode = `BATCH-${normalizedItemCode}-${normalizedBatchNo}`;

      // Ensure uniqueness even in edge cases
      const exists = await Inventory.findOne({ barcode: resolvedBarcode }).select('_id');
      if (exists) {
        resolvedBarcode = `${resolvedBarcode}-${uuidv4().slice(0, 8).toUpperCase()}`;
      }
    } else {
      const barcodeExists = await Inventory.findOne({ barcode: resolvedBarcode }).select('_id');
      if (barcodeExists) {
        return res.status(400).json({
          success: false,
          message: 'Barcode already exists for another batch'
        });
      }
    }

    const inventory = await Inventory.create({
      itemId,
      itemType,
      itemCode,
      itemName,
      batchNo,
      barcode: resolvedBarcode,
      qtyOnHand: quantity,
      qtyAvailable: quantity,
      uom,
      costPerUnit,
      totalValue: quantity * costPerUnit,
      supplierId,
      location,
      grn,
      qualityStatus: qualityStatus || 'approved',
      receivedDate: new Date(),
      fifoDate: new Date()
    });

    // Emit real-time event
    broadcastToAll('inventory_updated', {
      type: 'material_received',
      itemCode,
      batchNo,
      barcode: resolvedBarcode,
      quantity,
      timestamp: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Material received successfully',
      data: inventory
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lookup inventory batch by barcode (primary) or batchNo (secondary)
// @route   GET /api/inventory/lookup?code=...
// @access  Private
exports.lookupInventoryBatch = async (req, res, next) => {
  try {
    const code = String(req.query.code || '').trim();
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Query param "code" is required'
      });
    }

    // 1) Best: exact barcode match
    let batch = await Inventory.findOne({ barcode: code })
      .populate('itemId')
      .populate('supplierId', 'name code');

    if (batch) {
      return res.json({ success: true, data: batch, match: 'barcode' });
    }

    // 2) Optional fallback: batchNo
    const normalizedBatchNo = code.toUpperCase();
    const candidates = await Inventory.find({ batchNo: normalizedBatchNo })
      .limit(2)
      .populate('itemId')
      .populate('supplierId', 'name code');

    if (candidates.length === 1) {
      return res.json({ success: true, data: candidates[0], match: 'batchNo' });
    }

    if (candidates.length > 1) {
      return res.status(409).json({
        success: false,
        message: 'Batch number is not unique. Please scan the batch barcode instead.',
        data: candidates.map(b => ({
          _id: b._id,
          itemCode: b.itemCode,
          itemName: b.itemName,
          batchNo: b.batchNo,
          barcode: b.barcode
        }))
      });
    }

    return res.status(404).json({
      success: false,
      message: 'Batch not found'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Adjust inventory
// @route   PUT /api/inventory/:id/adjust
// @access  Private
exports.adjustInventory = async (req, res, next) => {
  try {
    const { adjustmentType, quantity, reason } = req.body;

    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    const oldQty = item.qtyOnHand;

    if (adjustmentType === 'increase') {
      item.qtyOnHand += quantity;
    } else if (adjustmentType === 'decrease') {
      if (item.qtyOnHand < quantity) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient quantity for adjustment'
        });
      }
      item.qtyOnHand -= quantity;
    }

    item.qtyAvailable = item.qtyOnHand - item.qtyReserved;
    item.totalValue = item.qtyOnHand * item.costPerUnit;

    if (item.qtyOnHand === 0) {
      item.status = 'scrapped';
    }

    await item.save();

    // Emit real-time event
    broadcastToAll('inventory_updated', {
      type: 'inventory_adjusted',
      itemCode: item.itemCode,
      adjustmentType,
      quantity,
      oldQuantity: oldQty,
      newQuantity: item.qtyOnHand,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Inventory adjusted successfully',
      data: {
        item,
        adjustment: {
          type: adjustmentType,
          quantity,
          oldQuantity: oldQty,
          newQuantity: item.qtyOnHand,
          reason
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reorder alerts
// @route   GET /api/inventory/alerts
// @access  Private
exports.getReorderAlerts = async (req, res, next) => {
  try {
    // Get all raw materials with reorder points
    const materials = await RawMaterial.find({
      reorderPoint: { $gt: 0 },
      isActive: true
    });

    const alerts = [];

    for (const material of materials) {
      // Calculate current stock
      const stockRecords = await Inventory.find({
        itemCode: material.code,
        status: { $in: ['available', 'reserved'] }
      });

      const currentStock = stockRecords.reduce((sum, record) => sum + record.qtyAvailable, 0);

      if (currentStock <= material.reorderPoint) {
        alerts.push({
          materialCode: material.code,
          materialName: material.name,
          currentStock,
          reorderPoint: material.reorderPoint,
          reorderQuantity: material.reorderQuantity,
          shortBy: material.reorderPoint - currentStock,
          uom: material.uom,
          priority: currentStock <= material.safetyStock ? 'urgent' : 'normal'
        });
      }
    }

    // Emit real-time alerts if any
    if (alerts.length > 0) {
      emitToRole('store_manager', 'inventory_alerts', {
        count: alerts.length,
        alerts: alerts.filter(a => a.priority === 'urgent'),
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get batch history
// @route   GET /api/inventory/:id/history
// @access  Private
exports.getBatchHistory = async (req, res, next) => {
  try {
    const batch = await Inventory.findById(req.params.id)
      .populate('itemId')
      .populate('supplierId');

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // In a full implementation, you would track transaction history
    // For now, return batch details
    res.json({
      success: true,
      data: {
        batch,
        history: [] // Would contain issue/receive/adjustment transactions
      }
    });
  } catch (error) {
    next(error);
  }
};
