const mongoose = require('mongoose');

const finishingSchema = new mongoose.Schema({
  finishingNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  finishingDate: {
    type: Date,
    default: Date.now
  },
  material: {
    materialType: {
      type: String,
      enum: ['fabric', 'yarn', 'garment'],
      required: true
    },
    materialId: mongoose.Schema.Types.ObjectId,
    materialCode: String,
    materialName: String,
    quantity: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      enum: ['meters', 'yards', 'kg', 'pieces'],
      default: 'meters'
    }
  },
  finishType: {
    type: String,
    enum: [
      'calendering',
      'sanforization',
      'mercerization',
      'singeing',
      'raising',
      'shearing',
      'cropping',
      'heat_setting',
      'softening',
      'anti_shrink',
      'water_repellent',
      'flame_retardant',
      'anti_bacterial',
      'wrinkle_free',
      'soil_release',
      'UV_protection',
      'moisture_management'
    ],
    required: true
  },
  machine: {
    machineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Machine'
    },
    machineName: String,
    machineType: String
  },
  process: {
    temperature: {
      value: Number,
      unit: {
        type: String,
        enum: ['celsius', 'fahrenheit'],
        default: 'celsius'
      }
    },
    pressure: Number, // for calendering, sanforization
    speed: Number, // meters per minute
    tension: String,
    duration: Number, // minutes
    passes: Number, // number of passes
    chemicals: [{
      chemicalName: String,
      dosage: Number,
      unit: String,
      purpose: String
    }]
  },
  recipe: {
    recipeNumber: String,
    mlr: Number, // Material to Liquor Ratio for wet finishing
    ph: {
      initial: Number,
      final: Number
    },
    temperature: {
      initial: Number,
      final: Number
    },
    steps: [{
      stepNumber: Number,
      description: String,
      duration: Number,
      temperature: Number,
      additions: String
    }]
  },
  qualityParameters: {
    beforeFinishing: {
      width: Number,
      gsm: Number,
      shrinkage: {
        lengthwise: Number,
        widthwise: Number
      },
      tensileStrength: Number,
      tearStrength: Number
    },
    afterFinishing: {
      width: Number,
      gsm: Number,
      shrinkage: {
        lengthwise: Number,
        widthwise: Number
      },
      tensileStrength: Number,
      tearStrength: Number
    },
    improvement: {
      shrinkage: String,
      strength: String,
      appearance: String,
      handFeel: {
        type: String,
        enum: ['very_soft', 'soft', 'medium', 'stiff', 'very_stiff']
      }
    }
  },
  testing: {
    tests: [{
      testType: String,
      standard: String, // ISO, AATCC, etc.
      result: String,
      passFail: {
        type: String,
        enum: ['pass', 'fail']
      },
      testedBy: String,
      testDate: Date
    }],
    overallResult: {
      type: String,
      enum: ['passed', 'passed_with_deviation', 'failed']
    }
  },
  production: {
    targetQuantity: Number,
    actualProduction: Number,
    processedQuantity: Number,
    rejectedQuantity: Number,
    efficiency: Number
  },
  operator: {
    operatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    name: String,
    shift: {
      type: String,
      enum: ['morning', 'evening', 'night']
    }
  },
  cost: {
    chemicals: Number,
    energy: Number,
    water: Number,
    labor: Number,
    overhead: Number,
    total: Number,
    costPerUnit: Number
  },
  defects: [{
    defectType: String,
    description: String,
    severity: {
      type: String,
      enum: ['critical', 'major', 'minor']
    },
    quantity: Number
  }],
  remarks: String,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  status: {
    type: String,
    enum: ['in_progress', 'quality_check', 'approved', 'rejected', 'rework'],
    default: 'in_progress'
  }
}, {
  timestamps: true
});

// Auto-generate finishing number
finishingSchema.pre('save', async function(next) {
  if (!this.finishingNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = await mongoose.model('Finishing').countDocuments();
    this.finishingNumber = `FIN${year}${month}${(count + 1).toString().padStart(5, '0')}`;
  }

  // Calculate efficiency
  if (this.production.targetQuantity && this.production.processedQuantity) {
    this.production.efficiency = (this.production.processedQuantity / this.production.targetQuantity) * 100;
  }

  // Calculate total cost
  if (this.cost) {
    this.cost.total = 
      (this.cost.chemicals || 0) +
      (this.cost.energy || 0) +
      (this.cost.water || 0) +
      (this.cost.labor || 0) +
      (this.cost.overhead || 0);
    
    if (this.production.processedQuantity) {
      this.cost.costPerUnit = this.cost.total / this.production.processedQuantity;
    }
  }

  next();
});

// Indexes
finishingSchema.index({ finishingNumber: 1 });
finishingSchema.index({ finishingDate: -1 });
finishingSchema.index({ status: 1 });
finishingSchema.index({ finishType: 1 });

module.exports = mongoose.model('Finishing', finishingSchema);
