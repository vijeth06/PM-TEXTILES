const mongoose = require('mongoose');

// Model for Fabric Master - Textile Specific
const fabricSchema = new mongoose.Schema({
  fabricCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  fabricName: {
    type: String,
    required: true
  },
  fabricType: {
    type: String,
    enum: ['woven', 'knitted', 'non_woven', 'technical', 'blended'],
    required: true
  },
  construction: {
    warpCount: String, // e.g., 40s, 60s
    weftCount: String,
    epi: Number, // Ends per inch
    ppi: Number, // Picks per inch
    weaveType: {
      type: String,
      enum: ['plain', 'twill', 'satin', 'dobby', 'jacquard', 'other']
    }
  },
  composition: [{
    fiber: {
      type: String,
      enum: ['cotton', 'polyester', 'viscose', 'nylon', 'silk', 'wool', 'linen', 'blended']
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100
    }
  }],
  specifications: {
    gsm: Number, // Grams per square meter
    width: Number, // In inches or cm
    widthUnit: {
      type: String,
      enum: ['inch', 'cm'],
      default: 'inch'
    },
    shrinkage: {
      lengthwise: Number, // percentage
      widthwise: Number
    },
    tensileStrength: {
      warp: Number,
      weft: Number
    },
    tearStrength: Number,
    cuttableWidth: Number
  },
  colors: [{
    colorCode: String,
    colorName: String,
    pantoneCode: String,
    rgbValue: String,
    cmykValue: String,
    labValue: String, // LAB color space
    dyeRecipe: String,
    isStandard: Boolean
  }],
  finishes: [{
    finishType: {
      type: String,
      enum: ['mercerization', 'sanforization', 'calendering', 'brushing', 'coating', 'water_repellent', 'flame_retardant', 'anti_bacterial', 'other']
    },
    specification: String,
    chemicals: String
  }],
  pricing: {
    costPrice: Number,
    sellingPrice: Number,
    currency: {
      type: String,
      default: 'INR'
    },
    priceUnit: {
      type: String,
      enum: ['per_meter', 'per_yard', 'per_kg'],
      default: 'per_meter'
    }
  },
  qualityStandards: [{
    testType: {
      type: String,
      enum: ['colorfastness', 'pilling', 'dimensional_stability', 'ph', 'formaldehyde', 'azo_dyes', 'other']
    },
    standard: String, // e.g., ISO, AATCC, AS
    requirement: String,
    testMethod: String
  }],
  minimumOrderQuantity: {
    quantity: Number,
    unit: {
      type: String,
      enum: ['meters', 'yards', 'kg']
    }
  },
  leadTime: Number, // in days
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  image: String,
  swatchImage: String,
  technicalDrawing: String,
  isActive: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    enum: ['shirting', 'suiting', 'denim', 'knits', 'home_textile', 'technical', 'fashion']
  },
  seasonality: [{
    type: String,
    enum: ['summer', 'winter', 'monsoon', 'all_season']
  }],
  endUse: String, // shirts, trousers, bedsheets, etc.
  certifications: [{
    name: String,
    issuedBy: String,
    validUntil: Date,
    certificateNumber: String
  }]
}, {
  timestamps: true
});

// Indexes for faster queries (fabricCode has unique:true so index is automatic)
fabricSchema.index({ fabricType: 1, isActive: 1 });
fabricSchema.index({ 'composition.fiber': 1 });
fabricSchema.index({ category: 1 });

module.exports = mongoose.model('Fabric', fabricSchema);
