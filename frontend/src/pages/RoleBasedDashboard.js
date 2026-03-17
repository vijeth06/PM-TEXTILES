import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, ordersAPI, inventoryAPI } from '../services/api';
import { StatCard, SectionHeader, Card } from '../components/UIComponents';
import PageShell from '../components/PageShell';
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
  const [paymentDist, setPaymentDist] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [inventoryAlerts, setInventoryAlerts] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [metricsRes, trendsRes, orderDistRes, ordersRes, inventoryRes] = await Promise.allSettled([
        dashboardAPI.getMetrics(),
        dashboardAPI.getTrends({ period: 'weekly' }),
        dashboardAPI.getOrderStatusDistribution(),
        ordersAPI.getOrders({ limit: 100 }),
        inventoryAPI.getAlerts()
      ]);

      const metrics = metricsRes.status === 'fulfilled' ? metricsRes.value.data.data : {};
      const trends = trendsRes.status === 'fulfilled' ? trendsRes.value.data.data : {};
      const dist = orderDistRes.status === 'fulfilled' ? orderDistRes.value.data : [];
      const orders = ordersRes.status === 'fulfilled' ? ordersRes.value.data : {};
      const alerts = inventoryRes.status === 'fulfilled' ? inventoryRes.value.data.data : [];
      const orderRows = Array.isArray(orders.data) ? orders.data : [];
      const alertRows = Array.isArray(alerts) ? alerts : [];
      
      // Process revenue by order value range
      const revenueByRange = { 'Below 50K': 0, '50K-100K': 0, '100K-500K': 0, 'Above 500K': 0 };
      if (orderRows.length > 0) {
        orderRows.forEach(order => {
          const value = Number(order.totalAmount || order.orderValue || 0);
          if (value < 50000) revenueByRange['Below 50K']++;
          else if (value < 100000) revenueByRange['50K-100K']++;
          else if (value < 500000) revenueByRange['100K-500K']++;
          else revenueByRange['Above 500K']++;
        });
      }
      const revenueDistData = Object.entries(revenueByRange)
        .map(([name, count]) => ({ name, value: count }));
      setPaymentDist(revenueDistData);
      const machineMetrics = metrics.machines || {};
      const totalMachines = Number(machineMetrics.total || 0);
      const operationalMachines = Number(machineMetrics.running ?? machineMetrics.operational ?? 0);
      const maintenanceMachines = Number(machineMetrics.breakdown ?? machineMetrics.underMaintenance ?? 0);
      const idleMachines = Math.max(totalMachines - operationalMachines - maintenanceMachines, 0);

      setRecentOrders(orderRows.slice(0, 5));
      setInventoryAlerts(alertRows.slice(0, 5));

      setStats({
        production: {
          today: metrics.production?.totalProduction || 0,
          target: metrics.production?.targetQuantity || 0,
          efficiency: metrics.production?.avgEfficiency || 0,
          activePlans: metrics.production?.activePlans || 0,
          completedPlans: metrics.production?.completedPlans || 0,
          looms: {
            total: totalMachines,
            running: operationalMachines,
            idle: idleMachines,
            breakdown: maintenanceMachines
          }
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
          alerts: alertRows.length || 0,
          totalValue: metrics.inventory?.totalValue || 0
        },
        orders: {
          pending: orderRows.filter(o => o.status === 'pending').length || 0,
          total: orders.total || orderRows.length || 0,
          inProduction: orderRows.filter(o => o.status === 'in_production').length || 0,
          completed: orderRows.filter(o => o.status === 'delivered').length || 0
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
        setOrderDist(dist.map(d => ({ 
          name: d.status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'unknown', 
          value: d.count 
        })));
      }
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      setRecentOrders([]);
      setInventoryAlerts([]);
      setPaymentDist([]);
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
          {(() => {
            const loomData = [
              { name: 'Running', value: Number(stats.production.looms.running || 0) },
              { name: 'Idle', value: Number(stats.production.looms.idle || 0) },
              { name: 'Breakdown', value: Number(stats.production.looms.breakdown || 0) }
            ];
            const hasData = loomData.some((item) => item.value > 0);

            if (!hasData) {
              return (
                <div className="h-[300px] rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center">
                  <p className="text-sm text-slate-500">No machine status data available yet.</p>
                </div>
              );
            }

            return (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={loomData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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
            );
          })()}
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

        {/* Revenue by Order Value Distribution */}
        <Card variant="elevated" className="p-6">
          <SectionHeader title="Revenue by Order Value" />
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentDist.length > 0 ? paymentDist : [
                  {name: 'Below 50K', value: 0},
                  {name: '50K-100K', value: 0},
                  {name: '100K-500K', value: 0},
                  {name: 'Above 500K', value: 0}
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {[COLORS[1], COLORS[3], COLORS[5], COLORS[0]].map((color, index) => (
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
    <PageShell
      title={`Welcome, ${user?.name || 'User'}`}
      description="Your role-aware operations dashboard with production, quality, inventory, and order intelligence."
      badge={`${(user?.role || 'user').replace(/_/g, ' ')} dashboard`}
      actions={[
        <button
          key="reports"
          onClick={() => navigate('/reports')}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <DocumentTextIcon className="h-4 w-4" />
          Reports
        </button>,
        <button
          key="analytics"
          onClick={() => navigate('/analytics')}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ChartBarIcon className="h-4 w-4" />
          Analytics
        </button>,
        <button
          key="refresh"
          onClick={fetchDashboardData}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          <RocketLaunchIcon className="h-4 w-4" />
          Refresh
        </button>
      ]}
      stats={[
        { label: 'Today Production', value: `${Math.round(stats?.production?.today || 0)} m`, helper: 'Output registered today' },
        { label: 'Loom Efficiency', value: `${Math.round(stats?.production?.efficiency || 0)}%`, helper: 'Average machine utilization' },
        { label: 'Pending Orders', value: String(stats?.orders?.pending || 0), helper: 'Awaiting fulfillment' },
        { label: 'Inventory Alerts', value: String(stats?.inventory?.alerts || 0), helper: 'Low stock notifications' }
      ]}
    >
      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Production Pulse</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">Track real-time output, efficiency, and active plans.</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Quality Control</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">Monitor first-pass quality and pending inspections.</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Inventory Watch</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">Stay ahead of low stock alerts and reorder points.</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card variant="elevated" className="p-5">
          <SectionHeader title="Recent Orders" subtitle="Latest order flow snapshot" />
          <div className="space-y-2">
            {recentOrders.length > 0 ? recentOrders.map((order, idx) => (
              <div key={order._id || idx} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{order.orderNumber || order.soNumber || `Order ${idx + 1}`}</p>
                  <p className="text-xs text-slate-600">{order.customerName || order.customer?.name || 'Customer pending'}</p>
                </div>
                <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                  {(order.status || 'pending').replace(/_/g, ' ')}
                </span>
              </div>
            )) : (
              <p className="text-sm text-slate-500">No recent orders available.</p>
            )}
          </div>
        </Card>

        <Card variant="elevated" className="p-5">
          <SectionHeader title="Inventory Alerts" subtitle="Items requiring immediate attention" />
          <div className="space-y-2">
            {inventoryAlerts.length > 0 ? inventoryAlerts.map((alert, idx) => (
              <div key={alert._id || idx} className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2">
                <p className="text-sm font-semibold text-slate-900">{alert.itemName || alert.materialName || alert.name || `Alert ${idx + 1}`}</p>
                <p className="text-xs text-slate-700">
                  Current: {alert.currentStock ?? alert.current ?? 'N/A'} | Reorder: {alert.reorderPoint ?? alert.reorderLevel ?? 'N/A'}
                </p>
              </div>
            )) : (
              <p className="text-sm text-slate-500">No active inventory alerts.</p>
            )}
          </div>
        </Card>
      </div>

      {user?.role === 'production_manager' && renderProductionManagerDashboard()}
      {user?.role === 'qa_inspector' && renderQualityInspectorDashboard()}
      {user?.role === 'store_manager' && renderStoreManagerDashboard()}
      {(user?.role === 'admin' || user?.role === 'management' || user?.role === 'sales_manager' || user?.role === 'accountant' || !['production_manager', 'qa_inspector', 'store_manager'].includes(user?.role)) && renderProductionManagerDashboard()}
    </PageShell>
    );
  }

function QuickActionButton({ icon: Icon, label, color, onClick }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200',
    teal: 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200',
    amber: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200',
    green: 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200',
    purple: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200',
    red: 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
  };

  return (
    <button onClick={onClick} className={`${colorClasses[color]} p-4 rounded-xl transition-all hover:shadow-md hover:-translate-y-0.5 flex flex-col items-center justify-center space-y-2`}>
      <Icon className="h-7 w-7" />
      <span className="text-sm font-bold tracking-tight text-center">{label}</span>
    </button>
  );
}
