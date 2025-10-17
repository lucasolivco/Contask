// frontend/src/pages/Tasks.tsx - SIMPLIFICADO SEM FILTRO DUPLICADO

import React, { useState, useMemo, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  CheckSquare, 
  Plus,
  Trash2, 
  X,
  Archive
} from 'lucide-react'

import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import TaskFilters from '../components/tasks/TaskFilters'
import TaskCard from '../components/tasks/TaskCard'
import TaskDetailsModal from '../components/tasks/TaskDetailsModal'
import { useAuth } from '../contexts/AuthContext'
import { 
  getTasks, 
  updateTaskStatus, 
  deleteTask, 
  bulkDeleteTasks,
  archiveTask,
  unarchiveTask,
  bulkArchiveTasks } from '../services/taskService'
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
  const [isArchiving, setIsArchiving] = useState(false)

  // ✅ LIMPAR ESTADO QUANDO USUÁRIO MUDA
  useEffect(() => {
    if (user) {
      console.log(`🔄 Usuário mudou para: ${user.email} (${user.role})`)
      
      // Limpar seleções e filtros
      setSelectedTaskIds([])
      setFilters({})
      setSelectedTask(null)
      setIsDetailsModalOpen(false)
      
      // Invalidar cache específico
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      
      console.log('   ✅ Estado limpo para novo usuário')
    }
  }, [user?.id, queryClient])

  // ✅ QUERY ÚNICA SIMPLIFICADA
  const { data: tasksData, isLoading, error } = useQuery({
    queryKey: ['tasks', user?.id, filters],
    queryFn: () => getTasks(filters),
    enabled: !!user,
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
  })

  const tasks = tasksData?.tasks || []

  // ✅ FILTROS SIMPLIFICADOS - SEM LÓGICA COMPLEXA DE VISUALIZAÇÃO
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks]

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
  }, [tasks])

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    const task = filteredTasks.find(t => t.id === taskId)
    
    if (!task?.canChangeStatus) {
      toast.error('Você não pode alterar o status desta tarefa')
      return
    }
    
    try {
      toast.loading('Atualizando status...', { id: `status-${taskId}` })
      
      await updateTaskStatus(taskId, newStatus)
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] })
      
      toast.success('Status atualizado com sucesso!', { id: `status-${taskId}` })
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao atualizar status', { id: `status-${taskId}` })
    }
  }

  const handleEditTask = (taskId: string) => {
    const task = filteredTasks.find(t => t.id === taskId)
    
    if (!task?.canEdit) {
      toast.error('Apenas o criador da tarefa pode editá-la')
      return
    }
    
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
    if (!user?.id) {
      toast.error('Usuário não autenticado')
      return
    }

    const task = filteredTasks.find(t => t.id === taskId)
    
    if (!task?.canDelete) {
      toast.error('Apenas o criador da tarefa pode excluí-la')
      return
    }

    const taskName = task ? task.title : 'esta tarefa'
    
    if (!window.confirm(`Tem certeza que deseja excluir "${taskName}"?`)) {
      return
    }

    try {
      setIsDeleting(true)
      const result = await deleteTask(taskId)
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] })
      setSelectedTaskIds(prev => prev.filter(id => id !== taskId))
      toast.success(result.message || 'Tarefa excluída com sucesso!')
    } catch (error: any) {
      console.error('Erro ao excluir tarefa:', error)
      toast.error(error.response?.data?.error || 'Erro ao excluir tarefa')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleArchiveTask = async (taskId: string) => {
    const task = filteredTasks.find(t => t.id === taskId)
    if (!task) return

    if (!window.confirm(`Tem certeza que deseja arquivar a tarefa "${task.title}"?`)) {
      return
    }

    try {
      setIsArchiving(true)
      await archiveTask(taskId)
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id, filters] })
      toast.success('Tarefa arquivada com sucesso!')
    } catch (error: any) {
      console.error('Erro ao arquivar tarefa:', error)
      toast.error(error.response?.data?.error || 'Erro ao arquivar tarefa')
    } finally {
      setIsArchiving(false)
    }
  }

  const handleUnarchiveTask = async (taskId: string) => {
    try {
      await unarchiveTask(taskId)
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id, filters] })
      toast.success('Tarefa restaurada com sucesso!')
    } catch (error: any) {
      console.error('Erro ao restaurar tarefa:', error)
      toast.error(error.response?.data?.error || 'Erro ao restaurar tarefa')
    }
  }

  const handleBulkArchive = async () => {
    if (selectedTaskIds.length === 0) return

    if (!window.confirm(`Tem certeza que deseja arquivar ${selectedTaskIds.length} tarefa(s)?`)) {
      return
    }

    try {
      setIsArchiving(true)
      const result = await bulkArchiveTasks(selectedTaskIds)
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id, filters] })
      setSelectedTaskIds([])
      toast.success(result.message || `${selectedTaskIds.length} tarefas arquivadas com sucesso!`)
    } catch (error: any) {
      console.error('Erro ao arquivar tarefas:', error)
      toast.error(error.response?.data?.error || 'Erro ao arquivar tarefas')
    } finally {
      setIsArchiving(false)
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
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] })
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
            <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg">
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

      {/* ✅ FILTROS ELEGANTES COM currentUserId */}
      <TaskFilters 
        onFiltersChange={setFilters} 
        userRole={user?.role || ''} 
        currentUserId={user?.id}
      />

      {/* ✅ BARRA DE SELEÇÃO (APENAS MANAGER) */}
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
            <div className="flex items-center gap-2">
              {filters.archived !== true && (
                <Button
                  onClick={handleBulkArchive}
                  disabled={isArchiving || isDeleting}
                  className="bg-gray-600 hover:bg-gray-700 text-white flex items-center gap-2"
                  size="sm"
                >
                  <Archive className="h-4 w-4" />
                  <span>
                    {isArchiving ? 'Arquivando...' : `Arquivar`}
                  </span>
                </Button>
              )}
              <Button
                onClick={handleBulkDelete}
                disabled={isDeleting || isArchiving}
                className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                size="sm"
              >
                <Trash2 className="h-4 w-4" />
                <span>
                  {isDeleting ? 'Excluindo...' : `Excluir`}
                </span>
              </Button>
            </div>
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
                onArchive={handleArchiveTask}
                onUnarchive={handleUnarchiveTask}
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