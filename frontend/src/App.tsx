// App.tsx - O "cérebro" principal da aplicação
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'

// Importa nossos contextos e páginas
import { AuthProvider, useAuth } from './contexts/AuthContext'
import DashboardLayout from './layouts/DashboardLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import CreateTask from './pages/CreateTask'

// Cria um cliente para gerenciar requisições da API
// É como um "correio central" que organiza todas as chamadas para o backend
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Se der erro, tenta mais 1 vez
      staleTime: 5 * 60 * 1000, // Dados ficam "frescos" por 5 minutos
    },
  },
})

// Componente que protege rotas privadas
// É como um "porteiro" que só deixa entrar quem está logado
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth()

  // Se ainda está carregando os dados do usuário, mostra tela de loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Se não tem usuário logado, redireciona para login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Se está logado, mostra o conteúdo
  return <>{children}</>
}

// Componente que redireciona usuários logados
// É como um "redirecionador" - se já está logado, vai direto para o dashboard
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Se já está logado, redireciona para dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  // Se não está logado, mostra a página (login/register)
  return <>{children}</>
}

function App() {
  return (
    // QueryClientProvider: Fornece o "correio central" para toda a aplicação
    <QueryClientProvider client={queryClient}>
      {/* AuthProvider: Fornece informações de autenticação para toda a aplicação */}
      <AuthProvider>
        {/* BrowserRouter: Habilita navegação entre páginas */}
        <BrowserRouter>
          {/* Toaster: Sistema de notificações (toasts) */}
          <Toaster 
            position="top-right" 
            richColors 
            closeButton
          />
          
          {/* Routes: Define todas as rotas da aplicação */}
          <Routes>
            {/* Rota raiz - redireciona para dashboard se logado, senão para login */}
            <Route 
              path="/" 
              element={<Navigate to="/dashboard" replace />} 
            />
            
            {/* Rotas públicas (só para quem NÃO está logado) */}
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
            
            {/* Rotas privadas (só para quem está logado) */}
            {/* Todas ficam dentro do DashboardLayout (sidebar + header) */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              {/* Subrotas que aparecem dentro do layout */}
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="tasks/create" element={<CreateTask />} />
              {/* TODO: Adicionar mais rotas conforme criamos as páginas */}
            </Route>
            
            {/* Rota 404 - para páginas que não existem */}
            <Route 
              path="*" 
              element={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900">404</h1>
                    <p className="text-gray-600">Página não encontrada</p>
                  </div>
                </div>
              } 
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App