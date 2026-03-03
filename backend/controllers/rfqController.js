const RFQ = require('../models/RFQ');
const Supplier = require('../models/Supplier');
const PurchaseOrder = require('../models/PurchaseOrder');
const { sendEmail, emailTemplates } = require('../services/emailService');
const asyncHandler = require('express-async-handler');

// @desc    Create RFQ
// @route   POST /api/procurement/rfq
// @access  Private
exports.createRFQ = asyncHandler(async (req, res) => {
  const rfq = await RFQ.create({
    ...req.body,
    rfqNumber: 'RFQ-NEW-' + Date.now(),
    createdBy: req.user.id
  });

  res.status(201).json({
    success: true,
    data: rfq
  });
});

// @desc    Get all RFQs
// @route   GET /api/procurement/rfq
// @access  Private
exports.getRFQs = asyncHandler(async (req, res) => {
  const { status } = req.query;
  
  let query = {};
  if (status) query.status = status;

  const rfqs = await RFQ.find(query)
    .populate('suppliers.supplierId')
    .populate('createdBy', 'username fullName')
    .sort({ rfqDate: -1 });

  res.json({
    success: true,
    count: rfqs.length,
    data: rfqs
  });
});

// @desc    Get single RFQ
// @route   GET /api/procurement/rfq/:id
// @access  Private
exports.getRFQ = asyncHandler(async (req, res) => {
  const rfq = await RFQ.findById(req.params.id)
    .populate('suppliers.supplierId')
    .populate('quotations.supplierId')
    .populate('createdBy', 'username fullName');

  if (!rfq) {
    res.status(404);
    throw new Error('RFQ not found');
  }

  res.json({
    success: true,
    data: rfq
  });
});

// @desc    Send RFQ to suppliers
// @route   POST /api/procurement/rfq/:id/send
// @access  Private
exports.sendRFQ = asyncHandler(async (req, res) => {
  const rfq = await RFQ.findById(req.params.id).populate('suppliers.supplierId');

  if (!rfq) {
    res.status(404);
    throw new Error('RFQ not found');
  }

  rfq.status = 'sent';

  // Send email to each supplier
  for (const supplier of rfq.suppliers) {
    if (supplier.supplierId) {
      supplier.sentDate = new Date();
      
      // Send email notification
      try {
        await sendEmail({
          to: supplier.supplierId.email,
          subject: `RFQ: ${rfq.rfqNumber} - ${rfq.title}`,
          text: `Dear ${supplier.supplierId.name},\n\nWe invite you to submit a quotation for ${rfq.title}.\n\nDeadline: ${rfq.deadline}\n\nPlease login to our supplier portal to view details and submit your quotation.`
        });
      } catch (error) {
        console.error(`Failed to send email to ${supplier.supplierId.name}:`, error);
      }
    }
  }

  await rfq.save();

  res.json({
    success: true,
    message: 'RFQ sent to all suppliers',
    data: rfq
  });
});

// @desc    Submit quotation for RFQ
// @route   POST /api/procurement/rfq/:id/quotation
// @access  Private
exports.submitQuotation = asyncHandler(async (req, res) => {
  const { supplierId, items, totalAmount, paymentTerms, deliveryTerms, remarks, validUntil } = req.body;

  const rfq = await RFQ.findById(req.params.id);

  if (!rfq) {
    res.status(404);
    throw new Error('RFQ not found');
  }

  // Update supplier quotation received status
  const supplierIndex = rfq.suppliers.findIndex(s => s.supplierId.toString() === supplierId);
  if (supplierIndex >= 0) {
    rfq.suppliers[supplierIndex].quotationReceived = true;
    rfq.suppliers[supplierIndex].responseDate = new Date();
  }

  // Add quotation
  rfq.quotations.push({
    supplierId,
    submittedDate: new Date(),
    validUntil,
    items,
    totalAmount,
    paymentTerms,
    deliveryTerms,
    remarks
  });

  rfq.status = 'received';
  await rfq.save();

  res.json({
    success: true,
    message: 'Quotation submitted successfully',
    data: rfq
  });
});

// @desc    Evaluate and select winning quotation
// @route   POST /api/procurement/rfq/:id/evaluate
// @access  Private
exports.evaluateRFQ = asyncHandler(async (req, res) => {
  const { criteria, winnerId } = req.body;

  const rfq = await RFQ.findById(req.params.id);

  if (!rfq) {
    res.status(404);
    throw new Error('RFQ not found');
  }

  // Set evaluation criteria
  rfq.evaluation.criteria = criteria;
  rfq.evaluation.winner = winnerId;

  // Mark winning quotation
  rfq.quotations.forEach(q => {
    q.selected = q.supplierId.toString() === winnerId;
  });

  rfq.status = 'evaluated';
  await rfq.save();

  res.json({
    success: true,
    message: 'RFQ evaluated successfully',
    data: rfq
  });
});

// @desc    Create PO from RFQ
// @route   POST /api/procurement/rfq/:id/create-po
// @access  Private
exports.createPOFromRFQ = asyncHandler(async (req, res) => {
  const rfq = await RFQ.findById(req.params.id).populate('evaluation.winner');

  if (!rfq) {
    res.status(404);
    throw new Error('RFQ not found');
  }

  if (!rfq.evaluation.winner) {
    res.status(400);
    throw new Error('No winning quotation selected');
  }

  const winningQuotation = rfq.quotations.find(q => q.selected);

  if (!winningQuotation) {
    res.status(400);
    throw new Error('Winning quotation not found');
  }

  // Create Purchase Order
  const po = await PurchaseOrder.create({
    poNumber: `PO-RFQ-${Date.now()}`,
    supplierId: rfq.evaluation.winner,
    category: 'raw_material',
    expectedDeliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    items: winningQuotation.items.map(item => ({
      ...item,
      materialCode: item.materialCode,
      materialName: item.materialCode
    })),
    paymentTerms: winningQuotation.paymentTerms,
    deliveryTerms: winningQuotation.deliveryTerms,
    status: 'pending',
    createdBy: req.user.id
  });

  rfq.purchaseOrderId = po._id;
  rfq.status = 'awarded';
  await rfq.save();

  res.json({
    success: true,
    message: 'Purchase order created successfully',
    data: { rfq, po }
  });
});

// @desc    Update RFQ
// @route   PUT /api/procurement/rfq/:id
// @access  Private
exports.updateRFQ = asyncHandler(async (req, res) => {
  let rfq = await RFQ.findById(req.params.id);

  if (!rfq) {
    res.status(404);
    throw new Error('RFQ not found');
  }

  rfq = await RFQ.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.json({
    success: true,
    data: rfq
  });
});

// @desc    Delete RFQ
// @route   DELETE /api/procurement/rfq/:id
// @access  Private (Admin)
exports.deleteRFQ = asyncHandler(async (req, res) => {
  const rfq = await RFQ.findById(req.params.id);

  if (!rfq) {
    res.status(404);
    throw new Error('RFQ not found');
  }

  await rfq.deleteOne();

  res.json({
    success: true,
    message: 'RFQ deleted successfully'
  });
});
