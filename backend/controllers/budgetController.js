const Budget = require('../models/Budget');
const AuditLog = require('../models/AuditLog');
const { NotFoundError, ValidationError } = require('../utils/errors');

// Get all budgets with filtering
const getBudgets = async (req, res) => {
  try {
    const { fiscalYear, department, status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (fiscalYear) query.fiscalYear = fiscalYear;
    if (department) query.department = department;
    if (status) query.status = status;

     const budgets = await Budget.find(query)
       .populate('createdBy', 'name email')
       .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Budget.countDocuments(query);

    res.json({
      success: true,
      data: budgets,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get single budget
const getBudget = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id).populate('createdBy', 'name email');
    if (!budget) throw new NotFoundError('Budget not found');
    res.json({ success: true, data: budget });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

// Create budget
const createBudget = async (req, res) => {
  try {
    const { name, departmentId, year, totalAllocated, allocations } = req.body;

    const { budgetCode, fiscalYear, period, startDate, endDate, department, category, allocations } = req.body;

    // Validate required fields
    if (!budgetCode || !fiscalYear || !period || !department || !category) {
      throw new ValidationError('All required fields must be provided');
    }

    // Check for duplicate budget code
    const existingBudget = await Budget.findOne({ budgetCode });
    if (existingBudget) {
      throw new ValidationError('Budget code already exists');
    }

    const budget = new Budget({
      budgetCode,
      fiscalYear,
      period,
      startDate,
      endDate,
      department,
      category,
      allocations: allocations || [],
      status: 'draft',
      createdBy: req.user._id,
      variance: { amount: 0, percentage: 0, type: 'neutral' }
    });

    await budget.save();

    // Log activity
    await AuditLog.create({
      userId: req.user._id,
      action: 'CREATE_BUDGET',
      entity: 'Budget',
      entityId: budget._id,
      changes: { budget }
    });

    res.status(201).json({ success: true, data: budget });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update budget
const updateBudget = async (req, res) => {
  try {
    const { totalAllocated, allocations, status } = req.body;
    const budget = await Budget.findById(req.params.id);

    if (!budget) throw new NotFoundError('Budget not found');

    const oldData = { ...budget.toObject() };

    // Update fields
    if (totalAllocated) budget.totalAllocated = totalAllocated;
    if (allocations) budget.allocations = allocations;
    if (status) budget.status = status;

    await budget.save();

    // Log activity
    await AuditLog.create({
      userId: req.user._id,
      action: 'UPDATE_BUDGET',
      entity: 'Budget',
      entityId: budget._id,
      changes: {
        before: oldData,
        after: budget.toObject()
      }
    });

    res.json({ success: true, data: budget });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete budget
const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findByIdAndDelete(req.params.id);
    if (!budget) throw new NotFoundError('Budget not found');

    // Log activity
    await AuditLog.create({
      userId: req.user._id,
      action: 'DELETE_BUDGET',
      entity: 'Budget',
      entityId: req.params.id,
      changes: { deleted: budget }
    });

    res.json({ success: true, message: 'Budget deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Add allocation to budget
const addAllocation = async (req, res) => {
  try {
    const { category, amount } = req.body;
    const budget = await Budget.findById(req.params.id);

    if (!budget) throw new NotFoundError('Budget not found');

    budget.allocations.push({ category, amount });
    await budget.save();

    res.json({ success: true, data: budget });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get budget analytics
const getBudgetAnalytics = async (req, res) => {
  try {
    const { year } = req.query;
    const query = year ? { year: parseInt(year) } : {};

    const budgets = await Budget.find(query).populate('createdBy', 'name');
    
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

    // Calculate average utilization
    if (budgets.length > 0) {
      const totalUtilization = budgets.reduce((sum, b) => {
        return sum + (b.totalAllocated > 0 ? (b.totalSpent / b.totalAllocated) * 100 : 0);
      }, 0);
      analytics.averageUtilization = Math.round(totalUtilization / budgets.length);
    }

    // Budgets by department
    budgets.forEach(budget => {
      analytics.budgetsByDepartment[budget.department] = (analytics.budgetsByDepartment[budget.department] || 0) + 1;
    });

    // Budgets by status
    budgets.forEach(budget => {
      analytics.budgetsByStatus[budget.status] = (analytics.budgetsByStatus[budget.status] || 0) + 1;
    });

    // Top spenders
    analytics.topSpenders = budgets
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5)
      .map(b => ({
        budgetCode: b.budgetCode,
        spent: b.totalSpent,
        allocated: b.totalAllocated,
        department: b.department
      }));

    // Allocation by costCenter
    budgets.forEach(budget => {
      budget.allocations.forEach(alloc => {
        const key = alloc.costCenter || 'Unassigned';
        if (!analytics.allocationByCategory[key]) {
          analytics.allocationByCategory[key] = 0;
        }
        analytics.allocationByCategory[key] += alloc.allocatedAmount;
      });
    });

    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Forecast budget utilization
const forecastBudgetUtilization = async (req, res) => {
  try {
    const { id, months } = req.body;
    const budget = await Budget.findById(id);

    if (!budget) throw new NotFoundError('Budget not found');

    const monthlySpend = budget.totalSpent / new Date().getMonth();
    const forecastedUtilization = (monthlySpend * (months || 12)) / budget.totalAllocated;

    res.json({
      success: true,
      data: {
        currentUtilization: (budget.totalSpent / budget.totalAllocated) * 100,
        forecastedUtilization: Math.min(forecastedUtilization * 100, 200),
        riskLevel: forecastedUtilization > 1 ? 'High' : forecastedUtilization > 0.8 ? 'Medium' : 'Low'
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
