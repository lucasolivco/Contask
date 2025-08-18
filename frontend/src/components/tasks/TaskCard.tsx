import { Calendar, User, AlertTriangle, Clock, CheckCircle2, XCircle, Pause, ArrowRight } from 'lucide-react'
import {  
  TaskStatusLabels, 
  TaskPriorityLabels, 
  TaskStatusIcons,
} from '../../types'
import type { Task } from '../../types'

interface TaskCardProps {
  task: Task
  onClick?: () => void
  onStatusChange: (taskId: string, newStatus: Task["status"]) => void
  userRole: string
}

const TaskCard = ({ task, onClick, onStatusChange, userRole }: TaskCardProps) => {
  // CORRIGIDO: verificação usando valor em inglês
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED'
  
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

  // Ícones por status - CORRIGIDO: usando valores em inglês
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
      onClick={onClick}
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
          <span className={priorityClasses.badge}>
            <span className="mr-1">{priorityClasses.icon}</span>
            {TaskPriorityLabels[task.priority]}
          </span>
        </div>
      </div>

      {/* Título da tarefa */}
      <h3 className="heading-sm mb-3 line-clamp-2 group-hover:text-rose-700 transition-colors">
        {task.title}
      </h3>

      {/* Descrição */}
      {task.description && (
        <p className="text-muted text-sm mb-4 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Informações detalhadas */}
      <div className="space-y-3 mb-4">
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

      {/* Status selector para funcionários - CORRIGIDO: valores em inglês */}
      {userRole === 'EMPLOYEE' && onStatusChange && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Atualizar Status:
            </label>
            <select
              value={task.status}
              onChange={(e) => {
                e.stopPropagation()
                onStatusChange(task.id, e.target.value as Task["status"])
              }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:border-rose-300 focus:ring-2 focus:ring-rose-100 focus:outline-none transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="PENDING">{TaskStatusIcons.PENDING} {TaskStatusLabels.PENDING}</option>
              <option value="IN_PROGRESS">{TaskStatusIcons.IN_PROGRESS} {TaskStatusLabels.IN_PROGRESS}</option>
              <option value="COMPLETED">{TaskStatusIcons.COMPLETED} {TaskStatusLabels.COMPLETED}</option>
            </select>
          </div>
        </div>
      )}

      {/* Indicador de interação */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowRight className="h-4 w-4 text-rose-500" />
      </div>
    </div>
  )
}

export default TaskCard