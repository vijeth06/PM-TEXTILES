const mongoose = require('mongoose');

// Model for Approval Workflows
const workflowSchema = new mongoose.Schema({
  workflowName: {
    type: String,
    required: true,
    unique: true
  },
  workflowType: {
    type: String,
    enum: ['budget', 'purchase_order', 'quotation', 'document', 'expense', 'leave', 'custom'],
    required: true
  },
  description: String,
  stages: [{
    stageNumber: {
      type: Number,
      required: true
    },
    stageName: String,
    approverRole: {
      type: String,
      enum: ['admin', 'production_manager', 'store_manager', 'sales_executive', 'qa_inspector', 'management']
    },
    approvers: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      name: String
    }],
    approvalType: {
      type: String,
      enum: ['any_one', 'all', 'majority'],
      default: 'any_one'
    },
    autoApprove: {
      enabled: Boolean,
      conditions: mongoose.Schema.Types.Mixed
    },
    escalation: {
      enabled: Boolean,
      escalateAfterHours: Number,
      escalateTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  }],
  conditions: {
    amountThreshold: Number,
    departmentSpecific: [String],
    priorityBased: Boolean
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

workflowSchema.index({ workflowType: 1, isActive: 1 });

module.exports = mongoose.model('Workflow', workflowSchema);
