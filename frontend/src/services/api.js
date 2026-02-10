import axios from 'axios';
import { API_BASE_URL } from '../config/urls';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Production API
export const productionAPI = {
  getPlans: (params) => api.get('/production/plans', { params }),
  getPlan: (id) => api.get(`/production/plans/${id}`),
  createPlan: (data) => api.post('/production/plans', data),
  updatePlan: (id, data) => api.put(`/production/plans/${id}`, data),
  deletePlan: (id) => api.delete(`/production/plans/${id}`),
  getStages: (planId) => api.get(`/production/stages/${planId}`),
  updateStage: (id, data) => api.put(`/production/stages/${id}`, data),
  getMachines: (params) => api.get('/production/machines', { params })
};

// Inventory API
export const inventoryAPI = {
  getInventory: (params) => api.get('/inventory', { params }),
  lookupBatch: (code) => api.get('/inventory/lookup', { params: { code } }),
  getItem: (id) => api.get(`/inventory/${id}`),
  issueMaterial: (data) => api.post('/inventory/issue', data),
  receiveMaterial: (data) => api.post('/inventory/receive', data),
  adjustInventory: (id, data) => api.put(`/inventory/${id}/adjust`, data),
  getAlerts: () => api.get('/inventory/alerts'),
  getBatchHistory: (id) => api.get(`/inventory/${id}/history`),
  // Purchase Orders
  getPurchaseOrders: (params) => api.get('/inventory/purchase-orders', { params }),
  getPurchaseOrder: (id) => api.get(`/inventory/purchase-orders/${id}`),
  createPurchaseOrder: (data) => api.post('/inventory/purchase-orders', data),
  updatePurchaseOrder: (id, data) => api.put(`/inventory/purchase-orders/${id}`, data),
  receiveMaterials: (id, data) => api.post(`/inventory/purchase-orders/${id}/receive`, data),
  cancelPurchaseOrder: (id, data) => api.put(`/inventory/purchase-orders/${id}/cancel`, data),
  getSupplierPerformance: (supplierId, params) => api.get(`/inventory/purchase-orders/supplier/${supplierId}/performance`, { params })
};

// Orders API
export const ordersAPI = {
  getOrders: (params) => api.get('/orders', { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  createOrder: (data) => api.post('/orders', data),
  updateOrder: (id, data) => api.put(`/orders/${id}`, data),
  deleteOrder: (id) => api.delete(`/orders/${id}`),
  dispatchOrder: (id, data) => api.post(`/orders/${id}/dispatch`, data),
  getOrdersByCustomer: (customerId) => api.get(`/orders/customer/${customerId}`),
  getOrderProfit: (id) => api.get(`/orders/${id}/profit`)
};

// Customers API
export const customersAPI = {
  getCustomers: (params) => api.get('/customers', { params }),
  getCustomer: (id) => api.get(`/customers/${id}`),
  createCustomer: (data) => api.post('/customers', data),
  updateCustomer: (id, data) => api.put(`/customers/${id}`, data),
  deleteCustomer: (id) => api.delete(`/customers/${id}`)
};

// Suppliers API
export const suppliersAPI = {
  getSuppliers: (params) => api.get('/suppliers', { params }),
  getSupplier: (id) => api.get(`/suppliers/${id}`),
  createSupplier: (data) => api.post('/suppliers', data),
  updateSupplier: (id, data) => api.put(`/suppliers/${id}`, data),
  deleteSupplier: (id) => api.delete(`/suppliers/${id}`)
};

// Items (RawMaterial, SemiFinishedGood, FinishedGood)
export const itemsAPI = {
  getItems: (params) => api.get('/items', { params }),
  getItem: (id) => api.get(`/items/${id}`),
  createItem: (data) => api.post('/items', data),
  updateItem: (id, data) => api.put(`/items/${id}`, data),
  deleteItem: (id) => api.delete(`/items/${id}`)
};

// Reports API
export const reportsAPI = {
  getDailyProduction: (params) => api.get('/reports/production-daily', { params }),
  getInventoryAging: (params) => api.get('/reports/inventory-aging', { params }),
  getWastageAnalysis: (params) => api.get('/reports/wastage-analysis', { params }),
  getOrderFulfillment: (params) => api.get('/reports/order-fulfillment', { params }),
  getMachineUtilization: (params) => api.get('/reports/machine-utilization', { params }),
  getProfitPerOrder: (params) => api.get('/reports/profit-per-order', { params })
};

// Dashboard API
export const dashboardAPI = {
  getProductionTrend: (params) => api.get('/dashboard/production-trend', { params }),
  getInventoryAging: () => api.get('/dashboard/inventory-aging'),
  getOrderFulfillment: (params) => api.get('/dashboard/order-fulfillment', { params }),
  getMachineUtilization: (params) => api.get('/dashboard/machine-utilization', { params }),
  getSupplierPerformance: () => api.get('/dashboard/supplier-performance'),
  getMetrics: () => api.get('/dashboard/metrics'),
  getTrends: (params) => api.get('/dashboard/trends', { params }),
  getOrderStatusDistribution: () => api.get('/dashboard/order-status-distribution'),
  getQualityByStage: (params) => api.get('/dashboard/quality-by-stage', { params }),
  getMonthlyPerformance: (params) => api.get('/dashboard/monthly-performance', { params }),
  getInventoryValueTrend: (params) => api.get('/dashboard/inventory-value-trend', { params })
};

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updatePassword: (data) => api.put('/auth/update-password', data)
};

// Users API
export const usersAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (data) => api.post('/users', data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`)
};

// Notifications API
export const notificationAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  getNotification: (id) => api.get(`/notifications/${id}`),
  createNotification: (data) => api.post('/notifications', data),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  clearAll: () => api.delete('/notifications/clear-all')
};

// Audit Trail API
export const auditAPI = {
  getAuditLogs: (params) => api.get('/audit', { params }),
  getAuditLog: (id) => api.get(`/audit/${id}`),
  getUserActivity: (userId, params) => api.get(`/audit/user/${userId}`, { params }),
  getEntityHistory: (entityType, entityId) => api.get(`/audit/entity/${entityType}/${entityId}`)
};

// Settings API
export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.put('/settings', data),
  getSystemInfo: () => api.get('/settings/system-info'),
  backup: () => api.post('/settings/backup'),
  restore: (data) => api.post('/settings/restore', data)
};

export default api;
