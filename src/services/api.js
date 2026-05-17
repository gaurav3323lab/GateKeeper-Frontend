import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://yellowgreen-goldfish-813322.hostingersite.com';

const api = axios.create({
  baseURL: API_URL,
});

// JWT token auto-inject
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Auth ─────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/api/auth/login', data),
  register: (data) => api.post('/api/auth/register', data),
  getProfile: () => api.get('/api/auth/profile'),
  updateProfile: (data) => api.put('/api/auth/profile', data),
};

// ── Vehicles ─────────────────────────────────────────────────
export const vehicleAPI = {
  getVehicles: () => api.get('/api/vehicles'),
  addVehicle: (data) => api.post('/api/vehicles', data),
  updateVehicle: (id, data) => api.put(`/api/vehicles/${id}`, data),
  removeVehicle: (id) => api.delete(`/api/vehicles/${id}`),
};

// ── Service Requests ─────────────────────────────────────────
export const serviceAPI = {
  getResidentRequests: () => api.get('/api/service'),
  getAllRequests: () => api.get('/api/service/all'),
  createRequest: (data) => api.post('/api/service', data),
  updateRequest: (id, data) => api.put(`/api/service/${id}`, data),
  deleteRequest: (id) => api.delete(`/api/service/${id}`),
  updateStatus: (id, data) => api.put(`/api/service/${id}/status`, data),
};

// ── Family Members ───────────────────────────────────────────
export const familyAPI = {
  getMembers: () => api.get('/api/family'),
  addMember: (data) => api.post('/api/family', data),
  updateMember: (id, data) => api.put(`/api/family/${id}`, data),
  removeMember: (id) => api.delete(`/api/family/${id}`),
};

// ── Manager ──────────────────────────────────────────────────
export const managerAPI = {
  getPendingResidents: () => api.get('/api/manager/pending-residents'),
  getResidents: () => api.get('/api/manager/residents'),
  approveResident: (id, data) => api.post('/api/manager/approve-resident', { userId: id, ...data }),
  getStaff: () => api.get('/api/manager/staff'),
  createStaff: (data) => api.post('/api/manager/create-staff', data),
  updateStaff: (type, id, data) => api.put(`/api/manager/staff/${type}/${id}`, data),
  deleteStaff: (type, id) => api.delete(`/api/manager/staff/${type}/${id}`),
  createManager: (data) => api.post('/api/manager/create-manager', data),
  getManagers: () => api.get('/api/manager/managers'),
  deleteManager: (id) => api.delete(`/api/manager/managers/${id}`),
};

// ── Entry & SOS ──────────────────────────────────────────────
export const entryAPI = {
  scanPlate: (data) => api.post('/api/entry/scan-plate', data),
  sos: (data) => api.post('/api/entry/sos', data),
  manualLog: (data) => api.post('/api/entry/manual-log', data),
  logPreApproved: (data) => api.post('/api/entry/log-preapproved', data),
  getLogs: () => api.get('/api/entry/logs'),
  getResidentLogs: () => api.get('/api/entry/resident-logs'),
  getEmergencies: () => api.get('/api/entry/emergencies'),
  resolveEmergency: (id, data) => api.put(`/api/entry/emergencies/${id}/resolve`, data),
  getPreApprovals: () => api.get('/api/entry/pre-approvals'),
  addPreApproval: (data) => api.post('/api/entry/pre-approve', data),
  removePreApproval: (type, id) => api.delete(`/api/entry/pre-approve/${type}/${id}`),
};

// ── Guard Panel ──────────────────────────────────────────────
export const guardAPI = {
  getPreApproved: () => api.get('/api/guard/pre-approved'),
  getEntryLogs: () => api.get('/api/guard/entry-logs'),
  getEmergencies: () => api.get('/api/guard/emergencies'),
  getVehicleStats: () => api.get('/api/guard/vehicle-stats'),
  getInsideVisitors: () => api.get('/api/guard/inside-visitors'),
  checkoutVisitor: (log_id) => api.post('/api/guard/checkout-visitor', { log_id }),
};

// ── Societies ────────────────────────────────────────────────
export const societyAPI = {
  getAll: () => api.get('/api/societies'),
  create: (data) => api.post('/api/societies', data),
  update: (id, data) => api.put(`/api/societies/${id}`, data),
  delete: (id) => api.delete(`/api/societies/${id}`),
  verifyCode: (code) => api.get(`/api/societies/verify/${code}`),
};

// ── Announcements ────────────────────────────────────────────
export const announcementAPI = {
  getAll: () => api.get('/api/announcements'),
  create: (data) => api.post('/api/announcements', data),
  update: (id, data) => api.put(`/api/announcements/${id}`, data),
  delete: (id) => api.delete(`/api/announcements/${id}`),
};

// ── Ads ──────────────────────────────────────────────────────
export const adsAPI = {
  getAll: () => api.get('/api/ads'),
  create: (data) => api.post('/api/ads', data),
  delete: (id) => api.delete(`/api/ads/${id}`),
};

export default api;
