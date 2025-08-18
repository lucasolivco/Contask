import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  CheckSquare, 
  Plus,
  Eye,
  Calendar,
  User,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Pause
} from 'lucide-react'

import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import TaskFilters from '../components/tasks/TaskFilters'
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
        ['PENDING', 'IN_PROGRESS'].includes(task.status!)
      )
    }

    return filtered
  }, [tasks, filters])

  const handleStatusChange = (taskId: string, newStatus: Task['status']) => {
    updateStatusMutation.mutate({ id: taskId, status: newStatus })
  }

  // Componente para Card de Tarefa
  const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETADO'

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'COMPLETED': return <CheckCircle2 className="h-4 w-4 text-green-600" />
        case 'IN_PROGRESS': return <Clock className="h-4 w-4 text-blue-600" />
        case 'CANCELLED': return <XCircle className="h-4 w-4 text-red-600" />
        default: return <Pause className="h-4 w-4 text-gray-600" />
      }
    }

    const getStatusText = (status: string) => {
      switch (status) {
        case 'PENDING': return 'Pendente'
        case 'IN_PROGRESS': return 'Em Progresso'
        case 'COMPLETED': return 'Concluída'
        case 'CANCELLED': return 'Cancelada'
        default: return status
      }
    }

    const getPriorityText = (priority: string) => {
      switch (priority) {
        case 'HIGH': return 'Alta'
        case 'MEDIUM': return 'Média'
        case 'LOW': return 'Baixa'
        case 'URGENT': return 'Urgente'
        default: return priority
      }
    }

    return (
      <Card className={`card-hover ${isOverdue ? 'border-red-200 bg-red-50/30' : 'hover:border-rose-200'}`}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(task.status!)}
              <span className="text-sm font-medium text-gray-700">
                {getStatusText(task.status!)}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {isOverdue && (
                <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">
                  <AlertTriangle className="h-3 w-3" />
                  Atrasada
                </span>
              )}
              <span className={`priority-${task.priority!.toLowerCase()}`}>
                {getPriorityText(task.priority!)}
              </span>
            </div>
          </div>

          {/* Título e descrição */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
              {task.title}
            </h3>
            {task.description && (
              <p className="text-gray-600 text-sm line-clamp-2">
                {task.description}
              </p>
            )}
          </div>

          {/* Informações */}
          <div className="space-y-2 text-sm text-gray-500">
            {task.dueDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  Vence em {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>
                {user?.role === 'MANAGER' ? (
                  `Atribuído para ${task.assignedTo.name}`
                ) : (
                  `Criado por ${task.createdBy.name}`
                )}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <select
              value={task.status}
              onChange={(e) => handleStatusChange(task.id, e.target.value as Task['status'])}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-rose-500 focus:border-rose-300"
              disabled={updateStatusMutation.isPending}
            >
              <option value="PENDING">📋 Pendente</option>
              <option value="IN_PROGRESS">⚡ Em Progresso</option>
              <option value="COMPLETED">✅ Concluída</option>
              <option value="CANCELLED">❌ Cancelada</option>
            </select>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/tasks/${task.id}`)}
            >
              <Eye size={16} />
              Detalhes
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Erro ao carregar tarefas. Tente novamente.
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CheckSquare className="h-8 w-8 text-rose-500" />
            {user?.role === 'MANAGER' ? 'Gerenciar Tarefas' : 'Minhas Tarefas'}
          </h1>
          <p className="text-gray-600 mt-2">
            {user?.role === 'MANAGER' 
              ? 'Crie e acompanhe tarefas da sua equipe'
              : 'Visualize e atualize suas tarefas atribuídas'
            }
          </p>
        </div>
        
        {user?.role === 'MANAGER' && (
          <Button onClick={() => navigate('/tasks/create')} size="lg">
            <Plus className="h-5 w-5" />
            Nova Tarefa
          </Button>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="text-center gradient-blue border-blue-200">
          <div className="text-2xl font-bold text-blue-700">{tasks.length}</div>
          <div className="text-blue-600 text-sm">Total</div>
        </Card>
        <Card className="text-center bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="text-2xl font-bold text-yellow-700">
            {tasks.filter(t => t.status === 'PENDENTE').length}
          </div>
          <div className="text-yellow-600 text-sm">Pendentes</div>
        </Card>
        <Card className="text-center bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="text-2xl font-bold text-green-700">
            {tasks.filter(t => t.status === 'COMPLETADO').length}
          </div>
          <div className="text-green-600 text-sm">Concluídas</div>
        </Card>
        <Card className="text-center bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="text-2xl font-bold text-red-700">
            {tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && ['PENDING', 'IN_PROGRESS'].includes(t.status!)).length}
          </div>
          <div className="text-red-600 text-sm">Atrasadas</div>
        </Card>
      </div>

      {/* Filtros */}
      <TaskFilters onFiltersChange={setFilters} userRole={user?.role || ''} />

      {/* Lista de Tarefas */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CheckSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {tasks.length === 0 ? 'Nenhuma tarefa encontrada' : 'Nenhuma tarefa corresponde aos filtros'}
          </h3>
          <p className="text-gray-500 mb-6">
            {tasks.length === 0 
              ? 'Comece criando sua primeira tarefa'
              : 'Tente ajustar os filtros para ver mais resultados'
            }
          </p>
          {user?.role === 'MANAGER' && tasks.length === 0 && (
            <Button onClick={() => navigate('/tasks/create')}>
              <Plus className="h-4 w-4" />
              Criar Primeira Tarefa
            </Button>
          )}
        </Card>
      )}
    </div>
  )
}

export default Tasks