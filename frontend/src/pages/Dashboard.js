import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useDashboardUpdates } from '../hooks/useRealTimeUpdates';
import {
  CubeIcon,
  ArchiveBoxIcon,
  ShoppingCartIcon,
  WrenchIcon,
  ExclamationTriangleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Real-time dashboard updates
  const lastUpdate = useDashboardUpdates(() => {
    console.log('Dashboard update triggered by real-time event');
    fetchDashboardMetrics();
  });

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  const fetchDashboardMetrics = async () => {
    try {
      const response = await api.get('/dashboard/metrics');
      setMetrics(response.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statsCards = [
    {
      name: 'Active Production Plans',
      value: metrics?.production?.activePlans || 0,
      icon: CubeIcon,
      color: 'bg-blue-500',
      subtext: `${metrics?.production?.completedToday || 0} completed today`
    },
    {
      name: 'Inventory Value',
      value: `₹${(metrics?.inventory?.totalValue || 0).toLocaleString()}`,
      icon: ArchiveBoxIcon,
      color: 'bg-green-500',
      subtext: `${metrics?.inventory?.lowStockItems || 0} low stock items`
    },
    {
      name: 'Pending Orders',
      value: metrics?.orders?.pending || 0,
      icon: ShoppingCartIcon,
      color: 'bg-purple-500',
      subtext: `${metrics?.orders?.urgent || 0} urgent`
    },
    {
      name: 'Machine Status',
      value: `${metrics?.machines?.operational || 0}/${metrics?.machines?.total || 0}`,
      icon: WrenchIcon,
      color: 'bg-yellow-500',
      subtext: `${metrics?.machines?.underMaintenance || 0} under maintenance`
    }
  ];

  const alerts = [
    ...(metrics?.production?.delayedStages > 0 ? [{
      type: 'warning',
      message: `${metrics.production.delayedStages} production stages are delayed`
    }] : []),
    ...(metrics?.inventory?.lowStockItems > 0 ? [{
      type: 'warning',
      message: `${metrics.inventory.lowStockItems} items have low stock`
    }] : []),
    ...(metrics?.orders?.overdue > 0 ? [{
      type: 'danger',
      message: `${metrics.orders.overdue} orders are overdue`
    }] : []),
    ...(metrics?.orders?.urgent > 0 ? [{
      type: 'info',
      message: `${metrics.orders.urgent} urgent orders need attention`
    }] : [])
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.fullName}!</h1>
        <p className="text-gray-600 mt-1">Here's what's happening with your textile operations today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="card">
              <div className="flex items-center">
                <div className={`${stat.color} rounded-lg p-3`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.subtext}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="card">
          <div className="flex items-center mb-4">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Alerts & Notifications</h2>
          </div>
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-3 rounded-md ${
                  alert.type === 'danger' ? 'bg-red-50 text-red-800' :
                  alert.type === 'warning' ? 'bg-yellow-50 text-yellow-800' :
                  'bg-blue-50 text-blue-800'
                }`}
              >
                {alert.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {metrics?.recentActivities?.orders?.map((order) => (
              <div key={order._id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{order.orderNo}</p>
                  <p className="text-sm text-gray-600">{order.customerName}</p>
                </div>
                <span className={`badge ${
                  order.status === 'delivered' ? 'badge-green' :
                  order.status === 'in_production' ? 'badge-blue' :
                  'badge-yellow'
                }`}>
                  {order.status}
                </span>
              </div>
            )) || <p className="text-gray-500 text-sm">No recent orders</p>}
          </div>
        </div>

        {/* Recent Production */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Production</h3>
          <div className="space-y-3">
            {metrics?.recentActivities?.production?.map((stage) => (
              <div key={stage._id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{stage.planNo}</p>
                  <p className="text-sm text-gray-600 capitalize">{stage.stageName.replace(/_/g, ' ')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{stage.outputQuantity}</p>
                  <span className={`badge ${stage.status === 'completed' ? 'badge-green' : 'badge-blue'}`}>
                    {stage.status}
                  </span>
                </div>
              </div>
            )) || <p className="text-gray-500 text-sm">No recent production</p>}
          </div>
        </div>
      </div>

      {/* Wastage Summary */}
      {metrics?.wastage && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <ChartBarIcon className="h-6 w-6 text-gray-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Wastage Summary ({metrics.wastage.period})</h3>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-red-600">₹{(metrics.wastage.totalCost || 0).toLocaleString()}</p>
              <p className="text-sm text-gray-600">{metrics.wastage.recordCount} incidents</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
