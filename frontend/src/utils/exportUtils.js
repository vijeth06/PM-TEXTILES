// Export utilities for PDF and Excel generation

// Install required packages:
// npm install jspdf jspdf-autotable xlsx file-saver

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * Export data to PDF
 * @param {Object} options - Export options
 * @param {string} options.title - Document title
 * @param {Array} options.headers - Table headers
 * @param {Array} options.data - Table data
 * @param {string} options.filename - Output filename
 * @param {Object} options.orientation - 'portrait' or 'landscape'
 */
export const exportToPDF = ({
  title,
  headers,
  data,
  filename = 'report.pdf',
  orientation = 'portrait',
  summary = null
}) => {
  try {
    const doc = new jsPDF(orientation);
    const cleanText = (value) => String(value ?? '').replace(/[\r\n]+/g, ' ').trim();
    
    // Add title
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(title, 14, 20);
    
    // Add date
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(cleanText(`Generated: ${new Date().toLocaleString()}`), 14, 28);
    
    let startY = 35;

    // Add summary section if provided
    if (summary) {
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Summary', 14, startY);
      startY += 7;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      Object.entries(summary).forEach(([key, value], index) => {
        doc.text(cleanText(`${key}: ${value}`), 14, startY + (index * 5));
      });
      startY += Object.keys(summary).length * 5 + 5;
    }

    const normalizedHeaders = (headers || []).map((h) => cleanText(h));
    const normalizedData = (data || []).map((row) => row.map((cell) => cleanText(cell)));

    // Add table
    doc.autoTable({
      startY: startY,
      head: [normalizedHeaders],
      body: normalizedData,
      theme: 'grid',
      headStyles: {
        fillColor: [59, 130, 246], // Blue
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        overflow: 'linebreak'
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 35 },
        2: { cellWidth: 35 },
        3: { cellWidth: 35 }
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      }
    });

    // Add footer with page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    doc.save(filename);
    return true;
  } catch (error) {
    console.error('PDF Export Error:', error);
    return false;
  }
};

/**
 * Export data to Excel
 * @param {Object} options - Export options
 * @param {string} options.filename - Output filename
 * @param {Array} options.sheets - Array of sheet configurations
 */
export const exportToExcel = ({
  filename = 'report.xlsx',
  sheets = []
}) => {
  try {
    const workbook = XLSX.utils.book_new();

    sheets.forEach(sheet => {
      const { name, data, headers } = sheet;
      
      // Combine headers and data
      const wsData = headers ? [headers, ...data] : data;
      
      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(wsData);
      
      // Set column widths
      const colWidths = headers 
        ? headers.map(() => ({ wch: 15 }))
        : [];
      worksheet['!cols'] = colWidths;
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, name);
    });

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array' 
    });
    
    // Save file
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    saveAs(blob, filename);
    
    return true;
  } catch (error) {
    console.error('Excel Export Error:', error);
    return false;
  }
};

/**
 * Export chart data to PDF with chart image
 * @param {Object} options - Export options
 */
export const exportChartToPDF = async ({
  title,
  chartElement,
  filename = 'chart.pdf',
  orientation = 'landscape'
}) => {
  try {
    const doc = new jsPDF(orientation);
    
    // Add title
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(title, 14, 20);
    
    // Add date
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

    // Convert chart to image (requires html2canvas)
    if (chartElement) {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(chartElement);
      const imgData = canvas.toDataURL('image/png');
      
      const imgWidth = orientation === 'landscape' ? 270 : 180;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      doc.addImage(imgData, 'PNG', 14, 35, imgWidth, imgHeight);
    }

    doc.save(filename);
    return true;
  } catch (error) {
    console.error('Chart PDF Export Error:', error);
    return false;
  }
};

/**
 * Format data for export
 */
export const formatDataForExport = (data, columns) => {
  return data.map(row => 
    columns.map(col => {
      const value = typeof col.accessor === 'function' 
        ? col.accessor(row) 
        : row[col.accessor];
      return value ?? '';
    })
  );
};

/**
 * Prepare headers for export
 */
export const prepareHeaders = (columns) => {
  return columns.map(col => col.header || col.label);
};
