// frontend/src/components/tasks/TaskCard.tsx - ATUALIZADO COM PERMISSÕES
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
  Crown // ✅ ADICIONAR para indicar managers
} from 'lucide-react'
import moment from 'moment-timezone'
import {  
  TaskStatusLabels, 
  TaskPriorityLabels
} from '../../types'
import type { Task } from '../../types'

// ✅ INTERFACE ATUALIZADA PARA SUPORTAR PERMISSÕES
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
  
  // ✅ FUNÇÃO UNIVERSAL PARA FORMATAR DATAS (UTC -> Brasil)
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

  // ✅ FUNÇÃO PARA VERIFICAR SE DATA PASSOU (UTC -> Brasil)
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

  // ✅ FUNÇÃO CORRIGIDA PARA VERIFICAR PROXIMIDADE (TAMBÉM COM MOMENT)
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

  // ✅ USAR AS FUNÇÕES CORRIGIDAS
  const isOverdue = task.dueDate && isDatePastBrazil(task.dueDate) && task.status !== 'COMPLETED'
  const isNearTarget = task.targetDate && isDateNearBrazil(task.targetDate) && task.status !== 'COMPLETED'

  // ✅ getStatusStyles MANTIDO
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

  // ✅ CORES DE PRIORIDADE MANTIDAS
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

  // ✅ getStatusIcon MANTIDO
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
          {/* ✅ CHECKBOX APENAS PARA QUEM PODE DELETAR (CRIADORES) */}
          {task.canDelete && onToggleSelect && (
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

      {/* ✅ INFORMAÇÕES COM INDICADORES DE ROLE */}
      <div className="space-y-2 mb-4 text-sm text-gray-600">
        {/* ✅ MOSTRAR INFORMAÇÕES BASEADAS NA PERSPECTIVA */}
        <div className="space-y-1">
          {/* Criado por */}
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-xs text-gray-500">Criado por:</span>
            <div className="flex items-center gap-1">
              <span className="text-gray-700">{task.createdBy.name}</span>
              {task.isCreator && (
                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Você</span>
              )}
            </div>
          </div>
          
          {/* Atribuído para */}
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-purple-400" />
            <span className="text-xs text-gray-500">Atribuído para:</span>
            <div className="flex items-center gap-1">
              <span className="text-gray-700">{task.assignedTo.name}</span>
              {task.isAssigned && (
                <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Você</span>
              )}
            </div>
          </div>
        </div>

        {/* ✅ DATAS FORMATADAS CORRETAMENTE */}
        <div className="space-y-1">
          {/* Data de vencimento */}
          {task.dueDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-500">Vencimento:</span>
              <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-700'}>
                {formatDateBrazil(task.dueDate)}
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
                {formatDateBrazil(task.targetDate)}
                {isNearTarget && (
                  <span className="ml-1 text-orange-600 text-xs font-bold animate-pulse">🎯 Próxima</span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ✅ AÇÕES BASEADAS EM PERMISSÕES */}
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
        
        {/* ✅ AÇÕES BASEADAS EM PERMISSÕES (NÃO EM ROLE) */}
        <div className="flex items-center gap-1">
          {/* ✅ DROPDOWN DE STATUS - APENAS PARA QUEM PODE ALTERAR STATUS */}
          {task.canChangeStatus && !task.canEdit && (
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
          
          {/* ✅ BOTÕES DE EDITAR/EXCLUIR - APENAS PARA CRIADORES */}
          {task.canEdit && (
            <>
              {/* Botão Delete */}
              {task.canDelete && onDelete && (
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
            </>
          )}
          
          {/* ✅ CASO ESPECIAL: CRIADOR QUE TAMBÉM É ATRIBUÍDO */}
          {task.canEdit && task.canChangeStatus && (
            <select
              value={task.status}
              onChange={(e) => {
                e.stopPropagation()
                onStatusChange?.(task.id, e.target.value as Task['status'])
              }}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:border-blue-300 focus:ring-1 focus:ring-blue-100 focus:outline-none transition-all bg-white ml-1"
              onClick={(e) => e.stopPropagation()}
              title="Alterar status"
            >
              <option value="PENDING">⏳ Pendente</option>
              <option value="IN_PROGRESS">🔄 Em Progresso</option>
              <option value="COMPLETED">✅ Concluído</option>
              <option value="CANCELLED">❌ Cancelada</option>
            </select>
          )}
        </div>
        
        {/* ✅ INDICADOR DE PERMISSÃO (SUTIL) */}
        <div className="text-xs text-gray-400 ml-auto">
          {task.isCreator && task.isAssigned} {/* Criador e atribuído */}
          {task.isCreator && !task.isAssigned} {/* Apenas criador */}
          {!task.isCreator && task.isAssigned} {/* Apenas atribuído */}
        </div>
      </div>
    </div>
  )
}

export default TaskCard