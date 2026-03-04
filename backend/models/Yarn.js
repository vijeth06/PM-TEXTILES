const mongoose = require('mongoose');

// Model for Yarn Master - Textile Specific
const yarnSchema = new mongoose.Schema({
  yarnCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  yarnName: {
    type: String,
    required: true
  },
  fiber: {
    type: String,
    enum: ['cotton', 'polyester', 'viscose', 'nylon', 'acrylic', 'wool', 'silk', 'linen', 'blended'],
    required: true
  },
  blendComposition: [{
    fiber: String,
    percentage: {
      type: Number,
      min: 0,
      max: 100
    }
  }],
  count: {
    type: String,
    required: true // e.g., 40s, 60s, 80s
  },
  ply: {
    type: String,
    enum: ['single', '2-ply', '3-ply', '4-ply', 'cabled']
  },
  twist: {
    type: String,
    enum: ['s-twist', 'z-twist', 'no-twist']
  },
  tpi: Number, // Twists per inch
  specifications: {
    strength: Number, // RKM (Rkm = grams/tex × 9.81)
    elongation: Number, // percentage
    unevenness: Number, // CV%
    imperfections: {
      thin_places: Number,
      thick_places: Number,
      neps: Number
    },
    hairiness: Number
  },
  color: {
    colorCode: String,
    colorName: String,
    dyeMethod: {
      type: String,
      enum: ['raw_white', 'bleached', 'dyed', 'melange']
    },
    pantoneCode: String,
    colorFastness: {
      washing: String,
      rubbing: String,
      light: String
    }
  },
  manufacturing: {
    spinningMethod: {
      type: String,
      enum: ['ring_spun', 'open_end', 'air_jet', 'combed', 'carded']
    },
    mill: String,
    origin: String
  },
  packaging: {
    coneWeight: Number, // in kg
    conesPerCarton: Number,
    cartonWeight: Number
  },
  pricing: {
    costPrice: Number,
    sellingPrice: Number,
    currency: {
      type: String,
      default: 'INR'
    },
    priceUnit: {
      type: String,
      enum: ['per_kg', 'per_cone', 'per_carton'],
      default: 'per_kg'
    }
  },
  stock: {
    currentStock: {
      type: Number,
      default: 0
    },
    unit: {
      type: String,
      enum: ['kg', 'cones', 'cartons'],
      default: 'kg'
    },
    reorderLevel: Number,
    maxLevel: Number,
    location: String
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  qualityTests: [{
    testDate: Date,
    batchNo: String,
    count: String,
    strength: Number,
    unevenness: Number,
    results: String,
    testedBy: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  certifications: [{
    name: String, // e.g., BCI Cotton, GOTS
    certificateNo: String,
    validUntil: Date
  }],
  application: [{
    type: String,
    enum: ['warp', 'weft', 'knitting', 'embroidery', 'technical']
  }]
}, {
  timestamps: true
});

// Indexes (yarnCode has unique:true so index is automatic)
yarnSchema.index({ fiber: 1, count: 1 });
yarnSchema.index({ isActive: 1 });

module.exports = mongoose.model('Yarn', yarnSchema);
