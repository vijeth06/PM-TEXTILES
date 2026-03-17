import React, { useState } from 'react';
import { reportsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Card, CardHeader, CardBody, Button, Select, LoadingSpinner, Table, Thead, Tbody, Th, Td, Badge } from '../components/common';
import DateRangePicker from '../components/DateRangePicker';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';
import PageShell from '../components/PageShell';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const ReportsNew = () => {
  const [selectedReport, setSelectedReport] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const reports = [
    { id: 'production', name: 'Daily Production Report', api: 'getDailyProduction' },
    { id: 'inventory', name: 'Inventory Aging Report', api: 'getInventoryAging' },
    { id: 'wastage', name: 'Wastage Analysis', api: 'getWastageAnalysis' },
    { id: 'orders', name: 'Order Fulfillment (OTIF)', api: 'getOrderFulfillment' },
    { id: 'machines', name: 'Machine Utilization', api: 'getMachineUtilization' },
    { id: 'profit', name: 'Profit Per Order', api: 'getProfitPerOrder' }
  ];

  const generateReport = async () => {
    if (!selectedReport) {
      toast.error('Please select a report type');
      return;
    }

    try {
      setLoading(true);
      const report = reports.find(r => r.id === selectedReport);
      const response = await reportsAPI[report.api](dateRange);
      setReportData(response.data);
      toast.success('Report generated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate report');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = ({ startDate, endDate }) => {
    setDateRange({ startDate, endDate });
  };

  const exportToPDFHandler = () => {
    if (!reportData || !selectedReport) {
      toast.error('No report data to export');
      return;
    }

    try {
      const report = reports.find(r => r.id === selectedReport);
      let headers, data, summary;

      // Prepare data based on report type
      switch (selectedReport) {
        case 'production': {
          const stageEntries = Object.entries(reportData.summary?.stageWise || {});
          headers = ['Stage', 'Completed', 'In Progress', 'Total Output'];
          data = stageEntries.map(([stage, values]) => [
            stage.replace(/_/g, ' ').toUpperCase(),
            values.completed,
            values.inProgress,
            values.totalOutput
          ]);
          summary = { 'Total Stages': reportData.summary?.totalStages || 0 };
          break;
        }
        case 'inventory': {
          const agingEntries = Object.entries(reportData.agingBuckets || {});
          headers = ['Aging Bucket (Days)', 'Item Count', 'Value (₹)'];
          data = agingEntries.map(([bucket, values]) => [
            bucket, values.count, '₹' + (values.value || 0).toLocaleString()
          ]);
          break;
        }
        case 'wastage': {
          const stageWastage = Object.entries(reportData.byStage || {});
          headers = ['Stage', 'Quantity (kg)', 'Cost (₹)'];
          data = stageWastage.map(([stage, values]) => [
            stage.replace(/_/g, ' ').toUpperCase(), values.quantity, '₹' + (values.cost || 0).toLocaleString()
          ]);
          summary = {
            'Total Records': reportData.summary?.totalRecords || 0,
            'Total Quantity': (reportData.summary?.totalQuantity || 0) + ' kg',
            'Total Cost': '₹' + (reportData.summary?.totalCost || 0).toLocaleString()
          };
          break;
        }
        case 'orders': {
          const metrics = reportData.metrics || {};
          headers = ['Metric', 'Value'];
          data = [
            ['Total Orders', metrics.total || 0],
            ['Delivered', metrics.delivered || 0],
            ['On Time', metrics.onTime || 0],
            ['Delayed', metrics.delayed || 0],
            ['Pending', metrics.pending || 0],
            ['OTIF %', (metrics.otif || 0) + '%']
          ];
          break;
        }
        case 'machines':
          headers = ['Machine', 'Type', 'Uptime (hrs)', 'Downtime (hrs)', 'Utilization %', 'Status'];
          data = (reportData.data || []).map(m => [
            m.machineCode,
            m.type,
            (m.totalUptime / 60).toFixed(1),
            (m.totalDowntime / 60).toFixed(1),
            m.utilizationPercent + '%',
            m.status
          ]);
          break;
        case 'profit':
          headers = ['Order No', 'Customer', 'Order Date', 'Revenue', 'Status'];
          data = (reportData.data || []).map(o => [
            o.orderNo,
            o.customerName,
            new Date(o.orderDate).toLocaleDateString(),
            '₹' + o.revenue?.toLocaleString(),
            o.status
          ]);
          summary = {
            'Total Orders': reportData.count || 0,
            'Total Revenue': '₹' + ((reportData.totalRevenue || 0) / 1000).toFixed(0) + 'K'
          };
          break;
        default:
          headers = ['Data'];
          data = [['Report data not formatted for export']];
      }

      const success = exportToPDF({
        title: report.name,
        headers,
        data,
        summary,
        filename: `${selectedReport}_report_${new Date().toISOString().split('T')[0]}.pdf`,
        orientation: 'landscape'
      });

      if (success) {
        toast.success('PDF exported successfully');
      } else {
        toast.error('Failed to export PDF');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export PDF');
    }
  };

  const exportToExcelHandler = () => {
    if (!reportData || !selectedReport) {
      toast.error('No report data to export');
      return;
    }

    try {
      let sheets = [];

      // Prepare data based on report type
      switch (selectedReport) {
        case 'production': {
          const stageEntries = Object.entries(reportData.summary?.stageWise || {});
          sheets.push({
            name: 'Production Report',
            headers: ['Stage', 'Completed', 'In Progress', 'Total Output'],
            data: stageEntries.map(([stage, values]) => [
              stage.replace(/_/g, ' ').toUpperCase(), values.completed, values.inProgress, values.totalOutput
            ])
          });
          break;
        }
        case 'inventory': {
          const agingEntries = Object.entries(reportData.agingBuckets || {});
          sheets.push({
            name: 'Inventory Aging',
            headers: ['Aging Bucket (Days)', 'Item Count', 'Value'],
            data: agingEntries.map(([bucket, values]) => [bucket, values.count, values.value || 0])
          });
          break;
        }
        case 'wastage': {
          const stageWastage = Object.entries(reportData.byStage || {});
          const typeWastage = Object.entries(reportData.byType || {});
          sheets.push({
            name: 'Wastage by Stage',
            headers: ['Stage', 'Quantity (kg)', 'Cost'],
            data: stageWastage.map(([stage, v]) => [stage.replace(/_/g, ' ').toUpperCase(), v.quantity, v.cost])
          });
          sheets.push({
            name: 'Wastage by Type',
            headers: ['Type', 'Quantity (kg)', 'Cost'],
            data: typeWastage.map(([type, v]) => [type.replace(/_/g, ' ').toUpperCase(), v.quantity, v.cost])
          });
          break;
        }
        case 'orders': {
          const metrics = reportData.metrics || {};
          sheets.push({
            name: 'Order Fulfillment',
            headers: ['Metric', 'Value'],
            data: [
              ['Total Orders', metrics.total || 0],
              ['Delivered', metrics.delivered || 0],
              ['On Time', metrics.onTime || 0],
              ['Delayed', metrics.delayed || 0],
              ['OTIF %', (metrics.otif || 0) + '%']
            ]
          });
          break;
        }
        case 'machines':
          sheets.push({
            name: 'Machine Utilization',
            headers: ['Machine', 'Type', 'Uptime (hrs)', 'Downtime (hrs)', 'Utilization %', 'Status'],
            data: (reportData.data || []).map(m => [
              m.machineCode,
              m.type,
              (m.totalUptime / 60).toFixed(1),
              (m.totalDowntime / 60).toFixed(1),
              m.utilizationPercent,
              m.status
            ])
          });
          break;
        case 'profit':
          sheets.push({
            name: 'Profit Per Order',
            headers: ['Order No', 'Customer', 'Order Date', 'Revenue', 'Status'],
            data: (reportData.data || []).map(o => [
              o.orderNo,
              o.customerName,
              new Date(o.orderDate).toLocaleDateString(),
              o.revenue,
              o.status
            ])
          });
          break;
        default:
          sheets.push({
            name: 'Report Data',
            headers: ['Info'],
            data: [['Report data not formatted for export']]
          });
      }

      const success = exportToExcel({
        filename: `${selectedReport}_report_${new Date().toISOString().split('T')[0]}.xlsx`,
        sheets
      });

      if (success) {
        toast.success('Excel exported successfully');
      } else {
        toast.error('Failed to export Excel');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export Excel. Make sure required packages are installed.');
    }
  };

  return (
    <PageShell
      title="Reports & Analytics"
      description="Generate operational reports with date filters, chart views, and one-click export to PDF/Excel."
      badge="Insights"
      stats={[
        { label: 'Report Types', value: String(reports.length), helper: 'Production, inventory, orders, machine, profit' },
        { label: 'Selected', value: reports.find((r) => r.id === selectedReport)?.name || 'None', helper: 'Choose and generate' },
        { label: 'Date Window', value: `${dateRange.startDate} to ${dateRange.endDate}`, helper: 'Current filter range' }
      ]}
    >
      <div className="space-y-6">

      {/* Report Selection */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Generate Report</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Report Type"
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
            >
              <option value="">Select Report</option>
              {reports.map(report => (
                <option key={report.id} value={report.id}>{report.name}</option>
              ))}
            </Select>

            <div className="col-span-1">
              <DateRangePicker
                label="Date Range"
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                onChange={handleDateChange}
                presets={true}
              />
            </div>

            <div className="flex items-end">
              <Button onClick={generateReport} disabled={loading} className="w-full">
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Report Content */}
      {loading && (
        <div className="py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {!loading && reportData && (
        <>
          {/* Export Buttons */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={exportToPDFHandler} className="flex items-center">
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" onClick={exportToExcelHandler} className="flex items-center">
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Export Excel
            </Button>
          </div>

          {/* Report Views */}
          {selectedReport === 'production' && <ProductionReport data={reportData} />}
          {selectedReport === 'inventory' && <InventoryAgingReport data={reportData} />}
          {selectedReport === 'wastage' && <WastageReport data={reportData} />}
          {selectedReport === 'orders' && <OrderFulfillmentReport data={reportData} />}
          {selectedReport === 'machines' && <MachineUtilizationReport data={reportData} />}
          {selectedReport === 'profit' && <ProfitReport data={reportData} />}
        </>
      )}
      </div>
    </PageShell>
  );
};

const ProductionReport = ({ data }) => {
  const stageData = Object.entries(data.summary?.stageWise || {}).map(([stage, values]) => ({
    stage: stage.replace(/_/g, ' ').toUpperCase(),
    completed: values.completed,
    inProgress: values.inProgress,
    output: values.totalOutput
  }));

  return (
    <>
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Production Summary</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-blue-50 p-4 rounded">
              <div className="text-sm text-blue-600 font-medium">Total Stages</div>
              <div className="text-3xl font-bold text-blue-900">{data.summary?.totalStages || 0}</div>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <div className="text-sm text-green-600 font-medium">Completed</div>
              <div className="text-3xl font-bold text-green-900">
                {stageData.reduce((sum, s) => sum + s.completed, 0)}
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded">
              <div className="text-sm text-yellow-600 font-medium">In Progress</div>
              <div className="text-3xl font-bold text-yellow-900">
                {stageData.reduce((sum, s) => sum + s.inProgress, 0)}
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" fill="#10B981" name="Completed" />
              <Bar dataKey="inProgress" fill="#F59E0B" name="In Progress" />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
    </>
  );
};

const InventoryAgingReport = ({ data }) => {
  const agingData = Object.entries(data.agingBuckets || {}).map(([bucket, values]) => ({
    bucket,
    count: values.count,
    value: values.value
  }));

  return (
    <>
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Inventory Aging Analysis</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={agingData}
                  dataKey="count"
                  nameKey="bucket"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {agingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-3">
              {agingData.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">{item.bucket} Days</div>
                    <div className="text-sm text-gray-600">{item.count} items</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">₹{(item.value / 1000).toFixed(0)}K</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>
    </>
  );
};

const WastageReport = ({ data }) => {
  const stageData = Object.entries(data.byStage || {}).map(([stage, values]) => ({
    stage: stage.replace(/_/g, ' ').toUpperCase(),
    quantity: values.quantity,
    cost: values.cost
  }));

  const typeData = Object.entries(data.byType || {}).map(([type, values]) => ({
    type: type.replace(/_/g, ' ').toUpperCase(),
    quantity: values.quantity,
    cost: values.cost
  }));

  return (
    <>
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Wastage Analysis</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-red-50 p-4 rounded">
              <div className="text-sm text-red-600 font-medium">Total Records</div>
              <div className="text-3xl font-bold text-red-900">{data.summary?.totalRecords || 0}</div>
            </div>
            <div className="bg-orange-50 p-4 rounded">
              <div className="text-sm text-orange-600 font-medium">Total Quantity</div>
              <div className="text-3xl font-bold text-orange-900">{data.summary?.totalQuantity || 0} kg</div>
            </div>
            <div className="bg-red-50 p-4 rounded">
              <div className="text-sm text-red-600 font-medium">Total Cost</div>
              <div className="text-3xl font-bold text-red-900">₹{((data.summary?.totalCost || 0) / 1000).toFixed(0)}K</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">By Stage</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="quantity" fill="#EF4444" name="Quantity (kg)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">By Type</h4>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={typeData}
                    dataKey="quantity"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardBody>
      </Card>
    </>
  );
};

const OrderFulfillmentReport = ({ data }) => {
  const metrics = data.metrics || {};
  const chartData = [
    { name: 'On Time', value: metrics.onTime || 0, fill: '#10B981' },
    { name: 'Delayed', value: metrics.delayed || 0, fill: '#EF4444' },
    { name: 'Pending', value: metrics.pending || 0, fill: '#F59E0B' }
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Order Fulfillment (OTIF) Report</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-blue-50 p-4 rounded">
              <div className="text-sm text-blue-600 font-medium">Total Orders</div>
              <div className="text-3xl font-bold text-blue-900">{metrics.total || 0}</div>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <div className="text-sm text-green-600 font-medium">Delivered</div>
              <div className="text-3xl font-bold text-green-900">{metrics.delivered || 0}</div>
            </div>
            <div className="bg-red-50 p-4 rounded">
              <div className="text-sm text-red-600 font-medium">Delayed</div>
              <div className="text-3xl font-bold text-red-900">{metrics.delayed || 0}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded">
              <div className="text-sm text-purple-600 font-medium">OTIF %</div>
              <div className="text-3xl font-bold text-purple-900">{metrics.otif || 0}%</div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
    </>
  );
};

const MachineUtilizationReport = ({ data }) => {
  const machineData = (data.data || []).map(machine => ({
    machine: machine.machineCode,
    utilization: parseFloat(machine.utilizationPercent || 0),
    uptime: machine.totalUptime,
    downtime: machine.totalDowntime
  }));

  return (
    <>
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Machine Utilization Report</h3>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={machineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="machine" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="utilization" fill="#3B82F6" name="Utilization %" />
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-6">
            <Table>
              <Thead>
                <tr>
                  <Th>Machine</Th>
                  <Th>Type</Th>
                  <Th>Uptime (hrs)</Th>
                  <Th>Downtime (hrs)</Th>
                  <Th>Utilization %</Th>
                  <Th>Status</Th>
                </tr>
              </Thead>
              <Tbody>
                {(data.data || []).map((machine, idx) => (
                  <tr key={idx}>
                    <Td className="font-medium">{machine.machineCode}</Td>
                    <Td>{machine.type}</Td>
                    <Td>{(machine.totalUptime / 60).toFixed(1)}</Td>
                    <Td>{(machine.totalDowntime / 60).toFixed(1)}</Td>
                    <Td>
                      <Badge variant={
                        machine.utilizationPercent >= 80 ? 'success' :
                        machine.utilizationPercent >= 60 ? 'warning' : 'danger'
                      }>
                        {machine.utilizationPercent}%
                      </Badge>
                    </Td>
                    <Td>
                      <Badge variant={machine.status === 'running' ? 'success' : 'default'}>
                        {machine.status}
                      </Badge>
                    </Td>
                  </tr>
                ))}
              </Tbody>
            </Table>
          </div>
        </CardBody>
      </Card>
    </>
  );
};

const ProfitReport = ({ data }) => {
  const orders = data.data || [];
  const revenueData = orders.slice(0, 10).map(order => ({
    order: order.orderNo,
    revenue: order.revenue
  }));

  return (
    <>
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Profit Per Order Report</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-blue-50 p-4 rounded">
              <div className="text-sm text-blue-600 font-medium">Total Orders</div>
              <div className="text-3xl font-bold text-blue-900">{data.count || 0}</div>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <div className="text-sm text-green-600 font-medium">Total Revenue</div>
              <div className="text-3xl font-bold text-green-900">₹{((data.totalRevenue || 0) / 1000).toFixed(0)}K</div>
            </div>
            <div className="bg-purple-50 p-4 rounded">
              <div className="text-sm text-purple-600 font-medium">Avg per Order</div>
              <div className="text-3xl font-bold text-purple-900">
                ₹{data.count > 0 ? ((data.totalRevenue / data.count) / 1000).toFixed(0) : 0}K
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="order" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={2} name="Revenue" />
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-6">
            <Table>
              <Thead>
                <tr>
                  <Th>Order No</Th>
                  <Th>Customer</Th>
                  <Th>Order Date</Th>
                  <Th>Revenue</Th>
                  <Th>Status</Th>
                </tr>
              </Thead>
              <Tbody>
                {orders.map((order, idx) => (
                  <tr key={idx}>
                    <Td className="font-medium">{order.orderNo}</Td>
                    <Td>{order.customerName}</Td>
                    <Td>{new Date(order.orderDate).toLocaleDateString()}</Td>
                    <Td className="font-medium">₹{order.revenue?.toLocaleString()}</Td>
                    <Td>
                      <Badge variant={order.status === 'delivered' ? 'success' : 'info'}>
                        {order.status}
                      </Badge>
                    </Td>
                  </tr>
                ))}
              </Tbody>
            </Table>
          </div>
        </CardBody>
      </Card>
    </>
  );
};

export default ReportsNew;
