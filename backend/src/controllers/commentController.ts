// backend/src/controllers/commentController.ts - COM NOTIFICAÇÕES

import { Request, Response } from 'express'
import prisma from '../config/database'
import { sendCommentAddedNotification } from '../services/notificationService'

interface AuthRequest extends Request {
  user?: {
    userId: string
    role: string
  }
}

// ✅ BUSCAR COMENTÁRIOS DA TAREFA
export const getTaskComments = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params
    const userId = req.user!.userId

    // Verificar se o usuário tem acesso à tarefa
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { createdById: userId },
          { assignedToId: userId }
        ]
      }
    })

    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' })
    }

    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: {
        author: {
          select: { id: true, name: true, email: true, role: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    console.log(`💬 ${comments.length} comentários encontrados para tarefa ${taskId}`)

    res.json({ comments })

  } catch (error) {
    console.error('❌ Erro ao buscar comentários:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// ✅ CRIAR COMENTÁRIO COM NOTIFICAÇÃO
export const createComment = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params
    const { message } = req.body
    const userId = req.user!.userId

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Mensagem é obrigatória' })
    }

    // Verificar se o usuário tem acesso à tarefa
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { createdById: userId },
          { assignedToId: userId }
        ]
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } }
      }
    })

    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' })
    }

    // Criar comentário
    const comment = await prisma.comment.create({
      data: {
        message: message.trim(),
        taskId,
        authorId: userId
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    })

    console.log(`✅ Comentário criado por ${comment.author.name} na tarefa: ${task.title}`)

    // ✅ ENVIAR NOTIFICAÇÕES
    try {
      // Notificar o criador da tarefa (se não for quem comentou)
      if (task.createdById !== userId) {
        await sendCommentAddedNotification({
          task,
          comment,
          author: comment.author,
          recipient: task.createdBy,
          type: 'creator'
        })
      }

      // Notificar o responsável pela tarefa (se não for quem comentou e não for o criador)
      if (task.assignedToId !== userId && task.assignedToId !== task.createdById) {
        await sendCommentAddedNotification({
          task,
          comment,
          author: comment.author,
          recipient: task.assignedTo,
          type: 'assignee'
        })
      }

      console.log(`🔔 Notificações de comentário enviadas`)

    } catch (notificationError) {
      console.error('⚠️ Erro ao enviar notificações de comentário:', notificationError)
      // Não falhar a criação do comentário por causa da notificação
    }

    res.status(201).json({
      message: 'Comentário adicionado com sucesso',
      comment
    })

  } catch (error) {
    console.error('❌ Erro ao criar comentário:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}