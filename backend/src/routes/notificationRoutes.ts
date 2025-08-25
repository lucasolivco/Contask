import { Router } from 'express'
import { 
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount
} from '../controllers/notificationController'
import { authenticateToken } from '../middleware/auth'

const router = Router()

// Todas as rotas precisam de autenticação
router.use(authenticateToken)

// Buscar notificações do usuário
router.get('/', getNotifications)

// Contar não lidas
router.get('/unread-count', getUnreadCount)

// Marcar como lida
router.patch('/:id/read', markNotificationAsRead)

// Marcar todas como lidas
router.patch('/mark-all-read', markAllNotificationsAsRead)

// Excluir notificação
router.delete('/:id', deleteNotification)

export default router