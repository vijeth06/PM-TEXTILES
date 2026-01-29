const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { 
  exportInventoryToExcel, 
  exportOrdersToExcel, 
  exportProductionToExcel,
  importFromExcel 
} = require('../services/excelService');
const { generateInvoicePDF } = require('../services/pdfService');
const Inventory = require('../models/Inventory');
const Order = require('../models/Order');
const ProductionPlan = require('../models/ProductionPlan');
const path = require('path');
const fs = require('fs');

router.use(protect);

// Export inventory to Excel
router.get('/inventory/excel', authorize('admin', 'manager'), async (req, res) => {
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
router.get('/orders/excel', authorize('admin', 'manager'), async (req, res) => {
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
router.get('/production/excel', authorize('admin', 'manager'), async (req, res) => {
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
