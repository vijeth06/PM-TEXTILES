const express = require('express');
const router = express.Router();
const { protect, checkPermission } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { 
  exportInventoryToExcel, 
  exportOrdersToExcel, 
  exportProductionToExcel,
  importFromExcel,
  generateInventoryImportTemplate
} = require('../services/excelService');
const { generateInvoicePDF } = require('../services/pdfService');
const Inventory = require('../models/Inventory');
const Order = require('../models/Order');
const ProductionPlan = require('../models/ProductionPlan');
const path = require('path');
const fs = require('fs');

router.use(protect);

// Download import template
router.get('/import/template', checkPermission('manage_inventory'), async (req, res) => {
  try {
    const exportsDir = path.join(__dirname, '../exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    const filePath = path.join(exportsDir, `inventory_import_template_${Date.now()}.xlsx`);
    await generateInventoryImportTemplate(filePath);

    res.download(filePath, 'inventory_import_template.xlsx', (err) => {
      if (err) console.error(err);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Import from Excel
router.post('/import/excel', checkPermission('manage_inventory'), upload.single('file'), async (req, res) => {
  let uploadedPath = null;
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    uploadedPath = req.file.path;

    const importedData = await importFromExcel(uploadedPath);

    const requiredHeaders = [
      'item_name',
      'sku',
      'category',
      'current_stock',
      'min_level',
      'max_level',
      'unit',
      'unit_price',
      'status'
    ];

    const detectedHeaders = importedData.length > 0 ? Object.keys(importedData[0]) : [];
    const missingHeaders = requiredHeaders.filter((header) => !detectedHeaders.includes(header));
    if (missingHeaders.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template format',
        missingHeaders,
        expectedHeaders: requiredHeaders
      });
    }

    const invalidRows = importedData
      .map((row, index) => ({ rowNumber: index + 2, row }))
      .filter(({ row }) => !row.item_name || !row.sku || !row.unit);

    if (invalidRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some rows are invalid. Required: item_name, sku, unit',
        invalidRows: invalidRows.slice(0, 20)
      });
    }

    res.json({
      success: true,
      count: importedData.length,
      data: importedData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (uploadedPath && fs.existsSync(uploadedPath)) {
      fs.unlinkSync(uploadedPath);
    }
  }
});

// Export inventory to Excel
router.get('/inventory/excel', checkPermission('view_reports'), async (req, res) => {
  try {
    const inventory = await Inventory.find().lean();
    const filePath = path.join(__dirname, '../exports', `inventory_${Date.now()}.xlsx`);
    
    // Ensure exports directory exists
    const exportsDir = path.join(__dirname, '../exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    await exportInventoryToExcel(inventory, filePath);
    
    res.download(filePath, 'inventory.xlsx', (err) => {
      if (err) console.error(err);
      // Delete file after download
      fs.unlinkSync(filePath);
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Export orders to Excel
router.get('/orders/excel', checkPermission('view_reports'), async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('customer', 'name')
      .lean();
    
    const ordersData = orders.map(order => ({
      ...order,
      customerName: order.customer?.name || 'N/A',
      orderDate: new Date(order.orderDate).toLocaleDateString(),
      deliveryDate: order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'N/A'
    }));

    const filePath = path.join(__dirname, '../exports', `orders_${Date.now()}.xlsx`);
    
    const exportsDir = path.join(__dirname, '../exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    await exportOrdersToExcel(ordersData, filePath);
    
    res.download(filePath, 'orders.xlsx', (err) => {
      if (err) console.error(err);
      fs.unlinkSync(filePath);
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Export production to Excel
router.get('/production/excel', checkPermission('view_reports'), async (req, res) => {
  try {
    const production = await ProductionPlan.find()
      .populate('product', 'name')
      .lean();
    
    const productionData = production.map(prod => ({
      ...prod,
      productName: prod.product?.name || 'N/A',
      startDate: new Date(prod.startDate).toLocaleDateString(),
      endDate: prod.endDate ? new Date(prod.endDate).toLocaleDateString() : 'N/A'
    }));

    const filePath = path.join(__dirname, '../exports', `production_${Date.now()}.xlsx`);
    
    const exportsDir = path.join(__dirname, '../exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    await exportProductionToExcel(productionData, filePath);
    
    res.download(filePath, 'production.xlsx', (err) => {
      if (err) console.error(err);
      fs.unlinkSync(filePath);
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Generate invoice PDF
router.get('/invoice/:orderId/pdf', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('customer')
      .populate('items.product');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const filePath = path.join(__dirname, '../exports', `invoice_${order.orderNumber}.pdf`);
    
    const exportsDir = path.join(__dirname, '../exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    await generateInvoicePDF(order, order.customer, order.items, filePath);
    
    res.download(filePath, `invoice_${order.orderNumber}.pdf`, (err) => {
      if (err) console.error(err);
      fs.unlinkSync(filePath);
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
