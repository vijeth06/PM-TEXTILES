const mongoose = require('mongoose');

// Model for Budget & Forecasting
const budgetSchema = new mongoose.Schema({
  budgetCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  fiscalYear: {
    type: String,
    required: true
  },
  period: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  department: {
    type: String,
    enum: ['production', 'quality', 'inventory', 'sales', 'maintenance', 'hr', 'admin', 'overall'],
    required: true
  },
  category: {
    type: String,
    enum: ['operational', 'capital', 'project'],
    required: true
  },
  allocations: [{
    costCenter: String,
    description: String,
    allocatedAmount: {
      type: Number,
      required: true,
      min: 0
    },
    spentAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    remainingAmount: {
      type: Number,
      default: 0
    },
    utilizationPercentage: {
      type: Number,
      default: 0
    }
  }],
  totalAllocated: {
    type: Number,
    required: true,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  totalRemaining: {
    type: Number,
    default: 0
  },
  overallUtilization: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'proposed', 'approved', 'active', 'closed', 'revised'],
    default: 'draft'
  },
  approvalWorkflow: [{
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    level: Number,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected']
    },
    date: Date,
    comments: String
  }],
  variance: {
    amount: Number,
    percentage: Number,
    type: {
      type: String,
      enum: ['favorable', 'unfavorable', 'neutral']
    }
  },
  expenses: [{
    date: Date,
    costCenter: String,
    description: String,
    amount: Number,
    referenceType: String,
    referenceId: mongoose.Schema.Types.ObjectId,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Calculate totals and utilization
budgetSchema.pre('save', function(next) {
  let totalAllocated = 0;
  let totalSpent = 0;

  this.allocations.forEach(allocation => {
    totalAllocated += allocation.allocatedAmount;
    totalSpent += allocation.spentAmount;
    allocation.remainingAmount = allocation.allocatedAmount - allocation.spentAmount;
    allocation.utilizationPercentage = allocation.allocatedAmount > 0 
      ? ((allocation.spentAmount / allocation.allocatedAmount) * 100).toFixed(2)
      : 0;
  });

  this.totalAllocated = totalAllocated;
  this.totalSpent = totalSpent;
  this.totalRemaining = totalAllocated - totalSpent;
  this.overallUtilization = totalAllocated > 0 
    ? ((totalSpent / totalAllocated) * 100).toFixed(2)
    : 0;

  // Calculate variance
  this.variance.amount = this.totalAllocated - this.totalSpent;
  this.variance.percentage = this.totalAllocated > 0
    ? ((this.variance.amount / this.totalAllocated) * 100).toFixed(2)
    : 0;
  
  if (this.variance.amount > 0) this.variance.type = 'favorable';
  else if (this.variance.amount < 0) this.variance.type = 'unfavorable';
  else this.variance.type = 'neutral';

  next();
});

budgetSchema.index({ department: 1, fiscalYear: 1 });

module.exports = mongoose.model('Budget', budgetSchema);
