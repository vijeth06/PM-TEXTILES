import React, { useState, useEffect } from 'react';
import { kpisAPI } from '../../services/analyticsAPI';
import { 
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

export default function KPIsTab() {
  const [kpis, setKpis] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [showCalculateModal, setShowCalculateModal] = useState(false);

  const kpiTypes = [
    { value: 'oee', label: 'OEE (Overall Equipment Effectiveness)', color: 'blue' },
    { value: 'fpy', label: 'FPY (First Pass Yield)', color: 'green' },
    { value: 'otd', label: 'OTD (On-Time Delivery)', color: 'purple' },
    { value: 'production_efficiency', label: 'Production Efficiency', color: 'yellow' },
    { value: 'quality_rate', label: 'Quality Rate', color: 'red' },
    { value: 'machine_utilization', label: 'Machine Utilization', color: 'indigo' },
    { value: 'wastage_percentage', label: 'Wastage Percentage', color: 'orange' },
    { value: 'customer_satisfaction', label: 'Customer Satisfaction', color: 'pink' }
  ];

  useEffect(() => {
    fetchKPIDashboard();
  }, [selectedPeriod]);

  const fetchKPIDashboard = async () => {
    try {
      setLoading(true);
      const response = await kpisAPI.getKPIDashboard({ period: selectedPeriod });
      setDashboard(response.data.data);
    } catch (error) {
      console.error('Error fetching KPI dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateKPI = async (type) => {
    try {
      let response;
      switch (type) {
        case 'oee':
          response = await kpisAPI.calculateOEE({
            machineId: prompt('Enter Machine ID:'),
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date().toISOString()
          });
          break;
        case 'otd':
          response = await kpisAPI.calculateOTD({
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date().toISOString()
          });
          break;
        case 'fpy':
          response = await kpisAPI.calculateFPY({
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date().toISOString()
          });
          break;
        default:
          return;
      }
      window.alert(`${type.toUpperCase()} calculated successfully!`);
      fetchKPIDashboard();
    } catch (error) {
      console.error(`Error calculating ${type}:`, error);
      window.alert(`Failed to calculate ${type}`);
    }
  };

  const getPerformanceColor = (status) => {
    const colors = {
      excellent: 'bg-green-100 text-green-800 border-green-200',
      good: 'bg-blue-100 text-blue-800 border-blue-200',
      average: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      poor: 'bg-orange-100 text-orange-800 border-orange-200',
      critical: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTrendIcon = (trend) => {
    if (trend === 'improving') return <ArrowUpIcon className="h-5 w-5 text-green-500" />;
    if (trend === 'declining') return <ArrowDownIcon className="h-5 w-5 text-red-500" />;
    return <MinusIcon className="h-5 w-5 text-gray-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Key Performance Indicators</h2>
          <p className="mt-1 text-sm text-gray-500">
            Monitor and track critical business metrics across production, quality, and delivery
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-500">Loading KPI dashboard...</p>
        </div>
      ) : (
        <>
          {/* Quick Calculate Actions */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Calculate</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleCalculateKPI('oee')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Calculate OEE
              </button>
              <button
                onClick={() => handleCalculateKPI('otd')}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
              >
                Calculate OTD
              </button>
              <button
                onClick={() => handleCalculateKPI('fpy')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
              >
                Calculate FPY
              </button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          {dashboard && dashboard.summary && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {dashboard.summary.map((kpi, idx) => (
                <div
                  key={idx}
                  className="bg-white overflow-hidden shadow rounded-lg border-2 border-transparent hover:border-blue-500 transition-all"
                >
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <ChartBarIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate capitalize">
                            {kpi.type?.replace(/_/g, ' ')}
                          </dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">
                              {kpi.average?.toFixed(1)}%
                            </div>
                            <div className="ml-2 flex items-baseline text-sm">
                              {getTrendIcon(kpi.trend)}
                              <span className="ml-1 text-gray-600 capitalize">{kpi.trend}</span>
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPerformanceColor(kpi.performanceStatus)}`}>
                        {kpi.performanceStatus}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* KPI Trends Chart */}
          {dashboard && dashboard.summary && dashboard.summary.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">KPI Trends</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={dashboard.summary}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="type" 
                    tickFormatter={(value) => value.replace(/_/g, ' ').toUpperCase()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => value.replace(/_/g, ' ').toUpperCase()}
                  />
                  <Legend />
                  <Bar dataKey="average" fill="#3b82f6" name="Average (%)" />
                  <Bar dataKey="target" fill="#10b981" name="Target (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Performance Radar Chart */}
          {dashboard && dashboard.summary && dashboard.summary.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Overview</h3>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={dashboard.summary}>
                  <PolarGrid />
                  <PolarAngleAxis 
                    dataKey="type"
                    tickFormatter={(value) => value.replace(/_/g, ' ').toUpperCase()}
                  />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar 
                    name="Actual" 
                    dataKey="average" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.6} 
                  />
                  <Radar 
                    name="Target" 
                    dataKey="target" 
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.3} 
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Detailed KPI List */}
          {dashboard && dashboard.kpis && dashboard.kpis.length > 0 && (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Detailed KPI Records</h3>
              </div>
              <ul className="divide-y divide-gray-200">
                {dashboard.kpis.slice(0, 10).map((kpi) => (
                  <li key={kpi._id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate capitalize">
                          {kpi.kpiType?.replace(/_/g, ' ')}
                        </p>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <CalendarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                          <p>
                            {new Date(kpi.startDate).toLocaleDateString()} - {new Date(kpi.endDate).toLocaleDateString()}
                          </p>
                          {kpi.department && (
                            <span className="ml-4 px-2 py-1 bg-gray-100 rounded text-xs">
                              {kpi.department}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ml-5 flex-shrink-0 flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Actual</p>
                          <p className="text-lg font-semibold text-gray-900">{kpi.actualValue?.toFixed(1)}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Target</p>
                          <p className="text-lg font-semibold text-gray-900">{kpi.targetValue?.toFixed(1)}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Variance</p>
                          <p className={`text-lg font-semibold ${kpi.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {kpi.variance >= 0 ? '+' : ''}{kpi.variance?.toFixed(1)}%
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getPerformanceColor(kpi.performanceStatus)}`}>
                          {kpi.performanceStatus}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
