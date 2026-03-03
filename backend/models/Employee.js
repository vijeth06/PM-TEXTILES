const mongoose = require('mongoose');

// Model for employee/worker management
const employeeSchema = new mongoose.Schema({
  employeeCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  personalInfo: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    contactNumber: String,
    email: String,
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String
    },
    emergencyContact: {
      name: String,
      relation: String,
      phone: String
    }
  },
  employmentDetails: {
    joinDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    department: {
      type: String,
      enum: ['production', 'quality', 'maintenance', 'inventory', 'sales', 'admin'],
      required: true
    },
    designation: String,
    employmentType: {
      type: String,
      enum: ['permanent', 'contract', 'temporary', 'intern'],
      default: 'permanent'
    },
    shift: {
      type: String,
      enum: ['morning', 'afternoon', 'night', 'general', 'rotating']
    },
    reportingTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    salary: {
      basic: Number,
      allowances: Number,
      total: Number
    }
  },
  skills: [{
    skillName: String,
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert']
    },
    certificationDate: Date
  }],
  certifications: [{
    name: String,
    issuedBy: String,
    issueDate: Date,
    expiryDate: Date,
    documentUrl: String
  }],
  attendance: {
    totalPresent: { type: Number, default: 0 },
    totalAbsent: { type: Number, default: 0 },
    totalLeave: { type: Number, default: 0 },
    currentMonthPresent: { type: Number, default: 0 }
  },
  performance: {
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 3
    },
    lastReviewDate: Date,
    nextReviewDate: Date
  },
  training: [{
    trainingName: String,
    completedDate: Date,
    validUntil: Date,
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'expired']
    }
  }],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  terminationDate: Date,
  terminationReason: String,
  documents: [{
    type: String,
    url: String
  }],
  notes: String
}, {
  timestamps: true
});

employeeSchema.index({ 'employmentDetails.department': 1, isActive: 1 });

module.exports = mongoose.model('Employee', employeeSchema);
