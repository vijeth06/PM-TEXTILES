import React, { useState, useEffect } from 'react';
import { productionAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Modal, Input, Select, Textarea, Button, Badge } from '../../components/common';

const parseQuantity = (value) => {
  if (value === '' || value === null || value === undefined) {
    return 0;
  }

  const parsedValue = Number.parseFloat(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
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
    
    if (!formData.machineCode) {
      toast.error('Please select a machine');
      return;
    }

    if (formData.outputQuantity < 0) {
      toast.error('Output quantity cannot be negative');
      return;
    }

    if (formData.rejectedQuantity < 0) {
      toast.error('Rejected quantity cannot be negative');
      return;
    }

    if (formData.wastageQuantity < 0) {
      toast.error('Wastage quantity cannot be negative');
      return;
    }

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
      console.error('Stage update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update stage');
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
            {stage.planNo} - {stage.stageName.replace(/_/g, ' ').toUpperCase()}
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
            onChange={(e) => setFormData({ ...formData, outputQuantity: parseQuantity(e.target.value) })}
          />
          <Input
            label="Rejected Quantity"
            type="number"
            min="0"
            step="0.01"
            value={formData.rejectedQuantity}
            onChange={(e) => setFormData({ ...formData, rejectedQuantity: parseQuantity(e.target.value) })}
          />
          <Input
            label="Wastage Quantity"
            type="number"
            min="0"
            step="0.01"
            value={formData.wastageQuantity}
            onChange={(e) => setFormData({ ...formData, wastageQuantity: parseQuantity(e.target.value) })}
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

export default ExecutionModal;
