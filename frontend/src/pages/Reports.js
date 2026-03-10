import React, { useState, useEffect } from 'react';
import { reportsAPI, exportAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
  Card, CardHeader, CardBody, Button, Badge, Table, Thead, Tbody, Th, Td,
  LoadingSpinner 
} from '../components/common';
import { 
  ChartBarIcon, ExclamationTriangleIcon, TrendingUpIcon, 
  CubeIcon, CheckCircleIcon 
} from '@heroicons/react/24/outline';

const Reports = () => {
  const [activeReport, setActiveReport] = useState('production');
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const reports = [
    { id: 'production', name: 'Daily Production', icon: ChartBarIcon },
    { id: 'inventory', name: 'Inventory Aging', icon: CubeIcon },
    { id: 'wastage', name: 'Wastage Analysis', icon: ExclamationTriangleIcon },
    { id: 'fulfillment', name: 'Order Fulfillment', icon: CheckCircleIcon },
    { id: 'machines', name: 'Machine Utilization', icon: TrendingUpIcon },
    { id: 'profit', name: 'Profit Analysis', icon: TrendingUpIcon },
    { id: 'import', name: 'Import Data', icon: CubeIcon }
  ];

  useEffect(() => {
    if (activeReport !== 'import') {
      fetchReport();
    }
  }, [activeReport, filters]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let data;
      switch (activeReport) {
        case 'production':
          data = await reportsAPI.getDailyProduction({ date: filters.date });
          break;
        case 'inventory':
          data = await reportsAPI.getInventoryAging();
          break;
        case 'wastage':
          data = await reportsAPI.getWastageAnalysis({
            startDate: filters.startDate,
            endDate: filters.endDate
          });
          break;
        case 'fulfillment':
          data = await reportsAPI.getOrderFulfillment({
            startDate: filters.startDate,
            endDate: filters.endDate
          });
          break;
        case 'machines':
          data = await reportsAPI.getMachineUtilization();
          break;
        case 'profit':
          data = await reportsAPI.getProfitPerOrder({
            startDate: filters.startDate,
            endDate: filters.endDate
          });
          break;
        default:
          return;
      }
      setReportData(data.data);
    } catch (error) {
      toast.error('Failed to load report');
      console.error('Report error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderProductionReport = () => {
    if (!reportData) return null;
    const data = reportData;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-blue-50 border border-blue-200">
            <CardBody className="p-4">
              <p className="text-blue-600 text-sm font-medium">Total Stages</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{data.summary?.totalStages || 0}</p>
            </CardBody>
          </Card>
          <Card className="bg-green-50 border border-green-200">
            <CardBody className="p-4">
              <p className="text-green-600 text-sm font-medium">Total Output</p>
              <p className="text-3xl font-bold text-green-900 mt-2">{data.summary?.totalOutput || 0}</p>
            </CardBody>
          </Card>
          <Card className="bg-yellow-50 border border-yellow-200">
            <CardBody className="p-4">
              <p className="text-yellow-600 text-sm font-medium">Total Wastage</p>
              <p className="text-3xl font-bold text-yellow-900 mt-2">{data.summary?.totalWastage || 0}</p>
            </CardBody>
          </Card>
          <Card className="bg-red-50 border border-red-200">
            <CardBody className="p-4">
              <p className="text-red-600 text-sm font-medium">Total Rejections</p>
              <p className="text-3xl font-bold text-red-900 mt-2">{data.summary?.totalRejection || 0}</p>
            </CardBody>
          </Card>
        </div>

        {/* Stage-wise Details */}
        {data.summary?.stageWise && (
          <Card>
            <CardHeader className="border-b">
              <h3 className="font-semibold text-gray-900">Stage-wise Summary</h3>
            </CardHeader>
            <CardBody className="p-0">
              <Table>
                <Thead>
                  <tr>
                    <Th>Stage</Th>
                    <Th>Completed</Th>
                    <Th>In Progress</Th>
                    <Th>Output</Th>
                    <Th>Wastage</Th>
                    <Th>Rejections</Th>
                  </tr>
                </Thead>
                <Tbody>
                  {Object.entries(data.summary.stageWise).map(([stage, metrics]) => (
                    <tr key={stage}>
                      <Td className="font-medium text-gray-900">{stage}</Td>
                      <Td>{metrics.completed}</Td>
                      <Td>{metrics.inProgress}</Td>
                      <Td>{metrics.totalOutput}</Td>
                      <Td className="text-yellow-600">{metrics.totalWastage}</Td>
                      <Td className="text-red-600">{metrics.totalRejection}</Td>
                    </tr>
                  ))}
                </Tbody>
              </Table>
            </CardBody>
          </Card>
        )}
      </div>
    );
  };

  const renderInventoryReport = () => {
    if (!reportData) return null;
    const data = reportData;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-blue-50 border border-blue-200">
            <CardBody className="p-4">
              <p className="text-blue-600 text-sm font-medium">Total Items</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{data.summary?.totalItems || 0}</p>
            </CardBody>
          </Card>
          <Card className="bg-green-50 border border-green-200">
            <CardBody className="p-4">
              <p className="text-green-600 text-sm font-medium">Total Value</p>
              <p className="text-3xl font-bold text-green-900 mt-2">₹ {(data.summary?.totalValue || 0).toLocaleString()}</p>
            </CardBody>
          </Card>
        </div>

        {/* Aging Buckets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.agingBuckets && Object.entries(data.agingBuckets).map(([bucket, metrics]) => (
            <Card key={bucket} className="bg-gray-50 border border-gray-200">
              <CardBody className="p-4">
                <p className="text-gray-600 text-sm font-medium">Days: {bucket}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{metrics.count} items</p>
                <p className="text-sm text-gray-500 mt-1">Value: ₹{metrics.value.toLocaleString()}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderFulfillmentReport = () => {
    if (!reportData) return null;
    const metrics = reportData;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-blue-50 border border-blue-200">
            <CardBody className="p-4">
              <p className="text-blue-600 text-sm font-medium">Total Orders</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{metrics.total || 0}</p>
            </CardBody>
          </Card>
          <Card className="bg-green-50 border border-green-200">
            <CardBody className="p-4">
              <p className="text-green-600 text-sm font-medium">Delivered</p>
              <p className="text-3xl font-bold text-green-900 mt-2">{metrics.delivered || 0}</p>
            </CardBody>
          </Card>
          <Card className="bg-yellow-50 border border-yellow-200">
            <CardBody className="p-4">
              <p className="text-yellow-600 text-sm font-medium">Delayed</p>
              <p className="text-3xl font-bold text-yellow-900 mt-2">{metrics.delayed || 0}</p>
            </CardBody>
          </Card>
          <Card className="bg-purple-50 border border-purple-200">
            <CardBody className="p-4">
              <p className="text-purple-600 text-sm font-medium">OTIF %</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">{metrics.otif || 0}%</p>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  };

  const renderMachineReport = () => {
    if (!reportData) return null;
    const data = reportData;

    return (
      <div className="space-y-6">
        <Card className="bg-blue-50 border border-blue-200">
          <CardBody className="p-4">
            <p className="text-blue-600 text-sm font-medium">Average Utilization</p>
            <p className="text-3xl font-bold text-blue-900 mt-2">{data.avgUtilization || 0}%</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <h3 className="font-semibold text-gray-900">Machine-wise Details</h3>
          </CardHeader>
          <CardBody className="p-0">
            <Table>
              <Thead>
                <tr>
                  <Th>Machine Code</Th>
                  <Th>Machine Name</Th>
                  <Th>Type</Th>
                  <Th>Status</Th>
                  <Th>Uptime (hrs)</Th>
                  <Th>Downtime (hrs)</Th>
                  <Th>Utilization %</Th>
                </tr>
              </Thead>
              <Tbody>
                {data.data?.map((machine) => (
                  <tr key={machine.machineCode}>
                    <Td className="font-medium text-gray-900">{machine.machineCode}</Td>
                    <Td>{machine.machineName}</Td>
                    <Td>{machine.type}</Td>
                    <Td>
                      <Badge variant={machine.status === 'active' ? 'success' : 'warning'}>
                        {machine.status}
                      </Badge>
                    </Td>
                    <Td>{(machine.totalUptime / 3600).toFixed(2)}</Td>
                    <Td>{(machine.totalDowntime / 3600).toFixed(2)}</Td>
                    <Td>
                      <span className={machine.utilizationPercent >= 80 ? 'text-green-600 font-semibold' : 'text-yellow-600'}>
                        {machine.utilizationPercent}%
                      </span>
                    </Td>
                  </tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      </div>
    );
  };

  const renderProfitReport = () => {
    if (!reportData) return null;
    const data = reportData;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-blue-50 border border-blue-200">
            <CardBody className="p-4">
              <p className="text-blue-600 text-sm font-medium">Total Orders</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{data.count || 0}</p>
            </CardBody>
          </Card>
          <Card className="bg-green-50 border border-green-200">
            <CardBody className="p-4">
              <p className="text-green-600 text-sm font-medium">Delivered</p>
              <p className="text-3xl font-bold text-green-900 mt-2">{data.deliveredCount || 0}</p>
            </CardBody>
          </Card>
          <Card className="bg-purple-50 border border-purple-200">
            <CardBody className="p-4">
              <p className="text-purple-600 text-sm font-medium">Total Revenue</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">₹ {(data.totalRevenue || 0).toLocaleString()}</p>
            </CardBody>
          </Card>
          <Card className="bg-amber-50 border border-amber-200">
            <CardBody className="p-4">
              <p className="text-amber-600 text-sm font-medium">Avg Order Value</p>
              <p className="text-3xl font-bold text-amber-900 mt-2">₹ {(data.avgOrderValue || 0).toLocaleString()}</p>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader className="border-b">
            <h3 className="font-semibold text-gray-900">Order Details</h3>
          </CardHeader>
          <CardBody className="p-0">
            <Table>
              <Thead>
                <tr>
                  <Th>Order No</Th>
                  <Th>Customer</Th>
                  <Th>Quantity</Th>
                  <Th>Revenue</Th>
                  <Th>Status</Th>
                </tr>
              </Thead>
              <Tbody>
                {data.data?.map((order) => (
                  <tr key={order.orderNo}>
                    <Td className="font-medium text-gray-900">{order.orderNo}</Td>
                    <Td>{order.customerName}</Td>
                    <Td>{order.totalQuantity}</Td>
                    <Td className="text-green-600 font-semibold">₹ {order.revenue.toLocaleString()}</Td>
                    <Td>
                      <Badge variant={order.status === 'delivered' ? 'success' : 'warning'}>
                        {order.status.replace(/_/g, ' ')}
                      </Badge>
                    </Td>
                  </tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      </div>
    );
  };

  const renderReport = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    switch (activeReport) {
      case 'production':
        return renderProductionReport();
      case 'inventory':
        return renderInventoryReport();
      case 'fulfillment':
        return renderFulfillmentReport();
      case 'machines':
        return renderMachineReport();
      case 'profit':
        return renderProfitReport();
      case 'import':
        return renderImportSection();
      default:
        return null;
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error('Please select an Excel file first');
      return;
    }

    const confirmed = window.confirm(
      `Import file "${importFile.name}"?\n\nPlease ensure it matches the template columns.`
    );
    if (!confirmed) {
      return;
    }

    setImportLoading(true);
    try {
      const response = await exportAPI.importExcel(importFile);
      setImportResult(response.data);
      toast.success(`Imported ${response.data?.count || 0} rows successfully`);
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error.response?.data?.message || 'Import failed');
      setImportResult(null);
    } finally {
      setImportLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await exportAPI.getImportTemplate();
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', 'inventory_import_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      toast.success('Template downloaded');
    } catch (error) {
      console.error('Template download error:', error);
      toast.error('Failed to download template');
    }
  };

  const renderImportSection = () => {
    const previewRows = importResult?.data?.slice(0, 5) || [];

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="border-b">
            <h3 className="font-semibold text-gray-900">Import Excel Data</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Excel File (.xlsx)
              </label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setImportFile(file);
                  setImportResult(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleDownloadTemplate}>
                Download Template
              </Button>
              <Button onClick={handleImport} disabled={importLoading || !importFile}>
                {importLoading ? 'Importing...' : 'Import File'}
              </Button>
              {importFile && (
                <span className="text-sm text-gray-600">{importFile.name}</span>
              )}
            </div>
          </CardBody>
        </Card>

        {importResult && (
          <>
            <Card className="bg-green-50 border border-green-200">
              <CardBody className="p-4">
                <p className="text-green-700 text-sm font-medium">Imported Rows</p>
                <p className="text-3xl font-bold text-green-900 mt-2">{importResult.count || 0}</p>
              </CardBody>
            </Card>

            {previewRows.length > 0 && (
              <Card>
                <CardHeader className="border-b">
                  <h3 className="font-semibold text-gray-900">Preview (First 5 Rows)</h3>
                </CardHeader>
                <CardBody className="p-0">
                  <Table>
                    <Thead>
                      <tr>
                        {Object.keys(previewRows[0]).map((key) => (
                          <Th key={key}>{key}</Th>
                        ))}
                      </tr>
                    </Thead>
                    <Tbody>
                      {previewRows.map((row, idx) => (
                        <tr key={idx}>
                          {Object.keys(previewRows[0]).map((key) => (
                            <Td key={key}>{String(row[key] ?? '')}</Td>
                          ))}
                        </tr>
                      ))}
                    </Tbody>
                  </Table>
                </CardBody>
              </Card>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-1">View comprehensive business reports and analytics</p>
      </div>

      {/* Report Selection */}
      <div className="flex flex-wrap gap-2">
        {reports.map(report => (
          <button
            key={report.id}
            onClick={() => setActiveReport(report.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeReport === report.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {report.name}
          </button>
        ))}
      </div>

      {/* Filters */}
      {activeReport !== 'import' && (
        <div className="flex flex-wrap gap-4 items-end">
        {(activeReport === 'production') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Date
            </label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {['wastage', 'fulfillment', 'profit'].includes(activeReport) && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}

        <Button onClick={fetchReport} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
        </div>
      )}

      {/* Report Content */}
      {renderReport()}
    </div>
  );
};

export default Reports;
