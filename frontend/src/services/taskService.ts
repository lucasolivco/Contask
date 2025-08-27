// frontend/src/services/taskService.ts - CORRIGIDO
import api from './api'
import type { Task, CreateTaskForm, TaskFilter, TaskResponse, EmployeesResponse, UserDetailsResponse } from '../types'

// ✅ NOVA INTERFACE PARA USUÁRIOS ATRIBUÍVEIS
export interface AssignableUsersResponse {
  assignableUsers: Array<{
    id: string
    name: string
    email: string
    role: 'MANAGER' | 'EMPLOYEE'
    isCurrentUser: boolean
    activeTasks: number
    category: 'self' | 'manager' | 'employee'
  }>
  categories: {
    self: Array<{
      id: string
      name: string
      email: string
      role: 'MANAGER' | 'EMPLOYEE'
      isCurrentUser: true
      activeTasks: number
    }>
    managers: Array<{
      id: string
      name: string
      email: string
      role: 'MANAGER'
      isCurrentUser: false
      activeTasks: number
    }>
    employees: Array<{
      id: string
      name: string
      email: string
      role: 'EMPLOYEE'
      isCurrentUser: false
      activeTasks: number
    }>
  }
  stats: {
    totalUsers: number
    totalManagers: number
    totalEmployees: number
  }
}

// ✅ NOVA INTERFACE PARA TAREFAS ATRIBUÍDAS A MIM
export interface MyAssignedTasksResponse {
  tasks: Array<Task & {
    canEdit: boolean
    canChangeStatus: boolean
    canDelete: boolean
    isCreator: boolean
    isAssigned: boolean
  }>
}

// ✅ BUSCAR USUÁRIOS PARA ATRIBUIÇÃO (MANAGERS + EMPLOYEES)
export const getAssignableUsers = async (): Promise<AssignableUsersResponse> => {
  console.log('🔍 taskService: Buscando usuários atribuíveis')
  const response = await api.get('/api/tasks/assignable-users')
  console.log('✅ taskService: Usuários recebidos:', response.data)
  return response.data
}

// ✅ BUSCAR TAREFAS ATRIBUÍDAS A MIM (para managers que receberam tarefas)
// ✅ ADICIONAR NOVA FUNÇÃO PARA TAREFAS ATRIBUÍDAS
export const getMyAssignedTasks = async (): Promise<{ tasks: Task[] }> => {
  try {
    const response = await api.get('/api/tasks/assigned-to-me')
    return {
      tasks: Array.isArray(response.data.tasks) ? response.data.tasks : []
    }
  } catch (error: any) {
    console.error('Erro ao buscar tarefas atribuídas:', error)
    return { tasks: [] }
  }
}

// ✅ MODIFICAR getTasks PARA INCLUIR PERMISSÕES
export const getTasks = async (filters?: TaskFilter): Promise<{
  tasks: Array<Task & {
    canEdit?: boolean
    canChangeStatus?: boolean
    canDelete?: boolean
    isCreator?: boolean
    isAssigned?: boolean
  }>
}> => {
    const params = new URLSearchParams();

    if (filters?.status && filters.status !== 'all') {
        params.append('status', filters.status)
    }
    
    if (filters?.priority && filters.priority !== 'all') {
        params.append('priority', filters.priority)
    }
    
    if (filters?.search && filters.search.trim()) {
        params.append('search', filters.search)
    }
    
    if (filters?.assignedToId && filters.assignedToId !== 'all') {
        params.append('assignedToId', filters.assignedToId)
    }
    
    if (filters?.dueDate) {
        params.append('dueDate', filters.dueDate)
    }

    if (filters?.dueDateMonth) {
        params.append('dueDateMonth', filters.dueDateMonth.toString())
    }
    
    if (filters?.dueDateYear) {
        params.append('dueDateYear', filters.dueDateYear.toString())
    }
    
    if (filters?.overdue) {
        params.append('overdue', 'true')
    }
    
    const queryString = params.toString()
    const url = queryString ? `/api/tasks?${queryString}` : '/api/tasks'
    
    console.log('🚀 taskService chamando URL:', url)
    console.log('🚀 taskService com filtros:', filters)
    
    const response = await api.get(url);
    return response.data;
}

// ✅ FUNÇÃO CORRIGIDA PARA BUSCAR TODOS OS USUÁRIOS
export const getEmployees = async (): Promise<{
  employees: Array<{
    id: string
    name: string
    email: string
    role: 'MANAGER' | 'EMPLOYEE'
    _count: {
      assignedTasks: number
    }
  }>
  users: Array<{
    id: string
    name: string
    email: string
    role: 'MANAGER' | 'EMPLOYEE'
    _count: {
      assignedTasks: number
    }
  }>
  managers: Array<{
    id: string
    name: string
    email: string
    role: 'MANAGER'
    _count: {
      assignedTasks: number
    }
  }>
  stats: {
    totalUsers: number
    totalManagers: number
    totalEmployees: number
  }
}> => {
    try {
      console.log('🔍 taskService: Buscando todos os usuários (managers + employees)')
      
      // ✅ TENTAR PRIMEIRO O ENDPOINT PARA USUÁRIOS ATRIBUÍVEIS
      const response = await api.get('/api/tasks/assignable-users')
      console.log('✅ taskService: Resposta recebida:', response.data)
      
      // ✅ TRANSFORMAR A RESPOSTA PARA O FORMATO ESPERADO
      const assignableUsers = response.data.assignableUsers || []
      
      const users = assignableUsers.map((user: any) => ({
        ...user,
        _count: {
          assignedTasks: user.activeTasks || 0
        }
      }))
      
      const managers = users.filter((u: any) => u.role === 'MANAGER')
      const employees = users.filter((u: any) => u.role === 'EMPLOYEE')
      
      return {
        users,
        employees,
        managers,
        stats: response.data.stats || {
          totalUsers: users.length,
          totalManagers: managers.length,
          totalEmployees: employees.length
        }
      }
    } catch (error) {
      console.error('❌ Erro ao buscar usuários:', error)
      
      // ✅ FALLBACK: TENTAR ENDPOINT ANTIGO
      try {
        console.log('⚠️ Tentando endpoint antigo...')
        const fallbackResponse = await api.get('/api/tasks/employees')
        return fallbackResponse.data
      } catch (fallbackError) {
        console.error('❌ Erro em ambos os endpoints:', fallbackError)
        throw fallbackError
      }
    }
}

// ✅ FUNÇÃO UNIVERSAL PARA BUSCAR DETALHES DE USUÁRIO (CORRIGIDA)
export const getEmployeeDetails = async (userId: string): Promise<UserDetailsResponse> => {
  try {
    console.log(`🔍 taskService: Buscando detalhes do usuário ${userId}`)
    
    let response
    
    try {
      response = await api.get(`/api/tasks/user-details/${userId}`)
      console.log(`✅ taskService: Detalhes recebidos via user-details:`, response.data)
    } catch (userDetailsError: any) {
      if (userDetailsError.response?.status === 404) {
        console.log('⚠️ Endpoint user-details não encontrado, tentando employee-details...')
        response = await api.get(`/api/tasks/employees/${userId}`)
        console.log(`✅ taskService: Detalhes recebidos via employee-details:`, response.data)
      } else {
        throw userDetailsError
      }
    }
    
    const data = response.data
    
    // ✅ GARANTIR ESTRUTURA CORRETA
    return {
      employee: data.employee,
      user: data.user,
      tasks: Array.isArray(data.tasks) ? data.tasks : [],
      stats: {
        totalTasks: data.stats?.totalTasks ?? 0,
        pendingTasks: data.stats?.pendingTasks ?? 0,
        inProgressTasks: data.stats?.inProgressTasks ?? 0,
        completedTasks: data.stats?.completedTasks ?? 0,
        overdueTasks: data.stats?.overdueTasks ?? 0,
        completionRate: data.stats?.completionRate ?? 0,
        cancelledTasks: data.stats?.cancelledTasks,
        priorityBreakdown: data.stats?.priorityBreakdown,
        recentTasks: data.stats?.recentTasks,
        avgTasksPerMonth: data.stats?.avgTasksPerMonth
      }
    }
  } catch (error: any) {
    console.error(`❌ Erro ao buscar detalhes do usuário ${userId}:`, error)
    
    if (error.response?.status === 404) {
      console.log(`⚠️ Usuário ${userId} não encontrado, retornando dados vazios`)
      return {
        user: { id: userId, name: 'Usuário', email: '', role: 'EMPLOYEE' },
        tasks: [],
        stats: {
          totalTasks: 0,
          pendingTasks: 0,
          inProgressTasks: 0,
          completedTasks: 0,
          overdueTasks: 0,
          completionRate: 0
        }
      }
    }
    
    throw error
  }
}

// ✅ NOVA FUNÇÃO ESPECÍFICA PARA DETALHES DE USUÁRIO
export const getUserDetails = async (userId: string) => {
  return getEmployeeDetails(userId) // ✅ Usar a função universal
}

// ✅ TODAS AS OUTRAS FUNÇÕES PERMANECEM IGUAIS...
export const getTask = async (id: string): Promise<{ task: Task }> => {
    const response = await api.get(`/api/tasks/${id}`);
    return response.data;
}

export const createTask = async (data: CreateTaskForm): Promise<{ task: Task; message: string }> => {
    const response = await api.post('/api/tasks', data);
    return response.data
}

export const updateTaskStatus = async (id: string, status: Task['status']) => {
  console.log(`🔄 taskService: Atualizando tarefa ${id} para status ${status}`)
  
  const response = await api.patch(`/api/tasks/${id}/status`, { status })
  
  console.log(`✅ taskService: Resposta recebida:`, response.data)
  return response.data
}

export const updateTask = async (id: string, data: {
  title: string
  description?: string
  priority: Task['priority']
  status: Task['status']
  dueDate?: string
  targetDate?: string
  assignedToId: string
}) => {
  const response = await api.put(`/api/tasks/${id}`, data)
  return response.data
}

export const deleteTask = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete(`/api/tasks/${id}`)
  return response.data
}

export const bulkDeleteTasks = async (taskIds: string[]): Promise<{ 
  message: string; 
  deletedCount: number; 
  deletedTasks: { id: string; title: string }[]
}> => {
  const response = await api.delete('/api/tasks/bulk', {
    data: { taskIds }
  })
  return response.data
}

// ✅ FUNÇÕES DE NOTIFICAÇÃO PERMANECEM IGUAIS...
export const getNotifications = async (): Promise<any> => {
  const response = await api.get('/api/notifications')
  return response.data
}

export const getUnreadCount = async (): Promise<any> => {
  const response = await api.get('/api/notifications/unread-count')
  return response.data
}

export const markNotificationAsRead = async (id: string): Promise<any> => {
  const response = await api.patch(`/api/notifications/${id}/read`)
  return response.data
}

export const markAllNotificationsAsRead = async (): Promise<{
  message: string
  updatedCount: number
}> => {
  const response = await api.patch('/api/notifications/mark-all-read')
  return response.data
}

export const deleteNotification = async (id: string): Promise<any> => {
  const response = await api.delete(`/api/notifications/${id}`)
  return response.data
}