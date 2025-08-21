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
// ✅ CORRIGIDO: Função com tipo específico
export const updateTaskStatus = async (id: string, status: Task['status']) => {
  const response = await api.put(`/tasks/${id}/status`, { status })
  return response.data
}

// Buscar lista de funcionários (só gerentes)
export const getEmployees = async (): Promise<EmployeesResponse> => {
    const response = await api.get('/tasks/employees');
    return response.data;
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