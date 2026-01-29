const ExcelJS = require('exceljs');

const exportToExcel = async (data, columns, filePath, sheetName = 'Sheet1') => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // Add columns
  worksheet.columns = columns;

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4CAF50' }
  };

  // Add rows
  data.forEach(item => {
    worksheet.addRow(item);
  });

  // Auto-fit columns
  worksheet.columns.forEach(column => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, cell => {
      const columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = maxLength < 10 ? 10 : maxLength + 2;
  });

  // Save to file
  await workbook.xlsx.writeFile(filePath);
  return filePath;
};

const exportInventoryToExcel = async (inventoryData, filePath) => {
  const columns = [
    { header: 'Item Name', key: 'name', width: 30 },
    { header: 'SKU', key: 'sku', width: 15 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Current Stock', key: 'currentStock', width: 15 },
    { header: 'Min Level', key: 'minStockLevel', width: 15 },
    { header: 'Max Level', key: 'maxStockLevel', width: 15 },
    { header: 'Unit', key: 'unit', width: 10 },
    { header: 'Unit Price', key: 'unitPrice', width: 15 },
    { header: 'Status', key: 'status', width: 15 }
  ];

  return exportToExcel(inventoryData, columns, filePath, 'Inventory');
};

const exportOrdersToExcel = async (ordersData, filePath) => {
  const columns = [
    { header: 'Order Number', key: 'orderNumber', width: 20 },
    { header: 'Customer', key: 'customerName', width: 25 },
    { header: 'Order Date', key: 'orderDate', width: 15 },
    { header: 'Delivery Date', key: 'deliveryDate', width: 15 },
    { header: 'Total Amount', key: 'totalAmount', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Priority', key: 'priority', width: 12 }
  ];

  return exportToExcel(ordersData, columns, filePath, 'Orders');
};

const exportProductionToExcel = async (productionData, filePath) => {
  const columns = [
    { header: 'Production Number', key: 'productionNumber', width: 20 },
    { header: 'Product', key: 'productName', width: 25 },
    { header: 'Quantity', key: 'quantity', width: 12 },
    { header: 'Start Date', key: 'startDate', width: 15 },
    { header: 'End Date', key: 'endDate', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Progress', key: 'progress', width: 12 }
  ];

  return exportToExcel(productionData, columns, filePath, 'Production');
};

const importFromExcel = async (filePath) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  
  const worksheet = workbook.getWorksheet(1);
  const data = [];
  
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) { // Skip header
      const rowData = {};
      row.eachCell((cell, colNumber) => {
        const column = worksheet.getColumn(colNumber);
        rowData[column.key] = cell.value;
      });
      data.push(rowData);
    }
  });
  
  return data;
};

module.exports = {
  exportToExcel,
  exportInventoryToExcel,
  exportOrdersToExcel,
  exportProductionToExcel,
  importFromExcel
};
