const { validationResult } = require('express-validator');

// Validation result checker middleware
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  
  next();
};

// Common validation rules
const { body, param, query } = require('express-validator');

exports.loginValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
];

exports.registerValidation = [
  body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('role').isIn(['admin', 'production_manager', 'store_manager', 'sales_executive', 'qa_inspector', 'management'])
    .withMessage('Invalid role')
];

exports.idValidation = [
  param('id').isMongoId().withMessage('Invalid ID format')
];

exports.orderValidation = [
  body('customerId').isMongoId().withMessage('Invalid customer ID'),
  body('promiseDate').isISO8601().withMessage('Invalid promise date'),
  body('items').isArray({ min: 1 }).withMessage('Order must have at least one item')
];

exports.productionPlanValidation = [
  body('startDate').isISO8601().withMessage('Invalid start date'),
  body('endDate').isISO8601().withMessage('Invalid end date'),
  body('productDetails.targetQuantity').isFloat({ min: 0 }).withMessage('Target quantity must be positive')
];
