const Supplier = require('../models/Supplier');
const { broadcastToAll, emitToRole } = require('../services/socketService');

const normalizeSupplierPayload = (payload = {}) => {
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

  if (normalized.category === 'packaging') {
    normalized.category = 'consumables';
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

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private
exports.getSuppliers = async (req, res, next) => {
  try {
    const { category, isActive, page = 1, limit = 50 } = req.query;

    const query = {};
    if (category) query.category = category === 'packaging' ? 'consumables' : category;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const suppliers = await Supplier.find(query)
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Supplier.countDocuments(query);

    res.json({
      success: true,
      count: suppliers.length,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: suppliers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single supplier
// @route   GET /api/suppliers/:id
// @access  Private
exports.getSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create supplier
// @route   POST /api/suppliers
// @access  Private
exports.createSupplier = async (req, res, next) => {
  try {
    // Generate supplier code
    const count = await Supplier.countDocuments();
    const code = `SUPP-${String(count + 1).padStart(5, '0')}`;

    const supplier = await Supplier.create({
      ...normalizeSupplierPayload(req.body),
      code
    });

    // Emit real-time event
    emitToRole('store_manager', 'supplier_created', {
      code: supplier.code,
      name: supplier.name,
      category: supplier.category,
      timestamp: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: supplier
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private
exports.updateSupplier = async (req, res, next) => {
  try {
    let supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    supplier = await Supplier.findByIdAndUpdate(req.params.id, normalizeSupplierPayload(req.body), {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      message: 'Supplier updated successfully',
      data: supplier
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Private (Admin only)
exports.deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    await Supplier.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
