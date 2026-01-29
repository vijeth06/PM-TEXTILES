import React, { useState, useEffect } from 'react';
import { productionAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
  PlayIcon, StopIcon, CheckCircleIcon, XCircleIcon, 
  ClockIcon, WrenchScrewdriverIcon, UserGroupIcon
} from '@heroicons/react/24/outline';
import { 
  Card, CardHeader, CardBody, Button, Badge, Table, Thead, Tbody, Th, Td, 
  Modal, Input, Select, Textarea, LoadingSpinner, EmptyState 
} from '../components/common';

const ProductionExecution = () => {
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [showDowntimeModal, setShowDowntimeModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);

  useEffect(() => {
    fetchPendingStages();
  }, []);

  const fetchPendingStages = async () => {
    try {
      setLoading(true);
      // Get all production plans
      const plansResponse = await productionAPI.getPlans({ 
        status: 'approved,in_progress' 
      });
      
      // For each plan, get its stages
      const allStages = [];
      for (const plan of plansResponse.data.data || []) {
        const stagesResponse = await productionAPI.getStages(plan._id);
        allStages.push(...(stagesResponse.data.data || []));
      }
      
      setStages(allStages);
    } catch (error) {
      toast.error('Failed to fetch production stages');
    } finally {
      setLoading(false);
    }
  };

  const handleStartStage = (stage) => {
    setSelectedStage(stage);
    setShowExecutionModal(true);
  };

  const handleQualityCheck = (stage) => {
    setSelectedStage(stage);
    setShowQualityModal(true);
  };

  const handleLogDowntime = (stage) => {
    setSelectedStage(stage);
    setShowDowntimeModal(true);
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'default',
      in_progress: 'warning',
      completed: 'success',
      on_hold: 'danger',
      cancelled: 'danger'
    };
    return <Badge variant={variants[status]}>{status.replace('_', ' ').toUpperCase()}</Badge>;
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
                  {stages.filter(s => s.status === 'pending').length}
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
                  {stages.filter(s => s.status === 'in_progress').length}
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
                  {stages.filter(s => s.status === 'completed').length}
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
                  {stages.filter(s => s.status === 'on_hold').length}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <XCircleIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Stages Table */}
      <Card>
        <CardBody className="p-0">
          {loading ? (
            <div className="py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : stages.length === 0 ? (
            <EmptyState
              icon={PlayIcon}
              title="No production stages"
              description="No active production stages available for execution"
            />
          ) : (
            <Table>
              <Thead>
                <tr>
                  <Th>Plan No</Th>
                  <Th>Stage</Th>
                  <Th>Machine</Th>
                  <Th>Input Qty</Th>
                  <Th>Output Qty</Th>
                  <Th>Status</Th>
                  <Th>Progress</Th>
                  <Th>Actions</Th>
                </tr>
              </Thead>
              <Tbody>
                {stages.map((stage) => (
                  <tr key={stage._id}>
                    <Td>
                      <span className="font-medium">{stage.planNo}</span>
                    </Td>
                    <Td>
                      <div>
                        <div className="font-medium capitalize">
                          {stage.stageName.replace('_', ' ')}
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
                          style={{ 
                            width: stage.status === 'completed' ? '100%' : 
                                   stage.status === 'in_progress' ? '50%' : '0%' 
                          }}
                        ></div>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex space-x-2">
                        {stage.status === 'pending' && (
                          <button
                            onClick={() => handleStartStage(stage)}
                            className="text-green-600 hover:text-green-800"
                            title="Start Stage"
                          >
                            <PlayIcon className="h-5 w-5" />
                          </button>
                        )}
                        {stage.status === 'in_progress' && (
                          <>
                            <button
                              onClick={() => handleStartStage(stage)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Complete Stage"
                            >
                              <CheckCircleIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleQualityCheck(stage)}
                              className="text-purple-600 hover:text-purple-800"
                              title="Quality Check"
                            >
                              <WrenchScrewdriverIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleLogDowntime(stage)}
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

      {/* Modals */}
      {showExecutionModal && (
        <ExecutionModal
          stage={selectedStage}
          onClose={() => setShowExecutionModal(false)}
          onSuccess={() => {
            setShowExecutionModal(false);
            fetchPendingStages();
          }}
        />
      )}

      {showQualityModal && (
        <QualityCheckModal
          stage={selectedStage}
          onClose={() => setShowQualityModal(false)}
          onSuccess={() => {
            setShowQualityModal(false);
            fetchPendingStages();
          }}
        />
      )}

      {showDowntimeModal && (
        <DowntimeModal
          stage={selectedStage}
          onClose={() => setShowDowntimeModal(false)}
          onSuccess={() => {
            setShowDowntimeModal(false);
            fetchPendingStages();
          }}
        />
      )}
    </div>
  );
};

const ExecutionModal = ({ stage, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    outputQuantity: stage?.outputQuantity || 0,
    rejectedQuantity: stage?.rejectedQuantity || 0,
    wastageQuantity: stage?.wastageQuantity || 0,
    machineId: stage?.machineId || '',
    machineCode: stage?.machineCode || '',
    assignedWorkers: stage?.assignedWorkers || [],
    notes: stage?.notes || '',
    status: stage?.status === 'pending' ? 'in_progress' : 'completed'
  });
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [workerName, setWorkerName] = useState('');

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      const response = await productionAPI.getMachines();
      setMachines(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch machines');
    }
  };

  const handleAddWorker = () => {
    if (workerName.trim()) {
      setFormData({
        ...formData,
        assignedWorkers: [
          ...formData.assignedWorkers,
          { workerName: workerName.trim(), workerId: Date.now().toString() }
        ]
      });
      setWorkerName('');
    }
  };

  const handleRemoveWorker = (index) => {
    setFormData({
      ...formData,
      assignedWorkers: formData.assignedWorkers.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = {
        ...formData,
        actualStartTime: stage.status === 'pending' ? new Date() : stage.actualStartTime,
        actualEndTime: formData.status === 'completed' ? new Date() : null
      };

      await productionAPI.updateStage(stage._id, updateData);
      toast.success(
        formData.status === 'completed' 
          ? 'Stage completed successfully' 
          : 'Stage started successfully'
      );
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={true} 
      onClose={onClose} 
      title={stage?.status === 'pending' ? 'Start Production Stage' : 'Complete Production Stage'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-blue-50 p-3 rounded">
          <div className="text-sm font-medium text-blue-900">
            {stage.planNo} - {stage.stageName.replace('_', ' ').toUpperCase()}
          </div>
          <div className="text-xs text-blue-700">
            Input Quantity: {stage.inputQuantity} {stage.uom}
          </div>
        </div>

        <Select
          label="Machine"
          required
          value={formData.machineCode}
          onChange={(e) => {
            const selectedMachine = machines.find(m => m.code === e.target.value);
            setFormData({ 
              ...formData, 
              machineCode: e.target.value,
              machineId: selectedMachine?._id || ''
            });
          }}
        >
          <option value="">Select Machine</option>
          {machines.map(machine => (
            <option key={machine._id} value={machine.code}>
              {machine.code} - {machine.name}
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Output Quantity"
            type="number"
            required
            min="0"
            step="0.01"
            value={formData.outputQuantity}
            onChange={(e) => setFormData({ ...formData, outputQuantity: parseFloat(e.target.value) })}
          />
          <Input
            label="Rejected Quantity"
            type="number"
            min="0"
            step="0.01"
            value={formData.rejectedQuantity}
            onChange={(e) => setFormData({ ...formData, rejectedQuantity: parseFloat(e.target.value) })}
          />
          <Input
            label="Wastage Quantity"
            type="number"
            min="0"
            step="0.01"
            value={formData.wastageQuantity}
            onChange={(e) => setFormData({ ...formData, wastageQuantity: parseFloat(e.target.value) })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Workers</label>
          <div className="flex space-x-2 mb-2">
            <Input
              placeholder="Worker name"
              value={workerName}
              onChange={(e) => setWorkerName(e.target.value)}
            />
            <Button type="button" onClick={handleAddWorker} variant="outline">
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.assignedWorkers.map((worker, idx) => (
              <Badge key={idx} variant="info" className="flex items-center space-x-1">
                <span>{worker.workerName}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveWorker(idx)}
                  className="ml-1 text-blue-800 hover:text-blue-900"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </div>

        <Textarea
          label="Notes"
          rows="3"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Add any notes or observations..."
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : formData.status === 'completed' ? 'Complete Stage' : 'Start Stage'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const QualityCheckModal = ({ stage, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    inspector: '',
    result: 'pass',
    remarks: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const qualityCheck = {
        checkTime: new Date(),
        ...formData
      };

      await productionAPI.updateStage(stage._id, {
        qualityChecks: [...(stage.qualityChecks || []), qualityCheck]
      });

      toast.success('Quality check recorded successfully');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Quality Check" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-blue-50 p-3 rounded">
          <div className="text-sm font-medium text-blue-900">
            {stage.planNo} - {stage.stageName.replace('_', ' ').toUpperCase()}
          </div>
        </div>

        <Input
          label="Inspector Name"
          required
          value={formData.inspector}
          onChange={(e) => setFormData({ ...formData, inspector: e.target.value })}
        />

        <Select
          label="Result"
          required
          value={formData.result}
          onChange={(e) => setFormData({ ...formData, result: e.target.value })}
        >
          <option value="pass">Pass</option>
          <option value="fail">Fail</option>
          <option value="conditional">Conditional</option>
        </Select>

        <Textarea
          label="Remarks"
          required
          rows="3"
          value={formData.remarks}
          onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
          placeholder="Enter quality check observations..."
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Check'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const DowntimeModal = ({ stage, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    reason: 'machine_breakdown',
    startTime: new Date().toISOString().slice(0, 16),
    endTime: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const start = new Date(formData.startTime);
      const end = formData.endTime ? new Date(formData.endTime) : new Date();
      const duration = Math.floor((end - start) / 1000 / 60); // minutes

      const downtime = {
        ...formData,
        startTime: start,
        endTime: end,
        duration
      };

      await productionAPI.updateStage(stage._id, {
        downtimeLog: [...(stage.downtimeLog || []), downtime]
      });

      toast.success('Downtime logged successfully');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Log Downtime" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-red-50 p-3 rounded">
          <div className="text-sm font-medium text-red-900">
            {stage.planNo} - {stage.stageName.replace('_', ' ').toUpperCase()}
          </div>
        </div>

        <Select
          label="Reason"
          required
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
        >
          <option value="machine_breakdown">Machine Breakdown</option>
          <option value="material_shortage">Material Shortage</option>
          <option value="power_outage">Power Outage</option>
          <option value="quality_issue">Quality Issue</option>
          <option value="other">Other</option>
        </Select>

        <Input
          label="Start Time"
          type="datetime-local"
          required
          value={formData.startTime}
          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
        />

        <Input
          label="End Time"
          type="datetime-local"
          value={formData.endTime}
          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
          help="Leave blank if still ongoing"
        />

        <Textarea
          label="Notes"
          rows="3"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional details about the downtime..."
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Log Downtime'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ProductionExecution;
