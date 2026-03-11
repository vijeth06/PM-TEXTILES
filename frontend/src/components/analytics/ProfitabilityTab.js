import React, { useState, useEffect } from 'react';
import { costAnalysisAPI } from '../../services/analyticsAPI';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ProfitabilityTab() {
  const [profitability, setProfitability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const fetchProfitability = async () => {
      try {
        setLoading(true);
        const response = await costAnalysisAPI.getProfitabilityReport(dateRange);
        setProfitability(response.data.data);
      } catch (error) {
        console.error('Error fetching profitability:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfitability();
  }, [dateRange]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Profitability Analysis</h2>
          <p className="mt-1 text-sm text-gray-500">
            Revenue, cost, and profit analysis across production and sales
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : profitability ? (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                    <ArrowTrendingUpIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {formatCurrency(profitability.summary?.totalRevenue || 0)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                    <ArrowTrendingDownIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Cost</dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {formatCurrency(profitability.summary?.totalCost || 0)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 ${(profitability.summary?.totalProfit || 0) >= 0 ? 'bg-green-500' : 'bg-red-500'} rounded-md p-3`}>
                    <ArrowTrendingUpIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Profit</dt>
                      <dd className={`text-lg font-semibold ${(profitability.summary?.totalProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(profitability.summary?.totalProfit || 0)}
                      </dd>
                      <dd className="text-sm text-gray-500">
                        Margin: {profitability.summary?.profitMargin?.toFixed(1)}%
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {profitability.byType && profitability.byType.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Profitability by Type</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={profitability.byType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                  <Bar dataKey="cost" fill="#ef4444" name="Cost" />
                  <Bar dataKey="profit" fill="#10b981" name="Profit" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
