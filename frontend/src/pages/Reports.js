import React from 'react';

const Reports = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports & Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-2">Production Reports</h3>
          <p className="text-sm text-gray-600">Daily production, stage-wise analysis, machine utilization</p>
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-2">Inventory Reports</h3>
          <p className="text-sm text-gray-600">Stock aging, valuation, movement analysis</p>
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-2">Wastage Analysis</h3>
          <p className="text-sm text-gray-600">Wastage by stage, type, and reason</p>
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-2">Order Fulfillment</h3>
          <p className="text-sm text-gray-600">OTIF metrics, delivery performance</p>
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-2">Profit Analysis</h3>
          <p className="text-sm text-gray-600">Order-wise profitability, revenue trends</p>
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-2">Supplier Performance</h3>
          <p className="text-sm text-gray-600">On-time delivery, quality metrics</p>
        </div>
      </div>
    </div>
  );
};

export default Reports;
