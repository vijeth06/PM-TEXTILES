const mongoose = require('mongoose');

// Model for Document Management System
const documentSchema = new mongoose.Schema({
  documentNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  category: {
    type: String,
    enum: ['policy', 'procedure', 'sop', 'manual', 'certificate', 'report', 'invoice', 'contract', 'compliance', 'other'],
    required: true
  },
  documentType: {
    type: String,
    enum: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'image', 'other']
  },
  version: {
    type: String,
    default: '1.0'
  },
  versionHistory: [{
    version: String,
    uploadedDate: Date,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changes: String,
    fileUrl: String
  }],
  currentFileUrl: {
    type: String,
    required: true
  },
  fileSize: Number, // in bytes
  tags: [String],
  department: {
    type: String,
    enum: ['production', 'quality', 'inventory', 'sales', 'admin', 'hr', 'finance', 'all']
  },
  referenceType: {
    type: String,
    enum: ['order', 'production_plan', 'supplier', 'customer', 'employee', 'machine', 'general']
  },
  referenceId: mongoose.Schema.Types.ObjectId,
  referenceNo: String,
  accessLevel: {
    type: String,
    enum: ['public', 'internal', 'confidential', 'restricted'],
    default: 'internal'
  },
  allowedRoles: [{
    type: String,
    enum: ['admin', 'production_manager', 'store_manager', 'sales_executive', 'qa_inspector', 'management']
  }],
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'approved', 'archived', 'expired'],
    default: 'draft'
  },
  approvalWorkflow: [{
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected']
    },
    date: Date,
    comments: String
  }],
  expiryDate: Date,
  retentionPeriod: Number, // in months
  ocrText: String, // Extracted text from OCR
  metadata: mongoose.Schema.Types.Mixed,
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastAccessedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastAccessedDate: Date,
  downloadCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Generate document number
documentSchema.pre('save', async function(next) {
  if (!this.documentNumber) {
    const count = await this.constructor.countDocuments();
    const year = new Date().getFullYear();
    this.documentNumber = `DOC-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

documentSchema.index({ category: 1, status: 1 });
documentSchema.index({ tags: 1 });

module.exports = mongoose.model('Document', documentSchema);
