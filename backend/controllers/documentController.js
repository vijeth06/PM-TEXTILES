const Document = require('../models/Document');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const asyncHandler = require('express-async-handler');

const DOCUMENT_UPLOAD_DIR = path.join(__dirname, '../uploads/documents');

const ensureDocumentUploadDir = () => {
  if (!fs.existsSync(DOCUMENT_UPLOAD_DIR)) {
    fs.mkdirSync(DOCUMENT_UPLOAD_DIR, { recursive: true });
  }
};

const sanitizeFilename = (filename = 'document') => {
  const parsed = path.parse(path.basename(filename));
  const safeName = (parsed.name || 'document').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeExt = (parsed.ext || '').replace(/[^a-zA-Z0-9.]/g, '');
  return `${safeName}${safeExt}`;
};

const buildAccessCondition = (user) => {
  if (!user || ['admin', 'management'].includes(user.role)) {
    return null;
  }

  const userId = user.id || user._id;

  return {
    $or: [
      { accessLevel: 'public' },
      { accessLevel: 'internal' },
      { uploadedBy: userId },
      {
        accessLevel: { $in: ['restricted', 'confidential'] },
        allowedRoles: user.role
      }
    ]
  };
};

const combineConditions = (...conditions) => {
  const filtered = conditions.filter((condition) => condition && Object.keys(condition).length > 0);
  if (filtered.length === 0) return {};
  if (filtered.length === 1) return filtered[0];
  return { $and: filtered };
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const userCanAccessDocument = (document, user) => {
  if (!document || !user) return false;
  if (['admin', 'management'].includes(user.role)) return true;
  if (document.accessLevel === 'public' || document.accessLevel === 'internal') return true;

  const uploadedBy = String(document.uploadedBy?._id || document.uploadedBy || '');
  if (uploadedBy === String(user.id || user._id)) {
    return true;
  }

  const allowedRoles = Array.isArray(document.allowedRoles) ? document.allowedRoles : [];
  return allowedRoles.includes(user.role);
};

const detectDocumentType = (file) => {
  const extension = path.extname(file.name || '').toLowerCase();
  const mimeType = file.mimetype || '';

  if (mimeType.includes('pdf') || extension === '.pdf') return 'pdf';
  if (mimeType.includes('word') || extension === '.doc') return 'doc';
  if (extension === '.docx') return 'docx';
  if (mimeType.includes('excel') || extension === '.xls') return 'xls';
  if (extension === '.xlsx') return 'xlsx';
  if (mimeType.startsWith('image/')) return 'image';
  return 'other';
};

// @desc    Upload document
// @route   POST /api/documents
// @access  Private
exports.uploadDocument = asyncHandler(async (req, res) => {
  if (!req.files || !req.files.file) {
    res.status(400);
    throw new Error('Please upload a file');
  }

  const file = req.files.file;
  ensureDocumentUploadDir();

  const originalFileName = sanitizeFilename(file.name);
  const storedFileName = `${Date.now()}-${crypto.randomUUID()}-${originalFileName}`;
  const uploadPath = path.join(DOCUMENT_UPLOAD_DIR, storedFileName);

  await file.mv(uploadPath);

  const document = await Document.create({
    ...req.body,
    title: req.body.title || path.parse(originalFileName).name,
    category: req.body.category || 'other',
    accessLevel: req.body.accessLevel || 'internal',
    currentFileUrl: `/uploads/documents/${storedFileName}`,
    fileSize: file.size,
    documentType: detectDocumentType(file),
    uploadedBy: req.user.id
  });

  res.status(201).json({
    success: true,
    data: document
  });
});

// @desc    Get all documents
// @route   GET /api/documents
// @access  Private
exports.getDocuments = asyncHandler(async (req, res) => {
  const { category, status, department, accessLevel } = req.query;
  
  const query = {};
  if (category) query.category = category;
  if (status) query.status = status;
  if (department) query.department = department;
  if (accessLevel) query.accessLevel = accessLevel;

  const documents = await Document.find(combineConditions(query, buildAccessCondition(req.user)))
    .populate('uploadedBy', 'username fullName')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: documents.length,
    data: documents
  });
});

// @desc    Get single document
// @route   GET /api/documents/:id
// @access  Private
exports.getDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id)
    .populate('uploadedBy')
    .populate('approvalWorkflow.approver', 'username fullName');

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  if (!userCanAccessDocument(document, req.user)) {
    res.status(403);
    throw new Error('Access denied');
  }

  // Update last accessed
  document.lastAccessedBy = req.user.id;
  document.lastAccessedDate = new Date();
  document.downloadCount += 1;
  await document.save();

  res.json({
    success: true,
    data: document
  });
});

// @desc    Update document
// @route   PUT /api/documents/:id
// @access  Private
exports.updateDocument = asyncHandler(async (req, res) => {
  let document = await Document.findById(req.params.id);

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  // Check ownership
  if (document.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to update this document');
  }

  document = await Document.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.json({
    success: true,
    data: document
  });
});

// @desc    Submit document for approval
// @route   POST /api/documents/:id/approve
// @access  Private
exports.submitForApproval = asyncHandler(async (req, res) => {
  const { approvers } = req.body;

  const document = await Document.findById(req.params.id);

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  document.approvalWorkflow = approvers.map(approverId => ({
    approver: approverId,
    status: 'pending'
  }));

  document.status = 'pending_approval';
  await document.save();

  res.json({
    success: true,
    data: document
  });
});

// @desc    Approve/Reject document
// @route   PUT /api/documents/:id/approval/:approvalId
// @access  Private
exports.approveDocument = asyncHandler(async (req, res) => {
  const { status, comments } = req.body;

  const document = await Document.findById(req.params.id);

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  const approval = document.approvalWorkflow.id(req.params.approvalId);
  
  if (!approval) {
    res.status(404);
    throw new Error('Approval not found');
  }

  if (approval.approver.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to approve');
  }

  approval.status = status;
  approval.date = new Date();
  approval.comments = comments;

  // Check if all approvals are complete
  const allApproved = document.approvalWorkflow.every(a => a.status === 'approved');
  const anyRejected = document.approvalWorkflow.some(a => a.status === 'rejected');

  if (allApproved) {
    document.status = 'approved';
  } else if (anyRejected) {
    document.status = 'draft';
  }

  await document.save();

  res.json({
    success: true,
    data: document
  });
});

// @desc    Search documents
// @route   GET /api/documents/search
// @access  Private
exports.searchDocuments = asyncHandler(async (req, res) => {
  const query = (req.query.query || req.query.q || '').trim();

  if (!query) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required'
    });
  }

  const searchRegex = new RegExp(escapeRegex(query), 'i');
  const searchCondition = {
    $or: [
      { title: searchRegex },
      { description: searchRegex },
      { tags: { $in: [searchRegex] } },
      { ocrText: searchRegex }
    ]
  };

  const documents = await Document.find(combineConditions(searchCondition, buildAccessCondition(req.user)))
    .populate('uploadedBy', 'username fullName')
    .limit(50);

  res.json({
    success: true,
    count: documents.length,
    data: documents
  });
});

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private (Admin or Owner)
exports.deleteDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  if (document.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to delete this document');
  }

  await document.deleteOne();

  res.json({
    success: true,
    message: 'Document deleted successfully'
  });
});
