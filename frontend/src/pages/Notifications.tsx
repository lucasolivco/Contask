import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Bell, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Mail,
  Eye,
  EyeOff,
  Trash2,
  Filter,
  RotateCcw,
  Calendar,
  User,
  CheckSquare,
  Settings
} from 'lucide-react'

import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotification 
} from '../services/taskService'
import type { Notification } from '../types'

const Notifications: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'TASK_ASSIGNED' | 'TASK_COMPLETED' | 'TASK_OVERDUE'>('all')
  
  const queryClient = useQueryClient()

  // ✅ BUSCAR NOTIFICAÇÕES
  const { data: notificationsData, isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    refetchInterval: 30000, // Refetch a cada 30 segundos
    staleTime: 1000 * 60 * 2, // 2 minutos
  })

  const notifications: Notification[] = notificationsData?.notifications || []

  // ✅ MARCAR COMO LIDA
  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  // ✅ MARCAR TODAS COMO LIDAS
  const markAllAsReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  // ✅ DELETAR NOTIFICAÇÃO
  const deleteNotificationMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  // ✅ FILTRAR NOTIFICAÇÕES
  const filteredNotifications = React.useMemo(() => {
    let filtered = notifications

    // Filtro por status de leitura
    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.read)
    } else if (filter === 'read') {
      filtered = filtered.filter(n => n.read)
    }

    // Filtro por tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(n => n.type === typeFilter)
    }

    // Ordenar por data (mais recentes primeiro)
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [notifications, filter, typeFilter])

  // ✅ ESTATÍSTICAS
  const stats = React.useMemo(() => {
    const unreadCount = notifications.filter(n => !n.read).length
    const todayCount = notifications.filter(n => 
      new Date(n.createdAt).toDateString() === new Date().toDateString()
    ).length

    return { unreadCount, todayCount, total: notifications.length }
  }, [notifications])

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return <Mail className="h-5 w-5 text-blue-600" />
      case 'TASK_COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'TASK_OVERDUE':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'TASK_UPDATED':
        return <Clock className="h-5 w-5 text-orange-600" />
      default:
        return <Bell className="h-5 w-5 text-gray-600" />
    }
  }

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return 'blue'
      case 'TASK_COMPLETED':
        return 'green'
      case 'TASK_OVERDUE':
        return 'red'
      case 'TASK_UPDATED':
        return 'orange'
      default:
        return 'gray'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60)
    const diffInHours = diffInMinutes / 60
    const diffInDays = diffInHours / 24

    if (diffInMinutes < 1) {
      return 'Agora mesmo'
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m atrás`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h atrás`
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d atrás`
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id)
    }
  }

  const clearFilters = () => {
    setFilter('all')
    setTypeFilter('all')
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="text-center py-12 border-red-200 bg-red-50">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Erro ao carregar notificações</h3>
          <p className="text-red-600">Tente novamente em alguns instantes</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* ✅ HEADER COM ESTATÍSTICAS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
              <Bell className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Notificações
              </h1>
              <p className="text-gray-600">
                Acompanhe as atualizações das suas tarefas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={stats.unreadCount === 0 || markAllAsReadMutation.isPending}
              className="flex items-center gap-2"
            >
              <CheckSquare className="h-4 w-4" />
              Marcar todas como lidas
            </Button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-900">{stats.unreadCount}</p>
                <p className="text-sm text-blue-700">Não lidas</p>
              </div>
            </div>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-900">{stats.todayCount}</p>
                <p className="text-sm text-green-700">Hoje</p>
              </div>
            </div>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckSquare className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-900">{stats.total}</p>
                <p className="text-sm text-purple-700">Total</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ✅ FILTROS */}
      <Card className="bg-gray-50 border-gray-200">
        <div className="p-4 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Filtro por status */}
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'Todas', count: notifications.length },
                { key: 'unread', label: 'Não lidas', count: stats.unreadCount },
                { key: 'read', label: 'Lidas', count: notifications.length - stats.unreadCount }
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === key
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>

            {/* Filtro por tipo */}
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'Todos os tipos' },
                { key: 'TASK_ASSIGNED', label: 'Atribuições' },
                { key: 'TASK_COMPLETED', label: 'Conclusões' },
                { key: 'TASK_OVERDUE', label: 'Vencimentos' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTypeFilter(key as any)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    typeFilter === key
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Limpar filtros */}
            {(filter !== 'all' || typeFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            )}
          </div>

          {/* Indicador de resultados */}
          {filteredNotifications.length !== notifications.length && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter className="h-4 w-4" />
              <span>
                Mostrando {filteredNotifications.length} de {notifications.length} notificações
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* ✅ LISTA DE NOTIFICAÇÕES */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredNotifications.length > 0 ? (
        <div className="space-y-3">
          {filteredNotifications.map((notification, index) => {
            const color = getNotificationColor(notification.type)
            
            return (
              <Card 
                key={notification.id}
                className={`
                  group cursor-pointer hover:shadow-lg transition-all duration-200
                  ${!notification.read ? `bg-${color}-50 border-${color}-200 ring-1 ring-${color}-300` : 'hover:bg-gray-50'}
                `}
                onClick={() => handleNotificationClick(notification)}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start space-x-4 p-4">
                  {/* Ícone da notificação */}
                  <div className={`
                    p-2.5 rounded-xl shadow-sm
                    ${!notification.read ? `bg-${color}-100` : 'bg-gray-100'}
                  `}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Conteúdo da notificação */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className={`
                          text-sm font-semibold truncate
                          ${!notification.read ? 'text-gray-900' : 'text-gray-700'}
                        `}>
                          {notification.title}
                        </h3>
                        
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {notification.message}
                        </p>

                        {notification.task && (
                          <div className="mt-3 flex items-center gap-2">
                            <span className={`
                              inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                              bg-${color}-100 text-${color}-800
                            `}>
                              <CheckSquare className="h-3 w-3 mr-1" />
                              {notification.task.title}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <span className="text-xs text-gray-500 block">
                            {formatDate(notification.createdAt)}
                          </span>
                          {!notification.read && (
                            <div className="flex items-center justify-end mt-1">
                              <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                            </div>
                          )}
                        </div>

                        {/* Ações */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                markAsReadMutation.mutate(notification.id)
                              }}
                              className="p-1 h-6 w-6"
                              title="Marcar como lida"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm('Tem certeza que deseja excluir esta notificação?')) {
                                deleteNotificationMutation.mutate(notification.id)
                              }
                            }}
                            className="p-1 h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Excluir notificação"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-6">
              <Bell className="h-16 w-16 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {filter === 'unread' && notifications.length > 0
                ? 'Todas as notificações foram lidas!'
                : 'Nenhuma notificação'
              }
            </h3>
            <p className="text-gray-600 mb-8">
              {filter === 'unread' && notifications.length > 0
                ? 'Parabéns! Você está em dia com todas as suas notificações.'
                : 'Você está em dia com todas as suas tarefas!'
              }
            </p>
            
            {(filter !== 'all' || typeFilter !== 'all') && (
              <Button onClick={clearFilters} className="mt-4">
                <RotateCcw className="h-4 w-4 mr-2" />
                Ver todas as notificações
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

export default Notifications