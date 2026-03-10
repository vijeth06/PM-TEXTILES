const Customer = require('../models/Customer');
const Order = require('../models/Order');
const { broadcastToAll, emitToRole } = require('../services/socketService');

const normalizeCustomerPayload = (payload = {}) => {
  const normalized = { ...payload };

  if (typeof normalized.contactPerson === 'string') {
    normalized.contactPerson = {
      name: normalized.contactPerson,
      phone: normalized.phone || '',
      email: normalized.email || ''
    };
  }

  if (normalized.city || normalized.state || normalized.pincode || typeof normalized.address === 'string') {
    const existingAddress = typeof normalized.address === 'object' && normalized.address !== null
      ? normalized.address
      : {};

    normalized.address = {
      ...existingAddress,
      line1: typeof normalized.address === 'string' ? normalized.address : existingAddress.line1,
      city: normalized.city || existingAddress.city,
      state: normalized.state || existingAddress.state,
      pincode: normalized.pincode || existingAddress.pincode,
      country: existingAddress.country || 'India'
    };
  }

  if (normalized.gstNo && !normalized.gstin) {
    normalized.gstin = normalized.gstNo;
  }

  if (typeof normalized.paymentTerms === 'number' || /^\d+$/.test(String(normalized.paymentTerms || ''))) {
    normalized.creditPeriod = Number(normalized.paymentTerms);
    normalized.paymentTerms = 'credit';
  }

  delete normalized.city;
  delete normalized.state;
  delete normalized.pincode;
  delete normalized.gstNo;

  return normalized;
};

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
exports.getCustomers = async (req, res, next) => {
  try {
    const { type, isActive, search, page = 1, limit = 50 } = req.query;

    const query = {};
    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: regex },
        { code: regex },
        { email: regex },
        { phone: regex },
        { 'contactPerson.name': regex }
      ];
    }

    const customers = await Customer.find(query)
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Customer.countDocuments(query);

    res.json({
      success: true,
      count: customers.length,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: customers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
exports.getCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get recent orders
    const recentOrders = await Order.find({ customerId: customer._id })
      .sort({ orderDate: -1 })
      .limit(10)
      .select('orderNo orderDate totalValue status');

    res.json({
      success: true,
      data: {
        ...customer.toObject(),
        recentOrders
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create customer
// @route   POST /api/customers
// @access  Private
exports.createCustomer = async (req, res, next) => {
  try {
    // Generate customer code
    const count = await Customer.countDocuments();
    const code = `CUST-${String(count + 1).padStart(5, '0')}`;

    const customer = await Customer.create({
      ...normalizeCustomerPayload(req.body),
      code
    });

    // Emit real-time event
    emitToRole('sales_executive', 'customer_created', {
      code: customer.code,
      name: customer.name,
      type: customer.type,
      timestamp: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
exports.updateCustomer = async (req, res, next) => {
  try {
    let customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    customer = await Customer.findByIdAndUpdate(req.params.id, normalizeCustomerPayload(req.body), {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private (Admin only)
exports.deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Check for existing orders
    const orderCount = await Order.countDocuments({ customerId: customer._id });
    if (orderCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete customer with existing orders. Consider deactivating instead.'
      });
    }

    await Customer.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
