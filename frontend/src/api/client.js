import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('smart_doc_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthEndpoint = error.config.url.includes('/auth/login') || error.config.url.includes('/auth/register');
      if (!isAuthEndpoint) {
        localStorage.removeItem('smart_doc_token');
        localStorage.removeItem('smart_doc_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/profile', data),
  changePassword: (data) => api.post('/auth/change-password', data),
};

export const documentAPI = {
  upload: (formData, onProgress) =>
    api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    }),
  uploadMultiple: (formData, onProgress) =>
    api.post('/documents/upload-multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    }),
  list: (params) => api.get('/documents', { params }),
  search: (q) => api.get('/documents/search', { params: { q } }),
  getById: (id) => api.get(`/documents/${id}`),
  downloadUrl: (id) => `${API_BASE}/documents/${id}/download`,
  previewUrl: (id) => `${API_BASE}/documents/${id}/preview`,
  delete: (id) => api.delete(`/documents/${id}`),
  updateCategory: (id, category, notes) =>
    api.patch(`/documents/${id}/category`, { category, notes }),
  reclassify: (id) => api.post(`/documents/${id}/reclassify`),
};

export const analyticsAPI = {
  getOverview: () => api.get('/analytics/overview'),
  getCategories: () => api.get('/analytics/categories'),
  getActivity: (days = 30) => api.get('/analytics/activity', { params: { days } }),
  getRecentLogs: (limit = 10) => api.get('/analytics/recent', { params: { limit } }),
  getMetrics: () => api.get('/analytics/metrics'),
};

export const categoryAPI = {
  list: () => api.get('/categories'),
  getCategoryDocs: (category) => api.get(`/categories/${category}/documents`),
};

export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;
