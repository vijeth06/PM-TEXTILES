const express = require('express');
const router = express.Router();

const {
  getItems,
  getItem,
  createItem,
  updateItem,
  deleteItem
} = require('../controllers/itemMasterController');

const { protect, authorize, checkPermission } = require('../middleware/auth');
const { validate, idValidation } = require('../middleware/validation');

router.use(protect);

// Query param `type` is required: RawMaterial | SemiFinishedGood | FinishedGood
router.route('/')
  .get(checkPermission('view_inventory'), getItems)
  .post(checkPermission('manage_inventory'), createItem);

router.route('/:id')
  .get(checkPermission('view_inventory'), idValidation, validate, getItem)
  .put(checkPermission('manage_inventory'), idValidation, validate, updateItem)
  .delete(checkPermission('manage_inventory'), authorize('admin'), idValidation, validate, deleteItem);

module.exports = router;
