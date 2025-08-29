// frontend/src/components/employees/EmployeeDetailsModal.tsx - BARRA DE PROGRESSO CORRIGIDA

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  X, Mail, Calendar, CheckSquare, Clock, AlertTriangle, Target, Activity, FileText, Star, BarChart3, Award, User
} from 'lucide-react'

import Button from '../ui/Button'
import Card from '../ui/Card'
import Portal from '../ui/Portal'
import { getEmployeeDetails } from '../../services/taskService'
import type { Task, UserDetailsResponse } from '../../types'
import { 
  TaskStatusLabels, 
  TaskPriorityLabels, 
  TaskStatusColors, 
  TaskPriorityColors, 
} from '../../types'

interface Employee {
  id: string
  name: string
  email: string
  role: 'MANAGER' | 'EMPLOYEE'
  _count?: {
    assignedTasks: number
  }
}

interface EmployeeDetailsModalProps {
  employee: Employee
  isOpen: boolean
  onClose: () => void
}

const EmployeeDetailsModal: React.FC<EmployeeDetailsModalProps> = ({
  employee,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'history'>('overview')
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'completed' | 'overdue' | 'in_progress'>('all')

  // ✅ QUERY CORRIGIDA
  const { data: employeeDetails, isLoading, error } = useQuery<UserDetailsResponse>({
    queryKey: ['user-details', employee.id, employee.role],
    queryFn: () => getEmployeeDetails(employee.id),
    enabled: isOpen,
    staleTime: 1000 * 60 * 2,
    retry: 1
  })

  // ✅ PROCESSAR DADOS COM VERIFICAÇÃO SEGURA
  const tasks: Task[] = React.useMemo(() => {
    if (!employeeDetails?.tasks || !Array.isArray(employeeDetails.tasks)) {
      return []
    }
    return employeeDetails.tasks
  }, [employeeDetails?.tasks])
  
  const stats = React.useMemo(() => {
    if (!employeeDetails?.stats) {
      return {
        totalTasks: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
        completionRate: 0,
        cancelledTasks: 0
      }
    }

    const rawStats = employeeDetails.stats
    return {
      totalTasks: rawStats.totalTasks || 0,
      pendingTasks: rawStats.pendingTasks || 0,
      inProgressTasks: rawStats.inProgressTasks || 0,
      completedTasks: rawStats.completedTasks || 0,
      overdueTasks: rawStats.overdueTasks || 0,
      completionRate: rawStats.completionRate || 0,
      cancelledTasks: rawStats.cancelledTasks || 0,
      priorityBreakdown: rawStats.priorityBreakdown,
      recentTasks: rawStats.recentTasks,
      avgTasksPerMonth: rawStats.avgTasksPerMonth
    }
  }, [employeeDetails?.stats])

  // ✅ DEBUG LOGS
  React.useEffect(() => {
    if (employeeDetails) {
      console.log(`🎯 Modal Debug - ${employee.name} (${employee.role}):`)
      console.log('   📊 Stats:', stats)
      console.log('   📋 Tasks:', tasks.length)
      console.log('   📈 Completion Rate:', stats.completionRate)
    }
  }, [employeeDetails, employee.name, employee.role, stats, tasks.length])

  // ✅ FECHAR COM ESC
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const filteredTasks = React.useMemo(() => {
    if (taskFilter === 'all') return tasks
    if (taskFilter === 'pending') return tasks.filter(t => t.status === 'PENDING')
    if (taskFilter === 'in_progress') return tasks.filter(t => t.status === 'IN_PROGRESS')
    if (taskFilter === 'completed') return tasks.filter(t => t.status === 'COMPLETED')
    if (taskFilter === 'overdue') {
      const now = new Date()
      return tasks.filter(t => 
        t.dueDate && 
        new Date(t.dueDate) < now && 
        ['PENDING', 'IN_PROGRESS'].includes(t.status)
      )
    }
    return tasks
  }, [tasks, taskFilter])

  const TaskItem: React.FC<{ task: Task }> = ({ task }) => {
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED'
    
    return (
      <div className={`border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow ${
        isOverdue ? 'border-red-200 bg-red-50' : ''
      }`}>
        <div className="space-y-2 sm:space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 line-clamp-2 text-sm sm:text-base">{task.title}</h4>
              {task.description && (
                <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
              )}
              {/* ✅ MOSTRAR QUEM CRIOU A TAREFA */}
              <p className="text-xs text-gray-500 mt-1">
                Criada por: {task.createdBy.name}
              </p>
            </div>
            <span className={`
              px-2 py-1 text-xs font-medium rounded whitespace-nowrap w-fit
              ${TaskStatusColors[task.status]?.bg || 'bg-gray-50'} 
              ${TaskStatusColors[task.status]?.text || 'text-gray-700'}
            `}>
              {TaskStatusLabels[task.status] || task.status}
            </span>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className={`
                px-2 py-1 rounded text-xs
                ${TaskPriorityColors[task.priority]?.bg || 'bg-gray-50'} 
                ${TaskPriorityColors[task.priority]?.text || 'text-gray-700'}
              `}>
                {TaskPriorityLabels[task.priority] || task.priority}
              </span>
              
              {task._count && task._count.attachments > 0 && (
                <div className="flex items-center gap-1 text-gray-500">
                  <FileText className="h-3 w-3" />
                  <span>{task._count.attachments}</span>
                </div>
              )}
            </div>
            
            {task.dueDate && (
              <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                <Calendar className="h-3 w-3" />
                <span className="text-xs">{new Date(task.dueDate).toLocaleDateString('pt-BR')}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!isOpen) return null

  const roleLabels = {
    title: employee.role === 'MANAGER' ? 'Detalhes do Manager' : 'Detalhes do Funcionário',
    taskDescription: employee.role === 'MANAGER' 
      ? 'Tarefas atribuídas a este manager' 
      : 'Tarefas atribuídas a este funcionário',
    emptyTasks: employee.role === 'MANAGER'
      ? 'Este manager não possui tarefas atribuídas'
      : 'Este funcionário não possui tarefas atribuídas',
    performanceText: employee.role === 'MANAGER'
      ? 'Essa taxa representa a eficiência na conclusão de tarefas atribuídas a este manager.'
      : 'Essa taxa representa a eficiência na conclusão de tarefas atribuídas a este funcionário.'
  }

  return (
    <Portal>
      <div 
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl sm:max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className={`h-12 w-12 sm:h-16 sm:w-16 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 ${
                employee.role === 'MANAGER'
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                  : 'bg-gradient-to-br from-emerald-500 to-green-600'
              }`}>
                <span className="text-lg sm:text-2xl font-bold text-white">
                  {employee.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 line-clamp-1">
                  <span className="truncate">{employee.name}</span>
                  {stats.completionRate >= 80 && (
                    <span className="text-yellow-500 flex-shrink-0" title="Top Performer">
                      <Star className="h-4 w-4 sm:h-5 sm:w-5" />
                    </span>
                  )}
                </h2>
                <div className="flex items-center text-gray-600 mt-1 text-sm sm:text-base">
                  <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="truncate">{employee.email}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    employee.role === 'MANAGER'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    <User className="h-3 w-3 mr-1" />
                    {employee.role === 'MANAGER' ? 'Manager' : 'Colaborador'}
                  </span>
                  
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    stats.completionRate >= 80 
                      ? 'bg-green-100 text-green-700'
                      : stats.completionRate >= 50
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    <Award className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">{stats.completionRate}% de conclusão</span>
                    <span className="sm:hidden">{stats.completionRate}%</span>
                  </span>
                </div>
              </div>
            </div>
            
            <Button variant="ghost" size="sm" onClick={onClose} className="self-start sm:self-center flex-shrink-0">
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50">
            {[
              { key: 'overview', label: 'Visão Geral', shortLabel: 'Visão', icon: BarChart3 },
              { key: 'tasks', label: `Tarefas (${tasks.length})`, shortLabel: `Tarefas (${tasks.length})`, icon: CheckSquare },
              { key: 'history', label: 'Histórico', shortLabel: 'Histórico', icon: Activity }
            ].map(({ key, label, shortLabel, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === key
                    ? 'border-b-2 border-blue-500 text-blue-600 bg-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{shortLabel}</span>
              </button>
            ))}
          </div>

          {/* Conteúdo */}
          <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-12rem)] sm:max-h-[60vh]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600 text-sm sm:text-base">Carregando detalhes...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertTriangle className="h-8 w-8 sm:h-12 sm:w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-700 mb-2">Erro ao carregar dados</h3>
                <p className="text-red-600 mb-4">
                  {error instanceof Error ? error.message : 'Erro desconhecido'}
                </p>
                <Button 
                  onClick={() => window.location.reload()} 
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Recarregar Página
                </Button>
              </div>
            ) : (
              <>
                {activeTab === 'overview' && (
                  <div className="space-y-4 sm:space-y-6">
                    {/* Grid de estatísticas */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      <Card className="text-center bg-blue-50 border-blue-200 p-3 sm:p-4">
                        <Target className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mx-auto mb-2" />
                        <div className="text-xl sm:text-2xl font-bold text-blue-900">{stats.totalTasks}</div>
                        <div className="text-xs sm:text-sm text-blue-700">Total</div>
                      </Card>
                      
                      <Card className="text-center bg-yellow-50 border-yellow-200 p-3 sm:p-4">
                        <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600 mx-auto mb-2" />
                        <div className="text-xl sm:text-2xl font-bold text-yellow-900">{stats.pendingTasks}</div>
                        <div className="text-xs sm:text-sm text-yellow-700">Pendentes</div>
                      </Card>
                      
                      <Card className="text-center bg-green-50 border-green-200 p-3 sm:p-4">
                        <CheckSquare className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 mx-auto mb-2" />
                        <div className="text-xl sm:text-2xl font-bold text-green-900">{stats.completedTasks}</div>
                        <div className="text-xs sm:text-sm text-green-700">Concluídas</div>
                      </Card>
                      
                      <Card className="text-center bg-red-50 border-red-200 p-3 sm:p-4">
                        <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 mx-auto mb-2" />
                        <div className="text-xl sm:text-2xl font-bold text-red-900">{stats.overdueTasks}</div>
                        <div className="text-xs sm:text-sm text-red-700">Atrasadas</div>
                      </Card>
                    </div>

                    {/* ✅ BARRA DE PROGRESSO CORRIGIDA */}
                    <Card className="p-4 sm:p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Performance Geral</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          stats.completionRate >= 80 ? 'bg-green-100 text-green-700' :
                          stats.completionRate >= 50 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {stats.completionRate}%
                        </span>
                      </div>
                      <div className="space-y-3">
                        {/* ✅ BARRA DE PROGRESSO COM LARGURA MÍNIMA */}
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${
                              stats.completionRate >= 80 ? 'bg-green-500' : 
                              stats.completionRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ 
                              width: stats.totalTasks === 0 ? '0%' : `${Math.max(stats.completionRate, 2)}%`,
                              minWidth: stats.totalTasks > 0 && stats.completionRate > 0 ? '8px' : '0px'
                            }}
                          ></div>
                        </div>
                        
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>
                            {stats.completedTasks} de {stats.totalTasks} tarefas concluídas
                          </span>
                          <span>{stats.completionRate}%</span>
                        </div>
                        
                        <p className="text-sm text-gray-600">{roleLabels.performanceText}</p>
                        
                        {/* ✅ INFO ADICIONAL SOBRE TAREFAS */}
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <p className="text-xs text-blue-700">
                            💡 <strong>Visualizando apenas tarefas atribuídas</strong> a {employee.name}
                            {employee.role === 'MANAGER' && ' (não inclui tarefas criadas por ele)'}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {activeTab === 'tasks' && (
                  <div className="space-y-4 sm:space-y-6">
                    {/* Info sobre tarefas */}
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-700">
                        📋 Mostrando <strong>apenas tarefas atribuídas</strong> a {employee.name}
                      </p>
                    </div>

                    {/* Filtros */}
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: 'all', label: 'Todas', count: tasks.length },
                        { key: 'pending', label: 'Pendentes', count: stats.pendingTasks },
                        { key: 'in_progress', label: 'Em Progresso', count: stats.inProgressTasks },
                        { key: 'completed', label: 'Concluídas', count: stats.completedTasks },
                        { key: 'overdue', label: 'Atrasadas', count: stats.overdueTasks }
                      ].map(({ key, label, count }) => (
                        <button
                          key={key}
                          onClick={() => setTaskFilter(key as any)}
                          className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                            taskFilter === key
                              ? 'bg-blue-100 text-blue-700 border border-blue-300'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
                          }`}
                        >
                          {label} ({count})
                        </button>
                      ))}
                    </div>

                    {/* Lista de tarefas */}
                    {filteredTasks.length > 0 ? (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
                        {filteredTasks.map((task) => (
                          <TaskItem key={task.id} task={task} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <CheckSquare className="h-8 w-8 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium text-sm sm:text-base">
                          {taskFilter === 'all' 
                            ? roleLabels.emptyTasks
                            : 'Nenhuma tarefa encontrada para este filtro'
                          }
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="space-y-4 sm:space-y-6">
                    <Card className="p-4 sm:p-6">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Atividade Recente</h3>
                      <div className="space-y-3">
                        {tasks.slice(0, 10).map((task) => (
                          <div key={task.id} className="flex items-center gap-3 py-2 sm:py-3 border-b border-gray-100 last:border-0">
                            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                              task.status === 'COMPLETED' ? 'bg-green-500' :
                              task.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                              task.status === 'PENDING' ? 'bg-yellow-500' :
                              'bg-gray-400'
                            }`}></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 line-clamp-1">{task.title}</p>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-1">
                                <span>{new Date(task.updatedAt).toLocaleDateString('pt-BR')}</span>
                                <span>•</span>
                                <span>{TaskStatusLabels[task.status] || task.status}</span>
                                <span>•</span>
                                <span>Por: {task.createdBy.name}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {tasks.length === 0 && (
                          <div className="text-center py-6">
                            <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-xs sm:text-sm text-gray-500">Nenhuma atividade registrada</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Portal>
  )
}

export default EmployeeDetailsModal