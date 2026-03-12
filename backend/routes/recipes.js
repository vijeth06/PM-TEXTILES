const express = require('express');
const router = express.Router();
const {
  getRecipes,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe
} = require('../controllers/recipeController');
const { protect, authorize } = require('../middleware/auth');
const { cache, invalidateCacheAfter } = require('../middleware/cache');

router.use(protect);

router
  .route('/')
  .get(cache(300), getRecipes)
  .post(
    authorize('admin', 'management', 'production_manager'),
    invalidateCacheAfter('cache:/api/recipes*'),
    createRecipe
  );

router
  .route('/:id')
  .get(cache(300), getRecipe)
  .put(
    authorize('admin', 'management', 'production_manager'),
    invalidateCacheAfter('cache:/api/recipes*'),
    updateRecipe
  )
  .delete(
    authorize('admin', 'management'),
    invalidateCacheAfter('cache:/api/recipes*'),
    deleteRecipe
  );

module.exports = router;
