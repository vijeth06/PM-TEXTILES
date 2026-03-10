import React, { useState, useEffect } from 'react';
import { forecastsAPI } from '../../services/analyticsAPI';
import { 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  PlusIcon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function ForecastsTab() {
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [selectedForecast, setSelectedForecast] = useState(null);

  const forecastTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'demand', label: 'Demand Forecast' },
    { value: 'inventory', label: 'Inventory Forecast' },
    { value: 'production', label: 'Production Forecast' },
    { value: 'revenue', label: 'Revenue Forecast' },
    { value: 'wastage', label: 'Wastage Forecast' }
  ];

  useEffect(() => {
    fetchForecasts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType]);

  const fetchForecasts = async () => {
    try {
      setLoading(true);
      const params = filterType !== 'all' ? { type: filterType } : {};
      const response = await forecastsAPI.getForecasts(params);
      setForecasts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching forecasts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDemandForecast = async () => {
    try {
      await forecastsAPI.generateDemandForecast({
        months: 6,
        includeSeasonality: true
      });
      window.alert('Demand forecast generated successfully!');
      fetchForecasts();
    } catch (error) {
      console.error('Error generating forecast:', error);
      window.alert('Failed to generate demand forecast');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      outdated: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPerformanceIcon = (variance) => {
    if (variance > 0) return <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />;
    return <ArrowTrendingDownIcon className="h-5 w-5 text-red-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Demand & Production Forecasts</h2>
          <p className="mt-1 text-sm text-gray-500">
            Predictive analytics for demand, inventory, production, and revenue
          </p>
        </div>
        <button
          onClick={handleGenerateDemandForecast}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Generate Demand Forecast
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filter by Type:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {forecastTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Forecast Cards */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-500">Loading forecasts...</p>
        </div>
      ) : forecasts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No forecasts found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Generate a forecast to get started with predictive analytics.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {forecasts.map((forecast) => (
            <div
              key={forecast._id}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedForecast(forecast)}
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {getPerformanceIcon(forecast.variance)}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 capitalize">
                        {forecast.forecastType} Forecast
                      </h3>
                      <p className="text-sm text-gray-500">
                        Period: {new Date(forecast.periodStart).toLocaleDateString()} - {new Date(forecast.periodEnd).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(forecast.status)}`}>
                    {forecast.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Algorithm</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900 capitalize">
                      {forecast.model?.algorithm?.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Confidence</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {forecast.model?.confidence || 'N/A'}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Accuracy</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {forecast.accuracy ? `${forecast.accuracy.toFixed(1)}%` : 'Pending'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Data Points</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {forecast.dataPoints?.length || 0}
                    </p>
                  </div>
                </div>

                {forecast.trend && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm font-medium text-blue-800">Trend Analysis</p>
                    <p className="mt-1 text-sm text-blue-600 capitalize">
                      {forecast.trend.direction} - {forecast.trend.strength}
                    </p>
                  </div>
                )}

                {forecast.recommendations && forecast.recommendations.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700">Recommendations:</p>
                    <ul className="mt-2 space-y-1">
                      {forecast.recommendations.slice(0, 2).map((rec, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start">
                          <span className="mr-2">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Forecast Detail Modal */}
      {selectedForecast && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setSelectedForecast(null)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {selectedForecast.forecastType.toUpperCase()} Forecast Details
                </h3>

                {selectedForecast.dataPoints && selectedForecast.dataPoints.length > 0 && (
                  <div className="mt-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={selectedForecast.dataPoints}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(date) => new Date(date).toLocaleDateString()}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(date) => new Date(date).toLocaleDateString()}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="predictedValue" 
                          stroke="#3b82f6" 
                          name="Predicted"
                          strokeWidth={2}
                        />
                        {selectedForecast.dataPoints.some(d => d.actualValue) && (
                          <Line 
                            type="monotone" 
                            dataKey="actualValue" 
                            stroke="#10b981" 
                            name="Actual"
                            strokeWidth={2}
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setSelectedForecast(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
