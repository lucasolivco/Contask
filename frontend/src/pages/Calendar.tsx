// frontend/src/pages/Calendar.tsx - QUERY CORRIGIDA
import React, { useState, useMemo, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  User,
  Target,
  Plus
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

const Calendar: React.FC = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // ✅ LIMPAR ESTADO QUANDO USUÁRIO MUDA
  useEffect(() => {
    if (user) {
      console.log(`🔄 Calendário: Carregando dados para ${user.email}`)
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    }
  }, [user?.id, queryClient])

  // ✅ QUERY CORRIGIDA - SEGUINDO EXATO PADRÃO DE TASKS.TSX
  const { data: tasksData, isLoading, error } = useQuery({
    queryKey: ['tasks', user?.id, 'calendar'],
    queryFn: () => getTasks({}), // ✅ Mesmo padrão
    enabled: !!user, // ✅ Mesmo padrão
    staleTime: 0, // ✅ Mesmo padrão
    gcTime: 1000 * 60 * 5, // ✅ Mesmo padrão
    // ✅ REMOVIDO onError - não existe no React Query v4+
  })

  // ✅ TRATAMENTO DE ERRO COM useEffect (como no padrão do projeto)
  useEffect(() => {
    if (error) {
      toast.error('Erro ao carregar tarefas do calendário')
    }
  }, [error])

  const tasks = tasksData?.tasks || []

  // ✅ RESTO DO CÓDIGO PERMANECE IGUAL - Agrupar tarefas por data de meta
  const tasksByDate = useMemo(() => {
    if (!tasks.length) return {}
    
    const grouped: Record<string, Task[]> = {}
    
    tasks.forEach((task: Task) => {
      if (task.dueDate) {
        const dateKey = new Date(task.dueDate).toDateString()
        if (!grouped[dateKey]) {
          grouped[dateKey] = []
        }
        grouped[dateKey].push(task)
      }
    })
    
    return grouped
  }, [tasks])

  // Navegação do calendário
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
  }

  // Gerar dias do calendário
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const current = new Date(startDate)
    
    for (let i = 0; i < 42; i++) { // 6 semanas
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    
    return days
  }

  const calendarDays = generateCalendarDays()
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth()
  }

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString()
  }

  const getTasksForDate = (date: Date) => {
    return tasksByDate[date.toDateString()] || []
  }

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'LOW': return 'bg-slate-400'
      case 'MEDIUM': return 'bg-blue-500'
      case 'HIGH': return 'bg-orange-500'
      case 'URGENT': return 'bg-purple-500'
      default: return 'bg-gray-400'
    }
  }

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="w-3 h-3 text-emerald-600" />
      case 'IN_PROGRESS': return <Clock className="w-3 h-3 text-blue-600" />
      case 'PENDING': return <AlertCircle className="w-3 h-3 text-slate-600" />
      default: return null
    }
  }

  const isOverdue = (task: Task) => {
    if (!task.dueDate || task.status === 'COMPLETED') return false
    return new Date(task.dueDate) < new Date()
  }

  // Estatísticas do mês
  const monthStats = useMemo(() => {
    if (!tasks.length) return {
      totalTasks: 0,
      withDueDate: 0,
      overdue: 0,
      completed: 0
    }
    
    const totalTasks = tasks.length
    const withDueDate = tasks.filter((task: Task) => task.dueDate).length
    const overdue = tasks.filter((task: Task) => 
      task.dueDate && task.status !== 'COMPLETED' && new Date(task.dueDate) < new Date()
    ).length
    const completed = tasks.filter((task: Task) => task.status === 'COMPLETED').length

    return { totalTasks, withDueDate, overdue, completed }
  }, [tasks])

  // ✅ COMPONENTE DE ESTATÍSTICA SEGUINDO PADRÃO DO PROJETO
  const StatCard: React.FC<{
    title: string
    value: number
    icon: React.ElementType
    color: string
    description: string
  }> = ({ title, value, icon: Icon, color, description }) => {

    const getColors = (colorClass: string) => {
      const colorMap: { [key: string]: { bg: string, iconBg: string, icon: string, text: string, value: string } } = {
        'text-blue-500': {
          bg: 'bg-blue-50 dark:bg-cyan-900/30',
          iconBg: 'bg-blue-100 dark:bg-cyan-800/50',
          icon: 'text-blue-600 dark:text-cyan-400',
          text: 'text-blue-700 dark:text-cyan-300',
          value: 'text-blue-900 dark:text-cyan-200'
        },
        'text-emerald-500': {
          bg: 'bg-green-50 dark:bg-green-900/30',
          iconBg: 'bg-green-100 dark:bg-green-800/50',
          icon: 'text-green-600 dark:text-green-400',
          text: 'text-green-700 dark:text-green-300',
          value: 'text-green-900 dark:text-green-200'
        },
        'text-red-500': {
          bg: 'bg-red-50 dark:bg-red-900/30',
          iconBg: 'bg-red-100 dark:bg-red-800/50',
          icon: 'text-red-600 dark:text-red-400',
          text: 'text-red-700 dark:text-red-300',
          value: 'text-red-900 dark:text-red-200'
        },
        'text-purple-500': {
          bg: 'bg-purple-50 dark:bg-purple-900/30',
          iconBg: 'bg-purple-100 dark:bg-purple-800/50',
          icon: 'text-purple-600 dark:text-purple-400',
          text: 'text-purple-700 dark:text-purple-300',
          value: 'text-purple-900 dark:text-purple-200'
        }
      }
      return colorMap[colorClass] || {
        bg: 'bg-gray-50 dark:bg-slate-900/30',
        iconBg: 'bg-gray-100 dark:bg-slate-800/50',
        icon: 'text-gray-600 dark:text-slate-400',
        text: 'text-gray-700 dark:text-slate-300',
        value: 'text-gray-900 dark:text-slate-200'
      }
    }

    const colors = getColors(color)

    const getBorderColor = (colorClass: string) => {
      const borderMap: { [key: string]: string } = {
        'text-blue-500': 'border-blue-200 dark:border-cyan-700',
        'text-emerald-500': 'border-green-200 dark:border-green-700',
        'text-red-500': 'border-red-200 dark:border-red-700',
        'text-purple-500': 'border-purple-200 dark:border-purple-700'
      }
      return borderMap[colorClass] || 'border-gray-200 dark:border-slate-700'
    }

    return (
      <Card className={`relative overflow-hidden ${colors.bg} ${getBorderColor(color)}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 ${colors.iconBg} rounded-lg`}>
            <Icon className={`h-5 w-5 ${colors.icon}`} />
          </div>
          <div>
            <p className={`text-2xl font-bold ${colors.value}`}>{value}</p>
            <p className={`text-sm ${colors.text}`}>{description}</p>
          </div>
        </div>
      </Card>
    )
  }

  // ✅ TRATAMENTO DE ERRO SEGUINDO PADRÃO DO PROJETO
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl">
          Erro ao carregar tarefas. Tente novamente.
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-slate-400">Carregando dados do usuário...</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-8">
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-gray-200 dark:bg-slate-700 rounded-xl w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-slate-700 rounded-2xl"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 dark:bg-slate-700 rounded-2xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8 animate-fade-in scrollbar-modern">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="heading-xl flex items-center gap-4 mb-2 text-gray-900 dark:text-slate-100">
            <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg">
              <CalendarIcon className="h-8 w-8 text-white" />
            </div>
            Calendário de Tarefas
          </h1>
          <p className="text-muted text-lg text-gray-600 dark:text-slate-400">
            Visualize as datas de meta das suas tarefas de forma organizada
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={goToToday}
            variant="secondary"
            size="lg"
          >
            Hoje
          </Button>
          
          {user?.role === 'MANAGER' && (
            <Button 
              onClick={() => navigate('/tasks/create')} 
              size="lg"
              className="btn-primary"
            >
              <Plus className="h-5 w-5" />
              Nova Tarefa
            </Button>
          )}
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Tarefas"
          value={monthStats.totalTasks}
          icon={Target}
          color="text-purple-500"
          description="Todas as tarefas"
        />
        <StatCard
          title="Com Data de Meta"
          value={monthStats.withDueDate}
          icon={CalendarIcon}
          color="text-blue-500"
          description="Tarefas agendadas"
        />
        <StatCard
          title="Concluídas"
          value={monthStats.completed}
          icon={CheckCircle}
          color="text-emerald-500"
          description="Tarefas finalizadas"
        />
        <StatCard
          title="Atrasadas"
          value={monthStats.overdue}
          icon={AlertCircle}
          color="text-red-500"
          description="Necessitam atenção"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Calendário Principal */}
        <div className="xl:col-span-3">
          <Card className="overflow-hidden">
            {/* Header do Calendário */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 border-b dark:border-slate-700">
              <Button
                variant="ghost"
                onClick={goToPreviousMonth}
                className="p-2"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>

              <Button
                variant="ghost"
                onClick={goToNextMonth}
                className="p-2"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Dias da Semana */}
            <div className="grid grid-cols-7 border-b dark:border-slate-700">
              {dayNames.map((day: string) => (
                <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-700/50">
                  {day}
                </div>
              ))}
            </div>

            {/* Dias do Calendário */}
            <div className="grid grid-cols-7">
              {calendarDays.map((date: Date, index: number) => {
                const tasks = getTasksForDate(date)
                const hasOverdue = tasks.some((task: Task) => isOverdue(task))
                
                return (
                  <div
                    key={index}
                    onClick={() => setSelectedDate(date)}
                    className={`
                      min-h-24 p-2 border-r dark:border-slate-700 border-b dark:border-slate-700 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/50
                      ${!isCurrentMonth(date) ? 'text-gray-400 dark:text-slate-600 bg-gray-50 dark:bg-slate-800/50' : ''}
                      ${isToday(date) ? 'bg-blue-50 dark:bg-cyan-900/20' : ''}
                      ${isSelected(date) ? 'bg-blue-100 dark:bg-cyan-900/30' : ''}
                    `}
                  >
                    <div className={`
                      text-sm font-medium mb-1
                      ${isToday(date) ? 'text-blue-600 dark:text-cyan-400' : 'dark:text-slate-300'}
                      ${hasOverdue ? 'text-red-600 dark:text-red-400' : ''}
                    `}>
                      {date.getDate()}
                    </div>

                    {/* Indicadores de Tarefas */}
                    <div className="space-y-1">
                      {tasks.slice(0, 3).map((task: Task) => (
                        <div
                          key={task.id}
                          className={`
                            text-xs p-1 rounded truncate flex items-center gap-1
                            ${isOverdue(task) ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                              task.status === 'COMPLETED' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300' :
                              'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'}
                          `}
                        >
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                          <span className="truncate">{task.title}</span>
                        </div>
                      ))}
                      
                      {tasks.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{tasks.length - 3} mais
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        {/* Sidebar com Detalhes */}
        <div className="space-y-6">
          {/* Tarefas do Dia Selecionado */}
          {selectedDate && (
            <Card>
              <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-3">
                {selectedDate.toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h3>

              <div className="space-y-3">
                {getTasksForDate(selectedDate).length === 0 ? (
                  <div className="text-center py-6 text-gray-500 dark:text-slate-400">
                    <CalendarIcon className="mx-auto h-8 w-8 text-gray-300 dark:text-slate-600 mb-2" />
                    <p className="font-medium text-sm">Nenhuma tarefa para este dia</p>
                  </div>
                ) : (
                  getTasksForDate(selectedDate).map((task: Task) => (
                    <div
                      key={task.id}
                      className={`
                        p-3 rounded-lg border-l-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors
                        ${isOverdue(task) ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20' :
                          task.status === 'COMPLETED' ? 'border-emerald-500 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' :
                          'border-blue-500 dark:border-cyan-500 bg-blue-50 dark:bg-cyan-900/20'}
                      `}
                      onClick={() => navigate('/tasks')}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(task.status)}
                        <span className="font-medium text-sm truncate text-gray-900 dark:text-slate-100">{task.title}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400">
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                        <span className="capitalize">{TaskPriorityLabels[task.priority]}</span>

                        {task.assignedTo && (
                          <>
                            <span>•</span>
                            <User className="w-3 h-3" />
                            <span className="truncate">{task.assignedTo.name}</span>
                          </>
                        )}
                      </div>

                      {isOverdue(task) && (
                        <div className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                          ⚠️ Atrasada
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}

          {/* Legenda */}
          <Card>
            <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-3">Legenda</h3>

            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Prioridades:</div>
              <div className="space-y-2 text-sm text-gray-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                  <span>Baixa</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Média</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span>Alta</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span>Urgente</span>
                </div>
              </div>

              <div className="border-t dark:border-slate-700 pt-3 mt-3">
                <div className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Status:</div>
                <div className="space-y-2 text-sm text-gray-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Concluída</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-blue-600 dark:text-cyan-400" />
                    <span>Em Progresso</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                    <span>Pendente</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Calendar