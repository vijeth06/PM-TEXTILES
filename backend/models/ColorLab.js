const mongoose = require('mongoose');

const colorLabSchema = new mongoose.Schema({
  matchingNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  customer: {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    },
    customerName: String,
    contactPerson: String
  },
  fabricType: {
    type: String,
    required: true
  },
  standardShade: {
    sampleNumber: String,
    shadeDescription: String,
    referenceType: {
      type: String,
      enum: ['physical_sample', 'pantone', 'color_card', 'digital_file']
    },
    labValues: {
      illuminant: {
        type: String,
        enum: ['D65', 'D50', 'A', 'C', 'F2', 'F7', 'F11'],
        default: 'D65'
      },
      observer: {
        type: String,
        enum: ['2_degree', '10_degree'],
        default: '10_degree'
      },
      L: Number, // Lightness (0-100)
      a: Number, // Green (-) to Red (+)
      b: Number, // Blue (-) to Yellow (+)
      c: Number, // Chroma
      h: Number  // Hue angle
    },
    rgbValues: {
      r: Number,
      g: Number,
      b: Number
    },
    cmykValues: {
      c: Number,
      m: Number,
      y: Number,
      k: Number
    },
    pantoneCode: String
  },
  submittedShades: [{
    submissionNumber: Number,
    submissionDate: Date,
    batchNumber: String,
    recipe: {
      recipeId: String,
      dyes: [{
        dyeName: String,
        dyeCode: String,
        dosage: Number,
        unit: String
      }],
      chemicals: [{
        chemicalName: String,
        dosage: Number,
        unit: String
      }],
      mlr: Number,
      temperature: Number,
      time: Number,
      ph: Number
    },
    labMeasurement: {
      L: Number,
      a: Number,
      b: Number,
      c: Number,
      h: Number,
      spectralData: [Number] // Reflectance values
    },
    deltaE: {
      dE2000: Number, // CIEDE2000 formula
      dE76: Number,   // CIE76 formula
      dEcmc: Number   // CMC formula
    },
    visualAssessment: {
      overallMatch: {
        type: String,
        enum: ['excellent', 'good', 'acceptable', 'poor', 'unacceptable']
      },
      lighter_darker: {
        type: String,
        enum: ['much_lighter', 'lighter', 'match', 'darker', 'much_darker']
      },
      redder_greener: {
        type: String,
        enum: ['much_redder', 'redder', 'match', 'greener', 'much_greener']
      },
      yellower_bluer: {
        type: String,
        enum: ['much_yellower', 'yellower', 'match', 'bluer', 'much_bluer']
      }
    },
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'approved', 'rejected', 'corrections_required'],
      default: 'submitted'
    },
    colorist: {
      employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
      },
      name: String
    },
    remarks: String
  }],
  matchingCriteria: {
    maxDeltaE: {
      type: Number,
      default: 1.0 // Acceptable Delta E threshold
    },
    lightSource: String,
    testingConditions: String
  },
  approvedShade: {
    submissionNumber: Number,
    approvalDate: Date,
    approvedBy: {
      employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
      },
      name: String
    },
    finalDeltaE: Number,
    commercialApproval: {
      type: Boolean,
      default: false
    }
  },
  bulkProduction: {
    dyeingBatchNumber: String,
    productionDate: Date,
    quantity: Number,
    shadeConsistency: {
      type: String,
      enum: ['excellent', 'good', 'acceptable', 'poor']
    }
  },
  priority: {
    type: String,
    enum: ['urgent', 'high', 'medium', 'low'],
    default: 'medium'
  },
  attempts: {
    type: Number,
    default: 0
  },
  averageDeltaE: Number,
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'approved', 'rejected', 'on_hold'],
    default: 'pending'
  },
  remarks: String
}, {
  timestamps: true
});

// Auto-generate matching number
colorLabSchema.pre('save', async function(next) {
  if (!this.matchingNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = await mongoose.model('ColorLab').countDocuments();
    this.matchingNumber = `CLR${year}${month}${(count + 1).toString().padStart(5, '0')}`;
  }

  // Update attempts count
  if (this.submittedShades) {
    this.attempts = this.submittedShades.length;
    
    // Calculate average Delta E
    const deltaEValues = this.submittedShades
      .filter(shade => shade.deltaE && shade.deltaE.dE2000)
      .map(shade => shade.deltaE.dE2000);
    
    if (deltaEValues.length > 0) {
      this.averageDeltaE = deltaEValues.reduce((sum, val) => sum + val, 0) / deltaEValues.length;
    }
  }

  next();
});

// Method to calculate Delta E 2000
colorLabSchema.methods.calculateDeltaE2000 = function(lab1, lab2) {
  // Simplified Delta E 2000 calculation
  // In production, use a proper color science library
  const dL = lab2.L - lab1.L;
  const da = lab2.a - lab1.a;
  const db = lab2.b - lab1.b;
  
  // CIE76 formula (simplified for demo)
  const dE76 = Math.sqrt(dL * dL + da * da + db * db);
  
  return {
    dE76,
    dE2000: dE76 * 0.9, // Approximation - use proper library in production
    dEcmc: dE76 * 0.95
  };
};

// Indexes (matchingNumber has unique:true so index is automatic)
colorLabSchema.index({ requestDate: -1 });
colorLabSchema.index({ status: 1 });
colorLabSchema.index({ priority: 1 });
colorLabSchema.index({ 'customer.customerId': 1 });

module.exports = mongoose.model('ColorLab', colorLabSchema);
