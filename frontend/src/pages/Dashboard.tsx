// Dashboard - CORRIGIDO
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  CheckSquare,
  Clock,
  AlertCircle,
  Users,
  TrendingUp,
  Calendar,
  Bell,
  Target
} from 'lucide-react'

import Card from '../components/ui/Card'
import { useAuth } from '../contexts/AuthContext'
import { getTasks } from '../services/taskService'
import {  
  TaskStatusLabels, 
  TaskPriorityLabels, 
  TaskStatusColors, 
  TaskPriorityColors 
} from '../types'
import type { Task } from '../types'

const Dashboard: React.FC = () => {
  const { user } = useAuth()

  // Busca todas as tarefas para fazer estatísticas
  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => getTasks()
  })

  const tasks = tasksData?.tasks || []

  // Calcula estatísticas - CORRIGIDO: usando valores em inglês
  const stats = React.useMemo(() => {
    const pending = tasks.filter(t => t.status === 'PENDING').length
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length
    const completed = tasks.filter(t => t.status === 'COMPLETED').length
    const overdue = tasks.filter(t => {
      if (!t.dueDate) return false
      return new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED'
    }).length

    return { pending, inProgress, completed, overdue, total: tasks.length }
  }, [tasks])

  // Tarefas recentes (últimas 5)
  const recentTasks = React.useMemo(() => {
    return tasks
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  }, [tasks])

  const StatCard: React.FC<{
    title: string
    value: number
    icon: React.ElementType
    gradient: string
    description: string
  }> = ({ title, value, icon: Icon, gradient, description }) => (
    <Card className={`text-center ${gradient} card-hover interactive-scale`}>
      <div className="flex items-center justify-center mb-3">
        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
          <Icon className="h-8 w-8 text-current" />
        </div>
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm font-semibold mb-1">{title}</div>
      <div className="text-xs opacity-80">{description}</div>
    </Card>
  )

  const TaskItem: React.FC<{ task: Task }> = ({ task }) => {
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED'

    return (
      <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0 group hover:bg-gray-50 transition-colors rounded-lg px-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 truncate group-hover:text-rose-600 transition-colors">
            {task.title}
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            {user?.role === 'MANAGER' 
              ? `Atribuída para: ${task.assignedTo.name}`
              : `Criada por: ${task.createdBy.name}`
            }
          </p>
          {isOverdue && (
            <p className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Atrasada
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-4">
          {/* Badge de Prioridade */}
          <span className={`
            px-2.5 py-1 text-xs font-semibold rounded-lg border
            ${TaskPriorityColors[task.priority].bg} 
            ${TaskPriorityColors[task.priority].text} 
            ${TaskPriorityColors[task.priority].border}
          `}>
            {TaskPriorityLabels[task.priority]}
          </span>
          
          {/* Badge de Status */}
          <span className={`
            px-2.5 py-1 text-xs font-semibold rounded-lg border
            ${TaskStatusColors[task.status].bg} 
            ${TaskStatusColors[task.status].text} 
            ${TaskStatusColors[task.status].border}
          `}>
            {TaskStatusLabels[task.status]}
          </span>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-gray-200 rounded-xl w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center md:text-left">
        <h1 className="heading-xl flex items-center justify-center md:justify-start gap-4 mb-3">
          <div className="p-3 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl shadow-lg">
            <CheckSquare className="h-8 w-8 text-white" />
          </div>
          Olá, {user?.name}! 👋
        </h1>
        <p className="text-muted text-lg">
          Aqui está um resumo das suas tarefas hoje.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          title="Pendentes"
          value={stats.pending}
          icon={Clock}
          gradient="gradient-warning border-amber-200 text-amber-700"
          description="Aguardando início"
        />
        <StatCard
          title="Em Progresso"
          value={stats.inProgress}
          icon={TrendingUp}
          gradient="gradient-blue border-blue-200 text-blue-700"
          description="Sendo executadas"
        />
        <StatCard
          title="Concluídas"
          value={stats.completed}
          icon={CheckSquare}
          gradient="gradient-success border-green-200 text-green-700"
          description="Finalizadas"
        />
        <StatCard
          title="Atrasadas"
          value={stats.overdue}
          icon={AlertCircle}
          gradient="gradient-danger border-red-200 text-red-700"
          description="Passaram do prazo"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Tasks */}
        <Card className="shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="heading-md flex items-center gap-2">
              <Calendar className="h-6 w-6 text-rose-500" />
              Tarefas Recentes
            </h3>
            <span className="text-sm text-gray-500">{recentTasks.length} de {tasks.length}</span>
          </div>
          
          {recentTasks.length > 0 ? (
            <div className="space-y-0">
              {recentTasks.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <CheckSquare className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h4 className="font-medium text-gray-900 mb-2">Nenhuma tarefa encontrada</h4>
              <p className="text-sm">Suas tarefas aparecerão aqui</p>
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-lg">
          <h3 className="heading-md flex items-center gap-2 mb-6">
            <Target className="h-6 w-6 text-rose-500" />
            Ações Rápidas
          </h3>
          
          <div className="space-y-4">
            {user?.role === 'MANAGER' ? (
              <>
                <button 
                  onClick={() => window.location.href = '/tasks/create'}
                  className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-rose-200 hover:bg-rose-50 transition-all duration-200 interactive-scale group"
                >
                  <div className="flex items-center">
                    <div className="p-3 bg-rose-100 rounded-xl group-hover:bg-rose-200 transition-colors">
                      <CheckSquare className="h-6 w-6 text-rose-600" />
                    </div>
                    <div className="ml-4">
                      <p className="font-semibold text-gray-900 group-hover:text-rose-700">Nova Tarefa</p>
                      <p className="text-sm text-gray-500">Criar tarefa para um funcionário</p>
                    </div>
                  </div>
                </button>
                
                <button 
                  onClick={() => window.location.href = '/employees'}
                  className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-all duration-200 interactive-scale group"
                >
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="font-semibold text-gray-900 group-hover:text-blue-700">Ver Funcionários</p>
                      <p className="text-sm text-gray-500">Gerenciar equipe</p>
                    </div>
                  </div>
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => window.location.href = '/tasks'}
                  className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-rose-200 hover:bg-rose-50 transition-all duration-200 interactive-scale group"
                >
                  <div className="flex items-center">
                    <div className="p-3 bg-rose-100 rounded-xl group-hover:bg-rose-200 transition-colors">
                      <CheckSquare className="h-6 w-6 text-rose-600" />
                    </div>
                    <div className="ml-4">
                      <p className="font-semibold text-gray-900 group-hover:text-rose-700">Minhas Tarefas</p>
                      <p className="text-sm text-gray-500">Ver todas as tarefas atribuídas</p>
                    </div>
                  </div>
                </button>
                
                <button 
                  onClick={() => window.location.href = '/notifications'}
                  className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-amber-200 hover:bg-amber-50 transition-all duration-200 interactive-scale group"
                >
                  <div className="flex items-center">
                    <div className="p-3 bg-amber-100 rounded-xl group-hover:bg-amber-200 transition-colors">
                      <Bell className="h-6 w-6 text-amber-600" />
                    </div>
                    <div className="ml-4">
                      <p className="font-semibold text-gray-900 group-hover:text-amber-700">Notificações</p>
                      <p className="text-sm text-gray-500">Ver atualizações recentes</p>
                    </div>
                  </div>
                </button>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard