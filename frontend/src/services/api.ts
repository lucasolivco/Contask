import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

// Adicionar este bloco para estender a tipagem do Axios
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
    return 'http://localhost:3001'
  }

  // ✅ EM PRODUÇÃO, FORÇAR CONFIGURAÇÃO EXPLÍCITA
  throw new Error('VITE_API_URL deve estar configurado em produção')
}

// ✅ WHITELIST DE DOMÍNIOS PERMITIDOS
const ALLOWED_DOMAINS = [
  'localhost',
  '127.0.0.1',
  // ✅ ADICIONAR SEU DOMÍNIO AQUI
  '147.93.69.28',
  'seudominio.com',
  'api.seudominio.com'
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

// ✅ FORÇAR HTTPS EM PRODUÇÃO
//if (import.meta.env.PROD && !baseURL.startsWith('https://')) {
//  throw new Error('HTTPS é obrigatório em produção')
//}

const api = axios.create({
  baseURL,
  timeout: 5000, // ✅ REDUZIDO DE 10s PARA 5s
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

    // ✅ ADICIONAR TOKEN DO HTTPONLY COOKIE (SE USANDO)
    // Token será enviado automaticamente via cookie
    // Não precisamos fazer nada aqui se usando httpOnly cookies

    // ✅ FALLBACK PARA LOCALSTORAGE (MENOS SEGURO)
    const tokenData = localStorage.getItem('access_token')
    // O token está dentro de um objeto JSON, como vimos na sua resposta
    const token = tokenData ? JSON.parse(tokenData).value : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
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

    // ✅ LOG APENAS ERROS OU STATUS IMPORTANTES
    if (response.status >= 400) {
      console.warn(`⚠️ ${response.status} ${response.config.url}`)
    }

    return response
  },
  // CORREÇÃO: Lógica reescrita para ser mais explícita para o TypeScript
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

        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('rateLimitExceeded', { detail: { retryAfter } }));
        }
        // Não tentar novamente, apenas rejeitar
        return Promise.reject(error);
      }

      // TOKEN EXPIRADO (401)
      if (status === 401) {
        console.warn('🔐 Token expirado, fazendo logout...');
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
	localStorage.removeItem('refresh_token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        // Não tentar novamente, apenas rejeitar
        return Promise.reject(error);
      }
    }

    // Cenário 2: Erro de rede ou erro de servidor (5xx) que merece nova tentativa
    if (
      originalRequest &&
      !originalRequest._retry &&
      retryCount < MAX_RETRIES &&
      // Condição: ou não houve resposta (erro de rede) ou o status foi 500+
      (!error.response || error.response.status >= 500)
    ) {
      originalRequest._retry = true;
      retryCount++;

      console.log(`🔄 Tentativa ${retryCount}/${MAX_RETRIES} para ${originalRequest.url}`);

      // BACKOFF EXPONENCIAL
      const delay = Math.pow(2, retryCount - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return api(originalRequest);
    }

    // Cenário 3: Log final para todos os outros erros
    console.error('❌ API Error:', {
      status: error.response?.status, // Optional chaining aqui é seguro apenas para o log
      message: error.message,
      url: error.config?.url,
      method: error.config?.method,
    });

    return Promise.reject(error);
  }
);

// ✅ FUNÇÃO PARA VERIFICAR STATUS DA API
export const checkAPIHealth = async (): Promise<boolean> => {
  try {
    await api.get('/api/health')
    return true
  } catch {
    return false
  }
}

// ✅ FUNÇÃO PARA OBTER STATUS DE RATE LIMIT
export const isRateLimited = (): boolean => rateLimitExceeded

export default api
