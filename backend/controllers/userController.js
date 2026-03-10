const bcrypt = require('bcryptjs');
const User = require('../models/User');

const getDefaultPermissionsByRole = (role) => {
  switch (role) {
    case 'admin':
      return ['system_admin'];
    case 'production_manager':
      return ['view_production', 'manage_production', 'view_inventory', 'view_reports'];
    case 'store_manager':
      return ['view_inventory', 'manage_inventory', 'view_production', 'view_reports'];
    case 'sales_executive':
      return ['view_orders', 'manage_orders', 'view_customers', 'manage_customers', 'view_reports'];
    case 'qa_inspector':
      return ['view_production', 'view_inventory', 'view_reports'];
    case 'management':
      return ['view_production', 'view_inventory', 'view_orders', 'view_reports'];
    default:
      return [];
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only)
exports.getUsers = async (req, res, next) => {
  try {
    const { role, isActive } = req.query;

    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin only)
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create user
// @route   POST /api/users
// @access  Private (Admin only)
exports.createUser = async (req, res, next) => {
  try {
    const { username, email, password, fullName, role, permissions, isActive } = req.body;

    // Validate required fields
    if (!username || !email || !password || !fullName || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
        errors: [
          { field: 'username', message: !username ? 'Username is required' : null },
          { field: 'email', message: !email ? 'Email is required' : null },
          { field: 'password', message: !password ? 'Password is required' : null },
          { field: 'fullName', message: !fullName ? 'Full name is required' : null },
          { field: 'role', message: !role ? 'Role is required' : null }
        ].filter(e => e.message)
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ username }, { email }] });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      username,
      email,
      password: hashedPassword,
      fullName,
      role,
      createdBy: req.user._id
    };

    // Normalize permissions: empty/missing permissions fall back to role defaults.
    const normalizedPermissions = Array.isArray(permissions)
      ? permissions.filter(Boolean)
      : [];
    userData.permissions = normalizedPermissions.length > 0
      ? normalizedPermissions
      : getDefaultPermissionsByRole(role);

    if (typeof isActive === 'boolean') {
      userData.isActive = isActive;
    }

    const user = await User.create(userData);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        permissions: user.permissions,
        isActive: user.isActive
      }
    });
  } catch (error) {
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin only)
exports.updateUser = async (req, res, next) => {
  try {
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow password update through this route
    const { password, ...updateData } = req.body;

    // Keep permissions safe: role changes or empty permission arrays should not break access.
    const targetRole = updateData.role || user.role;
    if (Array.isArray(updateData.permissions)) {
      const cleaned = updateData.permissions.filter(Boolean);
      updateData.permissions = cleaned.length > 0
        ? cleaned
        : getDefaultPermissionsByRole(targetRole);
    } else if (updateData.role && updateData.role !== user.role) {
      updateData.permissions = getDefaultPermissionsByRole(targetRole);
    }

    user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    }).select('-password');

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting own account
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
