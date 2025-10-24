// frontend/src/components/tasks/TaskCard.tsx - VERSÃO ATUALIZADA

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
  Trash2,
  Crown,
  Archive,
  RotateCcw
} from 'lucide-react'
import moment from 'moment-timezone'
import {  
  TaskStatusLabels, 
  TaskPriorityLabels
} from '../../types'
import type { Task } from '../../types'
import { formatTaskIdForDisplay } from '../../utils/formatters' // ✅ NOVO: Importar a função

// ... (interface TaskCardProps permanece a mesma)
interface TaskCardProps {
  task: Task & {
    canEdit?: boolean
    canChangeStatus?: boolean
    canDelete?: boolean
    isCreator?: boolean
    isAssigned?: boolean
  }
  onStatusChange?: (taskId: string, newStatus: Task['status']) => void
  userRole: string
  onEdit?: (taskId: string) => void
  onViewDetails?: (task: Task) => void
  onDelete?: (taskId: string) => void
  isSelected?: boolean
  onToggleSelect?: (taskId: string) => void
  onArchive?: (taskId: string) => void
  onUnarchive?: (taskId: string) => void
}


const TaskCard = ({ 
  task, 
  onStatusChange, 
  userRole, 
  onEdit, 
  onViewDetails,
  onDelete,
  isSelected,
  onToggleSelect,
  onArchive,
  onUnarchive
}: TaskCardProps) => {

  // ✅ NOVO: Gerar o ID de exibição
  const displayId = formatTaskIdForDisplay(task.id);
  
  // ... (todas as funções como formatDateBrazil, isDatePastBrazil, etc., permanecem as mesmas)
  const formatDateBrazil = (dateString: string | null) => {
    if (!dateString) return ''
    
    try {
      const date = moment(dateString).tz('America/Sao_Paulo')
      return date.format('DD/MM/YYYY')
    } catch (error) {
      console.error('Erro ao formatar data:', error)
      return 'Data inválida'
    }
  }

  const isDatePastBrazil = (dateString: string | null) => {
    if (!dateString) return false
    
    try {
      const dateBrazil = moment(dateString).tz('America/Sao_Paulo').startOf('day')
      const todayBrazil = moment().tz('America/Sao_Paulo').startOf('day')
      return dateBrazil.isBefore(todayBrazil)
    } catch (error) {
      console.error('Erro ao comparar data:', error)
      return false
    }
  }

  const isDateNearBrazil = (dateString: string | null) => {
    if (!dateString) return false
    
    try {
      const dateBrazil = moment(dateString).tz('America/Sao_Paulo').startOf('day')
      const todayBrazil = moment().tz('America/Sao_Paulo').startOf('day')
      const threeDaysFromNow = todayBrazil.clone().add(3, 'days')
      
      return dateBrazil.isSameOrAfter(todayBrazil) && dateBrazil.isSameOrBefore(threeDaysFromNow)
    } catch (error) {
      console.error('Erro ao verificar proximidade da data:', error)
      return false
    }
  }

  const isOverdue = task.dueDate && isDatePastBrazil(task.dueDate) && task.status !== 'COMPLETED'
  const isNearTarget = task.targetDate && isDateNearBrazil(task.targetDate) && task.status !== 'COMPLETED'

  const canShowCheckbox = () => {
    if (userRole === 'MANAGER' && onToggleSelect) {
      return true
    }
    return task.canDelete && onToggleSelect
  }

  const canShowDeleteButton = () => {
    return task.canDelete || (userRole === 'MANAGER' && (task.isCreator || task.canEdit))
  }

  const getStatusStyles = (status: Task['status']) => {
    switch (status) {
      case 'COMPLETED': return {
        border: 'border-r-green-500',
        bgHover: 'hover:bg-green-50'
      }
      case 'CANCELLED': return {
        border: 'border-r-red-500',
        bgHover: 'hover:bg-red-50'
      }
      case 'IN_PROGRESS': return {
        border: 'border-r-blue-500',
        bgHover: 'hover:bg-blue-50'
      }
      case 'ARCHIVED': return {
        border: 'border-r-gray-500',
        bgHover: 'hover:bg-gray-50',
        opacity: 'opacity-60'
      }
      case 'PENDING': return {
        border: 'border-r-gray-400',
        bgHover: 'hover:bg-gray-50'
      }
      default: return {
        border: 'border-r-gray-400',
        bgHover: 'hover:bg-gray-50'
      }
    }
  }

  const getPriorityStyles = (priority: Task['priority']) => {
    switch (priority) {
      case 'URGENT': return {
        text: 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700',
        icon: '🚨'
      }
      case 'HIGH': return {
        text: 'text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700',
        icon: '⚡'
      }
      case 'MEDIUM': return {
        text: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700',
        icon: '📋'
      }
      case 'LOW': return {
        text: 'text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600',
        icon: '📝'
      }
      default: return {
        text: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700',
        icon: '📋'
      }
    }
  }

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'IN_PROGRESS': return <Clock className="h-4 w-4 text-blue-600" />
      case 'CANCELLED': return <XCircle className="h-4 w-4 text-red-600" />
      case 'ARCHIVED': return <Archive className="h-4 w-4 text-gray-600" />
      default: return <Pause className="h-4 w-4 text-gray-600" />
    }
  }

  const statusStyles = getStatusStyles(task.status)
  const priorityStyles = getPriorityStyles(task.priority)

  const handleCardClick = () => {
    onViewDetails?.(task)
  }

  const handleInteractiveClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  console.log('TaskCard Debug:', {
    taskId: task.id,
    userRole,
    canDelete: task.canDelete,
    canEdit: task.canEdit,
    isCreator: task.isCreator,
    canShowCheckbox: canShowCheckbox(),
    hasOnToggleSelect: !!onToggleSelect
  })


  return (
    <div
      className={`
        bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 border-r-4 ${statusStyles.border} p-4
        transition-all duration-200 hover:shadow-lg hover:border-gray-300 dark:hover:border-slate-600 ${statusStyles.bgHover} ${statusStyles.opacity || ''}
        ${isSelected ? 'ring-2 ring-blue-500 dark:ring-cyan-500 bg-blue-50 dark:bg-cyan-900/20' : ''}
        ${task.status === 'COMPLETED' ? 'opacity-75' : ''}
        cursor-pointer group
      `}
      onClick={handleCardClick}
    >
      
      {/* HEADER COM CHECKBOX E PRIORIDADE */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* CHECKBOX CORRIGIDO - SEMPRE VISÍVEL PARA MANAGERS */}
          {canShowCheckbox() && (
            <div onClick={handleInteractiveClick}>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSelected || false}
                  onChange={(e) => {
                    e.stopPropagation()
                    onToggleSelect?.(task.id)
                  }}
                  className="w-5 h-5 text-blue-600 dark:text-cyan-500 bg-white dark:bg-slate-700 border-2 border-gray-300 dark:border-slate-600 rounded focus:ring-blue-500 dark:focus:ring-cyan-500 focus:ring-2 cursor-pointer"
                />
              </label>
            </div>
          )}
          
          {/* Status */}
          <div className="flex items-center gap-2">
            {getStatusIcon(task.status)}
            <span className={`status-${task.status.toLowerCase().replace('_', '-')} text-xs font-medium`}>
              {TaskStatusLabels[task.status]}
            </span>
          </div>
        </div>
        
        {/* PRIORIDADE + BOTÃO DELETE NO HOVER */}
        <div className="flex items-center gap-2">
           {/* ✅ NOVO: Exibindo o ID formatado no card */}
           <span className="text-xs font-mono bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 px-2 py-1 rounded">
             {displayId}
           </span>

          {/* Prioridade */}
          <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold border ${priorityStyles.text}`}>
            <span className="mr-1">{priorityStyles.icon}</span>
            {TaskPriorityLabels[task.priority]}
          </span>
          
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
            {/* BOTÃO DELETE (APENAS PARA ARQUIVADAS) */}
            {task.status === 'ARCHIVED' && canShowDeleteButton() && onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(task.id)
                }}
                className="p-1.5 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                title={task.status === 'ARCHIVED' ? "Excluir Permanentemente" : "Excluir tarefa"}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* O restante do componente permanece exatamente o mesmo, sem alterações */}
      {/* ... */}
      <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-3 line-clamp-2 text-base hover:text-blue-600 dark:hover:text-cyan-400 transition-colors">
        {task.title}
      </h3>

      <div className="space-y-2 mb-4 text-sm text-gray-600 dark:text-slate-400">
        <div className="space-y-1">
          {/* Criado por */}
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400 dark:text-slate-500" />
            <span className="text-xs text-gray-500 dark:text-slate-400">Criado por:</span>
            <div className="flex items-center gap-1">
              <span className="text-gray-700 dark:text-slate-300">{task.createdBy.name}</span>
              {task.isCreator && (
                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">Você</span>
              )}
            </div>
          </div>

          {/* Atribuído para */}
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-purple-400 dark:text-purple-500" />
            <span className="text-xs text-gray-500 dark:text-slate-400">Atribuído para:</span>
            <div className="flex items-center gap-1">
              <span className="text-gray-700 dark:text-slate-300">{task.assignedTo.name}</span>
              {task.isAssigned && (
                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded">Você</span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          {/* Data de vencimento */}
          {task.dueDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400 dark:text-slate-500" />
              <span className="text-xs text-gray-500 dark:text-slate-400">Vencimento:</span>
              <span className={isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-700 dark:text-slate-300'}>
                {formatDateBrazil(task.dueDate)}
                {isOverdue && (
                  <span className="ml-1 text-red-600 dark:text-red-400 text-xs font-bold animate-pulse">⚠️ Atrasada</span>
                )}
              </span>
            </div>
          )}

          {/* Data meta */}
          {task.targetDate && (
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              <span className="text-xs text-gray-500 dark:text-slate-400">Meta:</span>
              <span className={isNearTarget ? 'text-orange-600 dark:text-orange-400 font-medium' : 'text-gray-600 dark:text-slate-400'}>
                {formatDateBrazil(task.targetDate)}
                {isNearTarget && (
                  <span className="ml-1 text-orange-600 dark:text-orange-400 text-xs font-bold animate-pulse">🎯 Próxima</span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-slate-700">

        
        <div className="flex items-center gap-1 ml-auto" onClick={handleInteractiveClick}>
          {/* AÇÕES PARA TAREFAS ARQUIVADAS */}
          {task.status === 'ARCHIVED' && onUnarchive && canShowDeleteButton() && (
            <button
              onClick={(e) => { e.stopPropagation(); onUnarchive(task.id); }}
              className="flex items-center gap-2 text-sm bg-blue-600 dark:bg-cyan-600 hover:bg-blue-700 dark:hover:bg-cyan-700 text-white py-2 px-3 rounded-lg transition-colors font-medium"
            >
              <RotateCcw className="h-3 w-3" />
              Restaurar
            </button>
          )}


          {/* AÇÕES PARA TAREFAS ATIVAS */}
          {task.status !== 'ARCHIVED' && task.canChangeStatus && !task.canEdit && (
            <select
              value={task.status}
              onChange={(e) => onStatusChange?.(task.id, e.target.value as Task['status'])}
              className="text-sm border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:border-blue-300 dark:focus:border-cyan-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-cyan-900 focus:outline-none transition-all"
            >
              <option value="PENDING">⏳ Pendente</option>
              <option value="IN_PROGRESS">🔄 Em Progresso</option>
              <option value="COMPLETED">✅ Concluído</option>
            </select>
          )}
          
          {task.status !== 'ARCHIVED' && (task.canEdit || (userRole === 'MANAGER' && task.isCreator)) && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit?.(task.id)
              }}
              className="flex items-center gap-2 text-sm bg-blue-600 dark:bg-cyan-600 hover:bg-blue-700 dark:hover:bg-cyan-700 text-white py-2 px-3 rounded-lg transition-colors font-medium"
            >
              <Edit3 className="h-3 w-3" />
              Editar
            </button>
          )}
          
          {task.status !== 'ARCHIVED' && task.canEdit && task.canChangeStatus && (
            <select
              value={task.status}
              onChange={(e) => onStatusChange?.(task.id, e.target.value as Task['status'])}
              className="text-sm border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:border-blue-300 dark:focus:border-cyan-500 focus:ring-1 focus:ring-blue-100 dark:focus:ring-cyan-900 focus:outline-none transition-all ml-1"
              title="Alterar status"
            >
              <option value="PENDING">⏳ Pendente</option>
              <option value="IN_PROGRESS">🔄 Em Progresso</option>
              <option value="COMPLETED">✅ Concluído</option>
              <option value="CANCELLED">❌ Cancelada</option>
            </select>
          )}
        </div>
      </div>
    </div>
  )
}

export default TaskCard