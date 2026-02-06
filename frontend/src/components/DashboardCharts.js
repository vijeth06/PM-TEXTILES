import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export const ProductionTrendChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorProduction" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="date" stroke="#6B7280" />
        <YAxis stroke="#6B7280" />
        <Tooltip 
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
        />
        <Area 
          type="monotone" 
          dataKey="quantity" 
          stroke="#3B82F6" 
          fillOpacity={1} 
          fill="url(#colorProduction)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export const RevenueChart = ({ data }) => {
  const hasOrders = Array.isArray(data) && data.some(d => Object.prototype.hasOwnProperty.call(d, 'orders'));
  const secondKey = hasOrders ? 'orders' : 'profit';
  const secondLabel = hasOrders ? 'Orders' : 'Profit';

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="month" stroke="#6B7280" />
        <YAxis stroke="#6B7280" />
        <Tooltip 
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
          formatter={(value, name) => {
            if (name === secondKey && hasOrders) return Number(value).toLocaleString();
            return `₹${Number(value).toLocaleString()}`;
          }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="revenue" 
          stroke="#10B981" 
          strokeWidth={3}
          dot={{ fill: '#10B981', r: 5 }}
          activeDot={{ r: 7 }}
        />
        <Line 
          type="monotone" 
          dataKey={secondKey}
          stroke="#3B82F6" 
          strokeWidth={3}
          dot={{ fill: '#3B82F6', r: 5 }}
          activeDot={{ r: 7 }}
          name={secondLabel}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export const OrderStatusChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
};

export const InventoryLevelsChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="item" stroke="#6B7280" />
        <YAxis stroke="#6B7280" />
        <Tooltip 
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
        />
        <Legend />
        <Bar dataKey="current" fill="#3B82F6" radius={[8, 8, 0, 0]} />
        <Bar dataKey="reorderPoint" fill="#F59E0B" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const QualityMetricsChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis type="number" stroke="#6B7280" />
        <YAxis dataKey="stage" type="category" stroke="#6B7280" width={120} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
          formatter={(value) => `${value}%`}
        />
        <Bar dataKey="passRate" fill="#10B981" radius={[0, 8, 8, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const MonthlyPerformanceChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="month" stroke="#6B7280" />
        <YAxis stroke="#6B7280" />
        <Tooltip 
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
          formatter={(value, name) => {
            if (name === 'delivery') return [`${Number(value).toFixed(2)}%`, 'On-time Delivery'];
            return [Number(value).toLocaleString(), name];
          }}
        />
        <Legend />
        <Bar dataKey="orders" fill="#3B82F6" radius={[8, 8, 0, 0]} />
        <Bar dataKey="production" fill="#10B981" radius={[8, 8, 0, 0]} />
        <Bar dataKey="delivery" name="On-time Delivery (%)" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};
