import React, { useState, useEffect } from 'react';
import { leadsAPI } from '../../services/analyticsAPI';
import { PlusIcon, PhoneIcon, EnvelopeIcon, UserCircleIcon } from '@heroicons/react/24/outline';

export default function LeadsListTab() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [filters, setFilters] = useState({ status: 'all', priority: 'all' });

  const statusOptions = ['new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'converted', 'lost'];
  const priorityOptions = ['low', 'medium', 'high', 'urgent'];
  const sourceOptions = ['website', 'phone', 'email', 'referral', 'trade_show', 'cold_call', 'social_media'];

  useEffect(() => {
    fetchLeads();
  }, [filters]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.priority !== 'all') params.priority = filters.priority;
      const response = await leadsAPI.getLeads(params);
      setLeads(response.data.data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-purple-100 text-purple-800',
      qualified: 'bg-yellow-100 text-yellow-800',
      proposal_sent: 'bg-indigo-100 text-indigo-800',
      negotiation: 'bg-orange-100 text-orange-800',
      converted: 'bg-green-100 text-green-800',
      lost: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-gray-600',
      medium: 'text-blue-600',
      high: 'text-orange-600',
      urgent: 'text-red-600'
    };
    return colors[priority] || 'text-gray-600';
  };

  const handleConvertToCustomer = async (leadId) => {
    if (!window.confirm('Convert this lead to customer?')) return;
    try {
      await leadsAPI.convertToCustomer(leadId);
      window.alert('Lead converted to customer successfully!');
      fetchLeads();
    } catch (error) {
      console.error('Error converting lead:', error);
      window.alert('Failed to convert lead');
    }
  };

  const handleCreateQuotation = async (leadId) => {
    // This would typically open a quotation modal
    try {
      const items = window.prompt('Enter quotation items (JSON format):', '[{"itemCode":"ITEM001","description":"Sample Item","quantity":100,"rate":50}]');
      if (!items) return;
      await leadsAPI.createQuotationFromLead(leadId, {
        items: JSON.parse(items),
        validityDays: 30,
        terms: 'Standard payment terms'
      });
      window.alert('Quotation created successfully!');
      fetchLeads();
    } catch (error) {
      console.error('Error creating quotation:', error);
      window.alert('Failed to create quotation');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leads Pipeline</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage and track sales leads from first contact to conversion
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Lead
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow flex items-center space-x-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">Status:</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          >
            <option value="all">All Status</option>
            {statusOptions.map(s => (
              <option key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">Priority:</label>
          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            className="rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          >
            <option value="all">All Priorities</option>
            {priorityOptions.map(p => (
              <option key={p} value={p}>{p.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Leads Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leads.map((lead) => (
                <tr key={lead._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UserCircleIcon className="h-10 w-10 text-gray-400" />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{lead.companyName}</div>
                        <div className="text-sm text-gray-500">{lead.leadNumber}</div>
                        <div className="text-xs text-gray-400 capitalize">{lead.source}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{lead.contactPerson}</div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <PhoneIcon className="h-4 w-4 mr-1" />
                      {lead.contactNumber}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <EnvelopeIcon className="h-4 w-4 mr-1" />
                      {lead.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(lead.status)}`}>
                      {lead.status?.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-semibold uppercase ${getPriorityColor(lead.priority)}`}>
                      {lead.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{lead.estimatedValue?.toLocaleString('en-IN') || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleCreateQuotation(lead._id)}
                        className="text-indigo-600 hover:text-indigo-900 text-xs px-2 py-1 border border-indigo-600 rounded"
                      >
                        Quotation
                      </button>
                      <button
                        onClick={() => handleConvertToCustomer(lead._id)}
                        className="text-green-600 hover:text-green-900 text-xs px-2 py-1 border border-green-600 rounded"
                      >
                        Convert
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
