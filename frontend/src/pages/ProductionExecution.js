import React, { useState, useEffect } from 'react';
import { productionAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
  PlayIcon, CheckCircleIcon, ClockIcon, WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import { 
  Card, CardHeader, CardBody, Button, Badge, Table, Thead, Tbody, Th, Td, 
  LoadingSpinner, EmptyState 
} from '../components/common';
import ExecutionModal from './modals/ExecutionModal';
import QualityCheckModal from './modals/QualityCheckModal';
import DowntimeModal from './modals/DowntimeModal';

const ProductionExecution = () => {
  const [stages, setStages] = useState([]);
  const [summaryCounts, setSummaryCounts] = useState({
    pending: 0,
    in_progress: 0,
    completed: 0,
    on_hold: 0
  });
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(null); // 'execution', 'quality', 'downtime', or null
  const [selectedStage, setSelectedStage] = useState(null);

  useEffect(() => {
    fetchPendingStages();
  }, []);

  const fetchPendingStages = async () => {
    try {
      setLoading(true);
      // Get all production stages that are pending or in_progress
      // More efficient than fetching all plans and then their stages
      const stagesResponse = await productionAPI.getPlans({ 
        status: 'approved,in_progress' 
      });
      
      const allStages = [];
      const plans = stagesResponse.data.data || [];
      if (plans.length > 0) {
        const stageResults = await Promise.allSettled(
          plans.map(plan => productionAPI.getStages(plan._id))
        );
        stageResults.forEach((result, i) => {
          if (result.status === 'fulfilled') {
            const planStages = result.value.data.data || [];
            const plan = plans[i];
            const enrichedStages = planStages.map(stage => ({
              ...stage,
              planNo: plan.planNo,
              planId: plan._id
            }));
            allStages.push(...enrichedStages);
          } else {
            console.error(`Failed to fetch stages for plan ${plans[i]._id}:`, result.reason);
          }
        });
      }
      
      setSummaryCounts({
        pending: allStages.filter((stage) => stage.status === 'pending').length,
        in_progress: allStages.filter((stage) => stage.status === 'in_progress').length,
        completed: allStages.filter((stage) => stage.status === 'completed').length,
        on_hold: allStages.filter((stage) => stage.status === 'on_hold').length
      });

      const actionableStages = allStages.filter(
        (stage) => ['pending', 'in_progress', 'on_hold'].includes(stage.status)
      );

      setStages(actionableStages);
    } catch (error) {
      console.error('Error fetching production stages:', error);
      toast.error('Failed to fetch production stages');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (type, stage) => {
    setSelectedStage(stage);
    setOpenModal(type);
  };

  const handleCloseModal = () => {
    setOpenModal(null);
    setSelectedStage(null);
  };

  const handleModalSuccess = () => {
    handleCloseModal();
    fetchPendingStages();
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'default',
      in_progress: 'warning',
      completed: 'success',
      on_hold: 'danger',
      cancelled: 'danger'
    };
    return <Badge variant={variants[status]}>{status.replace(/_/g, ' ').toUpperCase()}</Badge>;
  };

  const getProgressPercentage = (stage) => {
    if (stage.status === 'completed') return 100;
    if (stage.status !== 'in_progress') return 0;

    const inputQty = Number(stage.inputQuantity || 0);
    const outputQty = Number(stage.outputQuantity || 0);
    if (inputQty <= 0) return 50;

    return Math.max(0, Math.min(100, Math.round((outputQty / inputQty) * 100)));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Production Execution</h1>
          <p className="text-gray-600 mt-1">Execute and monitor production stages in real-time</p>
        </div>
        <Button onClick={fetchPendingStages} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summaryCounts.pending}
                </p>
              </div>
              <div className="bg-gray-100 p-3 rounded-full">
                <ClockIcon className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {summaryCounts.in_progress}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <PlayIcon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {summaryCounts.completed}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">On Hold</p>
                <p className="text-2xl font-bold text-red-600">
                  {summaryCounts.on_hold}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <ClockIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Stages Table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Production Stages</h2>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : stages.length === 0 ? (
            <EmptyState 
              title="No active production stages" 
              description="There are no pending, in-progress, or on-hold stages right now"
            />
          ) : (
            <Table>
              <Thead>
                <Th>Plan</Th>
                <Th>Stage</Th>
                <Th>Machine</Th>
                <Th>Input</Th>
                <Th>Output</Th>
                <Th>Status</Th>
                <Th>Progress</Th>
                <Th>Actions</Th>
              </Thead>
              <Tbody>
                {stages.map((stage) => (
                  <tr key={stage._id} className="border-b">
                    <Td>
                      <div className="font-medium">{stage.planNo}</div>
                      <div className="text-xs text-gray-500">ID: {stage.planId ? stage.planId.substring(0, 8) : 'N/A'}</div>
                    </Td>
                    <Td>
                      <div>
                        <div className="font-medium capitalize">
                          {(stage.stageName || '').replace(/_/g, ' ') || 'Unknown Stage'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Seq: {stage.stageSequence}
                        </div>
                      </div>
                    </Td>
                    <Td>
                      {stage.machineCode || (
                        <Badge variant="default">Not Assigned</Badge>
                      )}
                    </Td>
                    <Td>
                      {stage.inputQuantity} {stage.uom}
                    </Td>
                    <Td>
                      <div>
                        <div className="font-medium">
                          {stage.outputQuantity} {stage.uom}
                        </div>
                        {stage.rejectedQuantity > 0 && (
                          <div className="text-xs text-red-600">
                            Rejected: {stage.rejectedQuantity}
                          </div>
                        )}
                      </div>
                    </Td>
                    <Td>{getStatusBadge(stage.status)}</Td>
                    <Td>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            stage.status === 'completed' ? 'bg-green-600' :
                            stage.status === 'in_progress' ? 'bg-yellow-600' :
                            'bg-gray-400'
                          }`}
                          style={{ width: `${getProgressPercentage(stage)}%` }}
                        ></div>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex space-x-2">
                        {stage.status === 'pending' && (
                          <button
                            onClick={() => handleOpenModal('execution', stage)}
                            className="text-green-600 hover:text-green-800"
                            title="Start Stage"
                          >
                            <PlayIcon className="h-5 w-5" />
                          </button>
                        )}
                        {stage.status === 'in_progress' && (
                          <>
                            <button
                              onClick={() => handleOpenModal('execution', stage)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Complete Stage"
                            >
                              <CheckCircleIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleOpenModal('quality', stage)}
                              className="text-purple-600 hover:text-purple-800"
                              title="Quality Check"
                            >
                              <WrenchScrewdriverIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleOpenModal('downtime', stage)}
                              className="text-red-600 hover:text-red-800"
                              title="Log Downtime"
                            >
                              <ClockIcon className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </Tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Modals - Conditional Rendering */}
      {openModal === 'execution' && selectedStage && (
        <ExecutionModal
          stage={selectedStage}
          onClose={handleCloseModal}
          onSuccess={handleModalSuccess}
        />
      )}

      {openModal === 'quality' && selectedStage && (
        <QualityCheckModal
          stage={selectedStage}
          onClose={handleCloseModal}
          onSuccess={handleModalSuccess}
        />
      )}

      {openModal === 'downtime' && selectedStage && (
        <DowntimeModal
          stage={selectedStage}
          onClose={handleCloseModal}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
};

export default ProductionExecution;
