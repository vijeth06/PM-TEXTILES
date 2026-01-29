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
transporter.verify((error, success) => {
  if (error) {
    console.log('Email service error:', error);
  } else {
    console.log('✅ Email service is ready');
  }
});

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
  })
};

module.exports = {
  sendEmail,
  emailTemplates
};
