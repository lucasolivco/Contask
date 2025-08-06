// Página de tarefas - onde o usuário vê e gerencia suas tarefas
import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
//   Search, 
//   Filter, 
  CheckSquare, 
//   Clock, 
//   AlertCircle,
  Plus,
  Eye
} from 'lucide-react'

import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useAuth } from '../contexts/AuthContext'
import { getTasks, updateTaskStatus } from '../services/taskService'
import type { Task, TaskFilter } from '../types'

const Tasks: React.FC = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  // Estados para filtros
  const [filters, setFilters] = React.useState<TaskFilter>({})
  const [searchTerm, setSearchTerm] = React.useState('')

  // Busca tarefas com filtros
  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => getTasks(filters)
  })

  // Mutation para atualizar status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Task['status'] }) =>
      updateTaskStatus(id, status),
    onSuccess: () => {
      toast.success('Status atualizado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao atualizar status')
    }
  })

  const tasks = tasksData?.tasks || []

  // Aplica filtros locais (busca por texto)
  const filteredTasks = React.useMemo(() => {
    if (!searchTerm) return tasks
    
    return tasks.filter(task =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [tasks, searchTerm])

  const handleStatusChange = (taskId: string, newStatus: Task['status']) => {
    updateStatusMutation.mutate({ id: taskId, status: newStatus })
  }

  const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
    const priorityColors = {
      LOW: 'border-l-green-500',
      MEDIUM: 'border-l-yellow-500',
      HIGH: 'border-l-orange-500',
      URGENT: 'border-l-red-500'
    }

    const statusColors = {
      PENDING: 'bg-gray-100 text-gray-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800'
    }

    const statusOptions = [
      { value: 'PENDING', label: 'Pendente' },
      { value: 'IN_PROGRESS', label: 'Em Progresso' },
      { value: 'COMPLETED', label: 'Concluída' },
      { value: 'CANCELLED', label: 'Cancelada' }
    ]

    return (
      <Card className={`border-l-4 ${priorityColors[task.priority]} hover:shadow-md transition-shadow`}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
              {task.description && (
                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[task.status]}`}>
                {statusOptions.find(s => s.value === task.status)?.label}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">
                {user?.role === 'MANAGER' ? 'Atribuída para:' : 'Criada por:'}
              </span>
              <p>
                {user?.role === 'MANAGER' ? task.assignedTo.name : task.createdBy.name}
              </p>
            </div>
            
            <div>
              <span className="font-medium">Prioridade:</span>
              <p className="capitalize">{task.priority.toLowerCase()}</p>
            </div>
            
            {task.dueDate && (
              <div>
                <span className="font-medium">Prazo:</span>
                <p>{new Date(task.dueDate).toLocaleDateString('pt-BR')}</p>
              </div>
            )}
            
            <div>
              <span className="font-medium">Criada em:</span>
              <p>{new Date(task.createdAt).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <select
              value={task.status}
              onChange={(e) => handleStatusChange(task.id, e.target.value as Task['status'])}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-primary-500"
              disabled={updateStatusMutation.isPending}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {/* TODO: Ver detalhes */}}
            >
              <Eye size={16} />
              Ver detalhes
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.role === 'MANAGER' ? 'Tarefas Criadas' : 'Minhas Tarefas'}
          </h1>
          <p className="text-gray-600">
            {user?.role === 'MANAGER' 
              ? 'Gerencie as tarefas da sua equipe'
              : 'Suas tarefas atribuídas'
            }
          </p>
        </div>

        {user?.role === 'MANAGER' && (
          <Button onClick={() => window.location.href = '/tasks/create'}>
            <Plus size={16} />
            Nova Tarefa
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar tarefas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters({ ...filters, status: (e.target.value || undefined) as Task['status'] })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos os status</option>
              <option value="PENDING">Pendente</option>
              <option value="IN_PROGRESS">Em Progresso</option>
              <option value="COMPLETED">Concluída</option>
              <option value="CANCELLED">Cancelada</option>
            </select>

            <select
              value={filters.priority || ''}
              onChange={(e) => setFilters({ ...filters, priority: (e.target.value || undefined) as Task['priority'] })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todas as prioridades</option>
              <option value="LOW">Baixa</option>
              <option value="MEDIUM">Média</option>
              <option value="HIGH">Alta</option>
              <option value="URGENT">Urgente</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Tasks List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : filteredTasks.length > 0 ? (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CheckSquare className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma tarefa encontrada</h3>
          <p className="mt-1 text-sm text-gray-500">
            {user?.role === 'MANAGER' 
              ? 'Comece criando uma nova tarefa para sua equipe.'
              : 'Você não possui tarefas atribuídas no momento.'
            }
          </p>
        </Card>
      )}
    </div>
  )
}

export default Tasks