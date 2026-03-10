const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [50, 'Username cannot exceed 50 characters']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'production_manager', 'store_manager', 'sales_executive', 'qa_inspector', 'management'],
    default: 'sales_executive',
    required: true
  },
  permissions: [{
    type: String,
    enum: [
      'view_production',
      'manage_production',
      'view_inventory',
      'manage_inventory',
      'view_orders',
      'manage_orders',
      'view_suppliers',
      'manage_suppliers',
      'view_customers',
      'manage_customers',
      'view_reports',
      'manage_users',
      'system_admin'
    ]
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Two-Factor Authentication fields
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    select: false // Don't return this in queries by default
  },
  backupCodes: [{
    code: String,
    used: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true
});

// Index for faster queries
userSchema.index({ username: 1, email: 1 });

module.exports = mongoose.model('User', userSchema);
