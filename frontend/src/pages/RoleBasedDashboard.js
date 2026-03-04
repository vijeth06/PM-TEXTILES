import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { StatCard, Button, SectionHeader, Card } from '../components/UIComponents';
import {
  ChartBarIcon,
  CogIcon,
  TruckIcon,
  UserGroupIcon,
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
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // Mock data - replace with actual API calls
    setStats({
      production: {
        today: 15420,
        target: 18000,
        efficiency: 85.7,
        looms: {total: 120, running: 102, idle: 12, breakdown: 6}
      },
      quality: {
        firstQuality: 92.3,
        defectRate: 3.2,
        inspected: 8540
      },
      inventory: {
        yarnStock: 45000,
        fabricStock: 32000,
        alerts: 12
      },
      orders: {
        pending: 45,
        inProduction: 28,
        completed: 156
      },
      dyeing: {
        batches: 8,
        shadeOk: 6,
        redip: 2
      }
    });
    setLoading(false);
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
          trend="up"
          change="+12.5%"
        />
        <StatCard
          title="Loom Efficiency"
          value={Math.round(stats.production.efficiency)}
          unit="%"
          color="teal"
          icon={CogIcon}
          trend="up"
          change="+5.2%"
        />
        <StatCard
          title="First Quality"
          value={Math.round(stats.quality.firstQuality)}
          unit="%"
          color="green"
          icon={ClipboardDocumentCheckIcon}
          trend="up"
          change="+2.1%"
        />
        <StatCard
          title="Pending Orders"
          value={stats.orders.pending}
          unit="orders"
          color="amber"
          icon={DocumentTextIcon}
          trend="down"
          change="-8.3%"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Trend */}
        <Card variant="elevated" className="p-6">
          <SectionHeader title="Production Trend" subtitle="Last 7 Days" />
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={[
              {day: 'Mon', production: 14500, target: 15000},
              {day: 'Tue', production: 15200, target: 15000},
              {day: 'Wed', production: 14800, target: 15000},
              {day: 'Thu', production: 15600, target: 15000},
              {day: 'Fri', production: 15100, target: 15000},
              {day: 'Sat', production: 15400, target: 15000},
              {day: 'Sun', production: 15420, target: 15000}
            ]}>
              <defs>
                <linearGradient id="colorProduction" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
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
      </div>

      {/* Quick Actions */}
      <Card variant="elevated" className="p-6">
        <SectionHeader title="Quick Actions" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionButton icon={RocketLaunchIcon} label="Start Production" color="blue" />
          <QuickActionButton icon={ClipboardDocumentCheckIcon} label="Quality Check" color="teal" />
          <QuickActionButton icon={WrenchScrewdriverIcon} label="Machine Status" color="amber" />
          <QuickActionButton icon={DocumentTextIcon} label="View Reports" color="purple" />
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
          trend="up"
          change="+7.2%"
        />
        <StatCard
          title="First Quality"
          value={Math.round(stats.quality.firstQuality)}
          unit="%"
          color="green"
          icon={ClipboardDocumentCheckIcon}
          trend="up"
          change="+3.4%"
        />
        <StatCard
          title="Defect Rate"
          value={Math.round(stats.quality.defectRate * 10) / 10}
          unit="%"
          color="red"
          icon={ChartBarIcon}
          trend="down"
          change="-1.2%"
        />
        <StatCard
          title="Pending Tests"
          value="23"
          unit="items"
          color="amber"
          icon={DocumentTextIcon}
          trend="up"
          change="+4.5%"
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
          trend="up"
          change="+5.8%"
        />
        <StatCard
          title="Fabric Stock"
          value={Math.round(stats.inventory.fabricStock / 1000)}
          unit="k m"
          color="green"
          icon={DocumentTextIcon}
          trend="down"
          change="-3.2%"
        />
        <StatCard
          title="Low Stock Alerts"
          value={stats.inventory.alerts}
          unit="items"
          color="red"
          icon={ChartBarIcon}
          trend="up"
          change="+2.1%"
        />
        <StatCard
          title="Pending Transfers"
          value="8"
          unit="transfers"
          color="amber"
          icon={TruckIcon}
          trend="down"
          change="-6.4%"
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
        {(user?.role === 'admin' || user?.role === 'management') && renderProductionManagerDashboard()}
      </div>
    );
  }

function QuickActionButton({ icon: Icon, label, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200',
    teal: 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200',
    amber: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200',
    green: 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200',
    purple: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200',
    red: 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
  };

  return (
    <button className={`${colorClasses[color]} p-4 rounded-lg transition-all hover:shadow-sm flex flex-col items-center justify-center space-y-2`}>
      <Icon className="h-8 w-8" />
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
}
