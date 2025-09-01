// backend/src/routes/notificationRoutes.ts - ROTAS COMPLETAS

import { Router } from 'express'
import { 
  getNotifications,
  markNotificationAsRead,
  markNotificationAsUnread,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllReadNotifications,
  getUnreadCount,
  getNotificationStats
} from '../controllers/notificationController'
import { authenticateToken } from '../middleware/auth'

const router = Router()

router.use(authenticateToken)

// Principais
router.get('/', getNotifications)
router.get('/unread-count', getUnreadCount)
router.get('/stats', getNotificationStats)

// Ações individuais
router.patch('/:id/read', markNotificationAsRead)
router.patch('/:id/unread', markNotificationAsUnread)
router.delete('/:id', deleteNotification)

// Ações em lote
router.patch('/mark-all-read', markAllNotificationsAsRead)
router.delete('/read', deleteAllReadNotifications)

export default router