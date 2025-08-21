import { 
  Calendar, 
  User, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Pause, 
  Edit3, 
  Target, 
  MessageCircle,
  Trash2
} from 'lucide-react'
import {  
  TaskStatusLabels, 
  TaskPriorityLabels
} from '../../types'
import type { Task } from '../../types'

interface TaskCardProps {
  task: Task
  onStatusChange?: (taskId: string, newStatus: Task['status']) => void
  userRole: string
  onEdit?: (taskId: string) => void
  onViewDetails?: (task: Task) => void
  onDelete?: (taskId: string) => void
  isSelected?: boolean
  onToggleSelect?: (taskId: string) => void
}

const TaskCard = ({ 
  task, 
  onStatusChange, 
  userRole, 
  onEdit, 
  onViewDetails,
  onDelete,
  isSelected,
  onToggleSelect
}: TaskCardProps) => {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED'
  const isNearTarget = task.targetDate && new Date(task.targetDate) < new Date() && task.status !== 'COMPLETED'
  
  // ✅ CORES DE PRIORIDADE RESTAURADAS
  const getPriorityStyles = (priority: Task['priority']) => {
    switch (priority) {
      case 'URGENT': return {
        text: 'text-purple-700 bg-purple-50 border-purple-200',
        border: 'border-r-purple-500',
        icon: '🚨'
      }
      case 'HIGH': return {
        text: 'text-orange-700 bg-orange-50 border-orange-200',
        border: 'border-r-orange-500',
        icon: '⚡'
      }
      case 'MEDIUM': return {
        text: 'text-blue-700 bg-blue-50 border-blue-200',
        border: 'border-r-blue-500',
        icon: '📋'
      }
      case 'LOW': return {
        text: 'text-slate-700 bg-slate-50 border-slate-200',
        border: 'border-r-slate-400',
        icon: '📝'
      }
      default: return {
        text: 'text-blue-700 bg-blue-50 border-blue-200',
        border: 'border-r-blue-500',
        icon: '📋'
      }
    }
  }

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'IN_PROGRESS': return <Clock className="h-4 w-4 text-blue-600" />
      case 'CANCELLED': return <XCircle className="h-4 w-4 text-gray-600" />
      default: return <Pause className="h-4 w-4 text-gray-600" />
    }
  }

  const priorityStyles = getPriorityStyles(task.priority)

  return (
    <div className={`
      bg-white rounded-xl border border-gray-200 border-r-4 ${priorityStyles.border} p-4 
      transition-all duration-200 hover:shadow-lg hover:border-gray-300
      ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
      ${task.status === 'COMPLETED' ? 'opacity-75' : ''}
    `}>
      
      {/* Header com checkbox e prioridade */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* ✅ CHECKBOX MELHORADO (APENAS MANAGER) */}
          {userRole === 'MANAGER' && onToggleSelect && (
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isSelected || false}
                onChange={(e) => {
                  e.stopPropagation()
                  onToggleSelect(task.id)
                }}
                className="w-5 h-5 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
              />
            </label>
          )}
          
          {/* Status */}
          <div className="flex items-center gap-2">
            {getStatusIcon(task.status)}
            <span className={`status-${task.status.toLowerCase().replace('_', '-')} text-xs font-medium`}>
              {TaskStatusLabels[task.status]}
            </span>
          </div>
        </div>
        
        {/* ✅ PRIORIDADE COM CORES RESTAURADAS */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold border ${priorityStyles.text}`}>
            <span className="mr-1">{priorityStyles.icon}</span>
            {TaskPriorityLabels[task.priority]}
          </span>
        </div>
      </div>

      {/* Título da tarefa */}
      <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2 text-base">
        {task.title}
      </h3>

      {/* Informações compactas */}
      <div className="space-y-2 mb-4 text-sm text-gray-600">
        {/* Responsável */}
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-400" />
          <span>
            {userRole === 'MANAGER' ? task.assignedTo.name : task.createdBy.name}
          </span>
        </div>

        {/* ✅ DATAS SEM LEGENDA EXPLICATIVA */}
        <div className="space-y-1">
          {/* Data de vencimento */}
          {task.dueDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-500">Vencimento:</span>
              <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-700'}>
                {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                {isOverdue && (
                  <span className="ml-1 text-red-600 text-xs font-bold animate-pulse">⚠️ Atrasada</span>
                )}
              </span>
            </div>
          )}
          
          {/* Data meta */}
          {task.targetDate && (
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-gray-500">Meta:</span>
              <span className={isNearTarget ? 'text-orange-600 font-medium' : 'text-grey-600'}>
                {new Date(task.targetDate).toLocaleDateString('pt-BR')}
                {isNearTarget && (
                  <span className="ml-1 text-orange-600 text-xs font-bold animate-pulse">🎯 Próxima</span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Ações compactas */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        {/* Ver Detalhes */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onViewDetails?.(task)
          }}
          className="flex-1 flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors font-medium"
        >
          <MessageCircle className="h-4 w-4" />
          Detalhes
        </button>
        
        {/* Ações específicas por papel */}
        {userRole === 'MANAGER' ? (
          <div className="flex items-center gap-1">
            {/* Botão Delete */}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(task.id)
                }}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                title="Excluir tarefa"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            
            {/* Botão Editar */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit?.(task.id)
              }}
              className="flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg transition-colors font-medium"
            >
              <Edit3 className="h-3 w-3" />
              Editar
            </button>
          </div>
        ) : (
          <select
            value={task.status}
            onChange={(e) => {
              e.stopPropagation()
              onStatusChange?.(task.id, e.target.value as Task['status'])
            }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="PENDING">⏳ Pendente</option>
            <option value="IN_PROGRESS">🔄 Em Progresso</option>
            <option value="COMPLETED">✅ Completada</option>
          </select>
        )}
      </div>
    </div>
  )
}

export default TaskCard