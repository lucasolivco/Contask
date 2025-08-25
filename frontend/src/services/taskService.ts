// Serviços para tarefas - CORRIGIDO
import api from './api'
import type { Task, CreateTaskForm, TaskFilter, TaskResponse, EmployeesResponse } from '../types'

// Buscar lista de tarefas (com filtros opcionais) - CORRIGIDO
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

    // ✅ PARÂMETROS QUE ESTAVAM FALTANDO
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
    const url = queryString ? `/tasks?${queryString}` : '/tasks'
    
    // ✅ LOG PARA DEBUG
    console.log('🚀 taskService chamando URL:', url)
    console.log('🚀 taskService com filtros:', filters)
    
    const response = await api.get(url);
    return response.data;
}

// Buscar uma tarefa específica pelo ID
export const getTask = async (id: string): Promise<{ task: Task }> => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
}

// Criar nova tarefa (só gerentes)
export const createTask = async (data: CreateTaskForm): Promise<{ task: Task; message: string }> => {
    const response = await api.post('/tasks', data);
    return response.data
}

// Atualizar status de uma tarefa
// ✅ CORRIGIR FUNÇÃO updateTaskStatus
export const updateTaskStatus = async (id: string, status: Task['status']) => {
  console.log(`🔄 taskService: Atualizando tarefa ${id} para status ${status}`)
  
  // ✅ USAR PATCH ao invés de PUT e URL correta
  const response = await api.patch(`/tasks/${id}/status`, { status })
  
  console.log(`✅ taskService: Resposta recebida:`, response.data)
  return response.data
}

// Buscar lista de funcionários (só gerentes)
export const getEmployees = async (): Promise<EmployeesResponse> => {
    const response = await api.get('/tasks/employees');
    return response.data;
}

// ✅ NOVA FUNÇÃO: Buscar detalhes de um funcionário específico
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
  const response = await api.get(`/tasks/employees/${employeeId}`)
  console.log(`✅ taskService: Detalhes recebidos:`, response.data)
  return response.data
}

// Atualizar tarefa
export const updateTask = async (id: string, data: {
  title: string
  description?: string
  priority: Task['priority']
  status: Task['status']
  dueDate?: string
  targetDate?: string
  assignedToId: string
}) => {
  const response = await api.put(`/tasks/${id}`, data)
  return response.data
}

// ✅ EXCLUIR TAREFA INDIVIDUAL
export const deleteTask = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete(`/tasks/${id}`)
  return response.data
}

// ✅ EXCLUIR MÚLTIPLAS TAREFAS
export const bulkDeleteTasks = async (taskIds: string[]): Promise<{ 
  message: string; 
  deletedCount: number; 
  deletedTasks: { id: string; title: string }[]
}> => {
  const response = await api.delete('/tasks/bulk', {
    data: { taskIds }
  })
  return response.data
}

// ✅ ATUALIZAR FUNÇÕES NO SEU taskService.ts

import type { 
  NotificationsResponse, 
  MarkNotificationResponse, 
  DeleteNotificationResponse,
  UnreadCountResponse 
} from '../types'

// Buscar notificações
export const getNotifications = async (): Promise<NotificationsResponse> => {
  const response = await api.get('/notifications')
  return response.data
}

// Contar não lidas
export const getUnreadCount = async (): Promise<UnreadCountResponse> => {
  const response = await api.get('/notifications/unread-count')
  return response.data
}

// Marcar como lida
export const markNotificationAsRead = async (id: string): Promise<MarkNotificationResponse> => {
  const response = await api.patch(`/notifications/${id}/read`)
  return response.data
}

// Marcar todas como lidas
export const markAllNotificationsAsRead = async (): Promise<{
  message: string
  updatedCount: number
}> => {
  const response = await api.patch('/notifications/mark-all-read')
  return response.data
}

// Excluir notificação
export const deleteNotification = async (id: string): Promise<DeleteNotificationResponse> => {
  const response = await api.delete(`/notifications/${id}`)
  return response.data
}