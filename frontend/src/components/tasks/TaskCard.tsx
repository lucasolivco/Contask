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
  
  // ✅ FUNÇÃO CORRIGIDA PARA FORMATAR DATAS SEM PROBLEMA DE TIMEZONE
  const formatDateLocal = (dateString: string) => {
    if (!dateString) return ''
    
    try {
      // Extrair apenas a parte da data (YYYY-MM-DD) se vier no formato ISO completo
      const dateOnly = dateString.split('T')[0]
      
      // Separar ano, mês e dia
      const [year, month, day] = dateOnly.split('-')
      
      // Criar data local explicitamente (mês - 1 porque Date usa índice 0-11)
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      
      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        console.warn('Data inválida:', dateString)
        return 'Data inválida'
      }
      
      // Retornar formatação brasileira
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      })
    } catch (error) {
      console.error('Erro ao formatar data:', error)
      return 'Erro na data'
    }
  }

  // ✅ FUNÇÃO CORRIGIDA PARA COMPARAÇÃO DE DATAS
  const isDatePast = (dateString: string) => {
    if (!dateString) return false
    
    try {
      // Extrair apenas a parte da data
      const dateOnly = dateString.split('T')[0]
      const [year, month, day] = dateOnly.split('-')
      
      // Criar data local
      const targetDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      return targetDate < today
    } catch (error) {
      console.error('Erro ao comparar data:', error)
      return false
    }
  }

  // ✅ FUNÇÃO CORRIGIDA PARA VERIFICAR PROXIMIDADE
  const isDateNear = (dateString: string) => {
    if (!dateString) return false
    
    try {
      // Extrair apenas a parte da data
      const dateOnly = dateString.split('T')[0]
      const [year, month, day] = dateOnly.split('-')
      
      // Criar data local
      const targetDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const threeDaysFromNow = new Date(today)
      threeDaysFromNow.setDate(today.getDate() + 3)
      
      return targetDate >= today && targetDate <= threeDaysFromNow
    } catch (error) {
      console.error('Erro ao verificar proximidade da data:', error)
      return false
    }
  }

  // ✅ CORRIGIR TODAS AS VERIFICAÇÕES PARA INGLÊS
  const isOverdue = task.dueDate && isDatePast(task.dueDate) && task.status !== 'COMPLETED'
  const isNearTarget = task.targetDate && isDateNear(task.targetDate) && task.status !== 'COMPLETED'

  // ✅ CORRIGIR getStatusStyles PARA INGLÊS
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

  // ✅ CORES DE PRIORIDADE (PARA OS BADGES) - MANTIDAS
  const getPriorityStyles = (priority: Task['priority']) => {
    switch (priority) {
      case 'URGENT': return {
        text: 'text-purple-700 bg-purple-50 border-purple-200',
        icon: '🚨'
      }
      case 'HIGH': return {
        text: 'text-orange-700 bg-orange-50 border-orange-200',
        icon: '⚡'
      }
      case 'MEDIUM': return {
        text: 'text-blue-700 bg-blue-50 border-blue-200',
        icon: '📋'
      }
      case 'LOW': return {
        text: 'text-slate-700 bg-slate-50 border-slate-200',
        icon: '📝'
      }
      default: return {
        text: 'text-blue-700 bg-blue-50 border-blue-200',
        icon: '📋'
      }
    }
  }

  // ✅ CORRIGIR getStatusIcon PARA INGLÊS
  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'IN_PROGRESS': return <Clock className="h-4 w-4 text-blue-600" />
      case 'CANCELLED': return <XCircle className="h-4 w-4 text-red-600" />
      default: return <Pause className="h-4 w-4 text-gray-600" />
    }
  }

  const statusStyles = getStatusStyles(task.status)
  const priorityStyles = getPriorityStyles(task.priority)

  return (
    <div className={`
      bg-white rounded-xl border border-gray-200 border-r-4 ${statusStyles.border} p-4 
      transition-all duration-200 hover:shadow-lg hover:border-gray-300 ${statusStyles.bgHover}
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
        
        {/* ✅ PRIORIDADE (BADGE) - CORES MANTIDAS */}
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

        {/* ✅ DATAS FORMATADAS CORRETAMENTE */}
        <div className="space-y-1">
          {/* Data de vencimento */}
          {task.dueDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-500">Vencimento:</span>
              <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-700'}>
                {formatDateLocal(task.dueDate)}
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
              <span className={isNearTarget ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                {formatDateLocal(task.targetDate)}
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
          Acessar
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
            <option value="COMPLETED">✅ Concluído</option>
          </select>
        )}
      </div>
    </div>
  )
}

export default TaskCard