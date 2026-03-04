const Dyeing = require('../models/Dyeing');
const Fabric = require('../models/Fabric');
const Yarn = require('../models/Yarn');
const Employee = require('../models/Employee');

// Get all dyeing batches
exports.getAllDyeingBatches = async (req, res) => {
  try {
    const { startDate, endDate, status, dyeingType, colorCode } = req.query;
    const filter = {};

    if (startDate && endDate) {
      filter.dyeingDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (status) filter.status = status;
    if (dyeingType) filter.dyeingType = dyeingType;
    if (colorCode) filter['color.colorCode'] = colorCode;

    const batches = await Dyeing.find(filter)
      .populate('material.materialId')
      .populate('process.machine')
      .populate('shadeMatching.matchedBy', 'name')
      .populate('shadeMatching.approvedBy', 'name')
      .sort({ dyeingDate: -1 });

    res.json(batches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get dyeing batch by ID
exports.getDyeingBatchById = async (req, res) => {
  try {
    const batch = await Dyeing.findById(req.params.id)
      .populate('material.materialId')
      .populate('process.machine')
      .populate('shadeMatching.matchedBy')
      .populate('shadeMatching.approvedBy')
      .populate('qualityCheck.inspector');

    if (!batch) {
      return res.status(404).json({ message: 'Dyeing batch not found' });
    }

    res.json(batch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create dyeing batch
exports.createDyeingBatch = async (req, res) => {
  try {
    const batch = new Dyeing(req.body);
    await batch.save();

    res.status(201).json(batch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update dyeing batch
exports.updateDyeingBatch = async (req, res) => {
  try {
    const batch = await Dyeing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!batch) {
      return res.status(404).json({ message: 'Dyeing batch not found' });
    }

    res.json(batch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete dyeing batch
exports.deleteDyeingBatch = async (req, res) => {
  try {
    const batch = await Dyeing.findByIdAndDelete(req.params.id);

    if (!batch) {
      return res.status(404).json({ message: 'Dyeing batch not found' });
    }

    res.json({ message: 'Dyeing batch deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Submit shade for matching
exports.submitShadeMatching = async (req, res) => {
  try {
    const { id } = req.params;
    const { labSubmission, matchedBy } = req.body;

    const batch = await Dyeing.findById(id);
    if (!batch) {
      return res.status(404).json({ message: 'Dyeing batch not found' });
    }

    // Calculate Delta E
    const deltaE = calculateDeltaE(batch.color.labValues, labSubmission);

    batch.shadeMatching = {
      standardSample: batch.color.shadeReference,
      labSubmission,
      deltaE,
      status: deltaE <= 1.0 ? 'ok' : deltaE <= 1.5 ? 'additions_required' : 'redip',
      matchedBy
    };

    // Update batch status based on Delta E
    if (deltaE <= 1.0) {
      batch.status = 'quality_check';
    } else {
      batch.status = 'shade_checking';
    }

    await batch.save();

    res.json(batch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Calculate Delta E (CIE76 formula - simplified)
function calculateDeltaE(lab1, lab2) {
  const dL = lab2.l - lab1.l;
  const da = lab2.a - lab1.a;
  const db = lab2.b - lab1.b;
  return Math.sqrt(dL * dL + da * da + db * db);
}

// Approve shade matching
exports.approveShadeMatching = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedBy, comments } = req.body;

    const batch = await Dyeing.findById(id);
    if (!batch) {
      return res.status(404).json({ message: 'Dyeing batch not found' });
    }

    batch.shadeMatching.status = 'ok';
    batch.shadeMatching.approvedBy = approvedBy;
    batch.status = 'quality_check';
    batch.remarks = comments;

    await batch.save();

    res.json(batch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Reject shade and request redip
exports.rejectShadeMatching = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const batch = await Dyeing.findById(id);
    if (!batch) {
      return res.status(404).json({ message: 'Dyeing batch not found' });
    }

    batch.shadeMatching.status = 'redip';
    batch.status = 'redip';
    batch.remarks = reason;

    await batch.save();

    res.json(batch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Record quality check
exports.recordQualityCheck = async (req, res) => {
  try {
    const { id } = req.params;
    const qualityCheckData = req.body;

    const batch = await Dyeing.findById(id);
    if (!batch) {
      return res.status(404).json({ message: 'Dyeing batch not found' });
    }

    batch.qualityCheck = qualityCheckData;
    
    if (qualityCheckData.overallResult === 'passed') {
      batch.status = 'approved';
    } else if (qualityCheckData.overallResult === 'failed') {
      batch.status = 'rejected';
    }

    await batch.save();

    res.json(batch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get dyeing statistics
exports.getDyeingStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};

    if (startDate && endDate) {
      dateFilter.dyeingDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else {
      // Default to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter.dyeingDate = { $gte: thirtyDaysAgo };
    }

    const batches = await Dyeing.find(dateFilter);

    // Calculate statistics
    const totalBatches = batches.length;
    const approvedBatches = batches.filter(b => b.status === 'approved').length;
    const redipBatches = batches.filter(b => b.status === 'redip').length;
    const avgDeltaE = batches
      .filter(b => b.shadeMatching && b.shadeMatching.deltaE)
      .reduce((sum, b) => sum + b.shadeMatching.deltaE, 0) / totalBatches || 0;

    // Color-wise analysis
    const colorStats = batches.reduce((acc, b) => {
      const color = b.color.colorCode;
      if (!acc[color]) {
        acc[color] = { total: 0, approved: 0, redip: 0 };
      }
      acc[color].total += 1;
      if (b.status === 'approved') acc[color].approved += 1;
      if (b.status === 'redip') acc[color].redip += 1;
      return acc;
    }, {});

    // Cost analysis
    const totalCost = batches.reduce((sum, b) => sum + (b.cost.total || 0), 0);
    const avgCostPerBatch = totalCost / totalBatches || 0;

    res.json({
      summary: {
        totalBatches,
        approvedBatches,
        redipBatches,
        successRate: ((approvedBatches / totalBatches) * 100).toFixed(2),
        avgDeltaE: avgDeltaE.toFixed(2),
        totalCost,
        avgCostPerBatch: avgCostPerBatch.toFixed(2)
      },
      colorStats,
      batches: batches.slice(0, 10) // Return latest 10 batches
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get shade matching queue
exports.getShadeMatchingQueue = async (req, res) => {
  try {
    const pendingBatches = await Dyeing.find({
      status: { $in: ['shade_checking', 'in_progress'] }
    }).populate('material.materialId', 'name')
      .populate('shadeMatching.matchedBy', 'name')
      .sort({ dyeingDate: 1 });

    res.json(pendingBatches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = exports;
