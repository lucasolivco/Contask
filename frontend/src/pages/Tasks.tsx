import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  CheckSquare, 
  Plus,
  TrendingUp,
  Clock,
  AlertTriangle,
  Target
} from 'lucide-react'

import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import TaskFilters from '../components/tasks/TaskFilters'
import TaskCard from '../components/tasks/TaskCard'
import { useAuth } from '../contexts/AuthContext'
import { getTasks, updateTaskStatus } from '../services/taskService'
import type { Task, TaskFilter } from '../types'
import { useNavigate } from 'react-router-dom'

const Tasks: React.FC = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  
  const [filters, setFilters] = useState<TaskFilter>({})

  // Busca tarefas com filtros
  const { data: tasksData, isLoading, error } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => getTasks(filters),
    retry: 1
  })

  // Mutation para atualizar status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Task['status'] }) =>
      updateTaskStatus(id, status),
    onSuccess: (data) => {
      toast.success(data.message || 'Status atualizado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao atualizar status')
    }
  })

  const tasks = tasksData?.tasks || []

  // Aplicar filtros adicionais no frontend
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks]

    // Filtro por tarefas atrasadas
    if (filters.overdue) {
      const now = new Date()
      filtered = filtered.filter(task =>
        task.dueDate &&
        new Date(task.dueDate) < now &&
        ['PENDING', 'IN_PROGRESS'].includes(task.status)
      )
    }

    return filtered
  }, [tasks, filters])

  const handleStatusChange = (taskId: string, newStatus: Task['status']) => {
    updateStatusMutation.mutate({ id: taskId, status: newStatus })
  }

  const handleTaskClick = (taskId: string) => {
    navigate(`/tasks/${taskId}`)
  }

  // Estatísticas - CORRIGIDO: usando valores em inglês
  const stats = useMemo(() => {
    const pending = tasks.filter(t => t.status === 'PENDING').length
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length
    const completed = tasks.filter(t => t.status === 'COMPLETED').length
    const overdue = tasks.filter(t => 
      t.dueDate && 
      new Date(t.dueDate) < new Date() && 
      ['PENDING', 'IN_PROGRESS'].includes(t.status)
    ).length

    return { pending, inProgress, completed, overdue, total: tasks.length }
  }, [tasks])

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          Erro ao carregar tarefas. Tente novamente.
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8 scrollbar-modern">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="animate-fade-in">
          <h1 className="heading-xl flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl shadow-lg">
              <CheckSquare className="h-8 w-8 text-white" />
            </div>
            {user?.role === 'MANAGER' ? 'Gerenciar Tarefas' : 'Minhas Tarefas'}
          </h1>
          <p className="text-muted mt-3 text-lg">
            {user?.role === 'MANAGER' 
              ? 'Crie e acompanhe tarefas da sua equipe'
              : 'Visualize e atualize suas tarefas atribuídas'
            }
          </p>
        </div>
        
        {user?.role === 'MANAGER' && (
          <Button 
            onClick={() => navigate('/tasks/create')} 
            size="lg"
            className="interactive-glow"
          >
            <Plus className="h-5 w-5" />
            Nova Tarefa
          </Button>
        )}
      </div>

      {/* Estatísticas - DESIGN ELEGANTE SEM GRADIENTES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-slide-up">
        <Card className="text-center stat-card-total card-hover">
          <div className="flex items-center justify-center mb-3">
            <div className="p-3 bg-slate-100 rounded-xl">
              <Target className="h-6 w-6 text-slate-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-700 mb-1">{stats.total}</div>
          <div className="text-slate-600 text-sm font-medium">Total</div>
        </Card>
        
        <Card className="text-center stat-card-pending card-hover">
          <div className="flex items-center justify-center mb-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-700 mb-1">{stats.pending}</div>
          <div className="text-blue-600 text-sm font-medium">Pendentes</div>
        </Card>
        
        <Card className="text-center stat-card-completed card-hover">
          <div className="flex items-center justify-center mb-3">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <CheckSquare className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700 mb-1">{stats.completed}</div>
          <div className="text-emerald-600 text-sm font-medium">Concluídas</div>
        </Card>
        
        <Card className="text-center stat-card-overdue card-hover">
          <div className="flex items-center justify-center mb-3">
            <div className="p-3 bg-amber-100 rounded-xl">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-700 mb-1">{stats.overdue}</div>
          <div className="text-amber-600 text-sm font-medium">Atrasadas</div>
        </Card>
      </div>

      {/* Filtros */}
      <TaskFilters onFiltersChange={setFilters} userRole={user?.role || ''} />

      {/* Lista de Tarefas */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task, index) => (
            <div 
              key={task.id} 
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <TaskCard
                task={task}
                onClick={() => handleTaskClick(task.id)}
                onStatusChange={handleStatusChange}
                userRole={user?.role || ''}
              />
            </div>
          ))}
        </div>
      ) : (
        <Card className="text-center py-16 animate-fade-in">
          <div className="max-w-md mx-auto">
            <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-6">
              <CheckSquare className="h-16 w-16 text-gray-400" />
            </div>
            <h3 className="heading-md mb-3">
              {tasks.length === 0 ? 'Nenhuma tarefa encontrada' : 'Nenhuma tarefa corresponde aos filtros'}
            </h3>
            <p className="text-muted mb-8">
              {tasks.length === 0 
                ? 'Comece criando sua primeira tarefa'
                : 'Tente ajustar os filtros para ver mais resultados'
              }
            </p>
            {user?.role === 'MANAGER' && tasks.length === 0 && (
              <Button 
                onClick={() => navigate('/tasks/create')}
                className="interactive-glow"
              >
                <Plus className="h-4 w-4" />
                Criar Primeira Tarefa
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

export default Tasks