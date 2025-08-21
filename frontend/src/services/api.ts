// Configuração para "conversar" com nosso backend
import axios from 'axios'

// Cria um "telefone" para falar com o backend

const api = axios.create({
    baseURL: 'http://localhost:3001/api', // URL base do backend
    timeout: 10000, // Tempo máximo de espera por uma resposta
    headers: {
        'Content-Type': 'application/json'
    }
})

// "Interceptor" - como um secretário que adiciona informações automáticas
api.interceptors.request.use((config) => {
    // Busca o token salvo no navegador
    const token = localStorage.getItem('token')

    if (token) {
        // Adiciona o token em todas as requisições (como mostrar o crachá)
        config.headers.authorization = `Bearer ${token}`
    }

    return config // Continua com a requisição

}, (error) => {
    // Se der erro, mostra uma mensagem
    console.error('Erro na requisição:', error)
    return Promise.reject(error) // Rejeita a promessa com o erro
})

// Interceptor para lidar com respostas
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api // Exporta o "telefone" para ser usado em outros lugares
