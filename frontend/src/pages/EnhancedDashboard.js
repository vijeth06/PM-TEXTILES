import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDashboardUpdates } from '../hooks/useRealTimeUpdates';
import { dashboardAPI, inventoryAPI } from '../services/api';
import {
  ProductionTrendChart,
  RevenueChart,
  OrderStatusChart,
  InventoryLevelsChart,
  QualityMetricsChart,
  MonthlyPerformanceChart
} from '../components/DashboardCharts';
import {
  CubeIcon,
  ArchiveBoxIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  TruckIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

const EnhancedDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [chartData, setChartData] = useState({
    productionTrend: [],
    revenue: [],
    orderStatus: [],
    inventoryLevels: [],
    qualityMetrics: [],
    monthlyPerformance: []
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Real-time dashboard updates
  useDashboardUpdates(() => {
    console.log('Dashboard update triggered by real-time event');
    fetchDashboardData();
  });

  const formatShort = (isoDateString) => {
    try {
      return new Date(isoDateString).toLocaleDateString(undefined, { month: 'short', day: '2-digit' });
    } catch {
      return isoDateString;
    }
  };

  const formatMonth = (yyyyMm) => {
    const [yyyy, mm] = String(yyyyMm).split('-');
    if (!yyyy || !mm) return yyyyMm;
    const date = new Date(Number(yyyy), Number(mm) - 1, 1);
    return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const [metricsRes, trendsRes, orderStatusRes, alertsRes, qualityRes, monthlyRes] = await Promise.all([
        dashboardAPI.getMetrics(),
        dashboardAPI.getTrends({ period: '30days' }),
        dashboardAPI.getOrderStatusDistribution(),
        inventoryAPI.getAlerts(),
        dashboardAPI.getQualityByStage(),
        dashboardAPI.getMonthlyPerformance({ months: 6 })
      ]);

      const metricsData = metricsRes.data.data;
      const trendsData = trendsRes.data.data;

      setMetrics(metricsData);

      const productionTrend = (trendsData.productionTrend || []).map(p => ({
        date: formatShort(p._id),
        quantity: p.completed || 0,
        planned: p.planned || 0
      }));

      const revenue = (trendsData.revenueTrend || []).map(r => ({
        month: formatShort(r._id),
        revenue: r.revenue || 0,
        orders: r.orders || 0
      }));

      const orderStatus = (orderStatusRes.data.data || []).map(s => ({
        name: String(s.status).replace(/_/g, ' '),
        value: s.count
      })).filter(x => x.value > 0);

      const inventoryLevels = (alertsRes.data.data || []).slice(0, 8).map(a => ({
        item: a.materialName || a.materialCode,
        current: a.currentStock || 0,
        reorderPoint: a.reorderPoint || 0
      }));

      const qualityMetrics = (qualityRes.data.data || []).map(q => ({
        stage: q.stage,
        passRate: q.passRate
      }));

      const monthlyPerformance = (monthlyRes.data.data || []).map(m => ({
        month: formatMonth(m.month),
        orders: m.orders || 0,
        production: m.production || 0,
        delivery: m.onTimeDeliveryRate || 0
      }));

      setChartData({
        productionTrend,
        revenue,
        orderStatus,
        inventoryLevels,
        qualityMetrics,
        monthlyPerformance
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statsCards = [
    {
      name: 'Active Orders',
      value: metrics?.orders?.pending || 0,
      icon: ShoppingCartIcon,
      color: 'bg-blue-500',
      change: 'Live',
      trend: 'up'
    },
    {
      name: 'Production Plans',
      value: metrics?.production?.activePlans || 0,
      icon: CubeIcon,
      color: 'bg-green-500',
      change: '+8%',
      trend: 'up'
    },
    {
      name: 'Inventory Value',
      value: `₹${(metrics?.inventory?.totalValue || 0).toLocaleString()}`,
      icon: ArchiveBoxIcon,
      color: 'bg-purple-500',
      change: 'Live',
      trend: 'up'
    },
    {
      name: 'Overdue Orders',
      value: metrics?.orders?.overdue || 0,
      icon: CurrencyDollarIcon,
      color: 'bg-amber-500',
      change: 'Live',
      trend: metrics?.orders?.overdue > 0 ? 'down' : 'up'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.fullName || 'User'}!</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Last updated</p>
          <p className="text-lg font-semibold text-gray-900">Just now</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <div className="flex items-center mt-2">
                  {stat.trend === 'up' ? (
                    <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs last month</span>
                </div>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Trend */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Production Trend (Last 7 Days)</h3>
          <ProductionTrendChart data={chartData.productionTrend} />
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue & Orders</h3>
          <RevenueChart data={chartData.revenue} />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Distribution</h3>
          <OrderStatusChart data={chartData.orderStatus} />
        </div>

        {/* Inventory Levels */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Levels</h3>
          <InventoryLevelsChart data={chartData.inventoryLevels} />
        </div>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quality Metrics */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Pass Rate by Stage</h3>
          <QualityMetricsChart data={chartData.qualityMetrics} />
        </div>

        {/* Monthly Performance */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Performance (Orders / Production / On-time Delivery %)</h3>
          <MonthlyPerformanceChart data={chartData.monthlyPerformance} />
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Recent Orders</h4>
            <div className="space-y-3">
              {(metrics?.recentActivities?.orders || []).length === 0 ? (
                <p className="text-sm text-gray-500">No recent orders.</p>
              ) : (
                (metrics?.recentActivities?.orders || []).map((o) => (
                  <div key={o._id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div className="flex items-center space-x-3">
                      <CheckCircleIcon className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{o.orderNo} — {o.customerName || o.customerId?.name || 'Customer'}</p>
                        <p className="text-xs text-gray-500">{o.status}</p>
                      </div>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{new Date(o.orderDate).toLocaleDateString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Recent Production</h4>
            <div className="space-y-3">
              {(metrics?.recentActivities?.production || []).length === 0 ? (
                <p className="text-sm text-gray-500">No recent production activity.</p>
              ) : (
                (metrics?.recentActivities?.production || []).map((p) => (
                  <div key={p._id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div className="flex items-center space-x-3">
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{p.planNo} — {p.stageName}</p>
                        <p className="text-xs text-gray-500">Output: {p.outputQuantity} ({p.status})</p>
                      </div>
                    </div>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">{p.actualEndTime ? new Date(p.actualEndTime).toLocaleDateString() : '—'}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;
