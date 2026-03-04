const mongoose = require('mongoose');

const printingSchema = new mongoose.Schema({
  printingNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  printingDate: {
    type: Date,
    default: Date.now
  },
  fabric: {
    fabricId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fabric'
    },
    fabricCode: String,
    fabricName: String,
    quantity: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      enum: ['meters', 'yards', 'pieces'],
      default: 'meters'
    }
  },
  printMethod: {
    type: String,
    enum: ['screen_printing', 'rotary_printing', 'digital_printing', 'block_printing', 'discharge_printing', 'resist_printing'],
    required: true
  },
  design: {
    designNumber: String,
    designName: String,
    repeats: {
      horizontal: Number,
      vertical: Number
    },
    numberOfScreens: Number,
    colorCount: Number
  },
  colors: [{
    colorNumber: String,
    colorName: String,
    pantoneCode: String,
    printPaste: {
      recipe: String,
      thickness: {
        type: String,
        enum: ['thin', 'medium', 'thick']
      },
      components: [{
        chemical: String,
        quantity: Number,
        unit: String
      }]
    }
  }],
  machine: {
    machineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Machine'
    },
    machineName: String,
    machineType: String,
    screens: Number
  },
  process: {
    speed: {
      type: Number, // meters per minute
      default: 0
    },
    temperature: {
      drying: Number,
      curing: Number,
      unit: {
        type: String,
        enum: ['celsius', 'fahrenheit'],
        default: 'celsius'
      }
    },
    pressure: Number, // for squeeze rollers
    tension: String
  },
  colorRegistration: {
    status: {
      type: String,
      enum: ['perfect', 'good', 'acceptable', 'poor', 'rejected'],
      default: 'good'
    },
    deviation: {
      horizontal: Number, // mm
      vertical: Number // mm
    },
    adjustedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    }
  },
  production: {
    targetQuantity: Number,
    actualProduction: Number,
    wastage: Number,
    goodProduction: Number,
    rejectedQuantity: Number,
    efficiency: Number // calculated
  },
  quality: {
    sharpness: {
      type: String,
      enum: ['excellent', 'good', 'acceptable', 'poor']
    },
    colorFastness: {
      washing: String,
      rubbing: String,
      light: String
    },
    defects: [{
      defectType: {
        type: String,
        enum: [
          'misprinting',
          'color_bleeding',
          'uneven_print',
          'smudging',
          'missing_color',
          'color_variation',
          'poor_registration',
          'streaks',
          'patches',
          'contamination'
        ]
      },
      severity: {
        type: String,
        enum: ['critical', 'major', 'minor']
      },
      location: String,
      quantity: Number
    }],
    overallGrade: {
      type: String,
      enum: ['A', 'B', 'C', 'reject']
    }
  },
  operator: {
    operatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    name: String,
    skill: {
      type: String,
      enum: ['trainee', 'semi_skilled', 'skilled', 'expert']
    }
  },
  cost: {
    printPaste: Number,
    chemicals: Number,
    energy: Number,
    labor: Number,
    overhead: Number,
    total: Number,
    costPerUnit: Number
  },
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

// Auto-generate printing number
printingSchema.pre('save', async function(next) {
  if (!this.printingNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = await mongoose.model('Printing').countDocuments();
    this.printingNumber = `PRT${year}${month}${(count + 1).toString().padStart(5, '0')}`;
  }

  // Calculate production efficiency
  if (this.production.targetQuantity && this.production.actualProduction) {
    this.production.efficiency = (this.production.actualProduction / this.production.targetQuantity) * 100;
  }

  // Calculate total cost
  if (this.cost) {
    this.cost.total = 
      (this.cost.printPaste || 0) +
      (this.cost.chemicals || 0) +
      (this.cost.energy || 0) +
      (this.cost.labor || 0) +
      (this.cost.overhead || 0);
    
    if (this.production.goodProduction) {
      this.cost.costPerUnit = this.cost.total / this.production.goodProduction;
    }
  }

  next();
});

// Indexes
printingSchema.index({ printingNumber: 1 });
printingSchema.index({ printingDate: -1 });
printingSchema.index({ status: 1 });
printingSchema.index({ printMethod: 1 });
printingSchema.index({ 'fabric.fabricCode': 1 });

module.exports = mongoose.model('Printing', printingSchema);
