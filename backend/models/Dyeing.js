const mongoose = require('mongoose');

// Model for Dyeing Process - Textile Specific
const dyeingSchema = new mongoose.Schema({
  dyeingNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  dyeingDate: {
    type: Date,
    default: Date.now
  },
  dyeingType: {
    type: String,
    enum: ['batch', 'continuous', 'semi_continuous', 'package', 'beam', 'jigger', 'jet'],
    required: true
  },
  materialType: {
    type: String,
    enum: ['yarn', 'fabric', 'garment'],
    required: true
  },
  material: {
    materialId: mongoose.Schema.Types.ObjectId,
    materialCode: String,
    materialName: String,
    quantity: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      enum: ['kg', 'meters', 'pieces']
    }
  },
  color: {
    colorCode: {
      type: String,
      required: true
    },
    colorName: String,
    pantoneCode: String,
    labValues: {
      l: Number,
      a: Number,
      b: Number
    },
    shadeReference: String
  },
  recipe: {
    recipeNo: String,
    recipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DyeRecipe'
    },
    mlr: Number, // Material to Liquor Ratio (1:10, 1:15, etc.)
    chemicals: [{
      chemicalName: String,
      chemicalCode: String,
      dosage: Number, // in gpl (grams per liter) or % owf (on weight of fabric)
      unit: {
        type: String,
        enum: ['gpl', 'owf_percentage', 'ml']
      },
      supplier: String
    }],
    dyes: [{
      dyeName: String,
      dyeCode: String,
      dosage: Number,
      unit: {
        type: String,
        enum: ['gpl', 'owf_percentage']
      },
      supplier: String
    }]
  },
  process: {
    machine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Machine'
    },
    machineCode: String,
    machineName: String,
    temperature: {
      initial: Number,
      final: Number,
      unit: {
        type: String,
        enum: ['celsius', 'fahrenheit'],
        default: 'celsius'
      }
    },
    time: Number, // total processing time in minutes
    ph: {
      initial: Number,
      final: Number
    },
    steps: [{
      stepNo: Number,
      description: String,
      temperature: Number,
      duration: Number, // in minutes
      rpm: Number,
      additions: String
    }]
  },
  shadeMatching: {
    standardSample: String,
    labSubmission: {
      l: Number,
      a: Number,
      b: Number
    },
    deltaE: Number, // Color difference
    status: {
      type: String,
      enum: ['ok', 'redip', 'additions_required', 'rejected'],
      default: 'ok'
    },
    matchedBy: String,
    matchedDate: Date,
    approvedBy: String
  },
  qualityCheck: {
    colorFastness: {
      washing: String,
      rubbing: String,
      light: String,
      perspiration: String
    },
    ph: Number,
    uniformity: {
      type: String,
      enum: ['excellent', 'good', 'acceptable', 'poor']
    },
    defects: [{
      defectType: {
        type: String,
        enum: ['uneven_dyeing', 'streaks', 'patches', 'wrong_shade', 'bleeding', 'other']
      },
      severity: {
        type: String,
        enum: ['critical', 'major', 'minor']
      },
      description: String
    }],
    overallResult: {
      type: String,
      enum: ['passed', 'passed_with_deviation', 'failed'],
      default: 'passed'
    },
    testedBy: String,
    testedDate: Date
  },
  wastage: {
    beforeDyeing: Number, // in kg or meters
    afterDyeing: Number,
    wastagePercentage: Number
  },
  cost: {
    chemicals: Number,
    dyes: Number,
    water: Number,
    energy: Number,
    labor: Number,
    overhead: Number,
    total: Number,
    costPerUnit: Number
  },
  output: {
    quantity: Number,
    unit: String,
    batchNo: String,
    location: String
  },
  status: {
    type: String,
    enum: ['in_progress', 'shade_checking', 'quality_check', 'approved', 'rejected', 'redip'],
    default: 'in_progress'
  },
  shift: {
    type: String,
    enum: ['morning', 'evening', 'night']
  },
  operator: {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    name: String
  },
  supervisedBy: {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    name: String
  },
  remarks: String,
  completedDate: Date
}, {
  timestamps: true
});

// Calculate total cost before saving
dyeingSchema.pre('save', function(next) {
  if (this.cost) {
    this.cost.total = 
      (this.cost.chemicals || 0) +
      (this.cost.dyes || 0) +
      (this.cost.water || 0) +
      (this.cost.energy || 0) +
      (this.cost.labor || 0) +
      (this.cost.overhead || 0);
    
    if (this.output && this.output.quantity > 0) {
      this.cost.costPerUnit = this.cost.total / this.output.quantity;
    }
  }
  next();
});

// Indexes (dyeingNumber has unique:true so index is automatic)
dyeingSchema.index({ dyeingDate: -1 });
dyeingSchema.index({ status: 1 });
dyeingSchema.index({ 'color.colorCode': 1 });

module.exports = mongoose.model('Dyeing', dyeingSchema);
