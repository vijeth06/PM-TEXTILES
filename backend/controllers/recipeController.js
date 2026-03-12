const Recipe = require('../models/Recipe');

exports.getRecipes = async (req, res) => {
  try {
    const { status, productCode } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (productCode) filter.productCode = String(productCode).toUpperCase();

    const recipes = await Recipe.find(filter)
      .populate('productId', 'productCode productName')
      .populate('createdBy', 'username fullName')
      .sort({ updatedAt: -1 });

    res.json({ success: true, count: recipes.length, data: recipes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id)
      .populate('productId', 'productCode productName')
      .populate('createdBy', 'username fullName')
      .populate('approvedBy', 'username fullName');

    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Recipe not found' });
    }

    res.json({ success: true, data: recipe });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createRecipe = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      recipeCode: String(req.body.recipeCode || '').toUpperCase(),
      createdBy: req.user._id
    };

    const exists = await Recipe.findOne({ recipeCode: payload.recipeCode });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Recipe code already exists' });
    }

    const recipe = await Recipe.create(payload);
    res.status(201).json({ success: true, data: recipe });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Recipe not found' });
    }

    Object.assign(recipe, req.body);
    if (req.body.status === 'active') {
      recipe.approvedBy = req.user._id;
    }

    await recipe.save();

    res.json({ success: true, data: recipe });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Recipe not found' });
    }

    await recipe.deleteOne();
    res.json({ success: true, message: 'Recipe deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
