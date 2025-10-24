// App.tsx - OTIMIZADO COM VERIFICAÇÃO POR EMAIL
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'

import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import DashboardLayout from './layouts/DashboardLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import CreateTask from './pages/CreateTask'
import Employees from './pages/Employees'
import Notifications from './pages/Notifications'
import EditTask from './pages/EditTask'

// ✅ PÁGINAS DE VERIFICAÇÃO DE EMAIL
import VerifyEmailSent from './pages/VerifyEmailSent'
import VerifyEmail from './pages/VerifyEmail'
import SsoLoginPage from './pages/SsoLoginPage' // ✅ NOVA: Importar página SSO

import ForgotPassword from './pages/ForgotPassword'  // ✅ NOVA
import ResetPassword from './pages/ResetPassword'   

import Calendar from './pages/Calendar' // ✅ ADICIONAR IMPORT

// ✅ QUERYCLIENT CORRIGIDO
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 2 * 60 * 1000, // 2 minutos
      gcTime: 5 * 60 * 1000, // ✅ gcTime ao invés de cacheTime
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchInterval: false,
    },
    mutations: {
      retry: 1,
    }
  },
})

// ✅ LOADING COMPONENT REUTILIZÁVEL COM DARK MODE
const LoadingScreen: React.FC<{ message?: string }> = ({ message = "Carregando..." }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50 dark:from-slate-900 dark:to-slate-800">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 dark:border-cyan-500 mx-auto"></div>
      <p className="mt-4 text-rose-600 dark:text-cyan-400 font-medium">{message}</p>
    </div>
  </div>
)

// ✅ PROTECTED ROUTE MELHORADO
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen message="Verificando autenticação..." />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // ✅ VERIFICAR SE EMAIL FOI CONFIRMADO (OPCIONAL - PARA SEGURANÇA EXTRA)
  if (user.emailVerified === false) {
    return <Navigate to="/verify-email-sent" state={{ email: user.email, name: user.name }} replace />
  }

  return <>{children}</>
}

// ✅ PUBLIC ROUTE MELHORADO
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen message="Carregando aplicação..." />
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

// ✅ SEMI-PROTECTED ROUTE (PARA PÁGINAS DE VERIFICAÇÃO)
const SemiProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  // Permite acesso mesmo sem login (para verificação de email de novos usuários)
  return <>{children}</>
}

// ✅ NOT FOUND PAGE MELHORADA COM DARK MODE
const NotFoundPage: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50 dark:from-slate-900 dark:to-slate-800">
    <div className="text-center space-y-6">
      <div className="text-9xl">🔍</div>
      <div>
        <h1 className="text-6xl font-bold text-gray-900 dark:text-slate-100 mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-rose-600 dark:text-rose-400 mb-4">Página não encontrada</h2>
        <p className="text-gray-600 dark:text-slate-400 mb-8">A página que você está procurando não existe.</p>
      </div>
      <div className="space-x-4">
        <button
          onClick={() => window.history.back()}
          className="px-6 py-3 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-lg font-medium hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors"
        >
          ← Voltar
        </button>
        <a
          href="/dashboard"
          className="px-6 py-3 bg-rose-500 dark:bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-600 dark:hover:bg-rose-700 transition-colors"
        >
          🏠 Ir ao Dashboard
        </a>
      </div>
    </div>
  </div>
)

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            {/* ✅ TOASTER OTIMIZADO COM DARK MODE */}
            <Toaster
              position="top-right"
              richColors
              closeButton
              theme="system"
              duration={4000}
            />
          
          <Routes>
            {/* ✅ REDIRECIONAMENTO PRINCIPAL */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* ✅ ROTAS PÚBLICAS (LOGIN/REGISTER) */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } 
            />
            
            {/* ✅ ROTAS DE VERIFICAÇÃO DE EMAIL (SEMI-PROTEGIDAS) */}
            <Route 
              path="/verify-email-sent" 
              element={
                <SemiProtectedRoute>
                  <VerifyEmailSent />
                </SemiProtectedRoute>
              } 
            />
            <Route 
              path="/verify-email" 
              element={
                <SemiProtectedRoute>
                  <VerifyEmail />
                </SemiProtectedRoute>
              } 
            />
            <Route 
              path="/forgot-password" 
              element={
                <SemiProtectedRoute>
                  <ForgotPassword />
                </SemiProtectedRoute>
              }
            />
            <Route 
              path="/reset-password" 
              element={
                <SemiProtectedRoute>
                  <ResetPassword />
                </SemiProtectedRoute>
              }
            />
            {/* ✅ NOVA: Rota para login automático vindo do Hub */}
            <Route
              path="/sso-login"
              element={
                <SemiProtectedRoute>
                  <SsoLoginPage />
                </SemiProtectedRoute>
              }
            />
            {/* ✅ ROTA ISOLADA PARA EDIÇÃO (FORA DO LAYOUT) */}
            <Route 
              path="/tasks/:id/edit" 
              element={
                <ProtectedRoute>
                  <EditTask />
                </ProtectedRoute>
              } 
            />
            
            {/* ✅ ROTAS PROTEGIDAS COM LAYOUT */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="tasks/create" element={<CreateTask />} />
              <Route path="calendar" element={<Calendar />} /> {/* ✅ NOVA ROTA */}
              <Route path="employees" element={<Employees />} />
              <Route path="notifications" element={<Notifications />} />
            </Route>
            
            {/* ✅ PÁGINA 404 MELHORADA */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App