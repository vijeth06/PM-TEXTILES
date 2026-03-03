const Document = require('../models/Document');
const path = require('path');
const asyncHandler = require('express-async-handler');

// @desc    Upload document
// @route   POST /api/documents
// @access  Private
exports.uploadDocument = asyncHandler(async (req, res) => {
  if (!req.files || !req.files.file) {
    res.status(400);
    throw new Error('Please upload a file');
  }

  const file = req.files.file;
  const uploadPath = path.join(__dirname, '../uploads/documents/', file.name);

  await file.mv(uploadPath);

  const document = await Document.create({
    ...req.body,
    currentFileUrl: `/uploads/documents/${file.name}`,
    fileSize: file.size,
    documentType: file.mimetype.includes('pdf') ? 'pdf' : 'other',
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
  
  let query = {};
  if (category) query.category = category;
  if (status) query.status = status;
  if (department) query.department = department;
  if (accessLevel) query.accessLevel = accessLevel;

  // Filter based on user role
  if (!['admin', 'management'].includes(req.user.role)) {
    query.$or = [
      { accessLevel: 'public' },
      { allowedRoles: req.user.role },
      { uploadedBy: req.user.id }
    ];
  }

  const documents = await Document.find(query)
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

  // Check access permission
  if (!['admin', 'management'].includes(req.user.role)) {
    if (document.accessLevel === 'restricted' || 
        document.accessLevel === 'confidential') {
      if (!document.allowedRoles.includes(req.user.role) && 
          document.uploadedBy.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Access denied');
      }
    }
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
  const { query } = req.query;

  const documents = await Document.find({
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } },
      { ocrText: { $regex: query, $options: 'i' } }
    ]
  })
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
