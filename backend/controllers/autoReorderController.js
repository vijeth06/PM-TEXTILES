const AutoReorder = require('../models/AutoReorder');
const RawMaterial = require('../models/RawMaterial');
const Inventory = require('../models/Inventory');
const PurchaseOrder = require('../models/PurchaseOrder');
const Supplier = require('../models/Supplier');
const { emitToRole } = require('../services/socketService');
const asyncHandler = require('express-async-handler');

// @desc    Get all auto-reorder suggestions
// @route   GET /api/procurement/auto-reorder
// @access  Private
exports.getAutoReorders = asyncHandler(async (req, res) => {
  const { status, priority } = req.query;
  
  let query = {};
  if (status) query.status = status;
  if (priority) query.priority = priority;

  const reorders = await AutoReorder.find(query)
    .populate('materialId')
    .populate('preferredSupplierId')
    .populate('approvedBy', 'username fullName')
    .sort({ priority: -1, createdAt: -1 });

  res.json({
    success: true,
    count: reorders.length,
    data: reorders
  });
});

// @desc    Check stock levels and trigger reorders
// @route   POST /api/procurement/auto-reorder/check
// @access  Private
exports.checkAndTriggerReorders = asyncHandler(async (req, res) => {
  const materials = await RawMaterial.find({
    reorderPoint: { $gt: 0 },
    isActive: true
  });

  const triggered = [];

  for (const material of materials) {
    // Calculate current stock
    const stockRecords = await Inventory.find({
      itemCode: material.code,
      status: { $in: ['available', 'reserved'] }
    });

    const currentStock = stockRecords.reduce((sum, record) => sum + (record.qtyAvailable || 0), 0);

    // Check if reorder needed
    if (currentStock <= material.reorderPoint) {
      // Check if already triggered
      const existing = await AutoReorder.findOne({
        materialCode: material.code,
        status: { $in: ['triggered', 'pending_approval', 'approved'] }
      });

      if (!existing) {
        // Calculate EOQ (Economic Order Quantity) - simplified
        const avgConsumption = material.averageConsumption || 100;
        const eoq = Math.sqrt((2 * avgConsumption * 1000) / 10); // Simplified formula

        // Get preferred supplier
        const supplier = material.preferredSupplierId 
          ? await Supplier.findById(material.preferredSupplierId)
          : await Supplier.findOne({ isActive: true }).sort({ createdAt: -1 }).limit(1);

        const priority = currentStock === 0 ? 'critical' : (currentStock < material.reorderPoint / 2 ? 'high' : 'medium');

        const reorder = await AutoReorder.create({
          materialId: material._id,
          materialCode: material.code,
          materialName: material.name,
          reorderPoint: material.reorderPoint,
          currentStock,
          economicOrderQuantity: Math.round(eoq),
          suggestedOrderQuantity: Math.round(eoq),
          leadTime: supplier?.leadTime || 7,
          safetyStock: material.safetyStock || 0,
          preferredSupplierId: supplier?._id,
          supplierCode: supplier?.code,
          supplierName: supplier?.name,
          estimatedCost: (material.standardCost || 0) * eoq,
          estimatedDeliveryDate: new Date(Date.now() + ((supplier?.leadTime || 7) * 24 * 60 * 60 * 1000)),
          priority,
          triggerReason: currentStock === 0 ? 'stockout' : 'low_stock'
        });

        triggered.push(reorder);

        // Emit notification
        emitToRole('admin', 'auto_reorder_triggered', {
          material: material.code,
          currentStock,
          priority
        });
      }
    }
  }

  res.json({
    success: true,
    message: `${triggered.length} auto-reorder(s) triggered`,
    data: triggered
  });
});

// @desc    Approve auto-reorder
// @route   PUT /api/procurement/auto-reorder/:id/approve
// @access  Private (Admin, Store Manager)
exports.approveAutoReorder = asyncHandler(async (req, res) => {
  const reorder = await AutoReorder.findById(req.params.id);

  if (!reorder) {
    res.status(404);
    throw new Error('Auto-reorder not found');
  }

  reorder.status = 'approved';
  reorder.approvedBy = req.user.id;
  reorder.approvedDate = new Date();

  await reorder.save();

  // If autoGenerate is true, create PO automatically
  if (reorder.autoGenerate) {
    const po = await PurchaseOrder.create({
      poNumber: `PO-AUTO-${Date.now()}`,
      supplierId: reorder.preferredSupplierId,
      supplierCode: reorder.supplierCode,
      supplierName: reorder.supplierName,
      category: 'raw_material',
      expectedDeliveryDate: reorder.estimatedDeliveryDate,
      items: [{
        materialId: reorder.materialId,
        materialCode: reorder.materialCode,
        materialName: reorder.materialName,
        quantity: reorder.suggestedOrderQuantity,
        uom: 'kg',
        ratePerUnit: reorder.estimatedCost / reorder.suggestedOrderQuantity
      }],
      status: 'pending',
      generatedBy: 'auto_reorder',
      createdBy: req.user.id
    });

    reorder.purchaseOrderId = po._id;
    reorder.status = 'po_created';
    await reorder.save();
  }

  res.json({
    success: true,
    data: reorder
  });
});

// @desc    Reject auto-reorder
// @route   PUT /api/procurement/auto-reorder/:id/reject
// @access  Private (Admin, Store Manager)
exports.rejectAutoReorder = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  
  const reorder = await AutoReorder.findById(req.params.id);

  if (!reorder) {
    res.status(404);
    throw new Error('Auto-reorder not found');
  }

  reorder.status = 'cancelled';
  reorder.rejectionReason = reason;
  reorder.approvedBy = req.user.id;
  reorder.approvedDate = new Date();

  await reorder.save();

  res.json({
    success: true,
    data: reorder
  });
});

// @desc    Update auto-reorder quantity
// @route   PUT /api/procurement/auto-reorder/:id/quantity
// @access  Private
exports.updateReorderQuantity = asyncHandler(async (req, res) => {
  const { suggestedOrderQuantity } = req.body;

  const reorder = await AutoReorder.findById(req.params.id);

  if (!reorder) {
    res.status(404);
    throw new Error('Auto-reorder not found');
  }

  reorder.suggestedOrderQuantity = suggestedOrderQuantity;
  reorder.estimatedCost = (reorder.estimatedCost / reorder.economicOrderQuantity) * suggestedOrderQuantity;

  await reorder.save();

  res.json({
    success: true,
    data: reorder
  });
});

// @desc    Delete auto-reorder
// @route   DELETE /api/procurement/auto-reorder/:id
// @access  Private (Admin)
exports.deleteAutoReorder = asyncHandler(async (req, res) => {
  const reorder = await AutoReorder.findById(req.params.id);

  if (!reorder) {
    res.status(404);
    throw new Error('Auto-reorder not found');
  }

  await reorder.deleteOne();

  res.json({
    success: true,
    message: 'Auto-reorder deleted successfully'
  });
});
