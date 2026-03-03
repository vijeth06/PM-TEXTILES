import React, { useState, useEffect } from 'react';
import { quotationsAPI } from '../../services/analyticsAPI';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

export default function QuotationsTab() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const response = await quotationsAPI.getQuotations();
      setQuotations(response.data.data || []);
    } catch (error) {
      console.error('Error fetching quotations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-orange-100 text-orange-800',
      converted: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Quotations</h2>
      
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quotations.map((quotation) => (
            <div key={quotation._id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <DocumentTextIcon className="h-8 w-8 text-indigo-600" />
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(quotation.status)}`}>
                    {quotation.status}
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-900">{quotation.quotationNo}</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {quotation.customer?.name || quotation.lead?.companyName || 'N/A'}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    ₹{quotation.totalAmount?.toLocaleString('en-IN')}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Valid until: {new Date(quotation.validUntil).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
