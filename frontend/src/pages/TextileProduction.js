import React, { useState, useEffect } from 'react';
import { textileAPI } from '../services/api';
import toast from 'react-hot-toast';
import { StatCard, Card, SectionHeader } from '../components/UIComponents';
import {
  CogIcon,
  BeakerIcon,
  SwatchIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function TextileProduction() {
  const [activeTab, setActiveTab] = useState('looms');
  const [loomData, setLoomData] = useState([]);
  const [dyeingData, setDyeingData] = useState([]);
  const [shadeMatching, setShadeMatching] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loomStats, setLoomStats] = useState({ total: 0, running: 0, idle: 0, breakdown: 0 });
  const [dyeingStats, setDyeingStats] = useState({ total: 0, inProgress: 0, approved: 0, redip: 0 });

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'looms') {
        const [productionsRes] = await Promise.allSettled([
          textileAPI.getLoomProductions(),
          textileAPI.getEfficiencyDashboard()
        ]);
        if (productionsRes.status === 'fulfilled') {
          const prods = productionsRes.value.data.data || [];
          setLoomData(prods);
          const running = prods.filter(l => l.status === 'running').length;
          const idle = prods.filter(l => l.status === 'idle').length;
          const breakdown = prods.filter(l => l.status === 'breakdown').length;
          setLoomStats({ total: prods.length, running, idle, breakdown });
        }
      } else if (activeTab === 'dyeing') {
        const [batchesRes] = await Promise.allSettled([
          textileAPI.getDyeingBatches(),
          textileAPI.getDyeingStatistics()
        ]);
        if (batchesRes.status === 'fulfilled') {
          const batches = batchesRes.value.data.data || [];
          setDyeingData(batches);
          const inProgress = batches.filter(b => b.status === 'in_progress').length;
          const approved = batches.filter(b => b.status === 'approved' || b.status === 'completed').length;
          const redip = batches.filter(b => b.status === 'redip').length;
          setDyeingStats({ total: batches.length, inProgress, approved, redip });
        }
      } else if (activeTab === 'shadeMatching') {
        const res = await textileAPI.getColorLabRequests();
        setShadeMatching(res.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch textile data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
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
        <StatCard title="Total Looms" value={loomStats.total} unit="machines" color="blue" icon={CogIcon} />
        <StatCard title="Running" value={loomStats.running} unit="active" color="green" icon={CheckCircleIcon} />
        <StatCard title="Idle" value={loomStats.idle} unit="machines" color="amber" icon={ClockIcon} />
        <StatCard title="Breakdown" value={loomStats.breakdown} unit="machines" color="red" icon={XCircleIcon} />
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
                <tr key={loom._id || loom.loomNo} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{loom.loomNo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{loom.fabric?.fabricName || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="flex items-center">
                      <span className="mr-2 font-semibold">{loom.production?.actualProduction || 0}m / {loom.production?.targetMeters || 0}m</span>
                      <div className="w-24 bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${loom.production?.targetMeters ? ((loom.production.actualProduction || 0) / loom.production.targetMeters) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                      (loom.production?.efficiency || 0) >= 90 ? 'bg-green-100 text-green-800 border border-green-200' :
                      (loom.production?.efficiency || 0) >= 75 ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {(loom.production?.efficiency || 0).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{loom.weaver?.name || '-'}</td>
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
        <StatCard title="Total Batches" value={dyeingStats.total} unit="batches" color="teal" icon={BeakerIcon} />
        <StatCard title="In Progress" value={dyeingStats.inProgress} unit="batches" color="blue" icon={ClockIcon} />
        <StatCard title="Approved" value={dyeingStats.approved} unit="batches" color="green" icon={CheckCircleIcon} />
        <StatCard title="Redip" value={dyeingStats.redip} unit="batch" color="red" icon={XCircleIcon} />
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
                <tr key={batch._id || batch.dyeingNumber} className="hover:bg-teal-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{batch.dyeingNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-6 w-6 rounded-full border-2 border-gray-300 mr-2 shadow-sm" style={{backgroundColor: getColorPreview(batch.color?.colorName)}}></div>
                      <span className="text-sm text-gray-700 font-medium">{batch.color?.colorName || batch.color?.colorCode || '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{batch.material?.materialName || batch.materialType || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-semibold">{batch.material?.quantity || 0}{batch.material?.unit === 'meters' ? 'm' : batch.material?.unit || ''}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {batch.shadeMatching?.deltaE !== null && batch.shadeMatching?.deltaE !== undefined ? (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        batch.shadeMatching.deltaE < 1.0 ? 'bg-green-100 text-green-800 border border-green-200' :
                        batch.shadeMatching.deltaE < 1.5 ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        ΔE: {batch.shadeMatching.deltaE}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400 font-medium">Pending</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{batch.assignedTo?.name || '-'}</td>
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
          <Card key={shade._id || shade.matchingNumber} variant="elevated" className="overflow-hidden">
            <div className="bg-blue-800 px-6 py-4">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-bold text-lg">{shade.matchingNumber}</h4>
                {getPriorityBadge(shade.priority)}
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="border-b border-gray-200 pb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</p>
                <p className="font-bold text-gray-900 mt-1">{shade.customer?.customerName || '-'}</p>
              </div>
              <div className="border-b border-gray-200 pb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Target Shade</p>
                <p className="font-bold text-gray-900 mt-1">{shade.standardShade?.shadeDescription || shade.standardShade?.pantoneCode || '-'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-xs font-semibold text-blue-700 uppercase">Attempts</p>
                  <p className="font-bold text-blue-900 text-lg mt-1">{shade.attempts || 0}</p>
                </div>
                <div className={`rounded-lg p-3 ${
                  (shade.averageDeltaE || 0) < 1.0 ? 'bg-green-50 border border-green-200' :
                  (shade.averageDeltaE || 0) < 1.5 ? 'bg-amber-50 border border-amber-200' :
                  'bg-red-50 border border-red-200'
                }`}>
                  <p className={`text-xs font-semibold uppercase ${
                    (shade.averageDeltaE || 0) < 1.0 ? 'text-green-700' :
                    (shade.averageDeltaE || 0) < 1.5 ? 'text-amber-700' :
                    'text-red-700'
                  }`}>Delta E</p>
                  <p className={`font-bold text-lg mt-1 ${
                    (shade.averageDeltaE || 0) < 1.0 ? 'text-green-900' :
                    (shade.averageDeltaE || 0) < 1.5 ? 'text-amber-900' :
                    'text-red-900'
                  }`}>{(shade.averageDeltaE || 0).toFixed(2)}</p>
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
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
          </div>
        ) : (
          <>
            {activeTab === 'looms' && renderLoomProduction()}
            {activeTab === 'dyeing' && renderDyeingProcess()}
            {activeTab === 'shadeMatching' && renderShadeMatching()}
          </>
        )}
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
