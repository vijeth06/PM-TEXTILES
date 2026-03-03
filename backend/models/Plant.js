const mongoose = require('mongoose');

// Model for Multi-Location/Multi-Plant Management
const plantSchema = new mongoose.Schema({
  plantCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['manufacturing', 'warehouse', 'office', 'showroom', 'mixed'],
    required: true
  },
  address: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    country: String,
    pincode: String,
    gpsCoordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  contact: {
    phone: String,
    email: String,
    fax: String
  },
  manager: {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    name: String,
    contact: String
  },
  capacity: {
    productionCapacity: Number,
    storageCapacity: Number,
    uom: String
  },
  facilities: [{
    type: {
      type: String,
      enum: ['production_line', 'warehouse', 'quality_lab', 'office', 'canteen', 'other']
    },
    name: String,
    area: Number, // in sq ft or sq m
    capacity: String
  }],
  machinery: [{
    machineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Machine'
    },
    machineCode: String,
    count: Number
  }],
  workforce: {
    totalEmployees: {
      type: Number,
      default: 0
    },
    production: {
      type: Number,
      default: 0
    },
    quality: {
      type: Number,
      default: 0
    },
    maintenance: {
      type: Number,
      default: 0
    },
    admin: {
      type: Number,
      default: 0
    }
  },
  operatingHours: {
    shifts: Number,
    hoursPerShift: Number,
    workingDays: [String]
  },
  certifications: [{
    name: String,
    issuedBy: String,
    issueDate: Date,
    expiryDate: Date,
    certificateNo: String
  }],
  compliance: [{
    regulationType: String,
    status: {
      type: String,
      enum: ['compliant', 'non_compliant', 'pending']
    },
    lastAuditDate: Date,
    nextAuditDate: Date
  }],
  status: {
    type: String,
    enum: ['operational', 'under_construction', 'maintenance', 'closed'],
    default: 'operational'
  },
  isHeadquarters: {
    type: Boolean,
    default: false
  },
  establishedDate: Date,
  notes: String,
  documents: [String]
}, {
  timestamps: true
});

plantSchema.index({ plantCode: 1 });
plantSchema.index({ type: 1, status: 1 });

module.exports = mongoose.model('Plant', plantSchema);
