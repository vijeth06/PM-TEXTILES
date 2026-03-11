import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
  CubeIcon, ArchiveBoxIcon, ShoppingCartIcon, WrenchScrewdriverIcon,
  ExclamationCircleIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon,
  ArrowPathIcon, EyeIcon
} from '@heroicons/react/24/outline';
import { Card, CardHeader, CardBody, Button, Badge, LoadingSpinner } from '../components/common';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const DashboardNew = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedPeriod] = useState('today');
  const [productionTrendData, setProductionTrendData] = useState([]);
  const [inventoryTrendData, setInventoryTrendData] = useState([]);

  useEffect(() => {
    fetchMetrics();
    
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchMetrics();
      }, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const [metricsRes, trendsRes, inventoryTrendRes] = await Promise.all([
        dashboardAPI.getMetrics(),
        dashboardAPI.getTrends({ period: '7days' }),
        dashboardAPI.getInventoryValueTrend({ months: 7 })
      ]);
      setMetrics(metricsRes.data.data);

      const trends = trendsRes.data.data;
      const productionTrend = (trends.productionTrend || []).map(p => ({
        date: p._id,
        production: p.completed || 0,
        target: p.planned || 0
      }));
      setProductionTrendData(productionTrend);

      const invTrend = (inventoryTrendRes.data.data || []).map(t => ({
        month: t.month,
        value: Math.round((t.totalValue || 0) / 1000)
      }));
      setInventoryTrendData(invTrend);
    } catch (error) {
      toast.error('Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const productionStatusData = [
    { name: 'Active Plans', value: metrics?.production?.activePlans || 0, fill: '#3B82F6' },
    { name: 'Completed Today', value: metrics?.production?.completedToday || 0, fill: '#10B981' },
    { name: 'Delayed Stages', value: metrics?.production?.delayedStages || 0, fill: '#EF4444' }
  ];

  const orderStatusData = [
    { name: 'Pending', value: metrics?.orders?.pending || 0, fill: '#6B7280' },
    { name: 'Urgent', value: metrics?.orders?.urgent || 0, fill: '#F59E0B' },
    { name: 'Overdue', value: metrics?.orders?.overdue || 0, fill: '#EF4444' }
  ];

  const machineStatusData = [
    { name: 'Operational', value: metrics?.machines?.operational || 0, fill: '#10B981' },
    { name: 'Under Maintenance', value: metrics?.machines?.underMaintenance || 0, fill: '#EF4444' }
  ];

  const displayDate = (yyyyMmDd) => {
    try {
      return new Date(yyyyMmDd).toLocaleDateString(undefined, { month: 'short', day: '2-digit' });
    } catch {
      return yyyyMmDd;
    }
  };

  const displayMonth = (yyyyMm) => {
    const [yyyy, mm] = String(yyyyMm).split('-');
    if (!yyyy || !mm) return yyyyMm;
    const date = new Date(Number(yyyy), Number(mm) - 1, 1);
    return date.toLocaleDateString(undefined, { month: 'short' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time overview of your operations</p>
        </div>
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700">Auto Refresh (30s)</span>
          </label>
          <Button onClick={fetchMetrics} variant="outline" className="flex items-center">
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon={CubeIcon}
          title="Production Plans"
          value={metrics?.production?.activePlans || 0}
          subtitle={`${metrics?.production?.completedToday || 0} completed today`}
          trend={{ value: 12, isPositive: true }}
          iconColor="text-blue-600"
          bgColor="bg-blue-100"
        />
        <StatsCard
          icon={ArchiveBoxIcon}
          title="Inventory Value"
          value={`₹${((metrics?.inventory?.totalValue || 0) / 1000).toFixed(0)}K`}
          subtitle={`${metrics?.inventory?.lowStockItems || 0} low stock alerts`}
          trend={{ value: 5, isPositive: false }}
          iconColor="text-green-600"
          bgColor="bg-green-100"
        />
        <StatsCard
          icon={ShoppingCartIcon}
          title="Pending Orders"
          value={metrics?.orders?.pending || 0}
          subtitle={`${metrics?.orders?.urgent || 0} urgent, ${metrics?.orders?.overdue || 0} overdue`}
          trend={{ value: 18, isPositive: true }}
          iconColor="text-purple-600"
          bgColor="bg-purple-100"
        />
        <StatsCard
          icon={WrenchScrewdriverIcon}
          title="Machine Status"
          value={`${metrics?.machines?.operational || 0}/${metrics?.machines?.total || 0}`}
          subtitle={`${metrics?.machines?.underMaintenance || 0} under maintenance`}
          trend={{ value: 8, isPositive: true }}
          iconColor="text-orange-600"
          bgColor="bg-orange-100"
        />
      </div>

      {/* Production Trend */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Production Trend (This Week)</h3>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className={selectedPeriod === 'today' ? 'bg-blue-50' : ''}>
                Today
              </Button>
              <Button variant="outline" size="sm" className={selectedPeriod === 'week' ? 'bg-blue-50' : ''}>
                Week
              </Button>
              <Button variant="outline" size="sm" className={selectedPeriod === 'month' ? 'bg-blue-50' : ''}>
                Month
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={productionTrendData}>
              <defs>
                <linearGradient id="colorProduction" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={displayDate} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="production" stroke="#3B82F6" fillOpacity={1} fill="url(#colorProduction)" name="Actual Production" />
              <Line type="monotone" dataKey="target" stroke="#EF4444" strokeDasharray="5 5" name="Target" />
            </AreaChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Production Status */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Production Status</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={productionStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {productionStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {productionStatusData.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></div>
                  <span className="text-xs text-gray-600">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Order Distribution */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Order Distribution</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={orderStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Machine Status */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Machine Status</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={machineStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label
                >
                  {machineStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Inventory Value Trend */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Inventory Value Trend (₹K)</h3>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={inventoryTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tickFormatter={displayMonth} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={3} dot={{ r: 5 }} name="Inventory Value" />
            </LineChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* Wastage Analysis */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Wastage Summary</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-red-600">
                  {metrics?.wastage?.totalQuantity || 0} kg
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded">
                  <div className="text-sm text-gray-600">Total Cost</div>
                  <div className="text-xl font-semibold text-gray-900">
                    ₹{((metrics?.wastage?.totalCost || 0) / 1000).toFixed(2)}K
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <div className="text-sm text-gray-600">Records</div>
                  <div className="text-xl font-semibold text-gray-900">
                    {metrics?.wastage?.recordCount || 0}
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {metrics?.wastage?.period || 'Last 30 days'}
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="text-center">
                <ExclamationCircleIcon className="h-16 w-16 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Detailed breakdown coming soon</p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
              <Button variant="outline" size="sm" className="flex items-center">
                <EyeIcon className="h-4 w-4 mr-1" />
                View All
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {metrics?.recentActivities?.orders && metrics.recentActivities.orders.length > 0 ? (
                metrics.recentActivities.orders.slice(0, 5).map((order) => (
                  <div key={order._id} className="flex justify-between items-center border-b pb-2 hover:bg-gray-50 p-2 rounded transition-colors">
                    <div>
                      <div className="font-medium text-gray-900">{order.orderNo}</div>
                      <div className="text-sm text-gray-500">{order.customerName || order.customerId?.name || 'N/A'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </div>
                      <Badge variant={
                        order.status === 'delivered' ? 'success' :
                        order.status === 'dispatched' ? 'info' :
                        order.status === 'in_production' ? 'warning' : 'default'
                      }>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">No recent orders</div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Recent Production */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Recent Production Plans</h3>
              <Button variant="outline" size="sm" className="flex items-center">
                <EyeIcon className="h-4 w-4 mr-1" />
                View All
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {metrics?.recentActivities?.production && metrics.recentActivities.production.length > 0 ? (
                metrics.recentActivities.production.slice(0, 5).map((plan) => (
                  <div key={plan._id} className="flex justify-between items-center border-b pb-2 hover:bg-gray-50 p-2 rounded transition-colors">
                    <div>
                      <div className="font-medium text-gray-900">{plan.planNo || 'N/A'}</div>
                      <div className="text-sm text-gray-500">
                        {plan.stageName || 'N/A'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        {plan.outputQuantity || 0} units
                      </div>
                      <Badge variant={
                        plan.status === 'completed' ? 'success' :
                        plan.status === 'in_progress' ? 'warning' :
                        plan.status === 'approved' ? 'info' : 'default'
                      }>
                        {plan.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">No recent production plans</div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

const StatsCard = ({ icon: Icon, title, value, subtitle, trend, iconColor, bgColor }) => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardBody>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? (
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
              )}
              <span>{trend.value}% vs last period</span>
            </div>
          )}
        </div>
        <div className={`${bgColor} p-3 rounded-full`}>
          <Icon className={`h-8 w-8 ${iconColor}`} />
        </div>
      </div>
    </CardBody>
  </Card>
);

export default DashboardNew;

