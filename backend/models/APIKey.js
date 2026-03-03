const mongoose = require('mongoose');

// Model for API Key Management
const apiKeySchema = new mongoose.Schema({
  keyName: {
    type: String,
    required: true,
    unique: true
  },
  apiKey: {
    type: String,
    required: true,
    unique: true
  },
  apiSecret: {
    type: String,
    required: true
  },
  description: String,
  application: String,
  owner: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    department: String,
    contactEmail: String
  },
  permissions: [{
    resource: {
      type: String,
      enum: ['orders', 'inventory', 'production', 'customers', 'suppliers', 'reports', 'all']
    },
    actions: [{
      type: String,
      enum: ['read', 'write', 'update', 'delete']
    }]
  }],
  rateLimit: {
    requestsPerHour: {
      type: Number,
      default: 1000
    },
    requestsPerDay: {
      type: Number,
      default: 10000
    }
  },
  usage: {
    totalRequests: {
      type: Number,
      default: 0
    },
    lastUsed: Date,
    requestsToday: {
      type: Number,
      default: 0
    },
    requestsThisMonth: {
      type: Number,
      default: 0
    }
  },
  ipWhitelist: [String],
  webhooks: [{
    event: String,
    url: String,
    active: Boolean
  }],
  status: {
    type: String,
    enum: ['active', 'suspended', 'revoked', 'expired'],
    default: 'active'
  },
  expiresAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastRotated: Date,
  notes: String
}, {
  timestamps: true
});

apiKeySchema.index({ apiKey: 1 });
apiKeySchema.index({ status: 1, expiresAt: 1 });

module.exports = mongoose.model('APIKey', apiKeySchema);
