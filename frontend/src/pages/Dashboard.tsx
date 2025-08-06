// Dashboard - página inicial com resumo das informações
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  CheckSquare,
  Clock,
  AlertCircle,
  Users,
  TrendingUp,
  Calendar,
  Bell
} from 'lucide-react'

import Card from '../components/ui/Card'
import { useAuth } from '../contexts/AuthContext'
import { getTasks } from '../services/taskService'
import type { Task } from '../types'

const Dashboard: React.FC = () => {
  const { user } = useAuth()

  // Busca todas as tarefas para fazer estatísticas
  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => getTasks()
  })

  const tasks = tasksData?.tasks || []

  // Calcula estatísticas
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
    color: string
    description: string
  }> = ({ title, value, icon: Icon, color, description }) => (
    <Card>
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
    </Card>
  )

  const TaskItem: React.FC<{ task: Task }> = ({ task }) => {
    const priorityColors = {
      LOW: 'bg-green-100 text-green-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HIGH: 'bg-orange-100 text-orange-800',
      URGENT: 'bg-red-100 text-red-800'
    }

    const statusColors = {
      PENDING: 'bg-gray-100 text-gray-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800'
    }

    return (
      <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {task.title}
          </h4>
          <p className="text-xs text-gray-500">
            {user?.role === 'MANAGER' 
              ? `Atribuída para: ${task.assignedTo.name}`
              : `Criada por: ${task.createdBy.name}`
            }
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[task.priority]}`}>
            {task.priority}
          </span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[task.status]}`}>
            {task.status}
          </span>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Olá, {user?.name}! 👋
        </h1>
        <p className="text-gray-600">
          Aqui está um resumo das suas tarefas hoje.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Pendentes"
          value={stats.pending}
          icon={Clock}
          color="bg-yellow-500"
          description="Aguardando início"
        />
        <StatCard
          title="Em Progresso"
          value={stats.inProgress}
          icon={TrendingUp}
          color="bg-blue-500"
          description="Sendo executadas"
        />
        <StatCard
          title="Concluídas"
          value={stats.completed}
          icon={CheckSquare}
          color="bg-green-500"
          description="Finalizadas"
        />
        <StatCard
          title="Atrasadas"
          value={stats.overdue}
          icon={AlertCircle}
          color="bg-red-500"
          description="Passaram do prazo"
        />
      </div>

      {/* Recent Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Tarefas Recentes
            </h3>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          
          {recentTasks.length > 0 ? (
            <div className="space-y-0">
              {recentTasks.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckSquare className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2">Nenhuma tarefa encontrada</p>
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Ações Rápidas
          </h3>
          
          <div className="space-y-3">
            {user?.role === 'MANAGER' ? (
              <>
                <button 
                  onClick={() => window.location.href = '/tasks/create'}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <CheckSquare className="h-5 w-5 text-primary-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Nova Tarefa</p>
                      <p className="text-sm text-gray-500">Criar tarefa para um funcionário</p>
                    </div>
                  </div>
                </button>
                
                <button 
                  onClick={() => window.location.href = '/employees'}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-primary-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Ver Funcionários</p>
                      <p className="text-sm text-gray-500">Gerenciar equipe</p>
                    </div>
                  </div>
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => window.location.href = '/tasks'}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <CheckSquare className="h-5 w-5 text-primary-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Minhas Tarefas</p>
                      <p className="text-sm text-gray-500">Ver todas as tarefas atribuídas</p>
                    </div>
                  </div>
                </button>
                
                <button 
                  onClick={() => window.location.href = '/notifications'}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <Bell className="h-5 w-5 text-primary-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Notificações</p>
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