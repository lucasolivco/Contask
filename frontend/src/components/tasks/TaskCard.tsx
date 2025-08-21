import { Calendar, User, AlertTriangle, Clock, CheckCircle2, XCircle, Pause, ArrowRight, CalendarPlus, Edit3, Target, MessageCircle } from 'lucide-react'
import {  
  TaskStatusLabels, 
  TaskPriorityLabels, 
  TaskStatusIcons, 
  TaskPriorityIcons
} from '../../types'
import type { Task } from '../../types'
import TaskDetailsModal from './TaskDetailsModal'

interface TaskCardProps {
  task: Task
  onClick?: () => void
  onStatusChange?: (taskId: string, newStatus: Task['status']) => void
  userRole: string
  onEdit?: (taskId: string) => void
  onViewDetails?: (task: Task) => void // ✅ NOVO
}

const TaskCard = ({ task, onClick, onStatusChange, userRole, onEdit, onViewDetails }: TaskCardProps) => {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED'
  
  // ✅ NOVO: Verificar se está próximo da data meta
  const isNearTarget = task.targetDate && new Date(task.targetDate) < new Date() && task.status !== 'COMPLETED'
  
  // Função para obter classes de prioridade
  const getPriorityClasses = (priority: Task['priority']) => {
    switch (priority) {
      case 'URGENT': return {
        badge: 'priority-urgent',
        card: 'card-urgent',
        icon: '🚨'
      }
      case 'HIGH': return {
        badge: 'priority-high',
        card: 'card-high',
        icon: '⚡'
      }
      case 'MEDIUM': return {
        badge: 'priority-medium',
        card: 'card-medium',
        icon: '📋'
      }
      case 'LOW': return {
        badge: 'priority-low',
        card: 'card-low',
        icon: '📝'
      }
      default: return {
        badge: 'priority-medium',
        card: 'card-medium',
        icon: '📋'
      }
    }
  }

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'IN_PROGRESS': return <Clock className="h-4 w-4 text-blue-600" />
      case 'CANCELLED': return <XCircle className="h-4 w-4 text-gray-600" />
      default: return <Pause className="h-4 w-4 text-slate-600" />
    }
  }

  const priorityClasses = getPriorityClasses(task.priority)

  return (
    <div 
      className={`
        card card-hover interactive-scale animate-fade-in relative
        ${priorityClasses.card}
        ${isOverdue ? 'card-overdue' : ''}
        ${task.status === 'COMPLETED' ? 'opacity-75' : ''}
        group
      `}
    >
      {/* Header com status e prioridade */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          {getStatusIcon(task.status)}
          <span className={`status-${task.status.toLowerCase().replace('_', '-')}`}>
            {TaskStatusLabels[task.status]}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {isOverdue && (
            <span className="badge-overdue">
              <AlertTriangle className="h-3 w-3" />
              Atrasada
            </span>
          )}
          {/* ✅ NOVO: Badge para data meta próxima */}
          {isNearTarget && !isOverdue && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
              <Target className="h-3 w-3" />
              Meta
            </span>
          )}
          <span className={priorityClasses.badge}>
            <span className="mr-1">{priorityClasses.icon}</span>
            {TaskPriorityLabels[task.priority]}
          </span>
        </div>
      </div>

      {/* Título da tarefa - CLICÁVEL PARA DETALHES */}
      <div onClick={onClick} className="cursor-pointer">
        <h3 className="heading-sm mb-3 line-clamp-2 group-hover:text-rose-700 transition-colors">
          {task.title}
        </h3>

        {/* Descrição */}
        {task.description && (
          <p className="text-muted text-sm mb-4 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* ✅ CORRIGIDO: Informações detalhadas com data meta */}
        <div className="space-y-3 mb-4">
          {/* Data de criação */}
          <div className="flex items-center gap-2 text-sm text-subtle">
            <CalendarPlus className="h-4 w-4 text-gray-400" />
            <span>
              Criada em {new Date(task.createdAt).toLocaleDateString('pt-BR')}
            </span>
          </div>

          {/* ✅ CORRIGIDO: Data meta - mostrar se existir */}
          {task.targetDate && (
            <div className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-blue-500" />
              <span className={isNearTarget ? 'text-amber-600 font-medium' : 'text-blue-600'}>
                Meta: {new Date(task.targetDate).toLocaleDateString('pt-BR')}
                {isNearTarget && ' (próxima)'}
              </span>
            </div>
          )}

          {/* Data de vencimento */}
          {task.dueDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className={isOverdue ? 'text-red-600 font-medium' : 'text-subtle'}>
                {isOverdue ? 'Venceu em' : 'Vence em'} {new Date(task.dueDate).toLocaleDateString('pt-BR')}
              </span>
            </div>
          )}

          {/* Atribuído para */}
          <div className="flex items-center gap-2 text-sm text-subtle">
            <User className="h-4 w-4 text-gray-400" />
            <span>
              {userRole === 'MANAGER' ? (
                `Atribuído para ${task.assignedTo.name}`
              ) : (
                `Criado por ${task.createdBy.name}`
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Ações - DIFERENTES PARA MANAGER E EMPLOYEE */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between gap-3">
          {/* ✅ Ver Detalhes - Disponível para AMBOS */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onViewDetails?.(task)
            }}
            className="flex-1 text-sm text-blue-600 hover:text-blue-700 py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Ver Detalhes
          </button>
          
          {/* ✅ Ações específicas por papel */}
          {userRole === 'MANAGER' ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit?.(task.id)
              }}
              className="flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors font-medium"
            >
              <Edit3 className="h-3 w-3" />
              Editar
            </button>
          ) : (
            <select
              value={task.status}
              onChange={(e) => {
                e.stopPropagation()
                onStatusChange?.(task.id, e.target.value as Task['status'])
              }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:border-rose-300 focus:ring-2 focus:ring-rose-100 focus:outline-none transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="PENDING">⏳ Pendente</option>
              <option value="IN_PROGRESS">🔄 Em Progresso</option>
              <option value="COMPLETED">✅ Completada</option>
            </select>
          )}
        </div>
      </div>

      {/* Indicador de interação */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowRight className="h-4 w-4 text-rose-500" />
      </div>
    </div>
  )
}

export default TaskCard