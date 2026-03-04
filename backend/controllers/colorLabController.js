const ColorLab = require('../models/ColorLab');
const Customer = require('../models/Customer');
const Employee = require('../models/Employee');

// Get all color lab requests
exports.getAllColorLabRequests = async (req, res) => {
  try {
    const { status, priority, customerId, startDate, endDate } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (customerId) filter['customer.customerId'] = customerId;
    if (startDate && endDate) {
      filter.requestDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const requests = await ColorLab.find(filter)
      .populate('customer.customerId', 'name contactPerson')
      .populate('approvedShade.approvedBy.employeeId', 'name')
      .sort({ requestDate: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get color lab request by ID
exports.getColorLabRequestById = async (req, res) => {
  try {
    const request = await ColorLab.findById(req.params.id)
      .populate('customer.customerId')
      .populate('submittedShades.colorist.employeeId')
      .populate('approvedShade.approvedBy.employeeId');

    if (!request) {
      return res.status(404).json({ message: 'Color lab request not found' });
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create color lab request
exports.createColorLabRequest = async (req, res) => {
  try {
    const request = new ColorLab(req.body);
    await request.save();

    res.status(201).json(request);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update color lab request
exports.updateColorLabRequest = async (req, res) => {
  try {
    const request = await ColorLab.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!request) {
      return res.status(404).json({ message: 'Color lab request not found' });
    }

    res.json(request);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete color lab request
exports.deleteColorLabRequest = async (req, res) => {
  try {
    const request = await ColorLab.findByIdAndDelete(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Color lab request not found' });
    }

    res.json({ message: 'Color lab request deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Submit shade for evaluation
exports.submitShade = async (req, res) => {
  try {
    const { id } = req.params;
    const { recipe, labMeasurement, colorist, remarks } = req.body;

    const request = await ColorLab.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Color lab request not found' });
    }

    // Calculate Delta E using the model method
    const deltaE = request.calculateDeltaE2000(
      request.standardShade.labValues,
      labMeasurement
    );

    // Determine visual assessment based on Delta E
    let visualAssessment = {
      overallMatch: 'poor',
      lighter_darker: determineShadeDirection(request.standardShade.labValues.L, labMeasurement.L, 'lightness'),
      redder_greener: determineShadeDirection(request.standardShade.labValues.a, labMeasurement.a, 'a'),
      yellower_bluer: determineShadeDirection(request.standardShade.labValues.b, labMeasurement.b, 'b')
    };

    if (deltaE.dE2000 <= 0.5) visualAssessment.overallMatch = 'excellent';
    else if (deltaE.dE2000 <= 1.0) visualAssessment.overallMatch = 'good';
    else if (deltaE.dE2000 <= 1.5) visualAssessment.overallMatch = 'acceptable';
    else if (deltaE.dE2000 <= 2.0) visualAssessment.overallMatch = 'poor';
    else visualAssessment.overallMatch = 'unacceptable';

    const submissionNumber = request.submittedShades.length + 1;

    request.submittedShades.push({
      submissionNumber,
      submissionDate: new Date(),
      recipe,
      labMeasurement,
      deltaE,
      visualAssessment,
      status: deltaE.dE2000 <= request.matchingCriteria.maxDeltaE ? 'submitted' : 'corrections_required',
      colorist,
      remarks
    });

    request.status = 'in_progress';

    await request.save();

    res.json(request);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Helper function to determine shade direction
function determineShadeDirection(standard, submitted, type) {
  const diff = submitted - standard;
  const threshold = 2; // Delta threshold

  if (type === 'lightness') {
    if (diff < -threshold * 2) return 'much_lighter';
    if (diff < -threshold) return 'lighter';
    if (diff > threshold * 2) return 'much_darker';
    if (diff > threshold) return 'darker';
    return 'match';
  } else if (type === 'a') {
    if (diff < -threshold * 2) return 'much_greener';
    if (diff < -threshold) return 'greener';
    if (diff > threshold * 2) return 'much_redder';
    if (diff > threshold) return 'redder';
    return 'match';
  } else if (type === 'b') {
    if (diff < -threshold * 2) return 'much_bluer';
    if (diff < -threshold) return 'bluer';
    if (diff > threshold * 2) return 'much_yellower';
    if (diff > threshold) return 'yellower';
    return 'match';
  }
  return 'match';
}

// Approve shade
exports.approveShade = async (req, res) => {
  try {
    const { id } = req.params;
    const { submissionNumber, approvedBy, comments } = req.body;

    const request = await ColorLab.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Color lab request not found' });
    }

    const shade = request.submittedShades.find(s => s.submissionNumber === submissionNumber);
    if (!shade) {
      return res.status(404).json({ message: 'Submitted shade not found' });
    }

    shade.status = 'approved';

    request.approvedShade = {
      submissionNumber,
      approvalDate: new Date(),
      approvedBy: {
        employeeId: approvedBy,
        name: (await Employee.findById(approvedBy))?.name
      },
      finalDeltaE: shade.deltaE.dE2000,
      commercialApproval: true
    };

    request.status = 'approved';
    request.remarks = comments;

    await request.save();

    res.json(request);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Reject shade
exports.rejectShade = async (req, res) => {
  try {
    const { id } = req.params;
    const { submissionNumber, reason } = req.body;

    const request = await ColorLab.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Color lab request not found' });
    }

    const shade = request.submittedShades.find(s => s.submissionNumber === submissionNumber);
    if (!shade) {
      return res.status(404).json({ message: 'Submitted shade not found' });
    }

    shade.status = 'rejected';
    shade.remarks = reason;

    await request.save();

    res.json(request);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get shade matching queue
exports.getShadeMatchingQueue = async (req, res) => {
  try {
    const queue = await ColorLab.find({
      status: { $in: ['pending', 'in_progress'] }
    }).populate('customer.customerId', 'name')
      .sort({ priority: -1, requestDate: 1 });

    // Prioritize: urgent -> high -> medium -> low
    const priorityOrder = { urgent: 1, high: 2, medium: 3, low: 4 };
    queue.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    res.json(queue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get color lab statistics
exports.getColorLabStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};

    if (startDate && endDate) {
      dateFilter.requestDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter.requestDate = { $gte: thirtyDaysAgo };
    }

    const requests = await ColorLab.find(dateFilter);

    const totalRequests = requests.length;
    const approvedRequests = requests.filter(r => r.status === 'approved').length;
    const avgAttempts = requests.reduce((sum, r) => sum + r.attempts, 0) / totalRequests || 0;
    const avgDeltaE = requests.reduce((sum, r) => sum + (r.averageDeltaE || 0), 0) / totalRequests || 0;

    // First-time approval rate
    const firstTimeApprovals = requests.filter(r => r.attempts === 1 && r.status === 'approved').length;
    const firstTimeApprovalRate = (firstTimeApprovals / totalRequests) * 100 || 0;

    // Customer-wise statistics
    const customerStats = requests.reduce((acc, r) => {
      const customer = r.customer.customerName;
      if (!acc[customer]) {
        acc[customer] = { total: 0, approved: 0, avgAttempts: 0 };
      }
      acc[customer].total += 1;
      if (r.status === 'approved') acc[customer].approved += 1;
      acc[customer].avgAttempts += r.attempts;
      return acc;
    }, {});

    Object.keys(customerStats).forEach(customer => {
      customerStats[customer].avgAttempts /= customerStats[customer].total;
    });

    res.json({
      summary: {
        totalRequests,
        approvedRequests,
        successRate: ((approvedRequests / totalRequests) * 100).toFixed(2),
        avgAttempts: avgAttempts.toFixed(1),
        avgDeltaE: avgDeltaE.toFixed(2),
        firstTimeApprovalRate: firstTimeApprovalRate.toFixed(2)
      },
      customerStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Record bulk production
exports.recordBulkProduction = async (req, res) => {
  try {
    const { id } = req.params;
    const { dyeingBatchNumber, productionDate, quantity, shadeConsistency } = req.body;

    const request = await ColorLab.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Color lab request not found' });
    }

    if (request.status !== 'approved') {
      return res.status(400).json({ message: 'Shade must be approved before bulk production' });
    }

    request.bulkProduction = {
      dyeingBatchNumber,
      productionDate,
      quantity,
      shadeConsistency
    };

    await request.save();

    res.json(request);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = exports;
