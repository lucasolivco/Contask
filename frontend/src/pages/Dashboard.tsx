// frontend/src/pages/Dashboard.tsx - APENAS PRIORIDADE EM TAREFAS PRIORITÁRIAS

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
import { useNavigate } from 'react-router-dom'
import moment from 'moment-timezone'

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  
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

  // ✅ DADOS PARA GRÁFICO COM CORES BALANCEADAS
  const chartData = React.useMemo(() => {
    if (stats.total === 0) return []
    
    return [
      { 
        name: 'Concluídas', 
        value: stats.completed, 
        percentage: Math.round((stats.completed / stats.total) * 100),
        color: '#22c55e', // Verde mais saturado
        textColor: 'text-emerald-700'
      },
      { 
        name: 'Em Progresso', 
        value: stats.inProgress, 
        percentage: Math.round((stats.inProgress / stats.total) * 100),
        color: '#3b82f6', // Azul balanceado
        textColor: 'text-blue-700'
      },
      { 
        name: 'Pendentes', 
        value: stats.pending, 
        percentage: Math.round((stats.pending / stats.total) * 100),
        color: '#9ca3af', // Cinza médio
        textColor: 'text-gray-700'
      },
      { 
        name: 'Atrasadas', 
        value: stats.overdue, 
        percentage: Math.round((stats.overdue / stats.total) * 100),
        color: '#f43f5e', // Rosa mais vibrante
        textColor: 'text-rose-700'
      },
    ].filter(item => item.value > 0)
  }, [stats])

  // ✅ COMPONENTE DE GRÁFICO PIZZA COM CORES BALANCEADAS
  const PieChartCSS: React.FC = () => {
    if (chartData.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <PieChart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-sm">Nenhuma tarefa encontrada</p>
            <p className="text-xs">Os dados aparecerão aqui</p>
          </div>
        </div>
      )
    }

    // ✅ GARANTIR QUE FATIAS PEQUENAS SEJAM VISÍVEIS (MÍNIMO 5%)
    const adjustedChartData = chartData.map(item => ({
      ...item,
      displayPercentage: Math.max(item.percentage, 5)
    }))

    // ✅ RECALCULAR TOTAL DOS PERCENTUAIS AJUSTADOS
    const totalAdjusted = adjustedChartData.reduce((sum, item) => sum + item.displayPercentage, 0)

    // ✅ NORMALIZAR PERCENTUAIS PARA TOTALIZAR 100%
    const normalizedData = adjustedChartData.map(item => ({
      ...item,
      normalizedPercentage: (item.displayPercentage / totalAdjusted) * 100
    }))

    // ✅ CALCULAR ÂNGULOS CORRIGIDOS
    let currentAngle = 0
    const segments = normalizedData.map((item, index) => {
      const angle = (item.normalizedPercentage / 100) * 360
      const startAngle = currentAngle
      currentAngle += angle
      
      return { 
        ...item, 
        startAngle, 
        angle: Math.max(angle, 18) // Mínimo 18 graus (5% de 360°)
      }
    })

    // ✅ FUNÇÃO PARA CRIAR PATH MAIS ROBUSTA
    const createPath = (startAngle: number, angle: number) => {
      const centerX = 80
      const centerY = 80
      const radius = 55
      
      // Converter para radianos
      const startRad = ((startAngle - 90) * Math.PI) / 180
      const endRad = ((startAngle + angle - 90) * Math.PI) / 180
      
      // Calcular pontos
      const x1 = centerX + radius * Math.cos(startRad)
      const y1 = centerY + radius * Math.sin(startRad)
      const x2 = centerX + radius * Math.cos(endRad)
      const y2 = centerY + radius * Math.sin(endRad)
      
      // Flag para arco grande (>180°)
      const largeArcFlag = angle > 180 ? 1 : 0
      
      // Criar path
      if (angle >= 360) {
        // Círculo completo
        return `M ${centerX} ${centerY} m -${radius} 0 a ${radius} ${radius} 0 1 1 ${radius * 2} 0 a ${radius} ${radius} 0 1 1 -${radius * 2} 0`
      } else {
        // Fatia normal
        return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
      }
    }

    return (
      <div className="h-64">
        <div className="flex flex-col h-full">
          
          {/* ✅ GRÁFICO COM CORES BALANCEADAS */}
          <div className="flex-1 flex items-center justify-center">
            <svg width="160" height="160" className="drop-shadow-sm">
              {/* ✅ RENDERIZAR FATIAS COM CORES BALANCEADAS */}
              {segments.map((segment, index) => (
                <path
                  key={`segment-${index}`}
                  d={createPath(segment.startAngle, segment.angle)}
                  fill={segment.color}
                  stroke="white"
                  strokeWidth="3"
                  className="transition-opacity duration-200 hover:opacity-80"
                  style={{ 
                    filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1))'
                  }}
                />
              ))}
              
              {/* ✅ CENTRO BRANCO */}
              <circle
                cx="80"
                cy="80"
                r="30"
                fill="white"
                stroke="#f3f4f6"
                strokeWidth="2"
                className="drop-shadow-sm"
              />
              
              {/* ✅ TEXTO CENTRAL */}
              <text
                x="80"
                y="76"
                textAnchor="middle"
                className="text-xl font-bold fill-gray-700"
              >
                {stats.total}
              </text>
              <text
                x="80"
                y="90"
                textAnchor="middle"
                className="text-xs fill-gray-500"
              >
                Total
              </text>
            </svg>
          </div>
          
          {/* ✅ LEGENDA COM CORES BALANCEADAS */}
          <div className="mt-3 space-y-2">
            {chartData.map((item, index) => (
              <div 
                key={`legend-${index}`}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0 border-2 border-white shadow-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-700 font-medium">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-bold text-gray-900">{item.value}</span>
                  <span className="text-gray-500">({item.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
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

  // ✅ COMPONENTE DE ESTATÍSTICA MANTIDO
  const StatCard: React.FC<{
    title: string
    value: number | string
    icon: React.ElementType
    color: string
    description: string
    trend?: number
  }> = ({ title, value, icon: Icon, color, description, trend }) => {
    
    // ✅ MAPEAMENTO CORRETO DE CORES DE FUNDO PARA ÍCONES
    const getIconBackground = (colorClass: string) => {
      const colorMap: { [key: string]: string } = {
        'text-blue-500': 'bg-blue-100',
        'text-green-500': 'bg-green-100', 
        'text-orange-500': 'bg-orange-100',
        'text-purple-500': 'bg-purple-100',
        'text-red-500': 'bg-red-100',
        'text-yellow-500': 'bg-yellow-100',
        'text-indigo-500': 'bg-indigo-100',
        'text-pink-500': 'bg-pink-100',
        'text-gray-500': 'bg-gray-100',
      }
      return colorMap[colorClass] || 'bg-gray-100'
    }

    return (
      <Card className="relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {/* ✅ ÍCONE COM FUNDO GARANTIDO */}
              <div className={`p-2.5 rounded-xl ${getIconBackground(color)} transition-transform hover:scale-105 duration-200`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                {title}
              </h3>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 font-medium">{description}</p>
              {trend !== undefined && (
                <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <TrendingUp className={`h-3 w-3 ${trend < 0 ? 'rotate-180' : ''}`} />
                  <span>{trend > 0 ? '+' : ''}{trend}% vs semana passada</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    )
  }

  // ✅ COMPONENTE DE TAREFA COM CONTROLE DE EXIBIÇÃO
  const TaskItem: React.FC<{ 
    task: Task; 
    showPriority?: boolean;
    showStatus?: boolean;
  }> = ({ task, showPriority = true, showStatus = true }) => {
    const isOverdue = task.dueDate && 
      moment(task.dueDate).tz('America/Sao_Paulo').isBefore(moment().tz('America/Sao_Paulo'), 'day') && 
      task.status !== 'COMPLETED'
    const isUrgent = task.priority === 'URGENT'

    return (
      <div 
        onClick={() => navigate('/tasks', { state: { openTaskId: task.id } })}
        className={`
        flex items-center justify-between py-3 px-3 rounded-lg transition-all duration-200 
        border border-gray-100 hover:border-gray-200 hover:bg-gray-50 cursor-pointer
        ${isOverdue ? 'border-rose-200 bg-rose-50/30' : ''}
        ${isUrgent && !isOverdue ? 'border-purple-200 bg-purple-50/30' : ''}
      `}
      title={`Clique para ver detalhes de "${task.title}"`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {/* ✅ TÍTULO LIMPO SEM TAGS */}
            <h4 className="text-sm font-semibold truncate text-gray-900">
              {task.title}
            </h4>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>
              {user?.role === 'MANAGER' 
                ? `Para: ${task.assignedTo.name}`
                : `Por: ${task.createdBy.name}`
              }
            </span>
            {task.dueDate && (
              <span className={isOverdue ? 'text-rose-600 font-medium' : 'text-gray-500'}>
                <Calendar className="inline h-3 w-3 mr-1" />
                {isOverdue ? 'Venceu' : 'Vence'}: {moment(task.dueDate).tz('America/Sao_Paulo').format('DD/MM/YYYY')}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-3">
          {/* ✅ BADGE DE PRIORIDADE CONDICIONAL */}
          {showPriority && (
            <span className={`
              px-2 py-1 text-xs font-medium rounded-full border
              ${task.priority === 'URGENT' ? 'bg-purple-100 text-purple-700 border-purple-200' : ''}
              ${task.priority === 'HIGH' ? 'bg-orange-100 text-orange-700 border-orange-200' : ''}
              ${task.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-700 border-blue-200' : ''}
              ${task.priority === 'LOW' ? 'bg-gray-100 text-gray-700 border-gray-200' : ''}
            `}>
              {/* ✅ MOSTRAR "URGENTE" NO LUGAR DE "ALTA" QUANDO FOR URGENT */}
              {task.priority === 'URGENT' ? 'URGENTE' : TaskPriorityLabels[task.priority]}
            </span>
          )}
          
          {/* ✅ BADGE DE STATUS CONDICIONAL */}
          {showStatus && (
            <span className={`
              px-2 py-1 text-xs font-medium rounded-full border
              ${task.status === 'PENDING' ? 'bg-gray-100 text-gray-700 border-gray-200' : ''}
              ${task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700 border-blue-200' : ''}
              ${task.status === 'COMPLETED' ? 'bg-green-100 text-green-700 border-green-200' : ''}
              ${task.status === 'CANCELLED' ? 'bg-gray-100 text-gray-600 border-gray-200' : ''}
            `}>
              {TaskStatusLabels[task.status]}
            </span>
          )}
        </div>
      </div>
    )
  }

  // ✅ LOADING MELHORADO (MANTIDO)
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
      {/* ✅ HEADER MELHORADO (MANTIDO) */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="heading-xl flex items-center gap-4 mb-2">
            <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg">
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
        
      </div>

      {/* ✅ ESTATÍSTICAS PRINCIPAIS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Tarefas"
          value={stats.total}
          icon={Target}
          color="text-pink-500"
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
          color="text-gray-500"
          description="Aguardando início"
        />
        <StatCard
          title="Em Progresso"
          value={stats.inProgress}
          icon={Activity}
          color="text-blue-500"
          description="Sendo executadas"
        />
      </div>

      {/* ✅ GRID PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ✅ GRÁFICO DE PIZZA COM CORES BALANCEADAS */}
        <Card className="lg:col-span-1 min-h-96">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="h-6 w-6 text-blue-500" />
            <h3 className="heading-md">Distribuição de Tarefas</h3>
          </div>
          <PieChartCSS />
        </Card>

        {/* ✅ TAREFAS PRIORITÁRIAS - APENAS PRIORIDADE */}
        <Card className="lg:col-span-1 min-h-96">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-rose-500" />
              <h3 className="heading-md">Tarefas Prioritárias</h3>
            </div>
            <span className="text-sm text-gray-500">{priorityTasks.length} urgentes</span>
          </div>
          
          {priorityTasks.length > 0 ? (
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {priorityTasks.map((task) => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  showPriority={true}
                  showStatus={false}
                />
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

        {/* ✅ ATIVIDADE RECENTE - PRIORIDADE E STATUS */}
        <Card className="lg:col-span-1 min-h-96">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-blue-500" />
              <h3 className="heading-md">Atividade Recente</h3>
            </div>
            <span className="text-sm text-gray-500">{recentTasks.length} tarefas</span>
          </div>
          
          {recentTasks.length > 0 ? (
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {recentTasks.map((task) => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  showPriority={true}
                  showStatus={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="font-medium">Nenhuma atividade recente</p>
              <p className="text-sm">Comece criando uma tarefa!</p>
            </div>
          )}
          
          {/* ✅ BOTÃO PARA VER TODAS AS TAREFAS */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.location.href = '/tasks'}
              className="w-full"
            >
              Ver todas as tarefas →
            </Button>
          </div>
        </Card>
      </div>

    </div>
  )
}

export default Dashboard