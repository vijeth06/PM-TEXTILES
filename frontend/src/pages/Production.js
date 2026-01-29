import React, { useState, useEffect } from 'react';
import { productionAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useProductionUpdates } from '../hooks/useRealTimeUpdates';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Card, CardHeader, CardBody, Button, Badge, Table, Thead, Tbody, Th, Td, Modal, Input, Select, LoadingSpinner, EmptyState, Pagination } from '../components/common';

const Production = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [filters, setFilters] = useState({ status: '', priority: '' });
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });

  // Real-time production updates
  useProductionUpdates((data) => {
    console.log('Real-time production update:', data);
    fetchPlans();
    
    // Show appropriate notifications
    if (data.planNo) {
      if (data.type === 'production_plan_created') {
        toast.success(`New production plan: ${data.planNo}`);
      } else if (data.stageName) {
        toast.info(`${data.planNo} - ${data.stageName}: ${data.completionPercent}%`);
      }
    }
  });

  useEffect(() => {
    fetchPlans();
  }, [filters, pagination.currentPage]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await productionAPI.getPlans({ 
        ...filters, 
        page: pagination.currentPage,
        limit: 10 
      });
      setPlans(response.data.data);
      setPagination({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages
      });
    } catch (error) {
      toast.error('Failed to fetch production plans');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = () => {
    setSelectedPlan(null);
    setShowModal(true);
  };

  const handleViewPlan = (plan) => {
    setSelectedPlan(plan);
    setShowModal(true);
  };

  const handleDeletePlan = async (id) => {
    if (window.confirm('Are you sure you want to delete this production plan?')) {
      try {
        await productionAPI.deletePlan(id);
        toast.success('Production plan deleted successfully');
        fetchPlans();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete plan');
      }
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      draft: 'default',
      approved: 'info',
      in_progress: 'warning',
      completed: 'success',
      cancelled: 'danger'
    };
    return <Badge variant={variants[status]}>{status.replace('_', ' ').toUpperCase()}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      low: 'default',
      normal: 'info',
      high: 'warning',
      urgent: 'danger'
    };
    return <Badge variant={variants[priority]}>{priority.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Production Management</h1>
          <p className="text-gray-600 mt-1">Manage production plans and track stages</p>
        </div>
        <Button onClick={handleCreatePlan} className="flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          New Production Plan
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Status"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="approved">Approved</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Select>

            <Select
              label="Priority"
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            >
              <option value="">All Priority</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => setFilters({ status: '', priority: '' })}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Plans Table */}
      <Card>
        <CardBody className="p-0">
          {loading ? (
            <div className="py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : plans.length === 0 ? (
            <EmptyState
              icon={PlusIcon}
              title="No production plans"
              description="Get started by creating a new production plan"
              action={
                <Button onClick={handleCreatePlan}>
                  <PlusIcon className="h-5 w-5 mr-2 inline" />
                  Create Plan
                </Button>
              }
            />
          ) : (
            <>
              <Table>
                <Thead>
                  <tr>
                    <Th>Plan No</Th>
                    <Th>Product</Th>
                    <Th>Target Qty</Th>
                    <Th>Start Date</Th>
                    <Th>Status</Th>
                    <Th>Priority</Th>
                    <Th>Progress</Th>
                    <Th>Actions</Th>
                  </tr>
                </Thead>
                <Tbody>
                  {plans.map((plan) => (
                    <tr key={plan._id}>
                      <Td>
                        <span className="font-medium">{plan.planNo}</span>
                      </Td>
                      <Td>
                        <div>
                          <div className="font-medium">{plan.productDetails?.productName}</div>
                          <div className="text-xs text-gray-500">{plan.productDetails?.sku}</div>
                        </div>
                      </Td>
                      <Td>
                        {plan.productDetails?.targetQuantity} {plan.productDetails?.uom}
                      </Td>
                      <Td>
                        {new Date(plan.startDate).toLocaleDateString()}
                      </Td>
                      <Td>{getStatusBadge(plan.status)}</Td>
                      <Td>{getPriorityBadge(plan.priority)}</Td>
                      <Td>
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${plan.completionPercent || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600">{plan.completionPercent || 0}%</span>
                        </div>
                      </Td>
                      <Td>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewPlan(plan)}
                            className="text-blue-600 hover:text-blue-800"
                            title="View"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeletePlan(plan._id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </Tbody>
              </Table>
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={(page) => setPagination({ ...pagination, currentPage: page })}
              />
            </>
          )}
        </CardBody>
      </Card>

      {/* Production Plan Modal */}
      {showModal && (
        <ProductionPlanModal
          plan={selectedPlan}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            fetchPlans();
          }}
        />
      )}
    </div>
  );
};

const ProductionPlanModal = ({ plan, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    productDetails: {
      sku: '',
      productName: '',
      targetQuantity: '',
      uom: 'kg'
    },
    priority: 'normal',
    stagesSequence: [
      { stageName: 'yarn_issue', sequence: 1 },
      { stageName: 'weaving', sequence: 2 },
      { stageName: 'dyeing', sequence: 3 },
      { stageName: 'finishing', sequence: 4 },
      { stageName: 'packing', sequence: 5 }
    ]
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (plan) {
        await productionAPI.updatePlan(plan._id, formData);
        toast.success('Production plan updated successfully');
      } else {
        await productionAPI.createPlan(formData);
        toast.success('Production plan created successfully');
      }
      onSave();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={plan ? 'View Production Plan' : 'Create Production Plan'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            required
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
          <Input
            label="End Date"
            type="date"
            required
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Product SKU"
            required
            value={formData.productDetails.sku}
            onChange={(e) => setFormData({
              ...formData,
              productDetails: { ...formData.productDetails, sku: e.target.value }
            })}
          />
          <Input
            label="Product Name"
            required
            value={formData.productDetails.productName}
            onChange={(e) => setFormData({
              ...formData,
              productDetails: { ...formData.productDetails, productName: e.target.value }
            })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Target Quantity"
            type="number"
            required
            value={formData.productDetails.targetQuantity}
            onChange={(e) => setFormData({
              ...formData,
              productDetails: { ...formData.productDetails, targetQuantity: e.target.value }
            })}
          />
          <Select
            label="Unit of Measurement"
            required
            value={formData.productDetails.uom}
            onChange={(e) => setFormData({
              ...formData,
              productDetails: { ...formData.productDetails, uom: e.target.value }
            })}
          >
            <option value="kg">Kilograms (kg)</option>
            <option value="mtr">Meters (mtr)</option>
            <option value="pcs">Pieces (pcs)</option>
            <option value="roll">Rolls</option>
          </Select>
        </div>

        <Select
          label="Priority"
          required
          value={formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
        >
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </Select>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : plan ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default Production;
