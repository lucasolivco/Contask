// frontend/src/pages/Employees.tsx - CORRIGIDO TYPESCRIPT
import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Users, 
  Mail, 
  CheckSquare, 
  Clock, 
  AlertTriangle,
  Eye,
  Search,
  Filter,
  RotateCcw,
  User,
  TrendingUp,
  Zap
} from 'lucide-react'

import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import EmployeeDetailsModal from '../components/employees/EmployeeDetailsModal'
import { getEmployees, getEmployeeDetails } from '../services/taskService'
import { useAuth } from '../contexts/AuthContext'
import type { Task, EmployeeDetailsResponse, EmployeeDetailsStats, UserDetailsApiResponse } from '../types' // ✅ ADICIONAR IMPORTS

// ✅ INTERFACE TIPADA CORRETAMENTE
interface UserFromAPI {
  id: string
  name: string
  email: string
  role: 'MANAGER' | 'EMPLOYEE'
  _count: {
    assignedTasks: number
  }
}

// ✅ INTERFACE PARA RESPONSE DA API
interface UsersApiResponse {
  employees?: UserFromAPI[]
  users?: UserFromAPI[]
  managers?: UserFromAPI[]
  stats?: {
    totalUsers: number
    totalManagers: number
    totalEmployees: number
  }
}

const Employees: React.FC = () => {
  const { user: currentUser } = useAuth()
  const [selectedEmployee, setSelectedEmployee] = useState<UserFromAPI | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'low-tasks'>('all')
  const [filterRole, setFilterRole] = useState<'ALL' | 'MANAGER' | 'EMPLOYEE'>('ALL')

  // ✅ QUERY TIPADA CORRETAMENTE
  const { data: usersData, isLoading, error } = useQuery<UsersApiResponse>({
    queryKey: ['users', 'all'],
    queryFn: getEmployees,
    staleTime: 1000 * 60 * 5,
    retry: 2
  })

  // ✅ GARANTIR COMPATIBILIDADE COM VERIFICAÇÃO DE TIPOS
  const allUsers: UserFromAPI[] = useMemo(() => {
    if (!usersData) return []
    
    // Se o backend retornar o novo formato com 'users'
    if (usersData.users && Array.isArray(usersData.users)) {
      return usersData.users
    }
    
    // Se retornar apenas 'employees' (formato antigo), incluir managers se existirem
    if (usersData.employees && Array.isArray(usersData.employees)) {
      const employees = usersData.employees
      const managers = (usersData.managers && Array.isArray(usersData.managers)) ? usersData.managers : []
      return [...managers, ...employees]
    }
    
    return []
  }, [usersData])

  const stats = usersData?.stats

  // ✅ FILTRAR COM TIPAGEM CORRETA
  const filteredUsers = useMemo(() => {
    let filtered = allUsers

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter((user: UserFromAPI) => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por role
    if (filterRole === 'MANAGER') {
      filtered = filtered.filter((user: UserFromAPI) => user.role === 'MANAGER')
    } else if (filterRole === 'EMPLOYEE') {
      filtered = filtered.filter((user: UserFromAPI) => user.role === 'EMPLOYEE')
    }

    // Filtro por status
    if (statusFilter === 'active') {
      filtered = filtered.filter((user: UserFromAPI) => user._count.assignedTasks > 0)
    } else if (statusFilter === 'low-tasks') {
      filtered = filtered.filter((user: UserFromAPI) => user._count.assignedTasks <= 2)
    }

    return filtered
  }, [allUsers, searchTerm, filterRole, statusFilter])

  // ✅ SEPARAR POR TIPO COM TIPAGEM
  const managersFiltered = filteredUsers.filter((u: UserFromAPI) => u.role === 'MANAGER')
  const employeesFiltered = filteredUsers.filter((u: UserFromAPI) => u.role === 'EMPLOYEE')

  const handleViewEmployee = (employee: UserFromAPI) => {
    setSelectedEmployee(employee)
    setIsDetailsModalOpen(true)
  }

  const handleCloseDetails = () => {
    setIsDetailsModalOpen(false)
    setSelectedEmployee(null)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setFilterRole('ALL')
  }

  // ✅ COMPONENTE CARD TIPADO CORRETAMENTE
  const UserCard: React.FC<{ 
    user: UserFromAPI
    index: number 
  }> = ({ user, index }) => {
    const totalTasks = user._count.assignedTasks
    const isCurrentUser = currentUser?.id === user.id
    
    // ✅ QUERY TIPADA COM O TIPO CORRETO
    const { data: userDetails, isLoading: detailsLoading, error: detailsError } = useQuery<UserDetailsApiResponse>({
      queryKey: ['user-details', user.id],
      queryFn: () => getEmployeeDetails(user.id),
      enabled: totalTasks > 0,
      staleTime: 1000 * 60 * 5,
      retry: 1
    })

    // ✅ CALCULAR ESTATÍSTICAS COM VERIFICAÇÃO SEGURA
    const realStats = useMemo(() => {
      if (detailsError || !userDetails || !userDetails.tasks || !Array.isArray(userDetails.tasks) || totalTasks === 0) {
        return { completed: 0, inProgress: 0, pending: 0, overdue: 0, completionRate: 0 }
      }

      const tasks: Task[] = userDetails.tasks
      const now = new Date()
      
      const completed = tasks.filter((t: Task) => t.status === 'COMPLETED').length
      const inProgress = tasks.filter((t: Task) => t.status === 'IN_PROGRESS').length
      const pending = tasks.filter((t: Task) => t.status === 'PENDING').length
      const overdue = tasks.filter((t: Task) => 
        t.dueDate && 
        new Date(t.dueDate) < now && 
        ['PENDING', 'IN_PROGRESS'].includes(t.status)
      ).length

      const completionRate = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0

      return { completed, inProgress, pending, overdue, completionRate }
    }, [userDetails, totalTasks, detailsError])

    return (
      <Card 
        className={`group hover:shadow-xl transition-all duration-300 cursor-pointer border-l-4 h-full ${
          user.role === 'MANAGER' 
            ? 'border-l-blue-500 hover:border-l-blue-600' 
            : 'border-l-emerald-500 hover:border-l-emerald-600'
        }`}
        onClick={() => handleViewEmployee(user)}
      >
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 h-full flex flex-col">
          {/* ✅ HEADER SEM COROA - PRIMEIRA LETRA PARA TODOS */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start space-x-3 min-w-0 flex-1">
              <div className="relative flex-shrink-0">
                <div className={`h-12 w-12 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 ${
                  user.role === 'MANAGER' 
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                    : 'bg-gradient-to-br from-emerald-500 to-green-600'
                }`}>
                  {/* ✅ SEMPRE PRIMEIRA LETRA - SEM COROA */}
                  <span className="text-lg sm:text-2xl font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-white ${
                  totalTasks > 0 ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {user.name}
                  {isCurrentUser && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      Você
                    </span>
                  )}
                </h3>
                <div className="flex items-center text-xs sm:text-sm text-gray-600 mt-1">
                  <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                
                {/* ✅ BADGES SEM COROA */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === 'MANAGER' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    <User className="h-3 w-3 mr-1" />
                    <span className="hidden xs:inline">
                      {user.role === 'MANAGER' ? 'Manager' : 'Usuário'}
                    </span>
                    <span className="xs:hidden">
                      {user.role === 'MANAGER' ? 'Mgr' : 'Colab'}
                    </span>
                  </span>
                  {totalTasks > 0 && (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      realStats.completionRate >= 80 ? 'bg-green-100 text-green-700' :
                      realStats.completionRate >= 50 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {realStats.completionRate}%
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation()
                handleViewEmployee(user)
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>

          {/* Estatísticas */}
          <div className="space-y-3 sm:space-y-4 flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-700">Tarefas Atribuídas</h4>
              <span className="text-xl sm:text-2xl font-bold text-gray-900">{totalTasks}</span>
            </div>
            
            {totalTasks > 0 ? (
              <>
                {/* Barra de progresso */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Taxa de Conclusão</span>
                    <span>{realStats.completionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        realStats.completionRate >= 80 ? 'bg-green-500' : 
                        realStats.completionRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.max(realStats.completionRate, 5)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Grid de estatísticas */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="text-center p-2 sm:p-3 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex items-center justify-center mb-1">
                      <CheckSquare className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                    </div>
                    <p className="text-sm sm:text-lg font-bold text-green-700">{realStats.completed}</p>
                    <p className="text-xs text-green-600 hidden sm:block">Concluídas</p>
                    <p className="text-xs text-green-600 sm:hidden">✓</p>
                  </div>
                  
                  <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-center mb-1">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                    </div>
                    <p className="text-sm sm:text-lg font-bold text-blue-700">{realStats.inProgress}</p>
                    <p className="text-xs text-blue-600 hidden sm:block">Em Progresso</p>
                    <p className="text-xs text-blue-600 sm:hidden">→</p>
                  </div>

                  <div className="text-center p-2 sm:p-3 bg-red-50 rounded-lg border border-red-100">
                    <div className="flex items-center justify-center mb-1">
                      <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                    </div>
                    <p className="text-sm sm:text-lg font-bold text-red-700">{realStats.overdue}</p>
                    <p className="text-xs text-red-600 hidden sm:block">Atrasadas</p>
                    <p className="text-xs text-red-600 sm:hidden">!</p>
                  </div>
                </div>

                {/* ✅ INDICADORES TIPADOS */}
                {detailsLoading && (
                  <div className="text-center py-2">
                    <div className="text-xs text-gray-500">Carregando estatísticas...</div>
                  </div>
                )}
                
                {detailsError && (
                  <div className="text-center py-2">
                    <div className="text-xs text-orange-500">
                      ⚠️ Estatísticas indisponíveis
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4 sm:py-6 bg-gray-50 rounded-lg border border-gray-200">
                <User className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs sm:text-sm text-gray-500 font-medium">Sem tarefas atribuídas</p>
                <p className="text-xs text-gray-400 hidden sm:block">
                  {user.role === 'MANAGER' ? 'Pode criar tarefas para a equipe' : 'Disponível para novas atribuições'}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 sm:pt-4 border-t border-gray-100 mt-auto">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500 hidden sm:block">
                Clique para ver detalhes
              </div>
              <div className="flex items-center gap-1 text-xs text-blue-600 font-medium ml-auto">
                <TrendingUp className="h-3 w-3" />
                <span className="hidden sm:inline">Ver Performance</span>
                <span className="sm:hidden">Detalhes</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <Card className="text-center py-12 border-red-200 bg-red-50">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Erro ao carregar equipe</h3>
          <p className="text-red-600">Tente novamente em alguns instantes</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4">
          <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg">
            <Users className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">Equipe</h1>
            <p className="text-gray-600 text-sm sm:text-lg">
              Gerencie toda sua equipe
            </p>
          </div>
        </div>
        
        {/* Estatísticas */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-blue-500" />
            <span>{managersFiltered.length} managers</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-500" />
            <span>{employeesFiltered.length} usuários</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{allUsers.length} total</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card className="bg-gray-50 border-gray-200">
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                />
              </div>
            </div>
            
            <div className="md:w-48">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as typeof filterRole)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">Todos os Usuários</option>
                <option value="MANAGER">Apenas Managers</option>
                <option value="EMPLOYEE">Apenas Colaboradores</option>
              </select>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'Todos', shortLabel: 'Todos', count: filteredUsers.length },
                { key: 'active', label: 'Ativos', shortLabel: 'Ativos', count: filteredUsers.filter((u: UserFromAPI) => u._count.assignedTasks > 0).length },
                
              ].map(({ key, label, shortLabel, count }) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key as any)}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    statusFilter === key
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{shortLabel}</span>
                  <span className="ml-1">({count})</span>
                </button>
              ))}
              
              {(searchTerm || statusFilter !== 'all' || filterRole !== 'ALL') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          {filteredUsers.length !== allUsers.length && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
              <Filter className="h-4 w-4" />
              <span>
                {filteredUsers.length} de {allUsers.length} usuários
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Lista separada por tipo */}
      <div className="space-y-8">
        {/* MANAGERS */}
        {managersFiltered.length > 0 && (filterRole === 'ALL' || filterRole === 'MANAGER') && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-900">
                Managers ({managersFiltered.length})
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {managersFiltered.map((user: UserFromAPI, index: number) => (
                <div 
                  key={user.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <UserCard user={user} index={index} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FUNCIONÁRIOS */}
        {employeesFiltered.length > 0 && (filterRole === 'ALL' || filterRole === 'EMPLOYEE') && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-emerald-500" />
              <h2 className="text-xl font-semibold text-gray-900">
                Usuários ({employeesFiltered.length})
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {employeesFiltered.map((user: UserFromAPI, index: number) => (
                <div 
                  key={user.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${(managersFiltered.length + index) * 0.1}s` }}
                >
                  <UserCard user={user} index={managersFiltered.length + index} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 sm:h-80 bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredUsers.length === 0 && (
        <Card className="text-center py-12 sm:py-16">
          <div className="max-w-md mx-auto px-4">
            <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-6">
              <Users className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
              {searchTerm || statusFilter !== 'all' || filterRole !== 'ALL'
                ? 'Nenhum usuário encontrado' 
                : 'Nenhum usuário cadastrado'
              }
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
              {searchTerm || statusFilter !== 'all' || filterRole !== 'ALL'
                ? 'Tente ajustar os filtros de busca'
                : 'Aguarde novos usuários se cadastrarem no sistema'
              }
            </p>
            {(searchTerm || statusFilter !== 'all' || filterRole !== 'ALL') && (
              <Button onClick={clearFilters} className="mt-4">
                <RotateCcw className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Modal de Detalhes */}
      {selectedEmployee && (
        <EmployeeDetailsModal
          employee={selectedEmployee}
          isOpen={isDetailsModalOpen}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  )
}

export default Employees