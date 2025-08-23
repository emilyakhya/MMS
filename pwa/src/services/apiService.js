import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Authentication
  login: async (email, password) => {
    const response = await api.post('/login', {
      email,
      password
    });
    return response.data;
  },

  // Barcode scanning
  scanBarcode: async (barcodeId) => {
    const formData = new FormData();
    formData.append('barcode_id', barcodeId);
    
    const response = await api.post('/scan', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Pill counting
  countPills: async (imageFile) => {
    const formData = new FormData();
    formData.append('file', imageFile);
    
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Submit count
  submitCount: async (data) => {
    const response = await api.post('/submit', data);
    return response.data;
  },

  // Get history
  getHistory: async (filters = {}) => {
    const response = await api.get('/records', { params: filters });
    return response.data;
  },

  // Get statistics
  getStats: async () => {
    const response = await api.get('/records');
    return response.data;
  },

  // Export data
  exportData: async (filters = {}) => {
    const response = await api.get('/export/csv', { 
      params: filters,
      responseType: 'blob'
    });
    return response.data;
  },
};
