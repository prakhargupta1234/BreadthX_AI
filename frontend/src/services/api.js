import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8000';
//const BASE_URL = 'http://127.0.0.1:54389';


const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ───────────────────────────────────────────────────────────────────
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/me'),
};

// ── Prediction ─────────────────────────────────────────────────────────────
export const predictAPI = {
  predict: (formData) =>
    api.post('/predict', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ── History ────────────────────────────────────────────────────────────────
export const historyAPI = {
  getAll: () => api.get('/history/'),
  deleteOne: (id) => api.delete(`/history/${id}`),
};

export default api;
