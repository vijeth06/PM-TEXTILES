import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { qualityAPI } from '../services/api';
import { PlusIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const STAGE_OPTIONS = ['dyeing', 'printing', 'finishing', 'weaving', 'raw_material', 'final_product'];
const STATUS_COLORS = {
  pass: 'bg-green-100 text-green-800',
  fail: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
  on_hold: 'bg-orange-100 text-orange-800',
};

const TABS = [
  { key: 'all', label: 'All Checks' },
  { key: 'raw_material', label: 'Raw Material' },
  { key: 'dyeing', label: 'Dyeing' },
  { key: 'printing', label: 'Printing' },
  { key: 'finishing', label: 'Finishing' },
  { key: 'final_product', label: 'Final Product' },
];

const EMPTY_FORM = {
  stage: 'dyeing',
  batchNumber: '',
  inspector: '',
  checkDate: new Date().toISOString().split('T')[0],
  parameters: { colorFastness: '', tensileStrength: '', shrinkage: '', ph: '' },
  result: 'pending',
  notes: '',
};

export default function QualityChecks() {
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  useEffect(() => { fetchChecks(); }, []);

  const fetchChecks = async () => {
    try {
      setLoading(true);
      const res = await qualityAPI.getChecks();
      setChecks(res.data.data || []);
    } catch {
      toast.error('Failed to load quality checks');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await qualityAPI.createCheck(formData);
      toast.success('Quality check recorded');
      setShowModal(false);
      fetchChecks();
    } catch {
      toast.error('Failed to save quality check');
    }
  };

  const filtered = activeTab === 'all' ? checks : checks.filter(c => c.stage === activeTab);

  const passRate = checks.length ? Math.round((checks.filter(c => c.result === 'pass').length / checks.length) * 100) : 0;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-3xl font-semibold text-gray-900">Quality Checks</h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-700">Track quality inspections across dyeing, printing, finishing & final product stages</p>
        </div>
        <button onClick={() => { setFormData(EMPTY_FORM); setShowModal(true); }} className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 active:bg-indigo-700">
          <PlusIcon className="h-5 w-5" />
          New Check
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Checks</p>
          <p className="text-2xl font-bold text-gray-900">{checks.length}</p>
        </div>
        <div className="bg-green-50 shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Pass Rate</p>
          <p className="text-2xl font-bold text-green-700">{passRate}%</p>
        </div>
        <div className="bg-red-50 shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Failed</p>
          <p className="text-2xl font-bold text-red-700">{checks.filter(c => c.result === 'fail').length}</p>
        </div>
        <div className="bg-yellow-50 shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-700">{checks.filter(c => c.result === 'pending').length}</p>
        </div>
      </div>

      {/* Stage Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${activeTab === tab.key ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {tab.label}
            <span className="ml-1 text-xs opacity-75">
              ({tab.key === 'all' ? checks.length : checks.filter(c => c.stage === tab.key).length})
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <CheckCircleIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No quality checks found for this stage.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Batch #', 'Stage', 'Inspector', 'Check Date', 'Color Fastness', 'pH', 'Result', 'Notes'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map(check => (
                <tr key={check._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{check.batchNumber || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 capitalize">{check.stage}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{check.inspector || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {check.checkDate ? new Date(check.checkDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{check.parameters?.colorFastness || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{check.parameters?.ph || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[check.result] || 'bg-gray-100 text-gray-800'}`}>
                      {check.result === 'pass' ? <CheckCircleIcon className="h-3 w-3" /> : check.result === 'fail' ? <XCircleIcon className="h-3 w-3" /> : null}
                      {check.result}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{check.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowModal(false)}></div>
            <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">New Quality Check</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Stage *</label>
                    <select value={formData.stage} onChange={e => setFormData({ ...formData, stage: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base sm:text-sm">
                      {STAGE_OPTIONS.map(s => <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Batch Number</label>
                    <input value={formData.batchNumber} onChange={e => setFormData({ ...formData, batchNumber: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Inspector</label>
                    <input value={formData.inspector} onChange={e => setFormData({ ...formData, inspector: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Check Date</label>
                    <input type="date" value={formData.checkDate} onChange={e => setFormData({ ...formData, checkDate: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm" />
                  </div>
                </div>
                {/* Quality Parameters */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quality Parameters</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600">Color Fastness (1–5)</label>
                      <input type="number" min="1" max="5" value={formData.parameters.colorFastness} onChange={e => setFormData({ ...formData, parameters: { ...formData.parameters, colorFastness: e.target.value } })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">pH Level</label>
                      <input type="number" step="0.1" value={formData.parameters.ph} onChange={e => setFormData({ ...formData, parameters: { ...formData.parameters, ph: e.target.value } })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Tensile Strength (N/cm²)</label>
                      <input type="number" value={formData.parameters.tensileStrength} onChange={e => setFormData({ ...formData, parameters: { ...formData.parameters, tensileStrength: e.target.value } })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Shrinkage (%)</label>
                      <input type="number" step="0.1" value={formData.parameters.shrinkage} onChange={e => setFormData({ ...formData, parameters: { ...formData.parameters, shrinkage: e.target.value } })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Result *</label>
                    <select value={formData.result} onChange={e => setFormData({ ...formData, result: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm">
                      <option value="pending">Pending</option>
                      <option value="pass">Pass</option>
                      <option value="fail">Fail</option>
                      <option value="on_hold">On Hold</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={2} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm" />
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Save</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
