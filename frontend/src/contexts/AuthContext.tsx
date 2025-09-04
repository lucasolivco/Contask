// frontend/src/contexts/AuthContext.tsx - VERSÃO SEGURA

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { User } from '../types'
import api from '../services/api'

interface AuthContextType {
  user: User | null
  token: string | null
  login: (user: User, token: string, refreshToken?: string) => void
  logout: () => void
  refreshAuth: () => Promise<boolean>
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ✅ CONSTANTES DE SEGURANÇA
const TOKEN_KEY = 'access_token'
const USER_KEY = 'user_data'
const REFRESH_KEY = 'refresh_token'
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000 // 5 minutos antes de expirar

// ✅ FUNÇÃO PARA VERIFICAR SE TOKEN ESTÁ PRÓXIMO DO VENCIMENTO
const isTokenExpiringSoon = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const exp = payload.exp * 1000 // Converter para milliseconds
    const now = Date.now()
    return (exp - now) < TOKEN_REFRESH_THRESHOLD
  } catch {
    return true // Se não conseguir decodificar, considerar expirado
  }
}

// ✅ FUNÇÃO PARA VALIDAR TOKEN
const isTokenValid = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const exp = payload.exp * 1000
    return Date.now() < exp
  } catch {
    return false
  }
}

// ✅ STORAGE SEGURO (CONSIDERE MIGRAR PARA HTTPONLY COOKIES)
const secureStorage = {
  setItem: (key: string, value: string) => {
    try {
      // ✅ ADICIONAR TIMESTAMP PARA VALIDAÇÃO
      const data = {
        value,
        timestamp: Date.now()
      }
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error)
    }
  },

  getItem: (key: string): string | null => {
    try {
      const item = localStorage.getItem(key)
      if (!item) return null

      const data = JSON.parse(item)
      
      // ✅ VERIFICAR SE DADOS NÃO SÃO MUITO ANTIGOS (24h)
      const age = Date.now() - data.timestamp
      if (age > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(key)
        return null
      }

      return data.value
    } catch {
      localStorage.removeItem(key)
      return null
    }
  },

  removeItem: (key: string) => {
    localStorage.removeItem(key)
  },

  clear: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(REFRESH_KEY)
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const queryClient = useQueryClient()

  // ✅ FUNÇÃO PARA REFRESH TOKEN
  const refreshAuth = useCallback(async (): Promise<boolean> => {
    try {
      const refreshToken = secureStorage.getItem(REFRESH_KEY)
      if (!refreshToken) return false

      const response = await api.post('/api/auth/refresh', {
        refreshToken
      })

      const { user: newUser, accessToken, refreshToken: newRefreshToken } = response.data

      // ✅ ATUALIZAR TOKENS
      setUser(newUser)
      setToken(accessToken)
      
      secureStorage.setItem(TOKEN_KEY, accessToken)
      secureStorage.setItem(USER_KEY, JSON.stringify(newUser))
      
      if (newRefreshToken) {
        secureStorage.setItem(REFRESH_KEY, newRefreshToken)
      }

      console.log('✅ Token refreshed successfully')
      return true
    } catch (error) {
      console.error('❌ Failed to refresh token:', error)
      logout()
      return false
    }
  }, [])

  // ✅ VERIFICAR AUTO-REFRESH
  useEffect(() => {
    if (!token) return

    const checkTokenExpiration = () => {
      if (isTokenExpiringSoon(token)) {
        console.log('🔄 Token expiring soon, refreshing...')
        refreshAuth()
      }
    }

    // ✅ VERIFICAR A CADA 1 MINUTO
    const interval = setInterval(checkTokenExpiration, 60 * 1000)
    
    return () => clearInterval(interval)
  }, [token, refreshAuth])

  // ✅ RESTAURAR SESSÃO AO CARREGAR
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedToken = secureStorage.getItem(TOKEN_KEY)
        const savedUser = secureStorage.getItem(USER_KEY)

        if (savedToken && savedUser) {
          // ✅ VERIFICAR SE TOKEN É VÁLIDO
          if (!isTokenValid(savedToken)) {
            console.log('🔄 Token expired, trying to refresh...')
            const refreshed = await refreshAuth()
            
            if (!refreshed) {
              console.log('❌ Cannot refresh token, logging out')
              secureStorage.clear()
            }
            return
          }

          try {
            const parsedUser = JSON.parse(savedUser)
            
            // ✅ VERIFICAR EMAIL VERIFICADO
            if (parsedUser.emailVerified !== false) {
              setToken(savedToken)
              setUser(parsedUser)
              console.log('✅ Session restored:', parsedUser.email)

              // ✅ VERIFICAR SE PRECISA REFRESH
              if (isTokenExpiringSoon(savedToken)) {
                refreshAuth()
              }
            } else {
              console.log('⚠️ Email not verified, clearing session')
              secureStorage.clear()
            }
          } catch (error) {
            console.error('❌ Error parsing user data:', error)
            secureStorage.clear()
          }
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error)
        secureStorage.clear()
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [refreshAuth])

  const login = useCallback((userData: User, userToken: string, refreshToken?: string) => {
    console.log('🔑 Logging in user:', userData.email)
    
    // ✅ VALIDAR TOKEN ANTES DE SALVAR
    if (!isTokenValid(userToken)) {
      console.error('❌ Invalid token provided')
      throw new Error('Token inválido')
    }

    queryClient.clear()
    setUser(userData)
    setToken(userToken)
    
    secureStorage.setItem(USER_KEY, JSON.stringify(userData))
    secureStorage.setItem(TOKEN_KEY, userToken)
    
    if (refreshToken) {
      secureStorage.setItem(REFRESH_KEY, refreshToken)
    }
    
    console.log('✅ Login completed')
  }, [queryClient])

  const logout = useCallback(() => {
    console.log('🚪 Logging out...')
    
    // ✅ CHAMAR ENDPOINT DE LOGOUT NO BACKEND
    if (token) {
      api.post('/api/auth/logout').catch(() => {
        // ✅ IGNORAR ERRO - LOGOUT LOCAL MESMO ASSIM
      })
    }
    
    setUser(null)
    setToken(null)
    secureStorage.clear()
    queryClient.clear()
    queryClient.invalidateQueries()
    
    console.log('✅ Logout completed')
  }, [token, queryClient])

  // ✅ LISTENER PARA RATE LIMIT
  useEffect(() => {
    const handleRateLimit = () => {
      console.warn('🚨 Rate limit exceeded - consider logging out')
      // ✅ OPCIONAL: LOGOUT AUTOMÁTICO EM RATE LIMIT EXCESSIVO
    }

    window.addEventListener('rateLimitExceeded', handleRateLimit)
    return () => window.removeEventListener('rateLimitExceeded', handleRateLimit)
  }, [])

  const value = {
    user,
    token,
    login,
    logout,
    refreshAuth,
    isLoading,
    isAuthenticated: !!user && !!token
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}