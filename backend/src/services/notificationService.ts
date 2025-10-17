// backend/src/services/notificationService.ts - VERSÃO CORRIGIDA

import prisma from '../config/database'
import { sendEmail } from './emailService'
import cron from 'node-cron'
import moment from 'moment-timezone'

const BRAZIL_TIMEZONE = 'America/Sao_Paulo'

// ✅ TIPO ATUALIZADO COM NOVOS TIPOS DE NOTIFICAÇÃO
type NotificationType = 
  | 'TASK_ASSIGNED' 
  | 'TASK_UPDATED' 
  | 'TASK_COMPLETED' 
  | 'TASK_OVERDUE' 
  | 'TASK_CANCELLED' 
  | 'TASK_REASSIGNED'
  | 'COMMENT_ADDED'      // ✅ NOVO
  | 'ATTACHMENT_ADDED'   // ✅ NOVO
  | 'TASK_ARCHIVED'

// ✅ INTERFACE ATUALIZADA COM TODAS AS PROPRIEDADES DE METADATA
type NotificationData = {
  type: NotificationType
  title: string
  message: string
  userId: string
  taskId?: string
  metadata?: {
    // Propriedades para tarefas
    oldAssignee?: string
    newAssignee?: string
    changedFields?: string[]
    previousStatus?: string
    newStatus?: string
    reason?: string
    
    // ✅ NOVAS: Propriedades para comentários
    commentAuthor?: string
    commentPreview?: string
    recipientType?: 'creator' | 'assignee'
    
    // ✅ NOVAS: Propriedades para anexos
    uploader?: string
    fileCount?: number
    fileNames?: string
  }
}

const getBrazilDate = () => moment().tz(BRAZIL_TIMEZONE)

// ✅ FUNÇÃO PRINCIPAL PARA CRIAR NOTIFICAÇÃO
export const createNotification = async (data: NotificationData) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        type: data.type,
        title: data.title,
        message: data.message,
        userId: data.userId,
        taskId: data.taskId,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null
      }
    })

    console.log('✅ Notificação criada:', notification.id, '-', data.type)
    return notification

  } catch (error) {
    console.error('❌ Erro ao criar notificação:', error)
    throw error
  }
}

// ✅ TAREFA ATRIBUÍDA/REATRIBUÍDA
export const sendTaskAssignedNotification = async (taskData: any, isReassignment = false) => {
  try {
    console.log(`📬 Enviando notificação de ${isReassignment ? 'reatribuição' : 'atribuição'}: ${taskData.task.title}`)

    const notification = await createNotification({
      type: isReassignment ? 'TASK_REASSIGNED' : 'TASK_ASSIGNED',
      title: isReassignment ? 'Tarefa reatribuída' : 'Nova tarefa atribuída',
      message: isReassignment 
        ? `A tarefa "${taskData.task.title}" foi reatribuída para você`
        : `Você recebeu a tarefa: "${taskData.task.title}"`,
      userId: taskData.assignedTo.id,
      taskId: taskData.task.id,
      metadata: isReassignment ? {
        oldAssignee: taskData.previousAssignee,
        newAssignee: taskData.assignedTo.name
      } : undefined
    })

    const emailSent = await sendEmail({
      to: taskData.assignedTo.email,
      subject: isReassignment ? '🔄 Tarefa reatribuída' : '📋 Nova tarefa atribuída',
      template: 'task-assigned',
      data: {
        userName: taskData.assignedTo.name,
        taskTitle: taskData.task.title,
        taskDescription: taskData.task.description,
        dueDate: taskData.task.dueDate ? moment(taskData.task.dueDate).tz(BRAZIL_TIMEZONE).format('DD/MM/YYYY') : null,
        priority: taskData.task.priority,
        managerName: taskData.createdBy.name,
        isReassignment,
        previousAssignee: taskData.previousAssignee
      }
    })

    return { notification, emailSent }

  } catch (error) {
    console.error('❌ Erro ao enviar notificação de atribuição:', error)
    throw error
  }
}

// ✅ TAREFA CONCLUÍDA
export const sendTaskCompletedNotification = async (taskData: any) => {
  try {
    const notification = await createNotification({
      type: 'TASK_COMPLETED',
      title: 'Tarefa concluída',
      message: `A tarefa "${taskData.task.title}" foi concluída por ${taskData.assignedTo.name}`,
      userId: taskData.createdBy.id,
      taskId: taskData.task.id
    })

    const emailSent = await sendEmail({
      to: taskData.createdBy.email,
      subject: '✅ Tarefa concluída',
      template: 'task-completed',
      data: {
        managerName: taskData.createdBy.name,
        taskTitle: taskData.task.title,
        assignedUserName: taskData.assignedTo.name,
        completedDate: getBrazilDate().format('DD/MM/YYYY')
      }
    })

    return { notification, emailSent }

  } catch (error) {
    console.error('❌ Erro ao enviar notificação de conclusão:', error)
    throw error
  }
}

// ✅ TAREFA ATUALIZADA
export const sendTaskUpdatedNotification = async (taskData: any, changes: any) => {
  try {
    if (taskData.assignedTo.id !== taskData.updatedBy.id) {
      const notification = await createNotification({
        type: 'TASK_UPDATED',
        title: 'Tarefa atualizada',
        message: `A tarefa "${taskData.task.title}" foi atualizada por ${taskData.updatedBy.name}`,
        userId: taskData.assignedTo.id,
        taskId: taskData.task.id,
        metadata: {
          changedFields: changes.changedFields,
          previousStatus: changes.statusChange?.from,
          newStatus: changes.statusChange?.to
        }
      })

      const emailSent = await sendEmail({
        to: taskData.assignedTo.email,
        subject: '🔄 Tarefa atualizada',
        template: 'task-updated',
        data: {
          userName: taskData.assignedTo.name,
          taskTitle: taskData.task.title,
          updatedBy: taskData.updatedBy.name,
          updatedDate: getBrazilDate().format('DD/MM/YYYY HH:mm'),
          changedFields: changes.changedFields,
          statusChange: changes.statusChange
        }
      })
    }

  } catch (error) {
    console.error('❌ Erro ao enviar notificação de atualização:', error)
    throw error
  }
}

// ✅ TAREFA CANCELADA
export const sendTaskCancelledNotification = async (taskData: any, reason?: string) => {
  try {
    const notification = await createNotification({
      type: 'TASK_CANCELLED',
      title: 'Tarefa cancelada',
      message: `A tarefa "${taskData.task.title}" foi cancelada`,
      userId: taskData.assignedTo.id,
      taskId: taskData.task.id,
      metadata: reason ? { reason } : undefined
    })

    const emailSent = await sendEmail({
      to: taskData.assignedTo.email,
      subject: '❌ Tarefa cancelada',
      template: 'task-cancelled',
      data: {
        userName: taskData.assignedTo.name,
        taskTitle: taskData.task.title,
        cancelledBy: taskData.cancelledBy.name,
        cancelledDate: getBrazilDate().format('DD/MM/YYYY HH:mm'),
        reason
      }
    })

    return { notification, emailSent }

  } catch (error) {
    console.error('❌ Erro ao enviar notificação de cancelamento:', error)
    throw error
  }
}

// ✅ VERIFICAR TAREFAS QUE VENCEM AMANHÃ
export const checkUpcomingTasks = async () => {
  try {
    console.log('🔍 Verificando tarefas que vencem AMANHÃ...')
    
    const nowBrazil = moment().tz(BRAZIL_TIMEZONE)
    const tomorrowBrazil = nowBrazil.clone().add(1, 'day')
    
    const tomorrowStartUTC = tomorrowBrazil.clone().startOf('day').utc().toDate()
    const tomorrowEndUTC = tomorrowBrazil.clone().endOf('day').utc().toDate()

    const upcomingTasks = await prisma.task.findMany({
      where: {
        AND: [
          {
            dueDate: { 
              gte: tomorrowStartUTC,
              lte: tomorrowEndUTC
            }
          },
          {
            status: { 
              in: ['PENDING', 'IN_PROGRESS'] 
            }
          }
        ]
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } }
      }
    })

    console.log(`📋 Encontradas ${upcomingTasks.length} tarefas que vencem AMANHÃ`)

    for (const task of upcomingTasks) {
      const last24Hours = nowBrazil.clone().subtract(24, 'hours').toDate()
      
      const existingNotification = await prisma.notification.findFirst({
        where: {
          taskId: task.id,
          type: 'TASK_OVERDUE',
          createdAt: { gte: last24Hours }
        }
      })

      if (!existingNotification) {
        const dueDateFormatted = moment(task.dueDate).tz(BRAZIL_TIMEZONE).format('DD/MM/YYYY')

        await createNotification({
          type: 'TASK_OVERDUE',
          title: 'Tarefa vence amanhã',
          message: `A tarefa "${task.title}" vence amanhã (${dueDateFormatted})`,
          userId: task.assignedTo.id,
          taskId: task.id
        })

        await sendEmail({
          to: task.assignedTo.email,
          subject: `⏰ AMANHÃ: ${task.title}`,
          template: 'task-overdue',
          data: {
            userName: task.assignedTo.name,
            taskTitle: task.title,
            dueDate: dueDateFormatted,
            dueTomorrow: true,
            managerName: task.createdBy.name
          }
        })

        console.log(`✅ Aviso enviado para ${task.assignedTo.name}`)
      }
    }

  } catch (error) {
    console.error('❌ Erro ao verificar tarefas:', error)
  }
}

// ✅ SCHEDULER
export const startNotificationScheduler = () => {
  console.log('⏰ Iniciando agendador de notificações...')
  
  cron.schedule('0 9 * * *', () => {
    console.log('🔄 Executando verificação diária...')
    checkUpcomingTasks()
  }, {
    timezone: BRAZIL_TIMEZONE
  })

  setTimeout(() => {
    console.log('🚀 Executando verificação inicial...')
    checkUpcomingTasks()
  }, 5000)

  console.log('✅ Agendador configurado')
}

// ✅ NOVA: NOTIFICAÇÃO DE COMENTÁRIO ADICIONADO
export const sendCommentAddedNotification = async (data: {
  task: any
  comment: any
  author: any
  recipient: any
  type: 'creator' | 'assignee'
}) => {
  try {
    console.log(`📬 Enviando notificação de comentário: ${data.task.title}`)

    const message = data.type === 'creator' 
      ? `${data.author.name} comentou na tarefa "${data.task.title}" que você criou`
      : `${data.author.name} comentou na tarefa "${data.task.title}"`

    const notification = await createNotification({
      type: 'COMMENT_ADDED',
      title: 'Novo comentário',
      message,
      userId: data.recipient.id,
      taskId: data.task.id,
      metadata: {
        commentAuthor: data.author.name,
        commentPreview: data.comment.message.substring(0, 100) + (data.comment.message.length > 100 ? '...' : ''),
        recipientType: data.type
      }
    })

    const emailSent = await sendEmail({
      to: data.recipient.email,
      subject: `💬 Novo comentário: ${data.task.title}`,
      template: 'comment-added',
      data: {
        recipientName: data.recipient.name,
        taskTitle: data.task.title,
        commentAuthor: data.author.name,
        commentMessage: data.comment.message,
        commentDate: getBrazilDate().format('DD/MM/YYYY HH:mm'),
        taskUrl: `${process.env.FRONTEND_URL}/tasks`,
        isCreator: data.type === 'creator'
      }
    })

    console.log(`✅ Notificação de comentário enviada para ${data.recipient.name}`)
    return { notification, emailSent }

  } catch (error) {
    console.error('❌ Erro ao enviar notificação de comentário:', error)
    throw error
  }
}

// ✅ NOVA: NOTIFICAÇÃO DE ANEXO ADICIONADO
export const sendAttachmentAddedNotification = async (data: {
  task: any
  attachments: any[]
  uploader: any
  recipient: any
  type: 'creator' | 'assignee'
}) => {
  try {
    console.log(`📬 Enviando notificação de anexo: ${data.task.title}`)

    const fileCount = data.attachments.length
    const fileNames = data.attachments.map(a => a.originalName).join(', ')
    
    const message = data.type === 'creator' 
      ? `${data.uploader.name} anexou ${fileCount} arquivo(s) na tarefa "${data.task.title}" que você criou`
      : `${data.uploader.name} anexou ${fileCount} arquivo(s) na tarefa "${data.task.title}"`

    const notification = await createNotification({
      type: 'ATTACHMENT_ADDED',
      title: 'Novo anexo',
      message,
      userId: data.recipient.id,
      taskId: data.task.id,
      metadata: {
        uploader: data.uploader.name,
        fileCount,
        fileNames: fileNames.substring(0, 200) + (fileNames.length > 200 ? '...' : ''),
        recipientType: data.type
      }
    })

    const emailSent = await sendEmail({
      to: data.recipient.email,
      subject: `📎 Novo anexo: ${data.task.title}`,
      template: 'attachment-added',
      data: {
        recipientName: data.recipient.name,
        taskTitle: data.task.title,
        uploaderName: data.uploader.name,
        fileCount,
        fileNames,
        attachmentDate: getBrazilDate().format('DD/MM/YYYY HH:mm'),
        taskUrl: `${process.env.FRONTEND_URL}/tasks`,
        isCreator: data.type === 'creator'
      }
    })

    console.log(`✅ Notificação de anexo enviada para ${data.recipient.name}`)
    return { notification, emailSent }

  } catch (error) {
    console.error('❌ Erro ao enviar notificação de anexo:', error)
    throw error
  }
}

// ✅ NOVA: NOTIFICAÇÃO DE TAREFA ARQUIVADA
export const sendTaskArchivedNotification = async (data: {
  task: any
  archivedBy: any
  assignedTo: any
}) => {
  try {
    console.log(`📬 Enviando notificação de arquivamento: ${data.task.title}`)

    // Não notificar se o responsável for o mesmo que arquivou
    if (data.archivedBy.id === data.assignedTo.id) {
      return
    }

    const notification = await createNotification({
      type: 'TASK_ARCHIVED',
      title: 'Tarefa arquivada',
      message: `A tarefa "${data.task.title}" foi arquivada por ${data.archivedBy.name}`,
      userId: data.assignedTo.id,
      taskId: data.task.id
    })

    // const emailSent = await sendEmail({
    //   to: data.assignedTo.email,
    //   subject: `🗄️ Tarefa arquivada: ${data.task.title}`,
    //   template: 'task-archived', // Você precisará criar este template
    //   data: {
    //     userName: data.assignedTo.name,
    //     taskTitle: data.task.title,
    //     archivedBy: data.archivedBy.name,
    //     archivedDate: getBrazilDate().format('DD/MM/YYYY HH:mm')
    //   }
    // })

    return { notification, emailSent: false } // Retorna false pois o email não é mais enviado
  } catch (error) {
    console.error('❌ Erro ao enviar notificação de arquivamento:', error)
    throw error
  }
}

// ✅ FUNÇÃO DE TESTE MANUAL
export const testUpcomingNotifications = async () => {
  const nowBrazil = getBrazilDate()
  console.log(`🧪 === TESTE: TAREFAS QUE VENCEM AMANHÃ (${nowBrazil.format('DD/MM/YYYY HH:mm:ss')} - Brasília) ===`)
  await checkUpcomingTasks()
  console.log('🧪 === FIM DO TESTE ===')
}