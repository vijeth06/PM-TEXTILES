import React, { useState, useEffect } from 'react';
import { StatCard, Card, SectionHeader } from '../components/UIComponents';
import {
  CogIcon,
  BeakerIcon,
  SwatchIcon,
  DocumentChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

export default function TextileProduction() {
  const [activeTab, setActiveTab] = useState('looms');
  const [loomData, setLoomData] = useState([]);
  const [dyeingData, setDyeingData] = useState([]);
  const [shadeMatching, setShadeMatching] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = () => {
    // Mock loom data
    setLoomData([
      { loomNo: 'L-001', fabric: 'Shirting 40s', efficiency: 92.5, production: 145, target: 155, status: 'running', weaver: 'John Doe', shift: 'Morning' },
      { loomNo: 'L-002', fabric: 'Denim 12oz', efficiency: 88.3, production: 132, target: 150, status: 'running', weaver: 'Jane Smith', shift: 'Morning' },
      { loomNo: 'L-003', fabric: 'Poplin 60s', efficiency: 95.2, production: 168, target: 175, status: 'running', weaver: 'Mike Johnson', shift: 'Morning' },
      { loomNo: 'L-004', fabric: 'Twill 2/1', efficiency: 0, production: 0, target: 140, status: 'breakdown', weaver: '-', shift: 'Morning' },
      { loomNo: 'L-005', fabric: 'Satin Weave', efficiency: 75.4, production: 98, target: 130, status: 'idle', weaver: 'Sarah Williams', shift: 'Morning' }
    ]);

    // Mock dyeing data
    setDyeingData([
      { batchNo: 'DYE-2024-001', color: 'Navy Blue', fabric: 'Cotton Poplin', quantity: 500, status: 'shade_checking', deltaE: 0.85, operator: 'Ahmed Ali' },
      { batchNo: 'DYE-2024-002', color: 'Ruby Red', fabric: 'Shirting', quantity: 750, status: 'in_progress', deltaE: null, operator: 'Chen Wei' },
      { batchNo: 'DYE-2024-003', color: 'Forest Green', fabric: 'Denim', quantity: 600, status: 'approved', deltaE: 0.65, operator: 'Raj Kumar' },
      { batchNo: 'DYE-2024-004', color: 'Sunset Orange', fabric: 'Twill', quantity: 450, status: 'redip', deltaE: 1.85, operator: 'Maria Garcia' }
    ]);

    // Mock shade matching data
    setShadeMatching([
      { matchNo: 'CLR-001', customer: 'ABC Textiles', shade: 'Pantone 19-4052', attempts: 2, deltaE: 0.72, status: 'approved', priority: 'high' },
      { matchNo: 'CLR-002', customer: 'XYZ Fashions', shade: 'Burgundy Red', attempts: 4, deltaE: 1.92, status: 'in_progress', priority: 'urgent' },
      { matchNo: 'CLR-003', customer: 'Global Garments', shade: 'Mint Green', attempts: 1, deltaE: 1.15, status: 'pending', priority: 'medium' }
    ]);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      running: { bg: 'bg-green-100', text: 'text-green-800', label: 'Running' },
      idle: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Idle' },
      breakdown: { bg: 'bg-red-100', text: 'text-red-800', label: 'Breakdown' },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'In Progress' },
      shade_checking: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Shade Checking' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
      redip: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Redip Required' },
      pending: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Pending' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      urgent: { bg: 'bg-red-500', label: 'Urgent' },
      high: { bg: 'bg-orange-500', label: 'High' },
      medium: { bg: 'bg-yellow-500', label: 'Medium' },
      low: { bg: 'bg-green-500', label: 'Low' }
    };

    const config = priorityConfig[priority] || priorityConfig.medium;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium text-white ${config.bg}`}>
        {config.label}
      </span>
    );
  };

  const renderLoomProduction = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Looms" value="120" unit="machines" color="blue" icon={CogIcon} trend="up" change="+3.2%" />
        <StatCard title="Running" value="102" unit="active" color="green" icon={CheckCircleIcon} trend="up" change="+8.5%" />
        <StatCard title="Idle" value="12" unit="machines" color="amber" icon={ClockIcon} trend="down" change="-5.1%" />
        <StatCard title="Breakdown" value="6" unit="machines" color="red" icon={XCircleIcon} trend="up" change="+2.3%" />
      </div>

      {/* Loom Status Table */}
      <Card variant="elevated" className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-blue-800">
          <SectionHeader title="Live Loom Status" className="text-white" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">Loom No</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">Fabric</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">Production</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">Efficiency</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">Weaver</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loomData.map((loom) => (
                <tr key={loom.loomNo} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{loom.loomNo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{loom.fabric}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="flex items-center">
                      <span className="mr-2 font-semibold">{loom.production}m / {loom.target}m</span>
                      <div className="w-24 bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${(loom.production / loom.target) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                      loom.efficiency >= 90 ? 'bg-green-100 text-green-800 border border-green-200' :
                      loom.efficiency >= 75 ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {loom.efficiency}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{loom.weaver}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(loom.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderDyeingProcess = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Today's Batches" value="8" unit="batches" color="teal" icon={BeakerIcon} trend="up" change="+12.5%" />
        <StatCard title="In Progress" value="2" unit="batches" color="blue" icon={ClockIcon} trend="up" change="+5.2%" />
        <StatCard title="Approved" value="5" unit="batches" color="green" icon={CheckCircleIcon} trend="up" change="+8.3%" />
        <StatCard title="Redip" value="1" unit="batch" color="red" icon={XCircleIcon} trend="up" change="+1.2%" />
      </div>

      {/* Dyeing Batches */}
      <Card variant="elevated" className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-blue-800">
          <SectionHeader title="Active Dyeing Batches" className="text-white" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-teal-900 uppercase tracking-wider">Batch No</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-teal-900 uppercase tracking-wider">Color</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-teal-900 uppercase tracking-wider">Fabric</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-teal-900 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-teal-900 uppercase tracking-wider">Delta E</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-teal-900 uppercase tracking-wider">Operator</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-teal-900 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {dyeingData.map((batch) => (
                <tr key={batch.batchNo} className="hover:bg-teal-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{batch.batchNo}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-6 w-6 rounded-full border-2 border-gray-300 mr-2 shadow-sm" style={{backgroundColor: getColorPreview(batch.color)}}></div>
                      <span className="text-sm text-gray-700 font-medium">{batch.color}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{batch.fabric}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-semibold">{batch.quantity}m</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {batch.deltaE !== null ? (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        batch.deltaE < 1.0 ? 'bg-green-100 text-green-800 border border-green-200' :
                        batch.deltaE < 1.5 ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        ΔE: {batch.deltaE}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400 font-medium">Pending</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{batch.operator}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(batch.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderShadeMatching = () => (
    <div className="space-y-6">
      {/* Shade Matching Requests */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {shadeMatching.map((shade) => (
          <Card key={shade.matchNo} variant="elevated" className="overflow-hidden">
            <div className="bg-blue-800 px-6 py-4">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-bold text-lg">{shade.matchNo}</h4>
                {getPriorityBadge(shade.priority)}
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="border-b border-gray-200 pb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</p>
                <p className="font-bold text-gray-900 mt-1">{shade.customer}</p>
              </div>
              <div className="border-b border-gray-200 pb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Target Shade</p>
                <p className="font-bold text-gray-900 mt-1">{shade.shade}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-xs font-semibold text-blue-700 uppercase">Attempts</p>
                  <p className="font-bold text-blue-900 text-lg mt-1">{shade.attempts}</p>
                </div>
                <div className={`rounded-lg p-3 ${
                  shade.deltaE < 1.0 ? 'bg-green-50 border border-green-200' :
                  shade.deltaE < 1.5 ? 'bg-amber-50 border border-amber-200' :
                  'bg-red-50 border border-red-200'
                }`}>
                  <p className={`text-xs font-semibold uppercase ${
                    shade.deltaE < 1.0 ? 'text-green-700' :
                    shade.deltaE < 1.5 ? 'text-amber-700' :
                    'text-red-700'
                  }`}>Delta E</p>
                  <p className={`font-bold text-lg mt-1 ${
                    shade.deltaE < 1.0 ? 'text-green-900' :
                    shade.deltaE < 1.5 ? 'text-amber-900' :
                    'text-red-900'
                  }`}>{shade.deltaE.toFixed(2)}</p>
                </div>
              </div>
              <div className="pt-3">
                {getStatusBadge(shade.status)}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const getColorPreview = (colorName) => {
    const colorMap = {
      'Navy Blue': '#000080',
      'Ruby Red': '#E0115F',
      'Forest Green': '#228B22',
      'Sunset Orange': '#FF4500'
    };
    return colorMap[colorName] || '#CCCCCC';
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-blue-800">Textile Production Hub</h1>
        <p className="mt-2 text-lg text-gray-600 font-medium">Real-time monitoring and management of manufacturing processes</p>
      </div>

        {/* Tabs */}
        <div className="mb-6 border-b-2 border-gray-200">
          <nav className="-mb-0.5 flex space-x-8">
            <TabButton
              label="Loom Production"
              icon={CogIcon}
              active={activeTab === 'looms'}
              onClick={() => setActiveTab('looms')}
            />
            <TabButton
              label="Dyeing Process"
              icon={BeakerIcon}
              active={activeTab === 'dyeing'}
              onClick={() => setActiveTab('dyeing')}
            />
            <TabButton
              label="Shade Matching"
              icon={SwatchIcon}
              active={activeTab === 'shadeMatching'}
              onClick={() => setActiveTab('shadeMatching')}
            />
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'looms' && renderLoomProduction()}
        {activeTab === 'dyeing' && renderDyeingProcess()}
        {activeTab === 'shadeMatching' && renderShadeMatching()}
      </div>
    );
  }

function TabButton({ label, icon: Icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center px-1 py-3 border-b-2 font-semibold text-sm transition-all duration-200
        ${active
          ? 'border-blue-600 text-blue-700 bg-blue-50'
          : 'border-transparent text-gray-600 hover:text-blue-700 hover:border-blue-300/50'
        }
      `}
    >
      <Icon className="h-5 w-5 mr-2" />
      {label}
    </button>
  );
}
