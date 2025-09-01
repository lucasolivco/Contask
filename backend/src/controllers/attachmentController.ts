// backend/src/controllers/attachmentController.ts - COM NOTIFICAÇÕES E DELETE

import { Request, Response } from 'express'
import prisma from '../config/database'
import fs from 'fs-extra'
import path from 'path'
import { sendAttachmentAddedNotification } from '../services/notificationService'

interface AuthRequest extends Request {
  user?: {
    userId: string
    role: string
  }
}

// ✅ BUSCAR ANEXOS DA TAREFA
export const getTaskAttachments = async (req: AuthRequest, res: Response) => {
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

    const attachments = await prisma.attachment.findMany({
      where: { taskId },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`📎 ${attachments.length} anexos encontrados para tarefa ${taskId}`)

    res.json({ attachments })

  } catch (error) {
    console.error('❌ Erro ao buscar anexos:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// ✅ UPLOAD DE ANEXOS COM NOTIFICAÇÃO
export const uploadAttachment = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params
    const files = req.files as Express.Multer.File[]
    const userId = req.user!.userId

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' })
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

    const attachments = []

    for (const file of files) {
      const attachment = await prisma.attachment.create({
        data: {
          fileName: file.filename,
          originalName: file.originalname,
          filePath: file.path,
          fileSize: file.size,
          mimeType: file.mimetype,
          taskId,
          uploadedById: userId
        },
        include: {
          uploadedBy: {
            select: { id: true, name: true, email: true }
          }
        }
      })

      attachments.push(attachment)
    }

    console.log(`✅ ${attachments.length} anexo(s) adicionado(s) à tarefa: ${task.title}`)

    // ✅ ENVIAR NOTIFICAÇÕES
    try {
      const uploaderUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true }
      })

      if (uploaderUser) {
        // Notificar o criador da tarefa (se não for quem anexou)
        if (task.createdById !== userId) {
          await sendAttachmentAddedNotification({
            task,
            attachments,
            uploader: uploaderUser,
            recipient: task.createdBy,
            type: 'creator'
          })
        }

        // Notificar o responsável pela tarefa (se não for quem anexou e não for o criador)
        if (task.assignedToId !== userId && task.assignedToId !== task.createdById) {
          await sendAttachmentAddedNotification({
            task,
            attachments,
            uploader: uploaderUser,
            recipient: task.assignedTo,
            type: 'assignee'
          })
        }

        console.log(`🔔 Notificações de anexo enviadas`)
      }

    } catch (notificationError) {
      console.error('⚠️ Erro ao enviar notificações de anexo:', notificationError)
      // Não falhar o upload por causa da notificação
    }

    res.status(201).json({
      message: `${attachments.length} arquivo(s) enviado(s) com sucesso`,
      attachments
    })

  } catch (error) {
    console.error('❌ Erro ao fazer upload:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// ✅ DOWNLOAD DE ANEXO
export const downloadAttachment = async (req: AuthRequest, res: Response) => {
  try {
    const { attachmentId } = req.params
    const userId = req.user!.userId

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: {
        task: {
          select: {
            id: true,
            createdById: true,
            assignedToId: true
          }
        }
      }
    })

    if (!attachment) {
      return res.status(404).json({ error: 'Anexo não encontrado' })
    }

    // Verificar se o usuário tem acesso à tarefa
    const hasAccess = attachment.task.createdById === userId || 
                     attachment.task.assignedToId === userId

    if (!hasAccess) {
      return res.status(403).json({ error: 'Sem permissão para acessar este anexo' })
    }

    // Verificar se o arquivo existe
    if (!fs.existsSync(attachment.filePath)) {
      return res.status(404).json({ error: 'Arquivo não encontrado no servidor' })
    }

    console.log(`📥 Download do anexo: ${attachment.originalName}`)

    res.download(attachment.filePath, attachment.originalName)

  } catch (error) {
    console.error('❌ Erro ao fazer download:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// ✅ NOVA: DELETAR ANEXO
export const deleteAttachment = async (req: AuthRequest, res: Response) => {
  try {
    const { attachmentId } = req.params
    const userId = req.user!.userId
    const userRole = req.user!.role

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: {
        uploadedBy: { select: { id: true, name: true } },
        task: {
          select: { 
            id: true, 
            title: true, 
            createdById: true,
            createdBy: { select: { name: true } }
          }
        }
      }
    })

    if (!attachment) {
      return res.status(404).json({ error: 'Anexo não encontrado' })
    }

    // Verificar permissões: quem fez upload, criador da tarefa ou manager
    const canDelete = attachment.uploadedById === userId || 
                     attachment.task.createdById === userId || 
                     userRole === 'MANAGER'

    if (!canDelete) {
      return res.status(403).json({ 
        error: 'Você não tem permissão para excluir este anexo' 
      })
    }

    // Excluir arquivo físico
    try {
      if (fs.existsSync(attachment.filePath)) {
        await fs.remove(attachment.filePath)
        console.log(`🗑️ Arquivo físico removido: ${attachment.filePath}`)
      }
    } catch (fileError) {
      console.warn(`⚠️ Erro ao remover arquivo físico: ${attachment.filePath}`, fileError)
      // Continua com a exclusão do banco mesmo se não conseguir remover o arquivo
    }

    // Excluir do banco
    await prisma.attachment.delete({
      where: { id: attachmentId }
    })

    console.log(`🗑️ Anexo "${attachment.originalName}" excluído da tarefa "${attachment.task.title}"`)

    res.json({
      message: 'Anexo excluído com sucesso',
      attachmentId,
      fileName: attachment.originalName
    })

  } catch (error) {
    console.error('❌ Erro ao excluir anexo:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}