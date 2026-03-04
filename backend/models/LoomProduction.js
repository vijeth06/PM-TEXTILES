const mongoose = require('mongoose');

// Model for Loom/Weaving Production - Textile Specific
const loomProductionSchema = new mongoose.Schema({
  loomNo: {
    type: String,
    required: true
  },
  loomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine'
  },
  productionDate: {
    type: Date,
    default: Date.now
  },
  shift: {
    type: String,
    enum: ['morning', 'evening', 'night'],
    required: true
  },
  fabric: {
    fabricId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fabric'
    },
    fabricCode: String,
    fabricName: String,
    sortNo: String, // Design/Sort number
    reedWidth: Number, // in inches
    cuttableWidth: Number
  },
  warp: {
    yarnId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Yarn'
    },
    yarnCode: String,
    count: String,
    color: String,
    beamNo: String,
    warpLength: Number, // in meters
    ends: Number,
    cramming: String // e.g., 2-2, 1-1
  },
  weft: [{
    yarnId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Yarn'
    },
    yarnCode: String,
    count: String,
    color: String,
    pirns: Number,
    consumptionPerMeter: Number
  }],
  production: {
    targetMeters: Number,
    actualProduction: Number,
    picks: Number, // Total picks
    rpm: Number, // Revolutions per minute
    efficiency: Number, // percentage
    runningTime: Number, // in minutes
    idleTime: Number,
    breakdownTime: Number
  },
  quality: {
    firstQuality: Number, // meters
    secondQuality: Number,
    thirdQuality: Number,
    rejection: Number,
    defects: [{
      defectType: {
        type: String,
        enum: ['missing_end', 'broken_pick', 'slub', 'contamination', 'wrong_draft', 'selvedge_defect', 'other']
      },
      count: Number,
      severity: {
        type: String,
        enum: ['critical', 'major', 'minor']
      }
    }]
  },
  stoppages: [{
    reason: {
      type: String,
      enum: ['warp_break', 'weft_break', 'mechanical', 'power_cut', 'changeover', 'other']
    },
    count: Number,
    totalTime: Number // in minutes
  }],
  weaver: {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    name: String,
    skill: {
      type: String,
      enum: ['trainee', 'semi_skilled', 'skilled', 'master_weaver']
    }
  },
  supervisor: String,
  rollsProduced: [{
    rollNo: String,
    meters: Number,
    weight: Number,
    grade: {
      type: String,
      enum: ['A', 'B', 'C', 'rejec']
    }
  }],
  powerConsumption: Number, // in units (kWh)
  remarks: String,
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'stopped'],
    default: 'in_progress'
  }
}, {
  timestamps: true
});

// Calculate efficiency before saving
loomProductionSchema.pre('save', function(next) {
  if (this.production && this.production.runningTime && this.production.runningTime > 0) {
    const totalTime = this.production.runningTime + (this.production.idleTime || 0) + (this.production.breakdownTime || 0);
    this.production.efficiency = (this.production.runningTime / totalTime) * 100;
  }
  next();
});

loomProductionSchema.index({ loomNo: 1, productionDate: -1 });
loomProductionSchema.index({ shift: 1, productionDate: -1 });
loomProductionSchema.index({ status: 1 });

module.exports = mongoose.model('LoomProduction', loomProductionSchema);
