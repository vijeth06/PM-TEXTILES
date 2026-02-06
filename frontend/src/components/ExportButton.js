import React, { useState } from 'react';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../services/api';

const ExportButton = ({ endpoint, filename, label = 'Export', format = 'excel', data }) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    
    try {
      let response;
      
      if (format === 'excel') {
        // Download from backend endpoint
        response = await api.get(endpoint, {
          responseType: 'blob'
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${filename}_${Date.now()}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        toast.success('Excel file downloaded successfully!');
        
      } else if (format === 'pdf') {
        // Download PDF from backend
        response = await api.get(endpoint, {
          responseType: 'blob'
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${filename}_${Date.now()}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        toast.success('PDF file downloaded successfully!');
        
      } else if (format === 'csv' && data) {
        // Client-side CSV generation
        const csv = convertToCSV(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${filename}_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        toast.success('CSV file downloaded successfully!');
      }
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // Add header row
    csvRows.push(headers.join(','));
    
    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma
        const escaped = ('' + value).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
      {loading ? 'Exporting...' : label}
    </button>
  );
};

export default ExportButton;
