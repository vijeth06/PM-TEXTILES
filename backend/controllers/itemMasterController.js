const RawMaterial = require('../models/RawMaterial');
const SemiFinishedGood = require('../models/SemiFinishedGood');
const FinishedGood = require('../models/FinishedGood');

const MODEL_BY_TYPE = {
  RawMaterial,
  SemiFinishedGood,
  FinishedGood
};

const toType = (type) => {
  if (!type) return null;
  return String(type);
};

const getModel = (type) => {
  const normalized = toType(type);
  const model = MODEL_BY_TYPE[normalized];
  if (!model) {
    const err = new Error('Invalid item type');
    err.statusCode = 400;
    throw err;
  }
  return model;
};

const generateCode = async (prefix, Model) => {
  const count = await Model.countDocuments();
  return `${prefix}-${String(count + 1).padStart(5, '0')}`;
};

// Generic master CRUD (RawMaterial / SemiFinishedGood / FinishedGood)
exports.getItems = async (req, res, next) => {
  try {
    const { type, isActive, page = 1, limit = 50, q } = req.query;
    const Model = getModel(type);

    const query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (q) {
      query.$or = [
        { code: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } }
      ];
    }

    const items = await Model.find(query)
      .sort({ name: 1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const count = await Model.countDocuments(query);

    res.json({
      success: true,
      count: items.length,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      data: items
    });
  } catch (error) {
    next(error);
  }
};

exports.getItem = async (req, res, next) => {
  try {
    const { type } = req.query;
    const Model = getModel(type);

    const item = await Model.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

exports.createItem = async (req, res, next) => {
  try {
    const { type } = req.query;
    const Model = getModel(type);

    const payload = { ...req.body };

    // Allow both: manual code or auto-generated
    if (!payload.code) {
      const prefix = type === 'RawMaterial' ? 'RM' : type === 'SemiFinishedGood' ? 'SFG' : 'FG';
      payload.code = await generateCode(prefix, Model);
    }

    const created = await Model.create(payload);

    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: created
    });
  } catch (error) {
    next(error);
  }
};

exports.updateItem = async (req, res, next) => {
  try {
    const { type } = req.query;
    const Model = getModel(type);

    const item = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.json({
      success: true,
      message: 'Item updated successfully',
      data: item
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteItem = async (req, res, next) => {
  try {
    const { type } = req.query;
    const Model = getModel(type);

    const item = await Model.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    await item.deleteOne();

    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    next(error);
  }
};
