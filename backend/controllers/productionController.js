const ProductionPlan = require('../models/ProductionPlan');
const ProductionStage = require('../models/ProductionStage');
const Machine = require('../models/Machine');
const { broadcastToAll, emitToRole } = require('../services/socketService');

// @desc    Get all production plans
// @route   GET /api/production/plans
// @access  Private
exports.getProductionPlans = async (req, res, next) => {
  try {
    const { status, priority, startDate, endDate, page = 1, limit = 20 } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    const plans = await ProductionPlan.find(query)
      .populate('orderIds', 'orderNo customerName')
      .populate('createdBy', 'fullName')
      .sort({ startDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await ProductionPlan.countDocuments(query);

    res.json({
      success: true,
      count: plans.length,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: plans
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single production plan
// @route   GET /api/production/plans/:id
// @access  Private
exports.getProductionPlan = async (req, res, next) => {
  try {
    const plan = await ProductionPlan.findById(req.params.id)
      .populate('orderIds')
      .populate('assignedMachines.machineId')
      .populate('createdBy', 'fullName')
      .populate('approvedBy', 'fullName');

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Production plan not found'
      });
    }

    // Get associated stages
    const stages = await ProductionStage.find({ planId: plan._id }).sort({ stageSequence: 1 });

    res.json({
      success: true,
      data: {
        ...plan.toObject(),
        stages
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create production plan
// @route   POST /api/production/plans
// @access  Private
exports.createProductionPlan = async (req, res, next) => {
  try {
    // Generate plan number
    const count = await ProductionPlan.countDocuments();
    const planNo = `PLAN-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const planData = {
      ...req.body,
      planNo,
      createdBy: req.user._id
    };

    const plan = await ProductionPlan.create(planData);

    // Create production stages
    if (req.body.stagesSequence && req.body.stagesSequence.length > 0) {
      const stages = req.body.stagesSequence.map((stage, index) => ({
        planId: plan._id,
        planNo: plan.planNo,
        stageName: stage.stageName,
        stageSequence: stage.sequence || index + 1,
        inputQuantity: index === 0 ? plan.productDetails.targetQuantity : 0,
        uom: plan.productDetails.uom,
        status: 'pending'
      }));

      await ProductionStage.insertMany(stages);
    }

    // Emit real-time event
    broadcastToAll('production_plan_created', {
      planNo: plan.planNo,
      productName: plan.productDetails?.productName,
      targetQuantity: plan.productDetails?.targetQuantity,
      priority: plan.priority,
      timestamp: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Production plan created successfully',
      data: plan
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update production plan
// @route   PUT /api/production/plans/:id
// @access  Private
exports.updateProductionPlan = async (req, res, next) => {
  try {
    let plan = await ProductionPlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Production plan not found'
      });
    }

    plan = await ProductionPlan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // Emit real-time event
    broadcastToAll('production_plan_updated', {
      planNo: plan.planNo,
      status: plan.status,
      completionPercent: plan.completionPercent,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Production plan updated successfully',
      data: plan
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete production plan
// @route   DELETE /api/production/plans/:id
// @access  Private (Admin/Production Manager)
exports.deleteProductionPlan = async (req, res, next) => {
  try {
    const plan = await ProductionPlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Production plan not found'
      });
    }

    // Check if plan can be deleted
    if (plan.status === 'in_progress' || plan.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a plan that is in progress or completed'
      });
    }

    await plan.remove();
    await ProductionStage.deleteMany({ planId: plan._id });

    res.json({
      success: true,
      message: 'Production plan deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get production stages for a plan
// @route   GET /api/production/stages/:planId
// @access  Private
exports.getProductionStages = async (req, res, next) => {
  try {
    const stages = await ProductionStage.find({ planId: req.params.planId })
      .populate('machineId')
      .sort({ stageSequence: 1 });

    res.json({
      success: true,
      count: stages.length,
      data: stages
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update production stage
// @route   PUT /api/production/stages/:id
// @access  Private
exports.updateProductionStage = async (req, res, next) => {
  try {
    let stage = await ProductionStage.findById(req.params.id);

    if (!stage) {
      return res.status(404).json({
        success: false,
        message: 'Production stage not found'
      });
    }

    stage = await ProductionStage.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // Update plan completion percentage
    const allStages = await ProductionStage.find({ planId: stage.planId });
    const completedStages = allStages.filter(s => s.status === 'completed').length;
    const completionPercent = (completedStages / allStages.length) * 100;

    await ProductionPlan.findByIdAndUpdate(stage.planId, {
      completionPercent,
      ...(completionPercent === 100 && { status: 'completed', actualEndDate: new Date() })
    });

    // Emit real-time events
    broadcastToAll('production_stage_updated', {
      planNo: stage.planNo,
      stageName: stage.stageName,
      status: stage.status,
      completionPercent: stage.completionPercent,
      timestamp: new Date()
    });

    // Notify production team
    emitToRole('production_manager', 'stage_progress', {
      planNo: stage.planNo,
      stageName: stage.stageName,
      completionPercent,
      overallCompletion: completionPercent
    });

    res.json({
      success: true,
      message: 'Production stage updated successfully',
      data: stage
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all machines
// @route   GET /api/production/machines
// @access  Private
exports.getMachines = async (req, res, next) => {
  try {
    const { type, status } = req.query;

    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;

    const machines = await Machine.find(query).sort({ code: 1 });

    res.json({
      success: true,
      count: machines.length,
      data: machines
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get machine utilization
// @route   GET /api/production/machines/:id/utilization
// @access  Private
exports.getMachineUtilization = async (req, res, next) => {
  try {
    const machine = await Machine.findById(req.params.id);

    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Machine not found'
      });
    }

    // Get production stages for this machine
    const stages = await ProductionStage.find({
      machineId: machine._id,
      actualStartTime: { $exists: true }
    }).sort({ actualStartTime: -1 });

    res.json({
      success: true,
      data: {
        machine,
        recentUsage: stages.slice(0, 10),
        metrics: machine.utilizationMetrics
      }
    });
  } catch (error) {
    next(error);
  }
};
