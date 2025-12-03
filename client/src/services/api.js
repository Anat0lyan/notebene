import axios from 'axios';

// Use environment variable or default to direct API server URL
// In development, use direct URL to avoid proxy issues
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.DEV ? 'http://localhost:3000/api' : '/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000, // 10 seconds timeout
});

// Add token to requests if available
const token = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Handle errors
api.interceptors.response.use(
  response => response,
  error => {
    // Log error for debugging
    if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      console.error('❌ Не удалось подключиться к серверу. Убедитесь, что сервер запущен на порту 3000.');
      console.error('Ошибка:', error.message);
    } else if (error.response) {
      // Server responded with error status
      console.error('Ошибка сервера:', error.response.status, error.response.data);
    } else {
      console.error('Ошибка запроса:', error.message);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Log requests for debugging
api.interceptors.request.use(
  config => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  error => {
    console.error('Ошибка при отправке запроса:', error);
    return Promise.reject(error);
  }
);

export default api;

