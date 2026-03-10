import { useEffect, useState } from 'react';
import socketService from '../services/socketService';

/**
 * Custom hook for real-time updates
 * @param {string} event - Socket event name to listen to
 * @param {function} callback - Callback function when event is received
 */
export const useRealTimeUpdates = (event, callback) => {
  useEffect(() => {
    if (socketService.isConnected()) {
      socketService.on(event, callback);

      return () => {
        socketService.off(event, callback);
      };
    }
  }, [event, callback]);
};

/**
 * Hook for real-time inventory updates
 */
export const useInventoryUpdates = (onUpdate) => {
  useEffect(() => {
    if (socketService.isConnected()) {
      const handleUpdate = (data) => {
        console.log('Inventory updated:', data);
        if (onUpdate) onUpdate(data);
      };

      socketService.on('inventory_updated', handleUpdate);
      socketService.on('inventory_alerts', handleUpdate);

      return () => {
        socketService.off('inventory_updated', handleUpdate);
        socketService.off('inventory_alerts', handleUpdate);
      };
    }
  }, [onUpdate]);
};

/**
 * Hook for real-time order updates
 */
export const useOrderUpdates = (onUpdate) => {
  useEffect(() => {
    if (socketService.isConnected()) {
      const createHandler = (eventName) => (data) => {
        console.log('Order updated:', data);
        if (onUpdate) onUpdate({ ...data, event: eventName });
      };

      const onOrderCreated = createHandler('order_created');
      const onOrderUpdated = createHandler('order_updated');
      const onOrderDispatched = createHandler('order_dispatched');
      const onOrderStatusUpdated = createHandler('order_status_updated');

      socketService.on('order_created', onOrderCreated);
      socketService.on('order_updated', onOrderUpdated);
      socketService.on('order_dispatched', onOrderDispatched);
      socketService.on('order_status_updated', onOrderStatusUpdated);

      return () => {
        socketService.off('order_created', onOrderCreated);
        socketService.off('order_updated', onOrderUpdated);
        socketService.off('order_dispatched', onOrderDispatched);
        socketService.off('order_status_updated', onOrderStatusUpdated);
      };
    }
  }, [onUpdate]);
};

/**
 * Hook for real-time production updates
 */
export const useProductionUpdates = (onUpdate) => {
  useEffect(() => {
    if (socketService.isConnected()) {
      const handleUpdate = (data) => {
        console.log('Production updated:', data);
        if (onUpdate) onUpdate(data);
      };

      socketService.on('production_plan_created', handleUpdate);
      socketService.on('production_plan_updated', handleUpdate);
      socketService.on('production_stage_updated', handleUpdate);
      socketService.on('stage_progress', handleUpdate);

      return () => {
        socketService.off('production_plan_created', handleUpdate);
        socketService.off('production_plan_updated', handleUpdate);
        socketService.off('production_stage_updated', handleUpdate);
        socketService.off('stage_progress', handleUpdate);
      };
    }
  }, [onUpdate]);
};

/**
 * Hook for real-time quality updates
 */
export const useQualityUpdates = (onUpdate) => {
  useEffect(() => {
    if (socketService.isConnected()) {
      const handleUpdate = (data) => {
        console.log('Quality check updated:', data);
        if (onUpdate) onUpdate(data);
      };

      socketService.on('quality_check_created', handleUpdate);
      socketService.on('quality_check_updated', handleUpdate);
      socketService.on('quality_check_failed', handleUpdate);

      return () => {
        socketService.off('quality_check_created', handleUpdate);
        socketService.off('quality_check_updated', handleUpdate);
        socketService.off('quality_check_failed', handleUpdate);
      };
    }
  }, [onUpdate]);
};

/**
 * Hook for real-time payment updates
 */
export const usePaymentUpdates = (onUpdate) => {
  useEffect(() => {
    if (socketService.isConnected()) {
      const handleUpdate = (data) => {
        console.log('Payment updated:', data);
        if (onUpdate) onUpdate(data);
      };

      socketService.on('payment_received', handleUpdate);

      return () => {
        socketService.off('payment_received', handleUpdate);
      };
    }
  }, [onUpdate]);
};

/**
 * Hook for real-time schedule updates
 */
export const useScheduleUpdates = (onUpdate) => {
  useEffect(() => {
    if (socketService.isConnected()) {
      const handleUpdate = (data) => {
        console.log('Schedule updated:', data);
        if (onUpdate) onUpdate(data);
      };

      socketService.on('new_schedule', handleUpdate);

      return () => {
        socketService.off('new_schedule', handleUpdate);
      };
    }
  }, [onUpdate]);
};

/**
 * Hook for real-time dashboard updates
 * Listens to all major events for dashboard refresh
 */
export const useDashboardUpdates = (onUpdate) => {
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    if (socketService.isConnected()) {
      const handleUpdate = (data) => {
        console.log('Dashboard update triggered:', data);
        setLastUpdate(new Date());
        if (onUpdate) onUpdate(data);
      };

      // Listen to all major events
      const events = [
        'order_created',
        'order_updated',
        'order_dispatched',
        'production_plan_created',
        'production_plan_updated',
        'production_stage_updated',
        'inventory_updated',
        'quality_check_created',
        'payment_received'
      ];

      events.forEach(event => {
        socketService.on(event, handleUpdate);
      });

      return () => {
        events.forEach(event => {
          socketService.off(event, handleUpdate);
        });
      };
    }
  }, [onUpdate]);

  return lastUpdate;
};
