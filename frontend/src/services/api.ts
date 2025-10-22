import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

// ✅ CONFIGURAÇÃO SEGURA DE URL
const getBaseURL = (): string => {
  // ✅ USAR VARIÁVEL DE AMBIENTE (VITE)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }

  // ✅ FALLBACK APENAS PARA DESENVOLVIMENTO LOCAL
  if (import.meta.env.DEV) {
    return 'http://localhost:3001'  // ✅ CORRIGIDO: Removido /api
  }

  // ✅ EM PRODUÇÃO, FORÇAR CONFIGURAÇÃO EXPLÍCITA
  throw new Error('VITE_API_URL deve estar configurado em produção')
}

// ✅ WHITELIST DE DOMÍNIOS PERMITIDOS - ATUALIZADO
const ALLOWED_DOMAINS = [
  'localhost',
  '127.0.0.1',
  '147.93.69.28',                    // ✅ SEU IP VPS
  'contask.canellahub.com.br',       // ✅ SEU SUBDOMÍNIO
  'canellahub.com.br'                // ✅ DOMÍNIO PRINCIPAL
]

const validateURL = (url: string): boolean => {
  try {
    const urlObj = new URL(url)
    return ALLOWED_DOMAINS.includes(urlObj.hostname)
  } catch {
    return false
  }
}

const baseURL = getBaseURL()

// ✅ VALIDAR URL ANTES DE USAR
if (!validateURL(baseURL)) {
  throw new Error(`Domínio não permitido: ${baseURL}`)
}

// ✅ FORÇAR HTTPS EM PRODUÇÃO - ATIVADO
if (import.meta.env.PROD && !baseURL.startsWith('https://')) {
  throw new Error('HTTPS é obrigatório em produção')
}

const api = axios.create({
  baseURL,
  timeout: 10000, // ✅ AUMENTADO PARA 10s (SSL pode demorar um pouco)
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // ✅ PARA COOKIES HTTPONLY
})

// ✅ RATE LIMITING TRACKER
let rateLimitExceeded = false
let retryCount = 0
const MAX_RETRIES = 3

// ✅ REQUEST INTERCEPTOR SEGURO
api.interceptors.request.use(
  (config) => {
    // ✅ LOG APENAS EM DEV E SEM DADOS SENSÍVEIS
    if (import.meta.env.DEV) {
      console.log(`📡 ${config.method?.toUpperCase()} ${config.url}`)
    }

    // ✅ ADICIONAR TOKEN DO LOCALSTORAGE
    const tokenData = localStorage.getItem('access_token')
    if (tokenData) {
      try {
        const token = JSON.parse(tokenData).value
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      } catch (error) {
        console.warn('⚠️ Token inválido no localStorage')
        localStorage.removeItem('access_token')
      }
    }

    return config
  },
  (error) => {
    console.error('❌ Request Error:', error.message)
    return Promise.reject(error)
  }
)

// ✅ RESPONSE INTERCEPTOR COM RETRY LOGIC
api.interceptors.response.use(
  (response) => {
    // ✅ RESET RETRY COUNT ON SUCCESS
    retryCount = 0
    rateLimitExceeded = false

    // ✅ LOG SUCCESS EM DEV
    if (import.meta.env.DEV && response.status >= 200 && response.status < 300) {
      console.log(`✅ ${response.status} ${response.config.url}`)
    }

    return response
  },
  async (error: AxiosError) => {
    const originalRequest: InternalAxiosRequestConfig | undefined = error.config

    // Cenário 1: O erro veio com uma resposta do servidor (ex: 4xx, 5xx)
    if (error.response) {
      const { status } = error.response;

      // RATE LIMITING (429)
      if (status === 429) {
        rateLimitExceeded = true;
        const retryAfter = error.response.headers['retry-after'];
        console.warn('🚨 Rate limit atingido:', {
          retryAfter: retryAfter ? `${retryAfter}s` : 'desconhecido',
          endpoint: originalRequest?.url,
        });

        // ✅ DISPATCH EVENT PARA UI MOSTRAR TOAST
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('rateLimitExceeded', { 
            detail: { retryAfter } 
          }));
        }
        return Promise.reject(error);
      }

      // TOKEN EXPIRADO (401)
      if (status === 401) {
        console.warn('🔐 Token expirado, fazendo logout...');
        
        // ✅ LIMPAR TODOS OS DADOS DE AUTH
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('refresh_token');
        
        // ✅ DISPATCH EVENT PARA LOGOUT GLOBAL
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('authExpired'));
        }
        
        // ✅ REDIRECT APENAS SE NÃO ESTIVER JÁ NO LOGIN
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      // ✅ FORBIDDEN (403)
      if (status === 403) {
        console.warn('🚫 Acesso negado');
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('accessDenied'));
        }
        return Promise.reject(error);
      }
    }

    // Cenário 2: Erro de rede ou erro de servidor (5xx) que merece nova tentativa
    if (
      originalRequest &&
      !originalRequest._retry &&
      retryCount < MAX_RETRIES &&
      (!error.response || error.response.status >= 500)
    ) {
      originalRequest._retry = true;
      retryCount++;

      console.log(`🔄 Tentativa ${retryCount}/${MAX_RETRIES} para ${originalRequest.url}`);

      // ✅ BACKOFF EXPONENCIAL COM JITTER
      const baseDelay = Math.pow(2, retryCount - 1) * 1000;
      const jitter = Math.random() * 500; // Adiciona randomness
      const delay = baseDelay + jitter;
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return api(originalRequest);
    }

    // Cenário 3: Log final para todos os outros erros
    console.error('❌ API Error:', {
      status: error.response?.status,
      message: error.message,
      url: error.config?.url,
      method: error.config?.method,
      timestamp: new Date().toISOString()
    });

    return Promise.reject(error);
  }
);

// ✅ FUNÇÃO PARA VERIFICAR STATUS DA API
export const checkAPIHealth = async (): Promise<boolean> => {
  try {
    const response = await api.get('/health') // ✅ SEM /api (já está no baseURL)
    return response.status === 200
  } catch (error) {
    console.warn('🏥 API Health check failed:', error)
    return false
  }
}

// ✅ FUNÇÃO PARA OBTER STATUS DE RATE LIMIT
export const isRateLimited = (): boolean => rateLimitExceeded

// ✅ FUNÇÃO PARA LIMPAR RATE LIMIT (útil para testes)
export const clearRateLimit = (): void => {
  rateLimitExceeded = false
  retryCount = 0
}

// ✅ FUNÇÃO PARA DEBUG (apenas em dev)
export const getAPIConfig = () => {
  if (import.meta.env.DEV) {
    return {
      baseURL,
      timeout: api.defaults.timeout,
      allowedDomains: ALLOWED_DOMAINS
    }
  }
  return null
}

export default api
