// Página de notificações - por enquanto um placeholder
import React from 'react'
import { Bell, CheckCircle, Clock, AlertTriangle } from 'lucide-react'

import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

const Notifications: React.FC = () => {
  // Por enquanto, dados mockados para demonstração
  const mockNotifications = [
    {
      id: '1',
      type: 'TASK_ASSIGNED',
      title: 'Nova tarefa atribuída',
      message: 'Você recebeu uma nova tarefa: "Implementar autenticação"',
      read: false,
      createdAt: new Date().toISOString(),
      task: {
        id: '1',
        title: 'Implementar autenticação'
      }
    },
    {
      id: '2', 
      type: 'TASK_COMPLETED',
      title: 'Tarefa concluída',
      message: 'A tarefa "Corrigir bugs do formulário" foi marcada como concluída',
      read: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 dia atrás
      task: {
        id: '2',
        title: 'Corrigir bugs do formulário'
      }
    }
  ]

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return <Bell className="h-5 w-5 text-blue-600" />
      case 'TASK_COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'TASK_OVERDUE':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return 'Agora mesmo'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h atrás`
    } else {
      return date.toLocaleDateString('pt-BR')
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Notificações
          </h1>
          <p className="text-gray-600">
            Acompanhe as atualizações das suas tarefas
          </p>
        </div>

        <Button variant="secondary" size="sm">
          Marcar todas como lidas
        </Button>
      </div>

      {/* Lista de notificações */}
      <div className="space-y-4">
        {mockNotifications.map((notification) => (
          <Card 
            key={notification.id}
            className={`
              cursor-pointer hover:shadow-md transition-shadow
              ${!notification.read ? 'bg-blue-50 border-blue-200' : ''}
            `}
          >
            <div className="flex items-start space-x-4">
              {/* Ícone da notificação */}
              <div className={`
                p-2 rounded-lg
                ${!notification.read ? 'bg-blue-100' : 'bg-gray-100'}
              `}>
                {getNotificationIcon(notification.type)}
              </div>

              {/* Conteúdo da notificação */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className={`
                    text-sm font-medium
                    ${!notification.read ? 'text-gray-900' : 'text-gray-700'}
                  `}>
                    {notification.title}
                  </h3>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {formatDate(notification.createdAt)}
                    </span>
                    {!notification.read && (
                      <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                    )}
                  </div>
                </div>

                <p className="mt-1 text-sm text-gray-600">
                  {notification.message}
                </p>

                {notification.task && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {notification.task.title}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Estado vazio */}
      {mockNotifications.length === 0 && (
        <Card className="text-center py-12">
          <Bell className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Nenhuma notificação
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Você está em dia com todas as suas tarefas!
          </p>
        </Card>
      )}
    </div>
  )
}

export default Notifications