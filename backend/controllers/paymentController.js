const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { emitToUser, broadcastToAll } = require('../services/socketService');
const { sendEmail, emailTemplates } = require('../services/emailService');

// Get all payments
exports.getPayments = async (req, res) => {
  try {
    const { orderId, status, startDate, endDate } = req.query;
    const filter = {};

    if (orderId) filter.order = orderId;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.paymentDate = {};
      if (startDate) filter.paymentDate.$gte = new Date(startDate);
      if (endDate) filter.paymentDate.$lte = new Date(endDate);
    }

    const payments = await Payment.find(filter)
      .populate('order')
      .populate('createdBy', 'name email')
      .sort({ paymentDate: -1 });

    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single payment
exports.getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('order')
      .populate('createdBy', 'name email');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create payment
exports.createPayment = async (req, res) => {
  try {
    const { order, amount, paymentMethod, transactionId, reference, notes } = req.body;

    // Check if order exists
    const orderDoc = await Order.findById(order).populate('customer');
    if (!orderDoc) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const payment = new Payment({
      order,
      amount,
      paymentMethod,
      transactionId,
      reference,
      notes,
      status: 'completed',
      createdBy: req.user._id
    });

    await payment.save();

    // Update order payment status
    const totalPaid = await Payment.aggregate([
      { $match: { order: orderDoc._id, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const paidAmount = totalPaid.length > 0 ? totalPaid[0].total : 0;
    
    if (paidAmount >= orderDoc.totalAmount) {
      orderDoc.paymentStatus = 'paid';
    } else if (paidAmount > 0) {
      orderDoc.paymentStatus = 'partial';
    }

    await orderDoc.save();

    // Send real-time notification
    emitToUser(req.user._id, 'payment_received', {
      payment,
      order: orderDoc
    });

    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update payment
exports.updatePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get payment summary for order
exports.getOrderPaymentSummary = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const payments = await Payment.find({ order: req.params.orderId });
    
    const summary = {
      totalAmount: order.totalAmount,
      paidAmount: payments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0),
      pendingAmount: 0,
      payments: payments
    };

    summary.pendingAmount = summary.totalAmount - summary.paidAmount;

    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = exports;
