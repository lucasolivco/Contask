import { Request, Response } from 'express'
import prisma from '../config/database'

interface AuthRequest extends Request {
  user?: {
    userId: string
    role: string
  }
}

// Buscar notificações do usuário
export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId
    const { limit = 50, offset = 0 } = req.query

    console.log(`🔔 Buscando notificações para usuário ${userId}`)

    const notifications = await prisma.notification.findMany({
      where: { userId },
      include: {
        task: {
          select: { id: true, title: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset)
    })

    const unreadCount = await prisma.notification.count({
      where: { 
        userId,
        read: false 
      }
    })

    console.log(`✅ Encontradas ${notifications.length} notificações (${unreadCount} não lidas)`)

    res.json({
      notifications,
      unreadCount
    })

  } catch (error) {
    console.error('❌ Erro ao buscar notificações:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// Contar notificações não lidas
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId

    const unreadCount = await prisma.notification.count({
      where: { 
        userId,
        read: false 
      }
    })

    res.json({ unreadCount })

  } catch (error) {
    console.error('❌ Erro ao contar não lidas:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// Marcar notificação como lida
export const markNotificationAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId

    console.log(`📖 Marcando notificação ${id} como lida para usuário ${userId}`)

    // Verificar se a notificação pertence ao usuário
    const notification = await prisma.notification.findFirst({
      where: { 
        id,
        userId 
      }
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
      data: { read: true },
      include: {
        task: {
          select: { id: true, title: true }
        }
      }
    })

    console.log(`✅ Notificação marcada como lida: ${id}`)

    res.json({
      message: 'Notificação marcada como lida',
      notification: updatedNotification
    })

  } catch (error) {
    console.error('❌ Erro ao marcar como lida:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// Marcar todas as notificações como lidas
export const markAllNotificationsAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId

    console.log(`📖 Marcando todas as notificações como lidas para usuário ${userId}`)

    const result = await prisma.notification.updateMany({
      where: { 
        userId,
        read: false 
      },
      data: { read: true }
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

// Excluir notificação
export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId

    console.log(`🗑️ Excluindo notificação ${id} do usuário ${userId}`)

    // Verificar se a notificação pertence ao usuário
    const notification = await prisma.notification.findFirst({
      where: { 
        id,
        userId 
      }
    })

    if (!notification) {
      return res.status(404).json({ error: 'Notificação não encontrada' })
    }

    await prisma.notification.delete({
      where: { id }
    })

    console.log(`✅ Notificação excluída: ${id}`)

    res.json({
      message: 'Notificação excluída com sucesso'
    })

  } catch (error) {
    console.error('❌ Erro ao excluir notificação:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}