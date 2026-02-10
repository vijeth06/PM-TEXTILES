const express = require('express');
const router = express.Router();
const {
  getInventory,
  getInventoryItem,
  lookupInventoryBatch,
  issueMaterial,
  receiveMaterial,
  adjustInventory,
  getReorderAlerts,
  getBatchHistory,
  getPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  updatePurchaseOrder,
  receiveMaterials,
  cancelPurchaseOrder,
  getSupplierPerformance
} = require('../controllers/inventoryController');
const { protect, checkPermission } = require('../middleware/auth');
const { validate, idValidation } = require('../middleware/validation');

router.use(protect);

// Inventory routes
router.get('/', checkPermission('view_inventory'), getInventory);
router.get('/lookup', checkPermission('view_inventory'), lookupInventoryBatch);
router.get('/alerts', checkPermission('view_inventory'), getReorderAlerts);
// Purchase Order routes
router.get('/purchase-orders', checkPermission('view_inventory'), getPurchaseOrders);
router.post('/purchase-orders', checkPermission('manage_inventory'), createPurchaseOrder);
router.get('/purchase-orders/:id', checkPermission('view_inventory'), getPurchaseOrder);
router.put('/purchase-orders/:id', checkPermission('manage_inventory'), updatePurchaseOrder);
router.post('/purchase-orders/:id/receive', checkPermission('manage_inventory'), receiveMaterials);
router.put('/purchase-orders/:id/cancel', checkPermission('manage_inventory'), cancelPurchaseOrder);
router.get('/purchase-orders/supplier/:supplierId/performance', checkPermission('view_inventory'), getSupplierPerformance);

router.get('/:id', checkPermission('view_inventory'), idValidation, validate, getInventoryItem);
router.get('/:id/history', checkPermission('view_inventory'), getBatchHistory);

router.post('/issue', checkPermission('manage_inventory'), issueMaterial);
router.post('/receive', checkPermission('manage_inventory'), receiveMaterial);
router.put('/:id/adjust', checkPermission('manage_inventory'), adjustInventory);

module.exports = router;
