import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { rfqAPI } from '../services/api';
import { suppliersAPI } from '../services/api';
import {
  PlusIcon, PaperAirplaneIcon, CheckIcon, TrashIcon, EyeIcon
} from '@heroicons/react/24/outline';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  received: 'bg-yellow-100 text-yellow-800',
  evaluated: 'bg-purple-100 text-purple-800',
  awarded: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const EMPTY_FORM = {
  rfqNumber: '',
  title: '',
  description: '',
  supplierId: '',
  deadline: '',
  items: [{ itemName: '', quantity: 1, unit: 'pcs', specifications: '' }],
};

export default function RFQManagement() {
  const [rfqs, setRfqs] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedRFQ, setSelectedRFQ] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [detailRFQ, setDetailRFQ] = useState(null);

  const getPrimarySupplierName = (rfq) => {
    if (rfq?.supplier?.name) return rfq.supplier.name;
    if (Array.isArray(rfq?.suppliers) && rfq.suppliers.length > 0) {
      return rfq.suppliers[0]?.supplierName || rfq.suppliers[0]?.supplierCode || '—';
    }
    return '—';
  };

  useEffect(() => {
    fetchRFQs();
    fetchSuppliers();
  }, []);

  const fetchRFQs = async () => {
    try {
      setLoading(true);
      const res = await rfqAPI.getRFQs();
      setRfqs(res.data.data || []);
    } catch {
      toast.error('Failed to load RFQs');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await suppliersAPI.getSuppliers();
      setSuppliers(res.data.data || []);
    } catch {
      /* silent */
    }
  };

  const openCreate = () => {
    setSelectedRFQ(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedRFQ) {
        await rfqAPI.updateRFQ(selectedRFQ._id, formData);
        toast.success('RFQ updated');
      } else {
        await rfqAPI.createRFQ(formData);
        toast.success('RFQ created');
      }
      setShowModal(false);
      fetchRFQs();
    } catch {
      toast.error('Failed to save RFQ');
    }
  };

  const handleSend = async (id) => {
    try {
      await rfqAPI.sendRFQ(id);
      toast.success('RFQ sent to supplier');
      fetchRFQs();
    } catch {
      toast.error('Failed to send RFQ');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this RFQ?')) return;
    try {
      await rfqAPI.deleteRFQ(id);
      toast.success('RFQ deleted');
      fetchRFQs();
    } catch {
      toast.error('Failed to delete RFQ');
    }
  };

  const addItem = () =>
    setFormData({ ...formData, items: [...formData.items, { itemName: '', quantity: 1, unit: 'pcs', specifications: '' }] });

  const updateItem = (idx, field, value) => {
    const items = [...formData.items];
    items[idx] = { ...items[idx], [field]: value };
    setFormData({ ...formData, items });
  };

  const removeItem = (idx) =>
    setFormData({ ...formData, items: formData.items.filter((_, i) => i !== idx) });

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-3xl font-semibold text-gray-900">RFQ Management</h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-700">Request for Quotations — create, send and evaluate supplier quotes</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <PlusIcon className="h-5 w-5" />
          New RFQ
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: rfqs.length, color: 'bg-gray-100' },
          { label: 'Sent', value: rfqs.filter(r => r.status === 'sent').length, color: 'bg-blue-100' },
          { label: 'Received', value: rfqs.filter(r => r.status === 'received').length, color: 'bg-yellow-100' },
          { label: 'Awarded', value: rfqs.filter(r => r.status === 'awarded').length, color: 'bg-green-100' },
        ].map(stat => (
          <div key={stat.label} className={`${stat.color} rounded-lg p-4`}>
            <p className="text-sm font-medium text-gray-600">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : rfqs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No RFQs found. Create one to get started.</div>
        ) : (
          <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['RFQ #', 'Title', 'Supplier', 'Deadline', 'Items', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rfqs.map(rfq => (
                <tr key={rfq._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{rfq.rfqNumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{rfq.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{getPrimarySupplierName(rfq)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {rfq.deadline ? new Date(rfq.deadline).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{rfq.items?.length || 0}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[rfq.status] || 'bg-gray-100 text-gray-800'}`}>
                      {rfq.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setDetailRFQ(rfq)} className="text-gray-400 hover:text-gray-600">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      {rfq.status === 'draft' && (
                        <button onClick={() => handleSend(rfq._id)} className="text-blue-500 hover:text-blue-700" title="Send to supplier">
                          <PaperAirplaneIcon className="h-4 w-4" />
                        </button>
                      )}
                      {rfq.status === 'received' && (
                        <button onClick={() => rfqAPI.createPOFromRFQ(rfq._id).then(() => { toast.success('PO created'); fetchRFQs(); }).catch(() => toast.error('Failed to create PO'))} className="text-green-500 hover:text-green-700" title="Create PO">
                          <CheckIcon className="h-4 w-4" />
                        </button>
                      )}
                      {['draft', 'cancelled'].includes(rfq.status) && (
                        <button onClick={() => handleDelete(rfq._id)} className="text-red-400 hover:text-red-600">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowModal(false)}></div>
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{selectedRFQ ? 'Edit RFQ' : 'New RFQ'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title *</label>
                    <input
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Supplier *</label>
                    <select
                      value={formData.supplierId}
                      onChange={e => setFormData({ ...formData, supplierId: e.target.value })}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    >
                      <option value="">Select supplier...</option>
                      {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Deadline</label>
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  />
                </div>
                {/* Items */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Items</label>
                    <button type="button" onClick={addItem} className="text-sm text-indigo-600 hover:text-indigo-800">+ Add Item</button>
                  </div>
                  <div className="space-y-2">
                    {formData.items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-4 gap-2 items-center">
                        <input
                          placeholder="Item name"
                          value={item.itemName}
                          onChange={e => updateItem(idx, 'itemName', e.target.value)}
                          required
                          className="col-span-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={e => updateItem(idx, 'quantity', e.target.value)}
                          className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                        />
                        <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 text-sm">Remove</button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700">Save</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailRFQ && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setDetailRFQ(null)}></div>
            <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{detailRFQ.rfqNumber} — {detailRFQ.title}</h3>
              <p className="text-sm text-gray-500 mb-4">{detailRFQ.description}</p>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div><span className="font-medium">Supplier:</span> {detailRFQ.supplier?.name || '—'}</div>
                <div><span className="font-medium">Status:</span> {detailRFQ.status}</div>
                <div><span className="font-medium">Deadline:</span> {detailRFQ.deadline ? new Date(detailRFQ.deadline).toLocaleDateString() : '—'}</div>
              </div>
              <table className="w-full text-sm border-collapse">
                <thead><tr className="bg-gray-50"><th className="text-left p-2 border">Item</th><th className="text-right p-2 border">Qty</th><th className="text-right p-2 border">Unit Price</th></tr></thead>
                <tbody>
                  {(detailRFQ.items || []).map((item, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-2 border">{item.itemName || item.materialName || item.materialCode || 'Item'}</td>
                      <td className="p-2 border text-right">{item.quantity}</td>
                      <td className="p-2 border text-right">{item.unitPrice || item.targetPrice ? `₹${(item.unitPrice || item.targetPrice)}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 flex justify-end">
                <button onClick={() => setDetailRFQ(null)} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
