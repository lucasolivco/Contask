import prisma from '../config/database'
import { sendEmail } from './emailService'
import cron from 'node-cron'
import moment from 'moment-timezone'

// ✅ DEFINIR TIMEZONE DO BRASIL
const BRAZIL_TIMEZONE = 'America/Sao_Paulo'

type NotificationData = {
  type: 'TASK_ASSIGNED' | 'TASK_UPDATED' | 'TASK_COMPLETED' | 'TASK_OVERDUE'
  title: string
  message: string
  userId: string
  taskId?: string
}

// ✅ FUNÇÃO PARA OBTER DATA DO BRASIL
const getBrazilDate = () => {
  return moment().tz(BRAZIL_TIMEZONE)
}

// ✅ FUNÇÃO PARA OBTER INÍCIO DO DIA NO BRASIL
const getBrazilDayStart = (date?: moment.Moment) => {
  const targetDate = date || getBrazilDate()
  return targetDate.clone().startOf('day').toDate()
}

// ✅ FUNÇÃO PARA OBTER FIM DO DIA NO BRASIL
const getBrazilDayEnd = (date?: moment.Moment) => {
  const targetDate = date || getBrazilDate()
  return targetDate.clone().endOf('day').toDate()
}

export const createNotification = async (data: NotificationData) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        type: data.type,
        title: data.title,
        message: data.message,
        userId: data.userId,
        taskId: data.taskId
      }
    })

    console.log('✅ Notificação criada:', notification.id)
    return notification

  } catch (error) {
    console.error('❌ Erro ao criar notificação:', error)
    throw error
  }
}

export const sendTaskAssignedNotification = async (taskData: any) => {
  try {
    const notification = await createNotification({
      type: 'TASK_ASSIGNED',
      title: 'Nova tarefa atribuída',
      message: `Você recebeu a tarefa: ${taskData.task.title}`,
      userId: taskData.assignedTo.id,
      taskId: taskData.task.id
    })

    const emailSent = await sendEmail({
      to: taskData.assignedTo.email,
      subject: '📋 Nova tarefa atribuída',
      template: 'task-assigned',
      data: {
        userName: taskData.assignedTo.name,
        taskTitle: taskData.task.title,
        taskDescription: taskData.task.description,
        dueDate: taskData.task.dueDate ? moment(taskData.task.dueDate).tz(BRAZIL_TIMEZONE).format('DD/MM/YYYY') : null,
        managerName: taskData.createdBy.name
      }
    })

    console.log(`✅ Notificação enviada para ${taskData.assignedTo.name}`)
    return { notification, emailSent }

  } catch (error) {
    console.error('❌ Erro ao enviar notificação de tarefa atribuída:', error)
    throw error
  }
}

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
        employeeName: taskData.assignedTo.name,
        completedDate: getBrazilDate().format('DD/MM/YYYY')
      }
    })

    console.log(`✅ Notificação de conclusão enviada para ${taskData.createdBy.name}`)
    return { notification, emailSent }

  } catch (error) {
    console.error('❌ Erro ao enviar notificação de tarefa concluída:', error)
    throw error
  }
}

// ✅ FUNÇÃO CORRIGIDA COM TIMEZONE BRASIL
export const checkUpcomingTasks = async () => {
  try {
    console.log('🔍 Verificando tarefas que vencem AMANHÃ (timezone Brasília)...')
    
    // ✅ USAR HORÁRIO DE BRASÍLIA CORRETAMENTE
    const nowBrazil = moment().tz(BRAZIL_TIMEZONE)
    
    // ✅ CALCULAR AMANHÃ NO TIMEZONE BRASIL
    const tomorrowBrazil = nowBrazil.clone().add(1, 'day')
    
    // ✅ CONVERTER PARA UTC PARA COMPARAR COM BANCO (que está em UTC)
    // Início de amanhã no Brasil, convertido para UTC
    const tomorrowStartBrazil = tomorrowBrazil.clone().startOf('day')
    const tomorrowEndBrazil = tomorrowBrazil.clone().endOf('day')
    
    // ✅ IMPORTANTE: Converter para UTC para comparar com o banco
    const tomorrowStartUTC = tomorrowStartBrazil.utc().toDate()
    const tomorrowEndUTC = tomorrowEndBrazil.utc().toDate()

    console.log('📅 Debug de datas (CORRIGIDO):')
    console.log('   Agora (Brasília):', nowBrazil.format('DD/MM/YYYY HH:mm:ss'))
    console.log('   Amanhã (Brasília):', tomorrowBrazil.format('DD/MM/YYYY'))
    console.log('   Busca UTC início:', tomorrowStartUTC.toISOString())
    console.log('   Busca UTC fim:', tomorrowEndUTC.toISOString())

    // ✅ BUSCAR tarefas usando UTC (como estão salvas no banco)
    const upcomingTasks = await prisma.task.findMany({
      where: {
        AND: [
          {
            dueDate: { 
              gte: tomorrowStartUTC,  // UTC
              lte: tomorrowEndUTC     // UTC
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
        assignedTo: { 
          select: { id: true, name: true, email: true } 
        },
        createdBy: { 
          select: { id: true, name: true, email: true } 
        }
      }
    })

    console.log(`📋 Encontradas ${upcomingTasks.length} tarefas que vencem AMANHÃ`)

    if (upcomingTasks.length === 0) {
      console.log('ℹ️ Nenhuma tarefa vence amanhã - nada para notificar')
      return
    }

    // ✅ Log das tarefas encontradas (convertendo UTC para Brasil para exibição)
    upcomingTasks.forEach(task => {
      const dueDateBrazil = moment(task.dueDate).tz(BRAZIL_TIMEZONE).format('DD/MM/YYYY')
      console.log(`   📝 "${task.title}" - Vence: ${dueDateBrazil} (AMANHÃ)`)
      console.log(`       Data UTC no banco: ${task.dueDate?.toISOString()}`)
    })

    for (const task of upcomingTasks) {
      // ✅ Verificar notificações das últimas 24h (horário Brasília)
      const last24HoursBrazil = nowBrazil.clone().subtract(24, 'hours').toDate()
      
      const existingNotification = await prisma.notification.findFirst({
        where: {
          taskId: task.id,
          type: 'TASK_OVERDUE',
          createdAt: { 
            gte: last24HoursBrazil
          }
        }
      })

      if (!existingNotification) {
        // ✅ FORMATAR DATA CORRETAMENTE PARA EXIBIÇÃO (UTC -> Brasil)
        const dueDateFormatted = moment(task.dueDate).tz(BRAZIL_TIMEZONE).format('DD/MM/YYYY')
        console.log(`⚠️ Enviando aviso: "${task.title}" vence AMANHÃ (${dueDateFormatted})`)

        // Criar notificação no sistema
        await createNotification({
          type: 'TASK_OVERDUE',
          title: 'Tarefa vence amanhã',
          message: `A tarefa "${task.title}" vence amanhã (${dueDateFormatted})`,
          userId: task.assignedTo.id,
          taskId: task.id
        })

        // Enviar email
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
        
      } else {
        console.log(`ℹ️ Tarefa "${task.title}" já foi notificada hoje`)
      }
    }

    console.log('✅ Verificação de tarefas que vencem amanhã concluída')

  } catch (error) {
    console.error('❌ Erro ao verificar tarefas que vencem amanhã:', error)
  }
}

// ✅ SCHEDULER ATUALIZADO COM TIMEZONE BRASIL
export const startNotificationScheduler = () => {
  console.log('⏰ Iniciando agendador de notificações...')
  console.log('🇧🇷 Timezone: América/São_Paulo (Brasília)')
  console.log('📋 Configuração: Avisar 1 dia antes do vencimento')
  
  // ✅ Executar todos os dias às 9:00 da manhã (horário de Brasília)
  cron.schedule('0 9 * * *', () => {
    const nowBrazil = getBrazilDate()
    console.log(`🔄 Executando verificação diária (${nowBrazil.format('DD/MM/YYYY HH:mm:ss')} - Brasília)...`)
    checkUpcomingTasks()
  }, {
    timezone: BRAZIL_TIMEZONE  // ✅ IMPORTANTE: Timezone no cron
  })

  // ✅ Executar uma vez ao iniciar (para teste imediato)
  setTimeout(() => {
    const nowBrazil = getBrazilDate()
    console.log(`🚀 Executando verificação inicial (${nowBrazil.format('DD/MM/YYYY HH:mm:ss')} - Brasília)...`)
    checkUpcomingTasks()
  }, 5000)

  console.log('✅ Agendador configurado: verificação diária às 9:00 (horário de Brasília)')
}

// ✅ FUNÇÃO DE TESTE MANUAL
export const testUpcomingNotifications = async () => {
  const nowBrazil = getBrazilDate()
  console.log(`🧪 === TESTE: TAREFAS QUE VENCEM AMANHÃ (${nowBrazil.format('DD/MM/YYYY HH:mm:ss')} - Brasília) ===`)
  await checkUpcomingTasks()
  console.log('🧪 === FIM DO TESTE ===')
}