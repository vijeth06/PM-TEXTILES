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

// Forecasts API
export const forecastsAPI = {
  getForecasts: (params) => api.get('/analytics/forecasts', { params }),
  getForecast: (id) => api.get(`/analytics/forecasts/${id}`),
  createForecast: (data) => api.post('/analytics/forecasts', data),
  generateDemandForecast: (data) => api.post('/analytics/forecasts/demand', data),
  getForecastAccuracy: (params) => api.get('/analytics/forecasts/accuracy', { params }),
  updateForecastActual: (id, data) => api.put(`/analytics/forecasts/${id}/actual`, data),
  deleteForecast: (id) => api.delete(`/analytics/forecasts/${id}`)
};

// KPIs API
export const kpisAPI = {
  getKPIs: (params) => api.get('/analytics/kpis', { params }),
  getKPI: (id) => api.get(`/analytics/kpis/${id}`),
  createKPI: (data) => api.post('/analytics/kpis', data),
  calculateOEE: (data) => api.post('/analytics/kpis/oee', data),
  calculateOTD: (data) => api.post('/analytics/kpis/otd', data),
  calculateFPY: (data) => api.post('/analytics/kpis/fpy', data),
  getKPIDashboard: (params) => api.get('/analytics/kpis/dashboard', { params }),
  deleteKPI: (id) => api.delete(`/analytics/kpis/${id}`)
};

// Cost Analysis API
export const costAnalysisAPI = {
  getCostAnalyses: (params) => api.get('/analytics/cost-analysis', { params }),
  getCostAnalysis: (id) => api.get(`/analytics/cost-analysis/${id}`),
  createCostAnalysis: (data) => api.post('/analytics/cost-analysis', data),
  analyzeProductionCost: (planId) => api.post(`/analytics/cost-analysis/production/${planId}`),
  getCostBreakdown: (params) => api.get('/analytics/cost-analysis/breakdown', { params }),
  getProfitabilityReport: (params) => api.get('/analytics/cost-analysis/profitability', { params }),
  updateCostAnalysis: (id, data) => api.put(`/analytics/cost-analysis/${id}`, data),
  deleteCostAnalysis: (id) => api.delete(`/analytics/cost-analysis/${id}`)
};

// Auto Reorder API
export const autoReorderAPI = {
  getAutoReorders: (params) => api.get('/procurement/auto-reorder', { params }),
  checkReorders: () => api.post('/procurement/auto-reorder/check'),
  approveReorder: (id) => api.put(`/procurement/auto-reorder/${id}/approve`),
  rejectReorder: (id, data) => api.put(`/procurement/auto-reorder/${id}/reject`, data),
  updateQuantity: (id, data) => api.put(`/procurement/auto-reorder/${id}/quantity`, data),
  deleteReorder: (id) => api.delete(`/procurement/auto-reorder/${id}`)
};

// RFQ API
export const rfqAPI = {
  getRFQs: (params) => api.get('/procurement/rfq', { params }),
  getRFQ: (id) => api.get(`/procurement/rfq/${id}`),
  createRFQ: (data) => api.post('/procurement/rfq', data),
  updateRFQ: (id, data) => api.put(`/procurement/rfq/${id}`, data),
  sendRFQ: (id) => api.post(`/procurement/rfq/${id}/send`),
  submitQuotation: (id, data) => api.post(`/procurement/rfq/${id}/quotation`, data),
  evaluateRFQ: (id, data) => api.post(`/procurement/rfq/${id}/evaluate`, data),
  createPOFromRFQ: (id) => api.post(`/procurement/rfq/${id}/create-po`),
  deleteRFQ: (id) => api.delete(`/procurement/rfq/${id}`)
};

// Employees API
export const employeesAPI = {
  getEmployees: (params) => api.get('/hr/employees', { params }),
  getEmployee: (id) => api.get(`/hr/employees/${id}`),
  createEmployee: (data) => api.post('/hr/employees', data),
  updateEmployee: (id, data) => api.put(`/hr/employees/${id}`, data),
  markAttendance: (id, data) => api.post(`/hr/employees/${id}/attendance`, data),
  getAttendance: (id, params) => api.get(`/hr/employees/${id}/attendance`, { params }),
  addTraining: (id, data) => api.post(`/hr/employees/${id}/training`, data),
  addSkill: (id, data) => api.post(`/hr/employees/${id}/skills`, data),
  terminateEmployee: (id, data) => api.put(`/hr/employees/${id}/terminate`, data),
  deleteEmployee: (id) => api.delete(`/hr/employees/${id}`)
};

// Maintenance API
export const maintenanceAPI = {
  getSchedules: (params) => api.get('/maintenance/schedules', { params }),
  getSchedule: (id) => api.get(`/maintenance/schedules/${id}`),
  createSchedule: (data) => api.post('/maintenance/schedules', data),
  updateSchedule: (id, data) => api.put(`/maintenance/schedules/${id}`, data),
  startMaintenance: (id) => api.put(`/maintenance/schedules/${id}/start`),
  completeMaintenance: (id, data) => api.put(`/maintenance/schedules/${id}/complete`, data),
  getOverdueMaintenance: () => api.get('/maintenance/schedules/overdue'),
  deleteSchedule: (id) => api.delete(`/maintenance/schedules/${id}`)
};

// Leads API
export const leadsAPI = {
  getLeads: (params) => api.get('/crm/leads', { params }),
  getLead: (id) => api.get(`/crm/leads/${id}`),
  createLead: (data) => api.post('/crm/leads', data),
  updateLead: (id, data) => api.put(`/crm/leads/${id}`, data),
  addFollowUp: (id, data) => api.post(`/crm/leads/${id}/followup`, data),
  createQuotationFromLead: (id, data) => api.post(`/crm/leads/${id}/quotation`, data),
  convertToCustomer: (id) => api.post(`/crm/leads/${id}/convert`),
  markAsLost: (id, data) => api.put(`/crm/leads/${id}/lost`, data),
  getLeadStats: () => api.get('/crm/leads/stats'),
  deleteLead: (id) => api.delete(`/crm/leads/${id}`)
};

// Quotations API
export const quotationsAPI = {
  getQuotations: (params) => api.get('/sales/quotations', { params }),
  getQuotation: (id) => api.get(`/sales/quotations/${id}`),
  createQuotation: (data) => api.post('/sales/quotations', data),
  updateQuotation: (id, data) => api.put(`/sales/quotations/${id}`, data),
  sendQuotation: (id) => api.post(`/sales/quotations/${id}/send`),
  acceptQuotation: (id) => api.put(`/sales/quotations/${id}/accept`),
  createOrderFromQuotation: (id) => api.post(`/sales/quotations/${id}/create-order`),
  reviseQuotation: (id) => api.post(`/sales/quotations/${id}/revise`),
  deleteQuotation: (id) => api.delete(`/sales/quotations/${id}`)
};

// Documents API
export const documentsAPI = {
  getDocuments: (params) => api.get('/documents', { params }),
  getDocument: (id) => api.get(`/documents/${id}`),
  uploadDocument: (formData) => api.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateDocument: (id, data) => api.put(`/documents/${id}`, data),
  searchDocuments: (params) => api.get('/documents/search', { params }),
  approveDocument: (id, approvalId, data) => api.put(`/documents/${id}/approval/${approvalId}`, data),
  deleteDocument: (id) => api.delete(`/documents/${id}`)
};

export default api;
