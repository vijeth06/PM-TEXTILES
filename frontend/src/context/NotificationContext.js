import React, { createContext, useContext, useState, useEffect } from 'react';
import { notificationAPI } from '../services/api';
import socketService from '../services/socketService';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getNotifications();
      setNotifications(response.data.data || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  // Mark as read
  const markAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev =>
        prev.map(notif => notif._id === id ? { ...notif, isRead: true } : notif)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  // Delete notification
  const deleteNotification = async (id) => {
    try {
      await notificationAPI.deleteNotification(id);
      setNotifications(prev => prev.filter(notif => notif._id !== id));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  // Clear all notifications
  const clearAll = async () => {
    try {
      await notificationAPI.clearAll();
      setNotifications([]);
      setUnreadCount(0);
      toast.success('All notifications cleared');
    } catch (error) {
      toast.error('Failed to clear notifications');
    }
  };

  // Create notification (for admin use)
  const createNotification = async (data) => {
    try {
      await notificationAPI.createNotification(data);
      toast.success('Notification sent');
      fetchNotifications();
    } catch (error) {
      toast.error('Failed to send notification');
    }
  };

  // Fetch notifications and setup real-time listener
  useEffect(() => {
    fetchNotifications();

    // Setup real-time notification listener
    if (socketService.isConnected()) {
      socketService.on('new_notification', (data) => {
        setNotifications(prev => [data, ...prev]);
        setUnreadCount(prev => prev + 1);
        toast.info(`New notification: ${data.title}`);
      });

      socketService.on('notification_updated', (data) => {
        setNotifications(prev =>
          prev.map(notif => notif._id === data._id ? data : notif)
        );
      });

      socketService.on('notification_deleted', (data) => {
        setNotifications(prev => prev.filter(notif => notif._id !== data._id));
        if (!data.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      });
    }

    // Cleanup listeners on unmount
    return () => {
      if (socketService.isConnected()) {
        socketService.off('new_notification');
        socketService.off('notification_updated');
        socketService.off('notification_deleted');
      }
    };
  }, []);

  const value = {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    createNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
