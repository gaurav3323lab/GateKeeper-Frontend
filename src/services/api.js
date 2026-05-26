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
  getSocietyContacts: () => api.get('/api/entry/society-contacts'),
};

// ── Guard Panel ──────────────────────────────────────────────
export const guardAPI = {
  getPreApproved: () => api.get('/api/guard/pre-approved'),
  getEntryLogs: () => api.get('/api/guard/entry-logs'),
  getEmergencies: () => api.get('/api/guard/emergencies'),
  getVehicleStats: () => api.get('/api/guard/vehicle-stats'),
  getInsideVisitors: () => api.get('/api/guard/inside-visitors'),
  checkoutVisitor: (log_id) => api.post('/api/guard/checkout-visitor', { log_id }),
  verifyPin: (pin) => api.get(`/api/guard/verify-pin/${pin}`),
  verifyVehicle: (plate) => api.get(`/api/guard/verify-vehicle/${plate}`),
  vehicleLog: (data) => api.post('/api/guard/vehicle-log', data),
};

// ── Societies ────────────────────────────────────────────────
export const societyAPI = {
  getAll: () => api.get('/api/societies'),
  create: (data) => api.post('/api/societies', data),
  update: (id, data) => api.put(`/api/societies/${id}`, data),
  delete: (id) => api.delete(`/api/societies/${id}`),
  verifyCode: (code) => api.get(`/api/societies/verify/${code}`),
  getSettings: (societyId) => api.get(`/api/societies/${societyId}/settings`),
  updateSettings: (societyId, data) => api.put(`/api/societies/${societyId}/settings`, data),
  getTowers: (societyId) => api.get(`/api/societies/${societyId}/towers`),
  addTower: (societyId, tower_name) => api.post(`/api/societies/${societyId}/towers`, { tower_name }),
  deleteTower: (societyId, towerId) => api.delete(`/api/societies/${societyId}/towers/${towerId}`),
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

// ── Admin Panel API ──────────────────────────────────────────
export const adminAPI = {
  getDashboard: () => api.get('/api/admin/dashboard'),
  getSystemStatus: () => api.get('/api/admin/system-status'),
  getManagers: () => api.get('/api/admin/managers'),
  createManager: (data) => api.post('/api/admin/create-manager', data),
  deleteManager: (id) => api.delete(`/api/admin/managers/${id}`),
  getStaff: () => api.get('/api/admin/staff'),
  createStaff: (data) => api.post('/api/admin/create-staff', data),
  getResidents: () => api.get('/api/admin/residents'),
  getEntryLogs: () => api.get('/api/admin/entry-logs'),
  getPendingResidents: () => api.get('/api/admin/pending-residents'),
  approveResident: (id, data) => api.post('/api/admin/approve-resident', { userId: id, ...data }),
  getEmergencyContacts: () => api.get('/api/admin/emergency-contacts'),
  getGlobalResidents: () => api.get('/api/admin/global-residents'),
  getGlobalStaff: () => api.get('/api/admin/global-staff'),
  // Society Admin management (super_admin only)
  getAdmins: () => api.get('/api/admin/admins'),
  createAdmin: (data) => api.post('/api/admin/create-admin', data),
  deleteAdmin: (id) => api.delete(`/api/admin/admins/${id}`),
  // Admin's own society dashboard (single rich endpoint)
  getAdminDashboard: () => api.get('/api/admin/admin-dashboard'),
};

// ── Emergency Contacts (Manager) ─────────────────────────────
export const emergencyAPI = {
  getAll: () => api.get('/api/manager/emergency-contacts'),
  create: (data) => api.post('/api/manager/emergency-contacts', data),
  update: (id, data) => api.put(`/api/manager/emergency-contacts/${id}`, data),
  delete: (id) => api.delete(`/api/manager/emergency-contacts/${id}`),
};

// ── Community Features (Polls, Chores, Comments, Daily Helpers) ──
export const communityAPI = {
  getPosts: () => api.get('/api/community/posts'),
  createPost: (data) => api.post('/api/community/posts', data),
  toggleLike: (postId) => api.post(`/api/community/posts/${postId}/like`),
  addComment: (postId, text) => api.post(`/api/community/posts/${postId}/comments`, { text }),
  votePoll: (postId, option) => api.post(`/api/community/posts/${postId}/vote`, { option }),
  
  getChores: () => api.get('/api/community/chores'),
  createChore: (text) => api.post('/api/community/chores', { text }),
  toggleChore: (id) => api.put(`/api/community/chores/${id}/toggle`),
  deleteChore: (id) => api.delete(`/api/community/chores/${id}`),
  
  getDailyHelpers: () => api.get('/api/community/daily-helpers'),
  getDirectory: () => api.get('/api/community/directory'),
};

export default api;
