// backend/src/controllers/notificationController.ts - VERSÃO COMPLETA

import { Request, Response } from 'express'
import prisma from '../config/database'

interface AuthRequest extends Request {
  user?: {
    userId: string
    role: string
  }
}

// ✅ BUSCAR NOTIFICAÇÕES COM PAGINAÇÃO E FILTROS
export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId
    const { 
      page = 1, 
      limit = 10, 
      type, 
      read, 
      search,
      startDate,
      endDate 
    } = req.query

    const pageNum = Math.max(1, parseInt(page as string))
    const limitNum = Math.max(1, Math.min(50, parseInt(limit as string)))
    const offset = (pageNum - 1) * limitNum

    console.log(`🔔 Buscando notificações para usuário ${userId}`, {
      page: pageNum,
      limit: limitNum,
      type,
      read,
      search
    })

    // Construir filtros
    let whereCondition: any = { userId }

    if (type && type !== 'all') {
      whereCondition.type = type
    }

    if (read !== undefined && read !== 'all') {
      whereCondition.read = read === 'true'
    }

    if (search && typeof search === 'string' && search.trim()) {
      whereCondition.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { message: { contains: search.trim(), mode: 'insensitive' } }
      ]
    }

    if (startDate || endDate) {
      whereCondition.createdAt = {}
      if (startDate) {
        whereCondition.createdAt.gte = new Date(startDate as string)
      }
      if (endDate) {
        whereCondition.createdAt.lte = new Date(endDate as string)
      }
    }

    // Buscar com paginação
    const [notifications, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereCondition,
        include: {
          task: {
            select: { 
              id: true, 
              title: true, 
              status: true, 
              priority: true 
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limitNum,
        skip: offset
      }),
      prisma.notification.count({ where: whereCondition })
    ])

    // Processar metadata JSON
    const processedNotifications = notifications.map(notification => ({
      ...notification,
      metadata: notification.metadata ? JSON.parse(notification.metadata) : null
    }))

    // Contar não lidas
    const unreadCount = await prisma.notification.count({
      where: { 
        userId,
        read: false 
      }
    })

    // Calcular paginação
    const totalPages = Math.ceil(totalCount / limitNum)
    const hasNextPage = pageNum < totalPages
    const hasPreviousPage = pageNum > 1

    console.log(`✅ Encontradas ${notifications.length}/${totalCount} notificações (${unreadCount} não lidas)`)

    res.json({
      notifications: processedNotifications,
      totalCount,
      totalPages,
      currentPage: pageNum,
      hasNextPage,
      hasPreviousPage,
      unreadCount,
      limit: limitNum
    })

  } catch (error) {
    console.error('❌ Erro ao buscar notificações:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// ✅ CONTAR NÃO LIDAS
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId

    const unreadCount = await prisma.notification.count({
      where: { 
        userId,
        read: false 
      }
    })

    console.log(`📊 Usuário ${userId}: ${unreadCount} notificações não lidas`)
    res.json({ unreadCount })

  } catch (error) {
    console.error('❌ Erro ao contar não lidas:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// ✅ MARCAR COMO LIDA
export const markNotificationAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId

    const notification = await prisma.notification.findFirst({
      where: { id, userId }
    })

    if (!notification) {
      return res.status(404).json({ error: 'Notificação não encontrada' })
    }

    if (notification.read) {
      return res.json({ 
        message: 'Notificação já estava marcada como lida',
        notification 
      })
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { 
        read: true,
        updatedAt: new Date()
      },
      include: {
        task: { select: { id: true, title: true } }
      }
    })

    // Processar metadata
    const processedNotification = {
      ...updatedNotification,
      metadata: updatedNotification.metadata ? JSON.parse(updatedNotification.metadata) : null
    }

    console.log(`✅ Notificação marcada como lida: ${id}`)

    res.json({
      message: 'Notificação marcada como lida',
      notification: processedNotification
    })

  } catch (error) {
    console.error('❌ Erro ao marcar como lida:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// ✅ MARCAR COMO NÃO LIDA
export const markNotificationAsUnread = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId

    const notification = await prisma.notification.findFirst({
      where: { id, userId }
    })

    if (!notification) {
      return res.status(404).json({ error: 'Notificação não encontrada' })
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { 
        read: false,
        updatedAt: new Date()
      },
      include: {
        task: { select: { id: true, title: true } }
      }
    })

    const processedNotification = {
      ...updatedNotification,
      metadata: updatedNotification.metadata ? JSON.parse(updatedNotification.metadata) : null
    }

    console.log(`✅ Notificação marcada como NÃO lida: ${id}`)

    res.json({
      message: 'Notificação marcada como não lida',
      notification: processedNotification
    })

  } catch (error) {
    console.error('❌ Erro ao marcar como não lida:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// ✅ MARCAR TODAS COMO LIDAS
export const markAllNotificationsAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId

    const result = await prisma.notification.updateMany({
      where: { 
        userId,
        read: false 
      },
      data: { 
        read: true,
        updatedAt: new Date()
      }
    })

    console.log(`✅ ${result.count} notificações marcadas como lidas`)

    res.json({
      message: `${result.count} notificação(ões) marcada(s) como lida(s)`,
      updatedCount: result.count
    })

  } catch (error) {
    console.error('❌ Erro ao marcar todas como lidas:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// ✅ EXCLUIR NOTIFICAÇÃO
export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId

    const notification = await prisma.notification.findFirst({
      where: { id, userId }
    })

    if (!notification) {
      return res.status(404).json({ error: 'Notificação não encontrada' })
    }

    await prisma.notification.delete({ where: { id } })

    console.log(`✅ Notificação excluída: ${id}`)
    res.json({ message: 'Notificação excluída com sucesso' })

  } catch (error) {
    console.error('❌ Erro ao excluir notificação:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// ✅ EXCLUIR TODAS LIDAS
export const deleteAllReadNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId

    const result = await prisma.notification.deleteMany({
      where: { 
        userId,
        read: true 
      }
    })

    console.log(`✅ ${result.count} notificações lidas excluídas`)

    res.json({
      message: `${result.count} notificação(ões) lida(s) excluída(s)`,
      deletedCount: result.count
    })

  } catch (error) {
    console.error('❌ Erro ao excluir notificações lidas:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// ✅ ESTATÍSTICAS
export const getNotificationStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId

    const [
      totalCount,
      unreadCount,
      todayCount,
      thisWeekCount
    ] = await Promise.all([
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, read: false } }),
      prisma.notification.count({
        where: {
          userId,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.notification.count({
        where: {
          userId,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ])

    const typeStats = await prisma.notification.groupBy({
      by: ['type'],
      where: { userId },
      _count: { id: true }
    })

    const typeBreakdown = typeStats.reduce((acc, stat) => {
      acc[stat.type] = stat._count.id
      return acc
    }, {} as Record<string, number>)

    const stats = {
      total: totalCount,
      unread: unreadCount,
      today: todayCount,
      thisWeek: thisWeekCount,
      byType: {
        TASK_ASSIGNED: typeBreakdown.TASK_ASSIGNED || 0,
        TASK_UPDATED: typeBreakdown.TASK_UPDATED || 0,
        TASK_COMPLETED: typeBreakdown.TASK_COMPLETED || 0,
        TASK_OVERDUE: typeBreakdown.TASK_OVERDUE || 0,
        TASK_CANCELLED: typeBreakdown.TASK_CANCELLED || 0,
        TASK_REASSIGNED: typeBreakdown.TASK_REASSIGNED || 0
      }
    }

    res.json({ stats })

  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}