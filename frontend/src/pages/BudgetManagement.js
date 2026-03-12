import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Card, CardHeader, CardBody, Button, Badge, Table, Thead, Tbody, Th, Td } from '../components/common';

const budgetsAPI = {
  getBudgets: (params) => api.get('/budgets', { params }),
  getBudget: (id) => api.get(`/budgets/${id}`),
  createBudget: (data) => api.post('/budgets', data),
  updateBudget: (id, data) => api.put(`/budgets/${id}`, data),
  deleteBudget: (id) => api.delete(`/budgets/${id}`)
};

export default function BudgetManagement() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [formData, setFormData] = useState({
    budgetCode: '',
    fiscalYear: new Date().getFullYear().toString(),
    period: 'yearly',
    startDate: '',
    endDate: '',
    department: 'overall',
    category: 'operational',
    allocations: [],
    notes: ''
  });

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await budgetsAPI.getBudgets({ fiscalYear: new Date().getFullYear().toString() });
       setBudgets(response.data.data || []);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      toast.error('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedBudget) {
        await budgetsAPI.updateBudget(selectedBudget._id, formData);
        toast.success('Budget updated successfully');
      } else {
        await budgetsAPI.createBudget(formData);
        toast.success('Budget created successfully');
      }
      setShowModal(false);
      setFormData({ budgetCode: '', fiscalYear: new Date().getFullYear().toString(), period: 'yearly', startDate: '', endDate: '', department: 'overall', category: 'operational', allocations: [], notes: '' });
      setSelectedBudget(null);
      fetchBudgets();
    } catch (error) {
      console.error('Error saving budget:', error);
      toast.error('Failed to save budget');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) return;
    try {
      await budgetsAPI.deleteBudget(id);
      toast.success('Budget deleted successfully');
      fetchBudgets();
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast.error('Failed to delete budget');
    }
  };

  const getUtilizationColor = (utilization) => {
    if (utilization >= 100) return 'bg-red-100 text-red-800';
    if (utilization >= 80) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-semibold text-gray-900">Budget Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Create and manage annual budgets by department with real-time tracking
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => {
              setSelectedBudget(null);
               setFormData({ budgetCode: '', fiscalYear: new Date().getFullYear().toString(), period: 'yearly', startDate: '', endDate: '', department: 'overall', category: 'operational', allocations: [], notes: '' });
              setShowModal(true);
            }}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Budget
          </button>
        </div>
      </div>

      {/* Budget Summary Stats */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
              <div className="h-6 w-6 text-white">💰</div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Allocated</dt>
              <dd className="text-2xl font-semibold text-gray-900">
                ₹{budgets.reduce((sum, b) => sum + (b.totalAllocated || 0), 0) / 100000}L
              </dd>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
              <div className="h-6 w-6 text-white">✓</div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Spent</dt>
              <dd className="text-2xl font-semibold text-gray-900">
                ₹{budgets.reduce((sum, b) => sum + (b.totalSpent || 0), 0) / 100000}L
              </dd>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
              <div className="h-6 w-6 text-white">📊</div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dt className="text-sm font-medium text-gray-500 truncate">Active Budgets</dt>
              <dd className="text-2xl font-semibold text-gray-900">{budgets.length}</dd>
            </div>
          </div>
        </div>
      </div>

      {/* Budgets Table */}
      <Card className="mt-8">
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Budgets</h3>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-2 text-sm text-gray-500">Loading budgets...</p>
            </div>
          ) : budgets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No budgets found. Create a new budget to get started.</p>
            </div>
          ) : (
            <Table>
              <Thead>
                <tr>
                    <Th>Code</Th>
                      <Th>Department</Th>
                  <Th>Allocated</Th>
                  <Th>Spent</Th>
                  <Th>Remaining</Th>
                  <Th>Utilization</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </Thead>
              <Tbody>
                {budgets.map((budget) => {
                  const utilization = budget.overallUtilization || 0;
                  return (
                    <tr key={budget._id} className="border-b hover:bg-gray-50">
                      <Td className="font-medium">{budget.budgetCode}</Td>
                      <Td>{budget.department}</Td>
                      <Td>₹{budget.totalAllocated?.toLocaleString()}</Td>
                      <Td>₹{budget.totalSpent?.toLocaleString()}</Td>
                      <Td>₹{(budget.totalAllocated - budget.totalSpent)?.toLocaleString()}</Td>
                      <Td>
                        <div className="flex items-center space-x-2">
                          <div className="w-12 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${utilization >= 100 ? 'bg-red-600' : utilization >= 80 ? 'bg-yellow-600' : 'bg-green-600'}`}
                              style={{ width: `${Math.min(utilization, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm">{utilization}%</span>
                        </div>
                      </Td>
                      <Td>
                        <Badge variant={budget.status === 'active' ? 'success' : 'default'}>
                          {budget.status}
                        </Badge>
                      </Td>
                      <Td>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedBudget(budget);
                              setFormData(budget);
                              setShowModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(budget._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </Tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Budget Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowModal(false)}></div>
            <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {selectedBudget ? 'Edit Budget' : 'New Budget'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Budget Code *</label>
                  <input
                    type="text"
                    value={formData.budgetCode}
                    onChange={(e) => setFormData({ ...formData, budgetCode: e.target.value.toUpperCase() })}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fiscal Year *</label>
                    <input
                      type="text"
                      value={formData.fiscalYear}
                      onChange={(e) => setFormData({ ...formData, fiscalYear: e.target.value })}
                      placeholder="2024"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Period *</label>
                    <select
                      value={formData.period}
                      onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Department *</label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="production">Production</option>
                      <option value="quality">Quality</option>
                      <option value="inventory">Inventory</option>
                      <option value="sales">Sales</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="hr">HR</option>
                      <option value="admin">Admin</option>
                      <option value="overall">Overall</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="operational">Operational</option>
                      <option value="capital">Capital</option>
                      <option value="project">Project</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    rows="3"
                  />
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
