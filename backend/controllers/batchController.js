const Batch = require('../models/Batch');
const Inventory = require('../models/Inventory');
const { generateQRCode, generateBarcode } = require('../services/barcodeService');

// Get all batches
exports.getBatches = async (req, res) => {
  try {
    const { product, status } = req.query;
    const filter = {};

    if (product) filter.product = product;
    if (status) filter.status = status;

    const batches = await Batch.find(filter)
      .populate('product')
      .populate('productionPlan')
      .populate('createdBy', 'name email')
      .populate('qualityCheck.checkedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: batches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single batch
exports.getBatch = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id)
      .populate('product')
      .populate('productionPlan')
      .populate('createdBy', 'name email')
      .populate('qualityCheck.checkedBy', 'name email');

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create batch
exports.createBatch = async (req, res) => {
  try {
    const { product, productionPlan, quantity, manufactureDate, expiryDate, location, notes } = req.body;

    const batch = new Batch({
      product,
      productionPlan,
      quantity,
      manufactureDate,
      expiryDate,
      location,
      notes,
      createdBy: req.user._id
    });

    await batch.save();

    // Generate QR Code and Barcode
    const qrData = {
      batchNumber: batch.batchNumber,
      product: product,
      quantity: quantity,
      manufactureDate: manufactureDate
    };

    batch.qrCode = await generateQRCode(qrData);
    batch.barcode = await generateBarcode(batch.batchNumber);
    
    await batch.save();

    res.status(201).json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update batch
exports.updateBatch = async (req, res) => {
  try {
    const batch = await Batch.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Quality check
exports.performQualityCheck = async (req, res) => {
  try {
    const { passed, checkedBy, notes } = req.body;
    
    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    batch.qualityCheck = {
      passed,
      checkedBy: checkedBy || req.user._id,
      checkDate: new Date(),
      notes
    };

    batch.status = passed ? 'approved' : 'rejected';
    await batch.save();

    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get batch by barcode/QR
exports.getBatchByCode = async (req, res) => {
  try {
    const { code } = req.params;
    
    const batch = await Batch.findOne({ batchNumber: code })
      .populate('product')
      .populate('productionPlan');

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = exports;
