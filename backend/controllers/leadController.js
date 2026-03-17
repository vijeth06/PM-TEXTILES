const Lead = require('../models/Lead');
const Quotation = require('../models/Quotation');
const Customer = require('../models/Customer');
const asyncHandler = require('express-async-handler');

// @desc    Create lead
// @route   POST /api/crm/leads
// @access  Private
exports.createLead = asyncHandler(async (req, res) => {
  const lead = await Lead.create({
    ...req.body,
    assignedTo: req.body.assignedTo || req.user.id
  });

  res.status(201).json({
    success: true,
    data: lead
  });
});

// @desc    Get all leads
// @route   GET /api/crm/leads
// @access  Private
exports.getLeads = asyncHandler(async (req, res) => {
  const { status, priority, assignedTo, source } = req.query;
  
  let query = {};
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (assignedTo) query.assignedTo = assignedTo;
  if (source) query.source = source;

  const leads = await Lead.find(query)
    .populate('assignedTo', 'username fullName email')
    .populate('customerId')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: leads.length,
    data: leads
  });
});

// @desc    Get single lead
// @route   GET /api/crm/leads/:id
// @access  Private
exports.getLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id)
    .populate('assignedTo')
    .populate('customerId')
    .populate('quotations.quotationId');

  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }

  res.json({
    success: true,
    data: lead
  });
});

// @desc    Update lead
// @route   PUT /api/crm/leads/:id
// @access  Private
exports.updateLead = asyncHandler(async (req, res) => {
  let lead = await Lead.findById(req.params.id);

  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }

  lead = await Lead.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.json({
    success: true,
    data: lead
  });
});

// @desc    Add follow-up to lead
// @route   POST /api/crm/leads/:id/followup
// @access  Private
exports.addFollowUp = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);

  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }

  lead.followUps.push({
    ...req.body,
    completedBy: req.user.id
  });

  await lead.save();

  res.json({
    success: true,
    data: lead
  });
});

// @desc    Create quotation from lead
// @route   POST /api/crm/leads/:id/quotation
// @access  Private
exports.createQuotationFromLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);

  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }

  const quotation = await Quotation.create({
    ...req.body,
    leadId: lead._id,
    customerName: lead.companyName,
    customerContact: {
      email: lead.contactPerson.email,
      phone: lead.contactPerson.phone
    },
    createdBy: req.user.id
  });

  // Add quotation reference to lead
  lead.quotations.push({
    quotationId: quotation._id,
    quotationNo: quotation.quotationNo,
    date: quotation.quotationDate,
    amount: quotation.totalAmount,
    status: quotation.status
  });

  lead.status = 'proposal_sent';
  await lead.save();

  res.status(201).json({
    success: true,
    data: quotation
  });
});

// @desc    Convert lead to customer
// @route   POST /api/crm/leads/:id/convert
// @access  Private
exports.convertToCustomer = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);

  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }

  if (lead.convertedToCustomer) {
    res.status(400);
    throw new Error('Lead already converted to customer');
  }

  // Create customer from lead
  const customerCount = await Customer.countDocuments();
  const customer = await Customer.create({
    code: `CUST-${String(customerCount + 1).padStart(5, '0')}`,
    name: lead.companyName,
    contactPerson: {
      name: lead.contactPerson.name,
      designation: lead.contactPerson.designation,
      email: lead.contactPerson.email,
      phone: lead.contactPerson.phone
    },
    address: lead.address,
    industry: lead.industry,
    status: 'active',
    source: lead.source
  });

  // Update lead
  lead.convertedToCustomer = true;
  lead.customerId = customer._id;
  lead.status = 'converted';
  lead.actualClosureDate = new Date();

  await lead.save();

  res.json({
    success: true,
    message: 'Lead converted to customer successfully',
    data: {
      lead,
      customer
    }
  });
});

// @desc    Mark lead as lost
// @route   PUT /api/crm/leads/:id/lost
// @access  Private
exports.markLeadAsLost = asyncHandler(async (req, res) => {
  const { lostReason } = req.body;

  const lead = await Lead.findById(req.params.id);

  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }

  lead.status = 'lost';
  lead.lostReason = lostReason;
  lead.actualClosureDate = new Date();

  await lead.save();

  res.json({
    success: true,
    data: lead
  });
});

// @desc    Get lead statistics
// @route   GET /api/crm/leads/stats
// @access  Private
exports.getLeadStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  let query = {};
  if (startDate && endDate) {
    query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const stats = await Lead.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$requirements.estimatedValue' }
      }
    }
  ]);

  const bySource = await Lead.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$source',
        count: { $sum: 1 }
      }
    }
  ]);

  const conversionRate = await Lead.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        converted: {
          $sum: { $cond: [{ $eq: ['$convertedToCustomer', true] }, 1, 0] }
        }
      }
    }
  ]);

  const totalLeads = conversionRate[0]?.total || 0;
  const convertedLeads = conversionRate[0]?.converted || 0;
  const rate = totalLeads > 0
    ? Number(((convertedLeads / totalLeads) * 100).toFixed(2))
    : 0;

  const byStatusMap = stats.reduce((acc, row) => {
    acc[row._id] = row.count;
    return acc;
  }, {});

  const activeLeads =
    (byStatusMap.new || 0) +
    (byStatusMap.contacted || 0) +
    (byStatusMap.qualified || 0) +
    (byStatusMap.proposal_sent || 0) +
    (byStatusMap.negotiation || 0);

  res.json({
    success: true,
    data: {
      totalLeads,
      convertedLeads,
      activeLeads,
      byStatus: stats,
      bySource,
      conversionRate: rate
    }
  });
});

// @desc    Delete lead
// @route   DELETE /api/crm/leads/:id
// @access  Private (Admin)
exports.deleteLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);

  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }

  await lead.deleteOne();

  res.json({
    success: true,
    message: 'Lead deleted successfully'
  });
});
