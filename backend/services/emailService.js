const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Verify connection configuration
const hasEmailCreds = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);
const hasPlaceholderCreds =
  /your-email/i.test(process.env.EMAIL_USER || '') ||
  /your-app-password/i.test(process.env.EMAIL_PASSWORD || '') ||
  /example/i.test(process.env.EMAIL_USER || '');

const initEmailService = () => {
  if (!hasEmailCreds || hasPlaceholderCreds) {
    console.log('ℹ️ Email service disabled (missing or placeholder EMAIL credentials)');
    return false;
  }

  transporter.verify((error) => {
    if (error) {
      console.log('Email service error:', error);
    } else {
      console.log('✅ Email service is ready');
    }
  });

  return true;
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'PM Textiles ERP'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    });

    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Email templates
const emailTemplates = {
  passwordReset: (resetUrl, userName) => ({
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hi ${userName},</p>
        <p>You requested to reset your password. Click the button below to reset it:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">PM Textiles ERP System</p>
      </div>
    `
  }),

  orderConfirmation: (order, customer) => ({
    subject: `Order Confirmation - #${order.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Order Confirmation</h2>
        <p>Dear ${customer.name},</p>
        <p>Your order has been confirmed!</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p><strong>Order Date:</strong> ${new Date(order.orderDate).toLocaleDateString()}</p>
          <p><strong>Total Amount:</strong> ₹${order.totalAmount.toLocaleString()}</p>
          <p><strong>Status:</strong> ${order.status}</p>
        </div>
        <p>We'll notify you when your order is ready for dispatch.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">PM Textiles ERP System</p>
      </div>
    `
  }),

  lowStockAlert: (items) => ({
    subject: '⚠️ Low Stock Alert',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff9800;">⚠️ Low Stock Alert</h2>
        <p>The following items are running low on stock:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #f5f5f5;">
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Item</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Current Stock</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Min Level</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">${item.name}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${item.currentStock}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${item.minLevel}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p>Please reorder these items soon.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">PM Textiles ERP System</p>
      </div>
    `
  }),

  productionComplete: (production) => ({
    subject: `Production Completed - ${production.productionNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">✅ Production Completed</h2>
        <p>Production has been completed successfully!</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p><strong>Production Number:</strong> ${production.productionNumber}</p>
          <p><strong>Product:</strong> ${production.productName}</p>
          <p><strong>Quantity:</strong> ${production.quantity}</p>
          <p><strong>Completion Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">PM Textiles ERP System</p>
      </div>
    `
  }),

  orderDispatched: (order, customer) => ({
    subject: `Order Dispatched - #${order.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2196F3;">🚚 Order Dispatched</h2>
        <p>Dear ${customer.name},</p>
        <p>Great news! Your order has been dispatched.</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p><strong>Dispatch Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Vehicle Number:</strong> ${order.dispatchDetails?.vehicleNumber || 'N/A'}</p>
          <p><strong>Driver:</strong> ${order.dispatchDetails?.driverName || 'N/A'}</p>
        </div>
        <p>Your order will reach you soon!</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">PM Textiles ERP System</p>
      </div>
    `
  }),

  qualityCheckFailed: (qualityCheck, batch) => ({
    subject: `⚠️ Quality Check Failed - Batch #${batch.batchNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f44336;">⚠️ Quality Check Failed</h2>
        <p>A quality check has failed and requires immediate attention.</p>
        <div style="background: #ffebee; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #f44336;">
          <p><strong>Batch Number:</strong> ${batch.batchNumber}</p>
          <p><strong>Product:</strong> ${batch.productName}</p>
          <p><strong>Issue:</strong> ${qualityCheck.remarks}</p>
          <p><strong>Inspector:</strong> ${qualityCheck.inspectorName}</p>
          <p><strong>Date:</strong> ${new Date(qualityCheck.checkDate).toLocaleDateString()}</p>
        </div>
        <p style="color: #f44336; font-weight: bold;">Action Required: Review and address the quality issues.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">PM Textiles ERP System</p>
      </div>
    `
  }),

  paymentReceived: (payment, order, customer) => ({
    subject: `Payment Received - Order #${order.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">✅ Payment Received</h2>
        <p>Dear ${customer.name},</p>
        <p>We have received your payment. Thank you!</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p><strong>Payment Amount:</strong> ₹${payment.amount.toLocaleString()}</p>
          <p><strong>Payment Method:</strong> ${payment.paymentMethod}</p>
          <p><strong>Transaction ID:</strong> ${payment.transactionId}</p>
          <p><strong>Date:</strong> ${new Date(payment.paymentDate).toLocaleDateString()}</p>
        </div>
        <p>A receipt has been generated for your records.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">PM Textiles ERP System</p>
      </div>
    `
  }),

  supplierOrderCreated: (purchaseOrder, supplier) => ({
    subject: `New Purchase Order - #${purchaseOrder.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Purchase Order</h2>
        <p>Dear ${supplier.name},</p>
        <p>We have created a new purchase order for your reference.</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p><strong>PO Number:</strong> ${purchaseOrder.orderNumber}</p>
          <p><strong>Order Date:</strong> ${new Date(purchaseOrder.orderDate).toLocaleDateString()}</p>
          <p><strong>Expected Delivery:</strong> ${new Date(purchaseOrder.expectedDelivery).toLocaleDateString()}</p>
          <p><strong>Total Amount:</strong> ₹${purchaseOrder.totalAmount.toLocaleString()}</p>
        </div>
        <p>Please confirm the order and expected delivery date.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">PM Textiles ERP System</p>
      </div>
    `
  })
};

module.exports = {
  initEmailService,
  sendEmail,
  emailTemplates
};
