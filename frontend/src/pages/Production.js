import React, { useState, useEffect } from 'react';
import { productionAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useProductionUpdates } from '../hooks/useRealTimeUpdates';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Card, CardBody, Button, Badge, Table, Thead, Tbody, Th, Td, Modal, Input, Select, LoadingSpinner, EmptyState, Pagination } from '../components/common';

const Production = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create'); // 'create' | 'view' | 'edit'
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setModalType('create');
    setShowModal(true);
  };

  const handleEditPlan = (plan) => {
    setSelectedPlan(plan);
    setModalType('edit');
    setShowModal(true);
  };

  const handleViewPlan = (plan) => {
    setSelectedPlan(plan);
    setModalType('view');
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
    return <Badge variant={variants[status]}>{status.replace(/_/g, ' ').toUpperCase()}</Badge>;
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
          <h1 className="text-4xl font-bold text-blue-800">Production Management</h1>
          <p className="text-gray-600 mt-2 font-medium">Plan and track manufacturing stages in real-time</p>
        </div>
        <Button onClick={handleCreatePlan} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition-all">
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
              onChange={(e) => {
                setFilters({ ...filters, status: e.target.value });
                setPagination(prev => ({ ...prev, currentPage: 1 }));
              }}
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
              onChange={(e) => {
                setFilters({ ...filters, priority: e.target.value });
                setPagination(prev => ({ ...prev, currentPage: 1 }));
              }}
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
                className="w-full border-blue-300 text-blue-600 hover:bg-blue-50"
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
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                            <div
                              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                              style={{ width: `${plan.completionPercent || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-semibold text-blue-700">{plan.completionPercent || 0}%</span>
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
                          {(plan.status === 'draft' || plan.status === 'approved') && (
                            <button
                              onClick={() => handleEditPlan(plan)}
                              className="text-yellow-600 hover:text-yellow-800"
                              title="Edit"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                          )}
                          {(plan.status === 'draft' || plan.status === 'approved') && (
                          <button
                            onClick={() => handleDeletePlan(plan._id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                          )}
                        </div>
                      </Td>
                    </tr>
                  ))}
                </Tbody>
              </Table>
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))}
              />
            </>
          )}
        </CardBody>
      </Card>

      {/* Production Plan Modal */}
      {showModal && (
        <ProductionPlanModal
          plan={selectedPlan}
          mode={modalType}
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

const ProductionPlanModal = ({ plan, mode = 'create', onClose, onSave }) => {
  const isViewMode = mode === 'view';
  const [formData, setFormData] = useState({
    startDate: plan ? new Date(plan.startDate).toISOString().split('T')[0] : '',
    endDate: plan?.endDate ? new Date(plan.endDate).toISOString().split('T')[0] : '',
    productDetails: {
      sku: plan?.productDetails?.sku || '',
      productName: plan?.productDetails?.productName || '',
      targetQuantity: plan?.productDetails?.targetQuantity || '',
      uom: plan?.productDetails?.uom || 'kg'
    },
    priority: plan?.priority || 'normal',
    status: plan?.status || 'draft',
    stagesSequence: plan?.stagesSequence || [
      { stageName: 'yarn_issue', sequence: 1 },
      { stageName: 'weaving', sequence: 2 },
      { stageName: 'dyeing', sequence: 3 },
      { stageName: 'finishing', sequence: 4 },
      { stageName: 'packing', sequence: 5 }
    ]
  });
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stagesLoading, setStagesLoading] = useState(false);

  useEffect(() => {
    if (plan?._id) {
      fetchStages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  const fetchStages = async () => {
    try {
      setStagesLoading(true);
      const response = await productionAPI.getStages(plan._id);
      setStages(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch stages:', error);
    } finally {
      setStagesLoading(false);
    }
  };

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

  const getStageStatusColor = (status) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      skipped: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={plan ? (isViewMode ? `View Plan: ${plan.planNo}` : `Edit Plan: ${plan.planNo}`) : 'Create Production Plan'} size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {plan && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-800"><strong>Plan No:</strong> {plan.planNo}</span>
              <span className="text-sm text-blue-800"><strong>Progress:</strong> {plan.completionPercent || 0}%</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            required
            disabled={isViewMode}
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
          <Input
            label="End Date"
            type="date"
            required
            disabled={isViewMode}
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Product SKU"
            required
            disabled={isViewMode}
            value={formData.productDetails.sku}
            onChange={(e) => setFormData({
              ...formData,
              productDetails: { ...formData.productDetails, sku: e.target.value }
            })}
          />
          <Input
            label="Product Name"
            required
            disabled={isViewMode}
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
            disabled={isViewMode}
            value={formData.productDetails.targetQuantity}
            onChange={(e) => setFormData({
              ...formData,
              productDetails: { ...formData.productDetails, targetQuantity: e.target.value }
            })}
          />
          <Select
            label="Unit of Measurement"
            required
            disabled={isViewMode}
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

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Priority"
            required
            disabled={isViewMode}
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </Select>
          {plan && (
            <Select
              label="Status"
              disabled={isViewMode}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="draft">Draft</option>
              <option value="approved">Approved</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </Select>
          )}
        </div>

        {/* Stages Section */}
        {plan && stages.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">Production Stages</h3>
            {stagesLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <div className="space-y-2">
                {stages.map((stage, idx) => (
                  <div key={stage._id || idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {stage.sequence || idx + 1}
                      </span>
                      <div>
                        <span className="font-medium capitalize">{stage.stageName?.replace(/_/g, ' ')}</span>
                        {stage.outputQuantity > 0 && (
                          <span className="text-xs text-gray-500 ml-2">
                            Output: {stage.outputQuantity} {stage.uom || ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${stage.completionPercent || 0}%` }}
                        ></div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStageStatusColor(stage.status)}`}>
                        {stage.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            {isViewMode ? 'Close' : 'Cancel'}
          </Button>
          {!isViewMode && (
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : plan ? 'Update Plan' : 'Create Plan'}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default Production;
