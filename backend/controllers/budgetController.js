const Budget = require('../models/Budget');
const AuditLog = require('../models/AuditLog');
const { NotFoundError, ValidationError } = require('../utils/errors');

const getBudgets = async (req, res) => {
  try {
    const { fiscalYear, department, status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (fiscalYear) query.fiscalYear = fiscalYear;
    if (department) query.department = department;
    if (status) query.status = status;

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const budgets = await Budget.find(query)
      .populate('createdBy', 'username fullName email')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await Budget.countDocuments(query);

    res.json({
      success: true,
      data: budgets,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getBudget = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id).populate('createdBy', 'username fullName email');
    if (!budget) throw new NotFoundError('Budget not found');
    res.json({ success: true, data: budget });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

const createBudget = async (req, res) => {
  try {
    const { budgetCode, fiscalYear, period, startDate, endDate, department, category, allocations, notes } = req.body;

    if (!budgetCode || !fiscalYear || !period || !department || !category) {
      throw new ValidationError('budgetCode, fiscalYear, period, department and category are required');
    }

    const existingBudget = await Budget.findOne({ budgetCode: String(budgetCode).toUpperCase().trim() });
    if (existingBudget) {
      throw new ValidationError('Budget code already exists');
    }

    const budget = new Budget({
      budgetCode: String(budgetCode).toUpperCase().trim(),
      fiscalYear,
      period,
      startDate,
      endDate,
      department,
      category,
      allocations: allocations || [],
      notes,
      status: 'draft',
      createdBy: req.user._id,
      variance: { amount: 0, percentage: 0, type: 'neutral' }
    });

    await budget.save();

    await AuditLog.create({
      userId: req.user._id,
      action: 'CREATE_BUDGET',
      entity: 'Budget',
      entityId: budget._id,
      changes: { after: budget.toObject() }
    });

    res.status(201).json({ success: true, data: budget });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateBudget = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);
    if (!budget) throw new NotFoundError('Budget not found');

    const oldData = budget.toObject();

    const updatableFields = [
      'fiscalYear',
      'period',
      'startDate',
      'endDate',
      'department',
      'category',
      'allocations',
      'status',
      'notes',
      'approvalWorkflow',
      'evaluation'
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        budget[field] = req.body[field];
      }
    });

    await budget.save();

    await AuditLog.create({
      userId: req.user._id,
      action: 'UPDATE_BUDGET',
      entity: 'Budget',
      entityId: budget._id,
      changes: { before: oldData, after: budget.toObject() }
    });

    res.json({ success: true, data: budget });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findByIdAndDelete(req.params.id);
    if (!budget) throw new NotFoundError('Budget not found');

    await AuditLog.create({
      userId: req.user._id,
      action: 'DELETE_BUDGET',
      entity: 'Budget',
      entityId: req.params.id,
      changes: { deleted: budget.toObject() }
    });

    res.json({ success: true, message: 'Budget deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const addAllocation = async (req, res) => {
  try {
    const { costCenter, description, allocatedAmount, spentAmount = 0, uom } = req.body;
    const budget = await Budget.findById(req.params.id);

    if (!budget) throw new NotFoundError('Budget not found');
    if (!allocatedAmount || allocatedAmount <= 0) {
      throw new ValidationError('allocatedAmount must be greater than 0');
    }

    budget.allocations.push({
      costCenter,
      description,
      allocatedAmount,
      spentAmount,
      uom
    });

    await budget.save();

    res.json({ success: true, data: budget });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getBudgetAnalytics = async (req, res) => {
  try {
    const { fiscalYear } = req.query;
    const query = fiscalYear ? { fiscalYear } : {};

    const budgets = await Budget.find(query).populate('createdBy', 'username fullName');

    const analytics = {
      totalBudgets: budgets.length,
      totalAllocated: budgets.reduce((sum, b) => sum + (b.totalAllocated || 0), 0),
      totalSpent: budgets.reduce((sum, b) => sum + (b.totalSpent || 0), 0),
      averageUtilization: 0,
      budgetsByDepartment: {},
      budgetsByStatus: {},
      topSpenders: [],
      allocationByCategory: {}
    };

    if (budgets.length > 0) {
      const totalUtilization = budgets.reduce((sum, b) => {
        return sum + (b.totalAllocated > 0 ? (b.totalSpent / b.totalAllocated) * 100 : 0);
      }, 0);
      analytics.averageUtilization = Math.round(totalUtilization / budgets.length);
    }

    budgets.forEach((budget) => {
      analytics.budgetsByDepartment[budget.department] = (analytics.budgetsByDepartment[budget.department] || 0) + 1;
      analytics.budgetsByStatus[budget.status] = (analytics.budgetsByStatus[budget.status] || 0) + 1;

      (budget.allocations || []).forEach((alloc) => {
        const key = alloc.costCenter || 'Unassigned';
        if (!analytics.allocationByCategory[key]) analytics.allocationByCategory[key] = 0;
        analytics.allocationByCategory[key] += Number(alloc.allocatedAmount || 0);
      });
    });

    analytics.topSpenders = [...budgets]
      .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
      .slice(0, 5)
      .map((b) => ({
        budgetCode: b.budgetCode,
        spent: b.totalSpent,
        allocated: b.totalAllocated,
        department: b.department
      }));

    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const forecastBudgetUtilization = async (req, res) => {
  try {
    const budgetId = req.params.id || req.body.id;
    const { months = 12 } = req.body;
    const budget = await Budget.findById(budgetId);

    if (!budget) throw new NotFoundError('Budget not found');

    const monthIndex = new Date().getMonth() + 1;
    const monthlySpend = monthIndex > 0 ? (budget.totalSpent || 0) / monthIndex : 0;
    const projectedSpend = monthlySpend * Number(months);
    const forecastedUtilizationRatio = budget.totalAllocated > 0 ? projectedSpend / budget.totalAllocated : 0;

    res.json({
      success: true,
      data: {
        currentUtilization: budget.totalAllocated > 0 ? ((budget.totalSpent / budget.totalAllocated) * 100) : 0,
        forecastedUtilization: Math.min(forecastedUtilizationRatio * 100, 200),
        riskLevel: forecastedUtilizationRatio > 1 ? 'High' : forecastedUtilizationRatio > 0.8 ? 'Medium' : 'Low'
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
  addAllocation,
  getBudgetAnalytics,
  forecastBudgetUtilization
};
