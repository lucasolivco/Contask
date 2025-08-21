import React, { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  CheckSquare, 
  Plus,
  Clock,
  AlertTriangle,
  Target,
  Trash2, 
  CheckSquare2,
  X
} from 'lucide-react'

import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import TaskFilters from '../components/tasks/TaskFilters'
import TaskCard from '../components/tasks/TaskCard'
import TaskDetailsModal from '../components/tasks/TaskDetailsModal'
import { useAuth } from '../contexts/AuthContext'
import { getTasks, updateTaskStatus, deleteTask, bulkDeleteTasks } from '../services/taskService'
import type { Task, TaskFilter } from '../types'
import { useNavigate } from 'react-router-dom'

const Tasks: React.FC = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  
  const [filters, setFilters] = useState<TaskFilter>({})
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)

  // Busca tarefas com filtros
  const { data: tasksData, isLoading, error } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => getTasks(filters),
    retry: 1
  })

  const tasks = tasksData?.tasks || []

  // ✅ ORDENAÇÃO POR PRIORIDADE + Filtros adicionais
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

    // ✅ ORDENAÇÃO POR PRIORIDADE: URGENT > HIGH > MEDIUM > LOW
    const priorityOrder = { 'URGENT': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 }
    
    filtered.sort((a, b) => {
      const priorityA = priorityOrder[a.priority] ?? 4
      const priorityB = priorityOrder[b.priority] ?? 4
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB
      }
      
      // Se mesma prioridade, ordenar por data de vencimento
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
      
      return dateA - dateB
    })

    return filtered
  }, [tasks, filters])

  // Funções existentes (não alteradas)
  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    if (user?.role !== 'EMPLOYEE') return
    
    try {
      await updateTaskStatus(taskId, newStatus)
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Status atualizado com sucesso!')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao atualizar status')
    }
  }

  const handleEditTask = (taskId: string) => {
    navigate(`/tasks/${taskId}/edit`)
  }

  const handleViewDetails = (task: Task) => {
    setSelectedTask(task)
    setIsDetailsModalOpen(true)
  }

  const handleCloseDetails = () => {
    setIsDetailsModalOpen(false)
    setSelectedTask(null)
  }

  const handleDeleteTask = async (taskId: string) => {
    const task = filteredTasks.find(t => t.id === taskId)
    const taskName = task ? task.title : 'esta tarefa'
    
    if (!window.confirm(`Tem certeza que deseja excluir "${taskName}"?`)) {
      return
    }

    try {
      setIsDeleting(true)
      const result = await deleteTask(taskId)
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setSelectedTaskIds(prev => prev.filter(id => id !== taskId))
      toast.success(result.message || 'Tarefa excluída com sucesso!')
    } catch (error: any) {
      console.error('Erro ao excluir tarefa:', error)
      toast.error(error.response?.data?.error || 'Erro ao excluir tarefa')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedTaskIds.length === 0) {
      toast.error('Selecione pelo menos uma tarefa')
      return
    }

    const selectedTasks = filteredTasks.filter(t => selectedTaskIds.includes(t.id))
    const taskNames = selectedTasks.slice(0, 3).map(t => t.title).join(', ')
    const displayText = selectedTasks.length > 3 
      ? `${taskNames} e mais ${selectedTasks.length - 3}` 
      : taskNames

    if (!window.confirm(`Tem certeza que deseja excluir ${selectedTaskIds.length} tarefa(s)?\n\n${displayText}`)) {
      return
    }

    try {
      setIsDeleting(true)
      const result = await bulkDeleteTasks(selectedTaskIds)
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setSelectedTaskIds([])
      toast.success(result.message || 'Tarefas excluídas com sucesso!')
    } catch (error: any) {
      console.error('Erro ao excluir tarefas:', error)
      toast.error(error.response?.data?.error || 'Erro ao excluir tarefas')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleSelect = (taskId: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }

  const handleSelectAll = () => {
    if (selectedTaskIds.length === filteredTasks.length) {
      setSelectedTaskIds([])
    } else {
      setSelectedTaskIds(filteredTasks.map(task => task.id))
    }
  }

  const clearSelection = () => {
    setSelectedTaskIds([])
  }

  // Estatísticas
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
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
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
            className="btn-primary interactive-glow"
          >
            <Plus className="h-5 w-5" />
            Nova Tarefa
          </Button>
        )}
      </div>

      {/* Estatísticas */}
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
            <div className="p-3 bg-slate-100 rounded-xl">
              <Clock className="h-6 w-6 text-slate-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-700 mb-1">{stats.pending}</div>
          <div className="text-slate-600 text-sm font-medium">Pendentes</div>
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
            <div className="p-3 bg-red-100 rounded-xl">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-red-700 mb-1">{stats.overdue}</div>
          <div className="text-red-600 text-sm font-medium">Atrasadas</div>
        </Card>
      </div>

      {/* Filtros */}
      <TaskFilters onFiltersChange={setFilters} userRole={user?.role || ''} />

      {/* ✅ BARRA DE SELEÇÃO MELHORADA (APENAS MANAGER) */}
      {user?.role === 'MANAGER' && filteredTasks.length > 0 && (
        <div className={`
          flex items-center justify-between p-4 rounded-xl border transition-all duration-300
          ${selectedTaskIds.length > 0 
            ? 'bg-blue-50 border-blue-200' 
            : 'bg-gray-50 border-gray-200'}
        `}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedTaskIds.length === filteredTasks.length && filteredTasks.length > 0}
                  onChange={handleSelectAll}
                  className="w-5 h-5 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                  disabled={isDeleting}
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  {selectedTaskIds.length === filteredTasks.length ? 'Desmarcar' : 'Selecionar'} Todas
                </span>
              </label>
            </div>
            
            {selectedTaskIds.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-blue-700 font-medium bg-blue-100 px-3 py-1 rounded-full">
                  {selectedTaskIds.length} selecionada(s)
                </span>
                <button
                  onClick={clearSelection}
                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                  title="Limpar seleção"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          
          {selectedTaskIds.length > 0 && (
            <Button
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
              size="sm"
            >
              <Trash2 className="h-4 w-4" />
              <span>
                {isDeleting ? 'Excluindo...' : `Excluir ${selectedTaskIds.length}`}
              </span>
            </Button>
          )}
        </div>
      )}

      {/* Lista de Tarefas */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task, index) => (
            <div 
              key={task.id} 
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <TaskCard
                task={task}
                onStatusChange={handleStatusChange}
                onEdit={handleEditTask}
                onViewDetails={handleViewDetails}
                onDelete={handleDeleteTask}
                isSelected={selectedTaskIds.includes(task.id)}
                onToggleSelect={handleToggleSelect}
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

      {/* Modal de Detalhes */}
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          isOpen={isDetailsModalOpen}
          onClose={handleCloseDetails}
          userRole={user?.role || ''}
          currentUser={{
            id: user?.id || '',
            name: user?.name || '',
            email: user?.email || ''
          }}
        />
      )}
    </div>
  )
}

export default Tasks