const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateInvoicePDF = async (order, customer, items, filePath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // Header
      doc.fontSize(20)
         .text('PM TEXTILES', 50, 50)
         .fontSize(10)
         .text('Production, Inventory & Order Management', 50, 75)
         .text('Contact: info@pmtextiles.com | Phone: +91-1234567890', 50, 90);

      // Invoice Title
      doc.fontSize(20)
         .text('INVOICE', 50, 130);

      // Invoice details
      doc.fontSize(10)
         .text(`Invoice Number: ${order.orderNumber}`, 50, 170)
         .text(`Date: ${new Date(order.orderDate).toLocaleDateString()}`, 50, 185)
         .text(`Due Date: ${new Date(order.deliveryDate).toLocaleDateString()}`, 50, 200);

      // Customer details
      doc.fontSize(12)
         .text('Bill To:', 50, 230)
         .fontSize(10)
         .text(customer.name, 50, 250)
         .text(customer.email, 50, 265)
         .text(customer.phone, 50, 280)
         .text(customer.address || '', 50, 295);

      // Table header
      const tableTop = 350;
      doc.fontSize(10)
         .text('Item', 50, tableTop)
         .text('Quantity', 250, tableTop)
         .text('Price', 350, tableTop)
         .text('Amount', 450, tableTop);

      // Draw line
      doc.moveTo(50, tableTop + 15)
         .lineTo(550, tableTop + 15)
         .stroke();

      // Table items
      let yPosition = tableTop + 30;
      items.forEach(item => {
        doc.text(item.productName || item.name, 50, yPosition)
           .text(item.quantity, 250, yPosition)
           .text(`₹${item.unitPrice.toFixed(2)}`, 350, yPosition)
           .text(`₹${(item.quantity * item.unitPrice).toFixed(2)}`, 450, yPosition);
        yPosition += 25;
      });

      // Totals
      yPosition += 20;
      doc.moveTo(50, yPosition)
         .lineTo(550, yPosition)
         .stroke();

      yPosition += 20;
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const tax = subtotal * 0.18; // 18% GST
      const total = subtotal + tax;

      doc.text('Subtotal:', 350, yPosition)
         .text(`₹${subtotal.toFixed(2)}`, 450, yPosition);

      yPosition += 20;
      doc.text('Tax (18% GST):', 350, yPosition)
         .text(`₹${tax.toFixed(2)}`, 450, yPosition);

      yPosition += 20;
      doc.fontSize(12)
         .text('Total:', 350, yPosition)
         .text(`₹${total.toFixed(2)}`, 450, yPosition);

      // Footer
      doc.fontSize(10)
         .text('Thank you for your business!', 50, 700, { align: 'center' })
         .text('Terms & Conditions Apply', 50, 720, { align: 'center' });

      doc.end();

      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

const generateProductionReportPDF = async (productionData, filePath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // Header
      doc.fontSize(20)
         .text('PM TEXTILES', { align: 'center' })
         .fontSize(16)
         .text('Production Report', { align: 'center' })
         .moveDown();

      // Report details
      doc.fontSize(12)
         .text(`Report Generated: ${new Date().toLocaleString()}`)
         .text(`Period: ${productionData.startDate} to ${productionData.endDate}`)
         .moveDown();

      // Summary
      doc.fontSize(14)
         .text('Summary', { underline: true })
         .fontSize(10)
         .text(`Total Productions: ${productionData.totalProductions}`)
         .text(`Total Quantity Produced: ${productionData.totalQuantity}`)
         .text(`Completed: ${productionData.completed}`)
         .text(`In Progress: ${productionData.inProgress}`)
         .text(`Pending: ${productionData.pending}`)
         .moveDown();

      doc.end();

      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateInvoicePDF,
  generateProductionReportPDF
};
