const mongoose = require('mongoose');

// Model for Energy Management and Carbon Footprint
const energyConsumptionSchema = new mongoose.Schema({
  recordDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  period: {
    type: String,
    enum: ['hourly', 'daily', 'weekly', 'monthly'],
    required: true
  },
  machineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine'
  },
  machineCode: String,
  machineName: String,
  department: {
    type: String,
    enum: ['production', 'quality', 'maintenance', 'admin', 'overall']
  },
  productionPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductionPlan'
  },
  energyType: {
    type: String,
    enum: ['electricity', 'gas', 'diesel', 'coal', 'steam', 'other'],
    required: true
  },
  consumption: {
    value: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      enum: ['kWh', 'MWh', 'kJ', 'MJ', 'liters', 'kg', 'm3'],
      required: true
    }
  },
  cost: {
    perUnit: Number,
    total: {
      type: Number,
      default: 0
    }
  },
  productionOutput: {
    quantity: Number,
    uom: String
  },
  energyIntensity: {
    type: Number, // Energy per unit of production
    default: 0
  },
  carbonEmissions: {
    co2: {
      type: Number,
      default: 0
    },
    ch4: {
      type: Number,
      default: 0
    },
    n2o: {
      type: Number,
      default: 0
    },
    totalCO2e: {
      type: Number, // Total CO2 equivalent
      default: 0
    },
    unit: {
      type: String,
      default: 'kg CO2e'
    }
  },
  efficiency: {
    type: Number, // Percentage
    min: 0,
    max: 100
  },
  meterReading: {
    start: Number,
    end: Number,
    meterId: String
  },
  benchmark: {
    target: Number,
    variance: Number,
    status: {
      type: String,
      enum: ['within_target', 'above_target', 'below_target']
    }
  },
  sustainabilityMetrics: {
    renewablePercentage: Number,
    wasteHeatRecovery: Number
  },
  notes: String,
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Calculate totals before saving
energyConsumptionSchema.pre('save', function(next) {
  // Calculate total cost
  if (this.cost.perUnit) {
    this.cost.total = this.consumption.value * this.cost.perUnit;
  }

  // Calculate energy intensity
  if (this.productionOutput && this.productionOutput.quantity > 0) {
    this.energyIntensity = this.consumption.value / this.productionOutput.quantity;
  }

  // Calculate carbon emissions (simplified - using average emission factors)
  const emissionFactors = {
    'electricity': 0.85, // kg CO2e per kWh
    'gas': 2.75, // kg CO2e per m3
    'diesel': 2.68, // kg CO2e per liter
    'coal': 2.42, // kg CO2e per kg
  };

  if (emissionFactors[this.energyType]) {
    this.carbonEmissions.totalCO2e = this.consumption.value * emissionFactors[this.energyType];
  }

  next();
});

energyConsumptionSchema.index({ recordDate: -1, machineId: 1 });
energyConsumptionSchema.index({ department: 1, period: 1 });

module.exports = mongoose.model('EnergyConsumption', energyConsumptionSchema);
