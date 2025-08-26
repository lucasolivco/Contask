// frontend/src/services/api.ts - OTIMIZAR COM CACHE
import axios from 'axios';

const getBaseURL = () => {
  const hostname = window.location.hostname;
  const port = 3001;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://localhost:${port}`;
  } else {
    return `http://${hostname}:${port}`;
  }
}

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ INTERCEPTOR MELHORADO COM MENOS LOGS
api.interceptors.request.use(
  (config) => {
    // ✅ LOG APENAS EM DESENVOLVIMENTO E SEM SPAM
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    // ✅ LOG APENAS ERROS OU REQUESTS IMPORTANTES
    if (response.status >= 400 || process.env.NODE_ENV === 'development') {
      console.log(`✅ ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    // ✅ LOG DETALHADO PARA RATE LIMITING
    if (error.response?.status === 429) {
      console.error('🚨 RATE LIMIT ATINGIDO:', {
        url: error.config?.url,
        retryAfter: error.response.headers['retry-after'],
        remaining: error.response.headers['x-ratelimit-remaining'],
        resetTime: error.response.headers['x-ratelimit-reset']
      });
    } else {
      console.error('❌ Response Error:', error.response?.status, error.response?.data);
    }
    return Promise.reject(error);
  }
);

// Adicionar token automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;