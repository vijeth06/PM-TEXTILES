import React, { useState } from 'react';
import { productionAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Modal, Input, Select, Textarea, Button } from '../../components/common';

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
    
    if (!formData.startTime) {
      toast.error('Please select start time');
      return;
    }

    if (!formData.reason.trim()) {
      toast.error('Please select a reason');
      return;
    }

    const start = new Date(formData.startTime);
    const end = formData.endTime ? new Date(formData.endTime) : new Date();
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      toast.error('Please provide valid date/time values');
      return;
    }
    if (end < start) {
      toast.error('End time cannot be earlier than start time');
      return;
    }

    setLoading(true);

    try {
      const downtime = {
        reason: formData.reason,
        startTime: start,
        endTime: formData.endTime ? end : null,
        duration: Math.max(0, Math.floor((end - start) / 60000)),
        notes: formData.notes
      };

      await productionAPI.updateStage(stage._id, {
        appendDowntime: downtime
      });

      toast.success('Downtime logged successfully');
      onSuccess();
    } catch (error) {
      console.error('Downtime logging error:', error);
      toast.error(error.response?.data?.message || 'Failed to log downtime');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Log Downtime" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-blue-50 p-3 rounded">
          <div className="text-sm font-medium text-blue-900">
            {stage.planNo} - {stage.stageName.replace(/_/g, ' ').toUpperCase()}
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

export default DowntimeModal;
