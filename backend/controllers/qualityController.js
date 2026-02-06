const QualityCheck = require('../models/QualityCheck');
const Batch = require('../models/Batch');
const { broadcastToAll, emitToRole } = require('../services/socketService');

// Get all quality checks
exports.getQualityChecks = async (req, res) => {
  try {
    const { type, result, startDate, endDate } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (result) filter.result = result;
    if (startDate || endDate) {
      filter.checkDate = {};
      if (startDate) filter.checkDate.$gte = new Date(startDate);
      if (endDate) filter.checkDate.$lte = new Date(endDate);
    }

    const checks = await QualityCheck.find(filter)
      .populate('batch')
      .populate('product')
      .populate('checkedBy', 'name email')
      .sort({ checkDate: -1 });

    res.json({ success: true, data: checks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single quality check
exports.getQualityCheck = async (req, res) => {
  try {
    const check = await QualityCheck.findById(req.params.id)
      .populate('batch')
      .populate('product')
      .populate('checkedBy', 'name email');

    if (!check) {
      return res.status(404).json({ success: false, message: 'Quality check not found' });
    }

    res.json({ success: true, data: check });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create quality check
exports.createQualityCheck = async (req, res) => {
  try {
    const { type, batch, product, parameters, result, defects, notes, images, actionTaken } = req.body;

    const check = new QualityCheck({
      type,
      batch,
      product,
      parameters,
      result,
      defects,
      notes,
      images,
      actionTaken,
      checkedBy: req.user._id
    });

    await check.save();

    // Update batch status if applicable
    if (batch) {
      const batchDoc = await Batch.findById(batch);
      if (batchDoc) {
        batchDoc.status = result === 'passed' ? 'approved' : result === 'failed' ? 'rejected' : 'quality_check';
        batchDoc.qualityCheck = {
          passed: result === 'passed',
          checkedBy: req.user._id,
          checkDate: new Date(),
          notes
        };
        await batchDoc.save();
      }
    }
    // Emit real-time events
    broadcastToAll('quality_check_created', {
      type,
      result,
      batchId: batch,
      timestamp: new Date()
    });

    // Notify QA team if failed
    if (result === 'failed') {
      emitToRole('qa_inspector', 'quality_check_failed', {
        type,
        batchId: batch,
        defects,
        timestamp: new Date()
      });
    }
    // Emit real-time events
    broadcastToAll('quality_check_created', {
      type,
      result,
      batchId: batch,
      timestamp: new Date()
    });

    // Notify QA team if failed
    if (result === 'failed') {
      emitToRole('qa_inspector', 'quality_check_failed', {
        type,
        batchId: batch,
        defects,
        timestamp: new Date()
      });
    }

    res.status(201).json({ success: true, data: check });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update quality check
exports.updateQualityCheck = async (req, res) => {
  try {
    const check = await QualityCheck.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!check) {
      return res.status(404).json({ success: false, message: 'Quality check not found' });
    }

    // Emit real-time event
    broadcastToAll('quality_check_updated', {
      checkId: check._id,
      result: check.result,
      timestamp: new Date()
    });

    res.json({ success: true, data: check });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get quality statistics
exports.getQualityStatistics = async (req, res) => {
  try {
    const stats = await QualityCheck.aggregate([
      {
        $group: {
          _id: '$result',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalChecks = await QualityCheck.countDocuments();
    const passRate = stats.find(s => s._id === 'passed')?.count || 0;

    res.json({
      success: true,
      data: {
        totalChecks,
        passRate: totalChecks > 0 ? ((passRate / totalChecks) * 100).toFixed(2) : 0,
        breakdown: stats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = exports;
