import React, { useState } from 'react';
import { productionAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Modal, Input, Select, Textarea, Button } from '../../components/common';

const QualityCheckModal = ({ stage, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    inspector: '',
    result: 'pass',
    remarks: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.inspector.trim()) {
      toast.error('Please enter inspector name');
      return;
    }

    if (!formData.remarks.trim()) {
      toast.error('Please enter remarks');
      return;
    }

    setLoading(true);

    try {
      const qualityCheck = {
        checkTime: new Date(),
        ...formData
      };

      await productionAPI.updateStage(stage._id, {
        appendQualityCheck: qualityCheck
      });

      toast.success('Quality check recorded successfully');
      onSuccess();
    } catch (error) {
      console.error('Quality check error:', error);
      toast.error(error.response?.data?.message || 'Failed to record quality check');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Quality Check" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-blue-50 p-3 rounded">
          <div className="text-sm font-medium text-blue-900">
            {stage.planNo} - {stage.stageName.replace(/_/g, ' ').toUpperCase()}
          </div>
        </div>

        <Input
          label="Inspector Name"
          required
          value={formData.inspector}
          onChange={(e) => setFormData({ ...formData, inspector: e.target.value })}
          placeholder="Enter inspector name"
        />

        <Select
          label="Result"
          required
          value={formData.result}
          onChange={(e) => setFormData({ ...formData, result: e.target.value })}
        >
          <option value="pass">Pass</option>
          <option value="fail">Fail</option>
          <option value="conditional">Conditional Pass</option>
        </Select>

        <Textarea
          label="Remarks"
          rows="4"
          required
          value={formData.remarks}
          onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
          placeholder="Quality check observations and remarks..."
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Recording...' : 'Record Check'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default QualityCheckModal;
