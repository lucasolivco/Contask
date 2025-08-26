// Serviços para tarefas - CORRIGIDO COM /api/
import api from './api'
import type { Task, CreateTaskForm, TaskFilter, TaskResponse, EmployeesResponse } from '../types'

// ✅ BUSCAR LISTA DE TAREFAS
export const getTasks = async (filters?: TaskFilter): Promise<TaskResponse> => {
    const params = new URLSearchParams();

    // Filtros básicos
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
    const url = queryString ? `/api/tasks?${queryString}` : '/api/tasks' // ✅ /api/tasks
    
    console.log('🚀 taskService chamando URL:', url)
    console.log('🚀 taskService com filtros:', filters)
    
    const response = await api.get(url);
    return response.data;
}

// ✅ BUSCAR TAREFA POR ID
export const getTask = async (id: string): Promise<{ task: Task }> => {
    const response = await api.get(`/api/tasks/${id}`); // ✅ /api/tasks
    return response.data;
}

// ✅ CRIAR TAREFA
export const createTask = async (data: CreateTaskForm): Promise<{ task: Task; message: string }> => {
    const response = await api.post('/api/tasks', data); // ✅ /api/tasks
    return response.data
}

// ✅ ATUALIZAR STATUS
export const updateTaskStatus = async (id: string, status: Task['status']) => {
  console.log(`🔄 taskService: Atualizando tarefa ${id} para status ${status}`)
  
  const response = await api.patch(`/api/tasks/${id}/status`, { status }) // ✅ /api/tasks
  
  console.log(`✅ taskService: Resposta recebida:`, response.data)
  return response.data
}

// ✅ BUSCAR FUNCIONÁRIOS
export const getEmployees = async (): Promise<EmployeesResponse> => {
    const response = await api.get('/api/tasks/employees'); // ✅ /api/tasks/employees
    return response.data;
}

// ✅ DETALHES DO FUNCIONÁRIO
export const getEmployeeDetails = async (employeeId: string): Promise<{
  employee: {
    id: string
    name: string
    email: string
  }
  tasks: Task[]
  stats: {
    totalTasks: number
    pendingTasks: number
    completedTasks: number
    overdueTasks: number
    inProgressTasks: number
    completionRate: number
  }
}> => {
  console.log(`🔍 taskService: Buscando detalhes do funcionário ${employeeId}`)
  const response = await api.get(`/api/tasks/employees/${employeeId}`) // ✅ /api/tasks
  console.log(`✅ taskService: Detalhes recebidos:`, response.data)
  return response.data
}

// ✅ ATUALIZAR TAREFA
export const updateTask = async (id: string, data: {
  title: string
  description?: string
  priority: Task['priority']
  status: Task['status']
  dueDate?: string
  targetDate?: string
  assignedToId: string
}) => {
  const response = await api.put(`/api/tasks/${id}`, data) // ✅ /api/tasks
  return response.data
}

// ✅ EXCLUIR TAREFA
export const deleteTask = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete(`/api/tasks/${id}`) // ✅ /api/tasks
  return response.data
}

// ✅ EXCLUIR MÚLTIPLAS
export const bulkDeleteTasks = async (taskIds: string[]): Promise<{ 
  message: string; 
  deletedCount: number; 
  deletedTasks: { id: string; title: string }[]
}> => {
  const response = await api.delete('/api/tasks/bulk', { // ✅ /api/tasks
    data: { taskIds }
  })
  return response.data
}

// ✅ NOTIFICAÇÕES TAMBÉM PRECISAM DO /api/
export const getNotifications = async (): Promise<any> => {
  const response = await api.get('/api/notifications') // ✅ /api/notifications
  return response.data
}

export const getUnreadCount = async (): Promise<any> => {
  const response = await api.get('/api/notifications/unread-count') // ✅ /api/notifications
  return response.data
}

export const markNotificationAsRead = async (id: string): Promise<any> => {
  const response = await api.patch(`/api/notifications/${id}/read`) // ✅ /api/notifications
  return response.data
}

export const markAllNotificationsAsRead = async (): Promise<{
  message: string
  updatedCount: number
}> => {
  const response = await api.patch('/api/notifications/mark-all-read') // ✅ /api/notifications
  return response.data
}

export const deleteNotification = async (id: string): Promise<any> => {
  const response = await api.delete(`/api/notifications/${id}`) // ✅ /api/notifications
  return response.data
}