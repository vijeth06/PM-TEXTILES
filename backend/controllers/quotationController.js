const Quotation = require('../models/Quotation');
const Lead = require('../models/Lead');
const Order = require('../models/Order');
const { sendEmail } = require('../services/emailService');
const asyncHandler = require('express-async-handler');

// @desc    Create quotation
// @route   POST /api/sales/quotations
// @access  Private
exports.createQuotation = asyncHandler(async (req, res) => {
  const quotation = await Quotation.create({
    ...req.body,
    quotationNo: 'QUOT-NEW-' + Date.now(),
    createdBy: req.user.id
  });

  res.status(201).json({
    success: true,
    data: quotation
  });
});

// @desc    Get all quotations
// @route   GET /api/sales/quotations
// @access  Private
exports.getQuotations = asyncHandler(async (req, res) => {
  const { status, customerId, leadId } = req.query;
  
  let query = {};
  if (status) query.status = status;
  if (customerId) query.customerId = customerId;
  if (leadId) query.leadId = leadId;

  const quotations = await Quotation.find(query)
    .populate('leadId')
    .populate('customerId')
    .populate('createdBy', 'username fullName')
    .sort({ quotationDate: -1 });

  res.json({
    success: true,
    count: quotations.length,
    data: quotations
  });
});

// @desc    Get single quotation
// @route   GET /api/sales/quotations/:id
// @access  Private
exports.getQuotation = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id)
    .populate('leadId')
    .populate('customerId')
    .populate('createdBy')
    .populate('approvedBy');

  if (!quotation) {
    res.status(404);
    throw new Error('Quotation not found');
  }

  res.json({
    success: true,
    data: quotation
  });
});

// @desc    Send quotation to customer
// @route   POST /api/sales/quotations/:id/send
// @access  Private
exports.sendQuotation = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id);

  if (!quotation) {
    res.status(404);
    throw new Error('Quotation not found');
  }

  quotation.status = 'sent';
  quotation.sentDate = new Date();

  // Send email to customer
  try {
    await sendEmail({
      to: quotation.customerContact.email,
      subject: `Quotation ${quotation.quotationNo} from PM Textiles`,
      text: `Dear ${quotation.customerName},\n\nPlease find attached our quotation.\n\nTotal Amount: ₹${quotation.totalAmount}\nValid Until: ${quotation.validUntil}`
    });
  } catch (error) {
    console.error('Failed to send quotation email:', error);
  }

  await quotation.save();

  res.json({
    success: true,
    message: 'Quotation sent successfully',
    data: quotation
  });
});

// @desc    Accept quotation
// @route   PUT /api/sales/quotations/:id/accept
// @access  Private
exports.acceptQuotation = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id);

  if (!quotation) {
    res.status(404);
    throw new Error('Quotation not found');
  }

  quotation.status = 'accepted';
  quotation.acceptedDate = new Date();

  await quotation.save();

  res.json({
    success: true,
    data: quotation
  });
});

// @desc    Create order from quotation
// @route   POST /api/sales/quotations/:id/create-order
// @access  Private
exports.createOrderFromQuotation = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id).populate('customerId');

  if (!quotation) {
    res.status(404);
    throw new Error('Quotation not found');
  }

  if (quotation.status !== 'accepted') {
    res.status(400);
    throw new Error('Quotation must be accepted before creating order');
  }

  // Create order
  const orderCount = await Order.countDocuments();
  const order = await Order.create({
    orderNo: `ORD-${Date.now()}-${String(orderCount + 1).padStart(4, '0')}`,
    customerId: quotation.customerId,
    customerCode: quotation.customerId?.code,
    customerName: quotation.customerName,
    promiseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    items: quotation.items.map(item => ({
      productCode: item.productCode,
      productName: item.productName,
      quantity: item.quantity,
      uom: item.uom,
      unitPrice: item.unitPrice,
      discount: item.discount,
      tax: item.tax,
      totalPrice: item.totalPrice
    })),
    totalQuantity: quotation.items.reduce((sum, item) => sum + item.quantity, 0),
    totalValue: quotation.totalAmount,
    paymentTerms: quotation.paymentTerms,
    status: 'pending',
    createdBy: req.user.id
  });

  quotation.status = 'converted';
  quotation.orderId = order._id;
  await quotation.save();

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: order
  });
});

// @desc    Update quotation
// @route   PUT /api/sales/quotations/:id
// @access  Private
exports.updateQuotation = asyncHandler(async (req, res) => {
  let quotation = await Quotation.findById(req.params.id);

  if (!quotation) {
    res.status(404);
    throw new Error('Quotation not found');
  }

  quotation = await Quotation.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.json({
    success: true,
    data: quotation
  });
});

// @desc    Create revision of quotation
// @route   POST /api/sales/quotations/:id/revise
// @access  Private
exports.reviseQuotation = asyncHandler(async (req, res) => {
  const originalQuotation = await Quotation.findById(req.params.id);

  if (!originalQuotation) {
    res.status(404);
    throw new Error('Quotation not found');
  }

  const revisedQuotation = await Quotation.create({
    ...originalQuotation.toObject(),
    _id: undefined,
    quotationNo: 'QUOT-NEW-' + Date.now(),
    quotationDate: new Date(),
    revisionOf: originalQuotation._id,
    revisionNumber: originalQuotation.revisionNumber + 1,
    status: 'draft',
    ...req.body,
    createdBy: req.user.id
  });

  res.status(201).json({
    success: true,
    data: revisedQuotation
  });
});

// @desc    Delete quotation
// @route   DELETE /api/sales/quotations/:id
// @access  Private (Admin)
exports.deleteQuotation = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id);

  if (!quotation) {
    res.status(404);
    throw new Error('Quotation not found');
  }

  await quotation.deleteOne();

  res.json({
    success: true,
    message:'Quotation deleted successfully'
  });
});
