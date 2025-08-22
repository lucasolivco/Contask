import React, { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  CheckSquare,
  Clock,
  AlertCircle,
  Users,
  TrendingUp,
  Calendar,
  Bell,
  Target,
  CalendarPlus,
  AlertTriangle,
  Plus,
  Filter,
  Search,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Award,
  Timer,
  Eye,
  Settings
} from 'lucide-react'

import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
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
  const queryClient = useQueryClient()

  // ✅ LIMPAR CACHE QUANDO USUÁRIO MUDA
  useEffect(() => {
    if (user) {
      console.log(`🔄 Dashboard: Carregando dados para ${user.email}`);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  }, [user?.id, queryClient]);

  // ✅ QUERY COM USER ID NA KEY
  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: () => getTasks(),
    enabled: !!user,
    staleTime: 0,
  })

  const tasks = tasksData?.tasks || []

  // ✅ ESTATÍSTICAS SIMPLIFICADAS (APENAS NÚMEROS)
  const stats = React.useMemo(() => {
    if (!user || !tasks.length) return {
      pending: 0, inProgress: 0, completed: 0, overdue: 0, total: 0, urgentTasks: 0
    };

    const pending = tasks.filter(t => t.status === 'PENDING').length
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length
    const completed = tasks.filter(t => t.status === 'COMPLETED').length
    const overdue = tasks.filter(t => {
      if (!t.dueDate) return false
      return new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED'
    }).length

    const urgentTasks = tasks.filter(t => 
      t.priority === 'URGENT' && ['PENDING', 'IN_PROGRESS'].includes(t.status)
    ).length

    return { 
      pending, inProgress, completed, overdue, total: tasks.length, urgentTasks
    }
  }, [tasks, user?.id])

  // ✅ DADOS PARA GRÁFICO DE PIZZA CSS
  const chartData = React.useMemo(() => {
    if (stats.total === 0) return []
    
    return [
      { 
        name: 'Concluídas', 
        value: stats.completed, 
        percentage: Math.round((stats.completed / stats.total) * 100),
        color: '#10b981',
        textColor: 'text-emerald-700'
      },
      { 
        name: 'Em Progresso', 
        value: stats.inProgress, 
        percentage: Math.round((stats.inProgress / stats.total) * 100),
        color: '#3b82f6',
        textColor: 'text-blue-700'
      },
      { 
        name: 'Pendentes', 
        value: stats.pending, 
        percentage: Math.round((stats.pending / stats.total) * 100),
        color: '#6b7280',
        textColor: 'text-gray-700'
      },
      { 
        name: 'Atrasadas', 
        value: stats.overdue, 
        percentage: Math.round((stats.overdue / stats.total) * 100),
        color: '#ef4444',
        textColor: 'text-red-700'
      },
    ].filter(item => item.value > 0)
  }, [stats])

  // ✅ COMPONENTE DE GRÁFICO PIZZA CSS COM TOOLTIP
  const PieChartCSS: React.FC = () => {
    const [hoveredSegment, setHoveredSegment] = React.useState<number | null>(null)

    if (chartData.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <PieChart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="font-medium">Nenhuma tarefa encontrada</p>
            <p className="text-sm">Os dados aparecerão aqui</p>
          </div>
        </div>
      )
    }

    // Calcular ângulos para cada segmento
    let currentAngle = 0
    const segments = chartData.map(item => {
      const angle = (item.percentage / 100) * 360
      const startAngle = currentAngle
      currentAngle += angle
      return { ...item, startAngle, angle }
    })

    // Criar path SVG para cada segmento
    const createPath = (startAngle: number, angle: number) => {
      const centerX = 120
      const centerY = 120
      const radius = 80
      
      const startAngleRad = (startAngle - 90) * (Math.PI / 180)
      const endAngleRad = (startAngle + angle - 90) * (Math.PI / 180)
      
      const x1 = centerX + radius * Math.cos(startAngleRad)
      const y1 = centerY + radius * Math.sin(startAngleRad)
      const x2 = centerX + radius * Math.cos(endAngleRad)
      const y2 = centerY + radius * Math.sin(endAngleRad)
      
      const largeArc = angle > 180 ? 1 : 0
      
      return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`
    }

    return (
      <div className="h-64 relative">
        <div className="flex items-center justify-center h-full">
          <div className="relative">
            {/* SVG Pie Chart */}
            <svg width="240" height="240" className="transform rotate-0">
              {segments.map((segment, index) => (
                <path
                  key={index}
                  d={createPath(segment.startAngle, segment.angle)}
                  fill={segment.color}
                  className="hover:opacity-80 transition-all duration-200 cursor-pointer"
                  style={{ 
                    filter: hoveredSegment === index 
                      ? 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.2))' 
                      : 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
                    transform: hoveredSegment === index ? 'scale(1.05)' : 'scale(1)',
                    transformOrigin: '120px 120px'
                  }}
                  onMouseEnter={() => setHoveredSegment(index)}
                  onMouseLeave={() => setHoveredSegment(null)}
                />
              ))}
              {/* Centro branco */}
              <circle
                cx="120"
                cy="120"
                r="40"
                fill="white"
                className="drop-shadow-sm"
              />
              {/* Texto central */}
              <text
                x="120"
                y="115"
                textAnchor="middle"
                className="text-xl font-bold fill-gray-700"
              >
                {stats.total}
              </text>
              <text
                x="120"
                y="130"
                textAnchor="middle"
                className="text-xs fill-gray-500"
              >
                Total
              </text>
            </svg>

            {/* ✅ TOOLTIP COM NÚMEROS */}
            {hoveredSegment !== null && (
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg z-10">
                <div className="text-center">
                  <div className="font-semibold">{chartData[hoveredSegment].name}</div>
                  <div className="text-xs opacity-90">
                    {chartData[hoveredSegment].value} tarefa{chartData[hoveredSegment].value !== 1 ? 's' : ''} ({chartData[hoveredSegment].percentage}%)
                  </div>
                </div>
                {/* Seta do tooltip */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            )}
          </div>
        </div>
        
        {/* Legenda */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          {chartData.map((item, index) => (
            <div 
              key={index} 
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
              onMouseEnter={() => setHoveredSegment(index)}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              <div 
                className="w-3 h-3 rounded-full transition-transform"
                style={{ 
                  backgroundColor: item.color,
                  transform: hoveredSegment === index ? 'scale(1.2)' : 'scale(1)'
                }}
              />
              <span className="text-xs text-gray-600">
                {item.name} ({item.value})
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ✅ TAREFAS PRIORITÁRIAS E RECENTES
  const priorityTasks = React.useMemo(() => {
    if (!user || !tasks.length) return [];
    
    return tasks
      .filter(t => ['PENDING', 'IN_PROGRESS'].includes(t.status))
      .filter(t => t.priority === 'URGENT' || (t.dueDate && new Date(t.dueDate) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)))
      .sort((a, b) => {
        const priorityOrder = { 'URGENT': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 }
        const priorityA = priorityOrder[a.priority] ?? 4
        const priorityB = priorityOrder[b.priority] ?? 4
        return priorityA - priorityB
      })
      .slice(0, 5)
  }, [tasks, user?.id])

  const recentTasks = React.useMemo(() => {
    if (!user || !tasks.length) return [];
    
    return tasks
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  }, [tasks, user?.id])

  // ✅ COMPONENTE DE ESTATÍSTICA NO ESTILO PREFERIDO (SEM HOVER)
  const StatCard: React.FC<{
    title: string
    value: number | string
    icon: React.ElementType
    color: string
    description: string
    trend?: number
  }> = ({ title, value, icon: Icon, color, description, trend }) => (
    <Card className="relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2.5 rounded-xl bg-opacity-10 ${color.replace('text-', 'bg-')}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <h3 className="text-sm font-semibold text-gray-600">{title}</h3>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{description}</p>
            {trend !== undefined && (
              <div className={`flex items-center gap-1 text-xs ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <TrendingUp className="h-3 w-3" />
                <span>{trend > 0 ? '+' : ''}{trend}% vs semana passada</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )

  // ✅ COMPONENTE DE TAREFA MELHORADO
  const TaskItem: React.FC<{ task: Task; showPriority?: boolean }> = ({ task, showPriority = true }) => {
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED'
    const isUrgent = task.priority === 'URGENT'

    return (
      <div className={`
        flex items-center justify-between py-3 px-3 rounded-lg transition-all duration-200 
        ${isOverdue ? 'bg-red-50 border border-red-200' : 'hover:bg-gray-50'}
        ${isUrgent ? 'border-l-4 border-l-purple-500' : ''}
      `}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`text-sm font-semibold truncate ${isOverdue ? 'text-red-700' : 'text-gray-900'}`}>
              {task.title}
            </h4>
            {isUrgent && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                URGENTE
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>
              {user?.role === 'MANAGER' 
                ? `Para: ${task.assignedTo.name}`
                : `Por: ${task.createdBy.name}`
              }
            </span>
            {task.dueDate && (
              <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                <Calendar className="inline h-3 w-3 mr-1" />
                {isOverdue ? 'Venceu' : 'Vence'}: {new Date(task.dueDate).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-3">
          {showPriority && (
            <span className={`
              px-2 py-1 text-xs font-medium rounded
              ${TaskPriorityColors[task.priority].bg} 
              ${TaskPriorityColors[task.priority].text}
            `}>
              {TaskPriorityLabels[task.priority]}
            </span>
          )}
          <span className={`
            px-2 py-1 text-xs font-medium rounded
            ${TaskStatusColors[task.status].bg} 
            ${TaskStatusColors[task.status].text}
          `}>
            {TaskStatusLabels[task.status]}
          </span>
        </div>
      </div>
    )
  }

  // ✅ AÇÕES RÁPIDAS BASEADAS EM UX
  const QuickAction: React.FC<{
    title: string
    description: string
    icon: React.ElementType
    onClick: () => void
    color: string
    badge?: string
  }> = ({ title, description, icon: Icon, onClick, color, badge }) => (
    <button 
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border border-gray-200 hover:border-opacity-60 transition-all duration-200 interactive-scale group ${color}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="p-3 rounded-xl group-hover:scale-110 transition-transform">
            <Icon className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900">{title}</p>
              {badge && (
                <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                  {badge}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
      </div>
    </button>
  )

  // ✅ LOADING MELHORADO
  if (!user) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados do usuário...</p>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="h-96 bg-gray-200 rounded-2xl"></div>
            <div className="h-96 bg-gray-200 rounded-2xl"></div>
            <div className="h-96 bg-gray-200 rounded-2xl"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      {/* ✅ HEADER MELHORADO */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="heading-xl flex items-center gap-4 mb-2">
            <div className="p-3 bg-gradient-to-br from-yellow-400 to-yellow-300 rounded-2xl shadow-lg">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            Olá, {user?.name}!
          </h1>
          <p className="text-muted text-lg">
            {user?.role === 'MANAGER' 
              ? `Gerencie sua equipe e acompanhe o progresso das ${stats.total} tarefas.`
              : `Você tem ${stats.pending + stats.inProgress} tarefas ativas para trabalhar.`
            }
          </p>
        </div>
        
        {user?.role === 'MANAGER' && (
          <div className="flex gap-3">
            <Button 
              onClick={() => window.location.href = '/tasks/create'} 
              size="lg"
              className="btn-primary"
            >
              <Plus className="h-5 w-5" />
              Nova Tarefa
            </Button>
            <Button 
              onClick={() => window.location.href = '/tasks'} 
              variant="secondary"
              size="lg"
            >
              <Eye className="h-5 w-5" />
              Ver Todas
            </Button>
          </div>
        )}
      </div>

      {/* ✅ ESTATÍSTICAS PRINCIPAIS - ESTILO PREFERIDO SEM HOVER */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Tarefas"
          value={stats.total}
          icon={Target}
          color="text-blue-500"
          description="Todas as tarefas"
        />
        <StatCard
          title="Concluídas"
          value={stats.completed}
          icon={CheckSquare}
          color="text-green-500"
          description="Tarefas finalizadas"
        />
        <StatCard
          title="Pendentes"
          value={stats.pending}
          icon={Clock}
          color="text-yellow-500"
          description="Aguardando início"
        />
        <StatCard
          title="Em Progresso"
          value={stats.inProgress}
          icon={Activity}
          color="text-orange-500"
          description="Sendo executadas"
        />
      </div>

      {/* ✅ GRID PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ✅ GRÁFICO DE PIZZA CSS COM TOOLTIP */}
        <Card className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="h-6 w-6 text-blue-500" />
            <h3 className="heading-md">Distribuição de Tarefas</h3>
          </div>
          <PieChartCSS />
        </Card>

        {/* ✅ TAREFAS PRIORITÁRIAS */}
        <Card className="lg:col-span-1">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
              <h3 className="heading-md">Tarefas Prioritárias</h3>
            </div>
            <span className="text-sm text-gray-500">{priorityTasks.length} urgentes</span>
          </div>
          
          {priorityTasks.length > 0 ? (
            <div className="space-y-3 max-h-72 overflow-y-auto scrollbar-modern">
              {priorityTasks.map((task) => (
                <TaskItem key={task.id} task={task} showPriority={false} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckSquare className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="font-medium">Nenhuma tarefa urgente</p>
              <p className="text-sm">Tudo sob controle! 🎉</p>
            </div>
          )}
        </Card>

        {/* ✅ AÇÕES RÁPIDAS EXPANDIDAS */}
        <Card className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="h-6 w-6 text-purple-500" />
            <h3 className="heading-md">Ações Rápidas</h3>
          </div>
          
          <div className="space-y-3">
            {user?.role === 'MANAGER' ? (
              <>
                <QuickAction
                  title="Nova Tarefa"
                  description="Criar tarefa para equipe"
                  icon={Plus}
                  onClick={() => window.location.href = '/tasks/create'}
                  color="hover:bg-blue-50 hover:border-blue-200"
                />
                <QuickAction
                  title="Ver Funcionários"
                  description="Gerenciar equipe"
                  icon={Users}
                  onClick={() => window.location.href = '/employees'}
                  color="hover:bg-green-50 hover:border-green-200"
                />
                <QuickAction
                  title="Todas as Tarefas"
                  description="Visualizar e filtrar"
                  icon={CheckSquare}
                  onClick={() => window.location.href = '/tasks'}
                  color="hover:bg-purple-50 hover:border-purple-200"
                />
                <QuickAction
                  title="Notificações"
                  description="Ver atualizações"
                  icon={Bell}
                  onClick={() => window.location.href = '/notifications'}
                  color="hover:bg-yellow-50 hover:border-yellow-200"
                />
              </>
            ) : (
              <>
                <QuickAction
                  title="Minhas Tarefas"
                  description="Ver todas as tarefas"
                  icon={CheckSquare}
                  onClick={() => window.location.href = '/tasks'}
                  color="hover:bg-blue-50 hover:border-blue-200"
                  badge={stats.pending > 0 ? `${stats.pending}` : undefined}
                />
                <QuickAction
                  title="Tarefas Atrasadas"
                  description="Resolver pendências"
                  icon={AlertCircle}
                  onClick={() => window.location.href = '/tasks?overdue=true'}
                  color="hover:bg-red-50 hover:border-red-200"
                  badge={stats.overdue > 0 ? `${stats.overdue}` : undefined}
                />
                <QuickAction
                  title="Notificações"
                  description="Ver atualizações"
                  icon={Bell}
                  onClick={() => window.location.href = '/notifications'}
                  color="hover:bg-yellow-50 hover:border-yellow-200"
                />
                <QuickAction
                  title="Progresso Pessoal"
                  description="Suas estatísticas"
                  icon={Activity}
                  onClick={() => window.location.href = '/profile'}
                  color="hover:bg-purple-50 hover:border-purple-200"
                />
              </>
            )}
          </div>
        </Card>
      </div>

      {/* ✅ TAREFAS RECENTES */}
      {recentTasks.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-indigo-500" />
              <h3 className="heading-md">Atividade Recente</h3>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.location.href = '/tasks'}
            >
              Ver todas →
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {recentTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

export default Dashboard