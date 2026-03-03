import React from 'react';
import { FunnelIcon } from '@heroicons/react/24/outline';

export default function LeadFunnelTab() {
  const funnelStages = [
    { name: 'New Leads', count: 45, color: 'bg-blue-500' },
    { name: 'Contacted', count: 38, color: 'bg-purple-500' },
    { name: 'Qualified', count: 28, color: 'bg-yellow-500' },
    { name: 'Proposal Sent', count: 18, color: 'bg-indigo-500' },
    { name: 'Negotiation', count: 12, color: 'bg-orange-500' },
    { name: 'Converted', count: 8, color: 'bg-green-500' }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Sales Funnel</h2>
      <div className="bg-white p-8 rounded-lg shadow">
        <div className="space-y-4">
          {funnelStages.map((stage, idx) => (
            <div key={idx} className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{stage.name}</span>
                <span className="text-sm font-semibold text-gray-900">{stage.count} leads</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-8" style={{ width: `${100 - (idx * 15)}%` }}>
                <div
                  className={`${stage.color} h-8 rounded-full flex items-center justify-center text-white text-sm font-medium`}
                  style={{ width: '100%' }}
                >
                  {((stage.count / funnelStages[0].count) * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
