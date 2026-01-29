const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { validate, idValidation, registerValidation } = require('../middleware/validation');

router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .get(getUsers)
  .post(registerValidation, validate, createUser);

router.route('/:id')
  .get(idValidation, validate, getUser)
  .put(idValidation, validate, updateUser)
  .delete(idValidation, validate, deleteUser);

module.exports = router;
