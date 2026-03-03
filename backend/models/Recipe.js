const mongoose = require('mongoose');

// Model for Recipe/BOM (Bill of Materials) Management
const recipeSchema = new mongoose.Schema({
  recipeCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FinishedGood',
    required: true
  },
  productCode: String,
  productName: {
    type: String,
    required: true
  },
  version: {
    type: String,
    default: '1.0'
  },
  versionHistory: [{
    version: String,
    effectiveDate: Date,
    changes: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  batchSize: {
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    uom: String
  },
  ingredients: [{
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'ingredients.materialType'
    },
    materialType: {
      type: String,
      enum: ['RawMaterial', 'SemiFinishedGood']
    },
    materialCode: String,
    materialName: String,
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    uom: String,
    wastagePercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    isOptional: {
      type: Boolean,
      default: false
    },
    substitutes: [{
      materialId: mongoose.Schema.Types.ObjectId,
      materialCode: String,
      materialName: String,
      conversionRatio: Number
    }],
    cost: Number
  }],
  processSteps: [{
    stepNumber: {
      type: Number,
      required: true
    },
    stageName: {
      type: String,
      enum: ['yarn_issue', 'weaving', 'dyeing', 'finishing', 'packing']
    },
    description: String,
    duration: Number, // in minutes
    temperature: String,
    machineType: String,
    parameters: mongoose.Schema.Types.Mixed
  }],
  cost: {
    rawMaterial: {
      type: Number,
      default: 0
    },
    labor: {
      type: Number,
      default: 0
    },
    overhead: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    },
    costPerUnit: {
      type: Number,
      default: 0
    }
  },
  yield: {
    expected: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    },
    typical: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  qualityParameters: [{
    parameter: String,
    specification: String,
    testMethod: String,
    acceptanceCriteria: String
  }],
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'obsolete'],
    default: 'draft'
  },
  effectiveDate: Date,
  expiryDate: Date,
  notes: String,
  attachments: [String],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Calculate total cost
recipeSchema.pre('save', function(next) {
  let rawMaterialCost = 0;
  
  this.ingredients.forEach(ingredient => {
    if (ingredient.cost) {
      rawMaterialCost += ingredient.quantity * ingredient.cost;
    }
  });

  this.cost.rawMaterial = rawMaterialCost;
  this.cost.total = this.cost.rawMaterial + this.cost.labor + this.cost.overhead;
  
  if (this.batchSize.quantity > 0) {
    this.cost.costPerUnit = this.cost.total / this.batchSize.quantity;
  }

  next();
});

recipeSchema.index({ recipeCode: 1 });
recipeSchema.index({ productCode: 1, version: 1 });

module.exports = mongoose.model('Recipe', recipeSchema);
