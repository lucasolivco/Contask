// frontend/src/services/api.ts - DETECTAR AUTOMATICAMENTE
import axios from 'axios';

// ✅ DETECTAR AUTOMATICAMENTE O AMBIENTE
const getBaseURL = () => {
  const hostname = window.location.hostname;
  const port = 3001;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://localhost:${port}`; // Desenvolvimento local
  } else {
    return `http://${hostname}:${port}`; // Rede local - usar mesmo IP do frontend
  }
}

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ INTERCEPTOR PARA LOGS (REMOVER EM PRODUÇÃO)
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', error.response?.status, error.response?.data);
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