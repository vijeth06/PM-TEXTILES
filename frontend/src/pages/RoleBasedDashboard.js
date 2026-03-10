import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, ordersAPI, inventoryAPI } from '../services/api';
import { StatCard, SectionHeader, Card } from '../components/UIComponents';
import {
  ChartBarIcon,
  CogIcon,
  TruckIcon,
  DocumentTextIcon,
  BeakerIcon,
  WrenchScrewdriverIcon,
  CurrencyDollarIcon,
  ClipboardDocumentCheckIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

const COLORS = ['#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function RoleBasedDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState([]);
  const [orderDist, setOrderDist] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [metricsRes, trendsRes, orderDistRes, ordersRes, inventoryRes] = await Promise.allSettled([
        dashboardAPI.getMetrics(),
        dashboardAPI.getTrends({ period: 'weekly' }),
        dashboardAPI.getOrderStatusDistribution(),
        ordersAPI.getOrders({ limit: 5 }),
        inventoryAPI.getAlerts()
      ]);

      const metrics = metricsRes.status === 'fulfilled' ? metricsRes.value.data.data : {};
      const trends = trendsRes.status === 'fulfilled' ? trendsRes.value.data.data : {};
      const dist = orderDistRes.status === 'fulfilled' ? orderDistRes.value.data.data : [];
      const orders = ordersRes.status === 'fulfilled' ? ordersRes.value.data : {};
      const alerts = inventoryRes.status === 'fulfilled' ? inventoryRes.value.data.data : [];

      setStats({
        production: {
          today: metrics.production?.totalProduction || 0,
          target: metrics.production?.targetQuantity || 0,
          efficiency: metrics.production?.avgEfficiency || 0,
          activePlans: metrics.production?.activePlans || 0,
          completedPlans: metrics.production?.completedPlans || 0,
          looms: { total: metrics.machines?.total || 0, running: metrics.machines?.running || 0, idle: metrics.machines?.idle || 0, breakdown: metrics.machines?.breakdown || 0 }
        },
        quality: {
          firstQuality: metrics.quality?.passRate || 0,
          defectRate: metrics.quality?.failRate || 0,
          inspected: metrics.quality?.totalChecks || 0,
          pendingTests: metrics.quality?.pendingChecks || 0
        },
        inventory: {
          yarnStock: metrics.inventory?.yarnStock || 0,
          fabricStock: metrics.inventory?.fabricStock || 0,
          alerts: alerts.length || 0,
          totalValue: metrics.inventory?.totalValue || 0
        },
        orders: {
          pending: orders.data?.filter(o => o.status === 'pending').length || 0,
          total: orders.total || 0,
          inProduction: orders.data?.filter(o => o.status === 'in_production').length || 0,
          completed: orders.data?.filter(o => o.status === 'delivered').length || 0
        }
      });

      if (trends.production) {
        setTrendData(trends.production.map(t => ({
          date: t._id,
          production: t.totalOutput || 0,
          target: metrics.production?.targetQuantity || 0
        })));
      }

      if (dist.length > 0) {
        setOrderDist(dist.map(d => ({ name: d._id?.replace(/_/g, ' ') || 'unknown', value: d.count })));
      }
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      setStats({
        production: { today: 0, target: 0, efficiency: 0, activePlans: 0, completedPlans: 0, looms: { total: 0, running: 0, idle: 0, breakdown: 0 } },
        quality: { firstQuality: 0, defectRate: 0, inspected: 0, pendingTests: 0 },
        inventory: { yarnStock: 0, fabricStock: 0, alerts: 0, totalValue: 0 },
        orders: { pending: 0, total: 0, inProduction: 0, completed: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  const renderProductionManagerDashboard = () => (
    <div className="space-y-6">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Production"
          value={stats.production.today.toLocaleString()}
          unit="m"
          color="blue"
          icon={ChartBarIcon}
        />
        <StatCard
          title="Loom Efficiency"
          value={Math.round(stats.production.efficiency)}
          unit="%"
          color="teal"
          icon={CogIcon}
        />
        <StatCard
          title="First Quality"
          value={Math.round(stats.quality.firstQuality)}
          unit="%"
          color="green"
          icon={ClipboardDocumentCheckIcon}
        />
        <StatCard
          title="Pending Orders"
          value={stats.orders.pending}
          unit="orders"
          color="amber"
          icon={DocumentTextIcon}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Trend */}
        <Card variant="elevated" className="p-6">
          <SectionHeader title="Production Trend" subtitle="Last 7 Days" />
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData.length > 0 ? trendData : [{date: 'No data', production: 0, target: 0}]}>
              <defs>
                <linearGradient id="colorProduction" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="production" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorProduction)" name="Actual" />
              <Line type="monotone" dataKey="target" stroke="#ef4444" strokeDasharray="5 5" name="Target" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Loom Status */}
        <Card variant="elevated" className="p-6">
          <SectionHeader title="Loom Status" />
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  {name: 'Running', value: stats.production.looms.running},
                  {name: 'Idle', value: stats.production.looms.idle},
                  {name: 'Breakdown', value: stats.production.looms.breakdown}
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {[COLORS[2], COLORS[1], COLORS[3]].map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Order Distribution */}
        <Card variant="elevated" className="p-6">
          <SectionHeader title="Order Distribution" />
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={orderDist.length > 0 ? orderDist : [
                  {name: 'Pending', value: stats.orders.pending},
                  {name: 'In Production', value: stats.orders.inProduction},
                  {name: 'Completed', value: stats.orders.completed}
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {COLORS.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card variant="elevated" className="p-6">
        <SectionHeader title="Quick Actions" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionButton icon={RocketLaunchIcon} label="Start Production" color="blue" onClick={() => navigate('/production')} />
          <QuickActionButton icon={ClipboardDocumentCheckIcon} label="Quality Check" color="teal" onClick={() => navigate('/production-execution')} />
          <QuickActionButton icon={WrenchScrewdriverIcon} label="Machine Status" color="amber" onClick={() => navigate('/textile-production')} />
          <QuickActionButton icon={DocumentTextIcon} label="View Reports" color="purple" onClick={() => navigate('/reports')} />
        </div>
      </Card>
    </div>
  );

  const renderQualityInspectorDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Inspected Today"
          value={stats.quality.inspected.toLocaleString()}
          unit="meters"
          color="blue"
          icon={BeakerIcon}
        />
        <StatCard
          title="First Quality"
          value={Math.round(stats.quality.firstQuality)}
          unit="%"
          color="green"
          icon={ClipboardDocumentCheckIcon}
        />
        <StatCard
          title="Defect Rate"
          value={Math.round(stats.quality.defectRate * 10) / 10}
          unit="%"
          color="red"
          icon={ChartBarIcon}
        />
        <StatCard
          title="Pending Tests"
          value={stats.quality.pendingTests}
          unit="items"
          color="amber"
          icon={DocumentTextIcon}
        />
      </div>

      {/* Quality Metrics Chart */}
      <Card variant="elevated" className="p-6">
        <SectionHeader title="Quality Metrics Trend" />
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={[
            {date: 'Jan 1', firstQuality: 91, defects: 4.2},
            {date: 'Jan 2', firstQuality: 93, defects: 3.5},
            {date: 'Jan 3', firstQuality: 90, defects: 4.8},
            {date: 'Jan 4', firstQuality: 94, defects: 2.9},
            {date: 'Jan 5', firstQuality: 92, defects: 3.8},
            {date: 'Jan 6', firstQuality: 93, defects: 3.2},
            {date: 'Jan 7', firstQuality: 92.3, defects: 3.2}
          ]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="firstQuality" stroke="#10b981" strokeWidth={2} name="First Quality %" />
            <Line type="monotone" dataKey="defects" stroke="#ef4444" strokeWidth={2} name="Defect Rate %" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );

  const renderStoreManagerDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Yarn Stock"
          value={Math.round(stats.inventory.yarnStock / 1000)}
          unit="k kg"
          color="blue"
          icon={TruckIcon}
        />
        <StatCard
          title="Fabric Stock"
          value={Math.round(stats.inventory.fabricStock / 1000)}
          unit="k m"
          color="green"
          icon={DocumentTextIcon}
        />
        <StatCard
          title="Low Stock Alerts"
          value={stats.inventory.alerts}
          unit="items"
          color="red"
          icon={ChartBarIcon}
        />
        <StatCard
          title="Inventory Value"
          value={(stats.inventory.totalValue / 100000).toFixed(1)}
          unit="L"
          color="amber"
          icon={CurrencyDollarIcon}
        />
      </div>

      {/* Inventory Chart */}
      <Card variant="elevated" className="p-6">
        <SectionHeader title="Stock Levels" />
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={[
            {item: 'Cotton Yarn', current: 12500, reorder: 10000},
            {item: 'Polyester Yarn', current: 8500, reorder: 8000},
            {item: 'Shirting Fabric', current: 15000, reorder: 12000},
            {item: 'Denim Fabric', current: 6500, reorder: 8000},
            {item: 'Chemicals', current: 4500, reorder: 5000}
          ]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="item" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="current" fill="#0ea5e9" name="Current Stock" />
            <Bar dataKey="reorder" fill="#ef4444" name="Reorder Level" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-blue-800">
            Welcome, {user?.name || 'User'}
          </h1>
          <p className="mt-2 text-lg text-gray-600 font-medium">
            <span className="text-blue-700 font-bold capitalize">{user?.role?.replace(/_/g, ' ')}</span> Dashboard
          </p>
        </div>

        {/* Role-based dashboard content */}
        {user?.role === 'production_manager' && renderProductionManagerDashboard()}
        {user?.role === 'qa_inspector' && renderQualityInspectorDashboard()}
        {user?.role === 'store_manager' && renderStoreManagerDashboard()}
        {(user?.role === 'admin' || user?.role === 'management' || user?.role === 'sales_manager' || user?.role === 'accountant' || !['production_manager', 'qa_inspector', 'store_manager'].includes(user?.role)) && renderProductionManagerDashboard()}
      </div>
    );
  }

function QuickActionButton({ icon: Icon, label, color, onClick }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200',
    teal: 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200',
    amber: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200',
    green: 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200',
    purple: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200',
    red: 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
  };

  return (
    <button onClick={onClick} className={`${colorClasses[color]} p-4 rounded-lg transition-all hover:shadow-sm flex flex-col items-center justify-center space-y-2`}>
      <Icon className="h-8 w-8" />
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
}
