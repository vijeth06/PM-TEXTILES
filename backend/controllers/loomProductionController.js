const LoomProduction = require('../models/LoomProduction');
const Fabric = require('../models/Fabric');
const Yarn = require('../models/Yarn');
const Employee = require('../models/Employee');

// Get all loom productions
exports.getAllLoomProductions = async (req, res) => {
  try {
    const { startDate, endDate, loomNo, status, shift } = req.query;
    const filter = {};

    if (startDate && endDate) {
      filter.productionDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (loomNo) filter.loomNo = loomNo;
    if (status) filter.status = status;
    if (shift) filter.shift = shift;

    const productions = await LoomProduction.find(filter)
      .populate('fabric.fabricId', 'fabricName fabricCode')
      .populate('warp.yarnId', 'yarnName yarnCode')
      .populate('weaver.employeeId', 'name')
      .sort({ productionDate: -1 });

    res.json(productions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get loom production by ID
exports.getLoomProductionById = async (req, res) => {
  try {
    const production = await LoomProduction.findById(req.params.id)
      .populate('fabric.fabricId')
      .populate('warp.yarnId')
      .populate('weft.yarnId')
      .populate('weaver.employeeId');

    if (!production) {
      return res.status(404).json({ message: 'Loom production not found' });
    }

    res.json(production);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create loom production
exports.createLoomProduction = async (req, res) => {
  try {
    const production = new LoomProduction(req.body);
    await production.save();

    res.status(201).json(production);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update loom production
exports.updateLoomProduction = async (req, res) => {
  try {
    const production = await LoomProduction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!production) {
      return res.status(404).json({ message: 'Loom production not found' });
    }

    res.json(production);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete loom production
exports.deleteLoomProduction = async (req, res) => {
  try {
    const production = await LoomProduction.findByIdAndDelete(req.params.id);

    if (!production) {
      return res.status(404).json({ message: 'Loom production not found' });
    }

    res.json({ message: 'Loom production deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get efficiency dashboard
exports.getEfficiencyDashboard = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};

    if (startDate && endDate) {
      dateFilter.productionDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else {
      // Default to last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      dateFilter.productionDate = { $gte: sevenDaysAgo };
    }

    const productions = await LoomProduction.find(dateFilter);

    // Calculate overall metrics
    const totalLooms = await LoomProduction.distinct('loomNo').length;
    const avgEfficiency = productions.reduce((sum, p) => sum + (p.production.efficiency || 0), 0) / productions.length || 0;
    const totalProduction = productions.reduce((sum, p) => sum + (p.production.actualProduction || 0), 0);
    const totalTarget = productions.reduce((sum, p) => sum + (p.production.targetMeters || 0), 0);

    // Loom-wise efficiency
    const loomEfficiency = productions.reduce((acc, p) => {
      if (!acc[p.loomNo]) {
        acc[p.loomNo] = { total: 0, count: 0 };
      }
      acc[p.loomNo].total += p.production.efficiency || 0;
      acc[p.loomNo].count += 1;
      return acc;
    }, {});

    const loomStats = Object.entries(loomEfficiency).map(([loom, data]) => ({
      loomNo: loom,
      avgEfficiency: data.total / data.count
    }));

    // Weaver performance
    const weaverPerformance = productions.reduce((acc, p) => {
      const weaver = p.weaver.name;
      if (!acc[weaver]) {
        acc[weaver] = { production: 0, count: 0, efficiency: 0 };
      }
      acc[weaver].production += p.production.actualProduction || 0;
      acc[weaver].efficiency += p.production.efficiency || 0;
      acc[weaver].count += 1;
      return acc;
    }, {});

    const weaverStats = Object.entries(weaverPerformance).map(([weaver, data]) => ({
      weaver,
      totalProduction: data.production,
      avgEfficiency: data.efficiency / data.count
    }));

    // Defect analysis
    const defectStats = productions.reduce((acc, p) => {
      if (p.quality.defects) {
        p.quality.defects.forEach(defect => {
          if (!acc[defect.defectType]) {
            acc[defect.defectType] = 0;
          }
          acc[defect.defectType] += defect.count || 0;
        });
      }
      return acc;
    }, {});

    res.json({
      summary: {
        totalLooms,
        avgEfficiency: avgEfficiency.toFixed(2),
        totalProduction,
        totalTarget,
        achievementRate: ((totalProduction / totalTarget) * 100).toFixed(2)
      },
      loomStats,
      weaverStats,
      defectStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Record defect
exports.recordDefect = async (req, res) => {
  try {
    const { id } = req.params;
    const { defectType, count, severity } = req.body;

    const production = await LoomProduction.findById(id);
    if (!production) {
      return res.status(404).json({ message: 'Loom production not found' });
    }

    production.quality.defects.push({ defectType, count, severity });
    await production.save();

    res.json(production);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Record stoppage
exports.recordStoppage = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, count, totalTime } = req.body;

    const production = await LoomProduction.findById(id);
    if (!production) {
      return res.status(404).json({ message: 'Loom production not found' });
    }

    production.stoppages.push({ reason, count, totalTime });
    await production.save();

    res.json(production);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get live loom status
exports.getLiveLoomStatus = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const liveProductions = await LoomProduction.find({
      productionDate: { $gte: today },
      status: { $in: ['in_progress', 'stopped'] }
    }).populate('fabric.fabricId', 'fabricName')
      .populate('weaver.employeeId', 'name');

    const loomStatus = liveProductions.map(p => ({
      loomNo: p.loomNo,
      status: p.status,
      fabric: p.fabric.fabricName || p.fabric.fabricCode,
      efficiency: p.production.efficiency,
      production: p.production.actualProduction,
      target: p.production.targetMeters,
      weaver: p.weaver.name,
      shift: p.shift
    }));

    res.json(loomStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = exports;
