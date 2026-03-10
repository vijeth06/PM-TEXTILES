import React, { useState, useEffect } from 'react';
import { kpisAPI } from '../../services/analyticsAPI';
import { 
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  CalendarIcon,
  XMarkIcon
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
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [showCalculateModal, setShowCalculateModal] = useState(false);
  const [kpiType, setKpiType] = useState('oee');
  const [kpiForm, setKpiForm] = useState({
    machineId: '',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchKPIDashboard();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const openCalculateModal = (type) => {
    setKpiType(type);
    setKpiForm({
      machineId: '',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    });
    setShowCalculateModal(true);
  };

  const handleCalculateKPI = async () => {
    try {
      const payload = {
        startDate: new Date(kpiForm.startDate).toISOString(),
        endDate: new Date(kpiForm.endDate).toISOString()
      };
      if (kpiType === 'oee') {
        if (!kpiForm.machineId) {
          window.alert('Machine ID is required for OEE calculation');
          return;
        }
        payload.machineId = kpiForm.machineId;
      }
      
      switch (kpiType) {
        case 'oee':
          await kpisAPI.calculateOEE(payload);
          break;
        case 'otd':
          await kpisAPI.calculateOTD(payload);
          break;
        case 'fpy':
          await kpisAPI.calculateFPY(payload);
          break;
        default:
          return;
      }
      window.alert(`${kpiType.toUpperCase()} calculated successfully!`);
      setShowCalculateModal(false);
      fetchKPIDashboard();
    } catch (error) {
      console.error(`Error calculating ${kpiType}:`, error);
      window.alert(`Failed to calculate ${kpiType}`);
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
                onClick={() => openCalculateModal('oee')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Calculate OEE
              </button>
              <button
                onClick={() => openCalculateModal('otd')}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
              >
                Calculate OTD
              </button>
              <button
                onClick={() => openCalculateModal('fpy')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
              >
                Calculate FPY
              </button>
            </div>
          </div>

          {/* Calculate KPI Modal */}
          {showCalculateModal && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowCalculateModal(false)}></div>
                
                <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                  <div className="absolute top-0 right-0 pt-4 pr-4">
                    <button onClick={() => setShowCalculateModal(false)} className="text-gray-400 hover:text-gray-500">
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Calculate {kpiType.toUpperCase()}</h3>
                  
                  <div className="space-y-4">
                    {kpiType === 'oee' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Machine ID *</label>
                        <input
                          type="text"
                          required
                          value={kpiForm.machineId}
                          onChange={(e) => setKpiForm({ ...kpiForm, machineId: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Enter machine ID"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Start Date *</label>
                      <input
                        type="date"
                        required
                        value={kpiForm.startDate}
                        onChange={(e) => setKpiForm({ ...kpiForm, startDate: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">End Date *</label>
                      <input
                        type="date"
                        required
                        value={kpiForm.endDate}
                        onChange={(e) => setKpiForm({ ...kpiForm, endDate: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        type="button"
                        onClick={() => setShowCalculateModal(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleCalculateKPI}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Calculate
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

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
