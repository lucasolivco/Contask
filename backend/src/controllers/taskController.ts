// "Cérebro" que gerencia todas as operações com tarefas
import { Request, Response } from 'express'
import prisma from '../config/database'
import { Prisma } from '@prisma/client' // para checar erros do Prisma
import fs from 'fs-extra'
import path from 'path'
import { sendEmail } from '../services/emailService'
import moment from 'moment-timezone'

// Interface para tipar as requisições com usuário autenticado
interface AuthRequest extends Request {
  user?: {
    userId: string
    role: string
  }
}

// Função para criar uma nova tarefa (só gerentes podem)
export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, assignedToId, dueDate, targetDate, priority } = req.body

    if (!title || !assignedToId) {
      return res.status(400).json({ 
        error: 'Título e usuário responsável são obrigatórios' // ✅ MUDANÇA: não é só "funcionário"
      })
    }

    // ✅ FUNÇÃO PARA CONVERTER DATA DO FRONTEND PARA UTC CORRETO
    const parseLocalDateToUTC = (dateString: string | null) => {
      if (!dateString) return null
      
      try {
        // Se recebeu no formato DD/MM/YYYY
        if (dateString.includes('/')) {
          const [day, month, year] = dateString.split('/')
          return new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0, 0))
        }
        
        // Se recebeu no formato YYYY-MM-DD
        if (dateString.includes('-')) {
          const [year, month, day] = dateString.split('-')
          return new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0, 0))
        }
        
        return null
      } catch (error) {
        console.error('Erro ao converter data:', error)
        return null
      }
    }

    // ✅ MODIFICAR: Buscar qualquer usuário verificado, não só EMPLOYEE
    const assignedUser = await prisma.user.findFirst({
      where: { 
        id: assignedToId,
        emailVerified: true // ✅ ADICIONAR: Só usuários verificados
        // ✅ REMOVER: role: 'EMPLOYEE' - permitir MANAGERS também
      }
    })

    if (!assignedUser) {
      return res.status(404).json({ 
        error: 'Usuário não encontrado ou não verificado' // ✅ MUDANÇA: mensagem mais genérica
      })
    }

    // ✅ ADICIONAR: Log para debug
    console.log(`📝 Manager ${req.user!.userId} criando tarefa para ${assignedUser.name} (${assignedUser.role})`)

    const manager = await prisma.user.findUnique({
      where: { id: req.user!.userId }
    })

    // ✅ CONVERTER DATAS CORRETAMENTE PARA UTC
    const dueDateUTC = parseLocalDateToUTC(dueDate)
    const targetDateUTC = parseLocalDateToUTC(targetDate)

    console.log('📅 Debug criação de tarefa:')
    console.log('   dueDate recebido:', dueDate)
    console.log('   dueDate convertido UTC:', dueDateUTC?.toISOString())
    console.log('   dueDate em Brasil:', dueDateUTC ? moment(dueDateUTC).tz('America/Sao_Paulo').format('DD/MM/YYYY') : null)

    const task = await prisma.task.create({
      data: {
        title,
        description,
        assignedToId,
        createdById: req.user!.userId,
        dueDate: dueDateUTC,
        targetDate: targetDateUTC,
        priority: priority || 'MEDIUM'
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // ✅ MODIFICAR NOTIFICAÇÃO: Personalizar baseado no role
    const notificationMessage = assignedUser.role === 'MANAGER' 
      ? `Nova tarefa atribuída por ${manager?.name}: "${title}"`
      : `Você recebeu uma nova tarefa: "${title}"`

    // ✅ CRIAR NOTIFICAÇÃO PARA O FUNCIONÁRIO
    await prisma.notification.create({
      data: {
        type: 'TASK_ASSIGNED',
        title: 'Nova tarefa atribuída',
        message: notificationMessage,
        userId: assignedToId,
        taskId: task.id
      }
    })

    // ✅ MODIFICAR EMAIL: Personalizar template baseado no role
    const emailSubject = assignedUser.role === 'MANAGER' 
      ? '📋 Nova tarefa'
      : '📋 Nova tarefa atribuída'

    await sendEmail({
      to: assignedUser.email,
      subject: emailSubject,
      template: 'task-assigned',
      data: {
        userName: assignedUser.name,
        taskTitle: title,
        taskDescription: description,
        dueDate: dueDateUTC ? moment(dueDateUTC).tz('America/Sao_Paulo').format('DD/MM/YYYY') : null,
        managerName: manager?.name,
        isManagerToManager: assignedUser.role === 'MANAGER' // ✅ ADICIONAR: flag para template
      }
    })

    console.log(`✅ Tarefa criada e notificações enviadas: ${title} para ${assignedUser.role}`)

    res.status(201).json({
      message: `Tarefa criada e atribuída para ${assignedUser.name}`,
      task
    })

  } catch (error) {
    console.error('Erro ao criar tarefa:', error)
    res.status(500).json({ 
      error: 'Erro interno do servidor' 
    })
  }
}

// Função para listar tarefas (cada usuário vê apenas suas tarefas)
export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      status, 
      priority, 
      search, 
      assignedToId, 
      dueDate, 
      overdue,
      dueDateMonth,
      dueDateYear
    } = req.query
    
    const userId = req.user!.userId
    const userRole = req.user!.role

    console.log('🔍 Filtros recebidos:', { 
      status, priority, search, assignedToId, dueDate, overdue,
      dueDateMonth, dueDateYear, userRole 
    })

    let whereCondition: any = {}

    // ✅ MODIFICAR: Filtros de permissão para managers
    if (userRole === 'EMPLOYEE') {
      // Employee: apenas tarefas atribuídas a ele
      whereCondition.assignedToId = userId
    } else if (userRole === 'MANAGER') {
      // ✅ MANAGER: tarefas que CRIOU + tarefas ATRIBUÍDAS a ele
      whereCondition.OR = [
        { createdById: userId },    // Tarefas que ele criou
        { assignedToId: userId }    // Tarefas atribuídas a ele por outros managers
      ]
    }

    // Filtros básicos
    if (status && status !== 'all') {
      whereCondition.status = status
    }

    if (priority && priority !== 'all') {
      whereCondition.priority = priority
    }

    if (userRole === 'MANAGER' && assignedToId && assignedToId !== 'all') {
      whereCondition.assignedToId = assignedToId
    }

    // ✅ CORRIGIR FILTRO POR MÊS/ANO DA DATA DE VENCIMENTO
    if (dueDateMonth || dueDateYear) {
      console.log('📅 Processando filtro de mês/ano:', { dueDateMonth, dueDateYear })
      
      if (dueDateMonth && dueDateYear) {
        // Filtrar por mês e ano específicos
        const year = Number(dueDateYear)
        const month = Number(dueDateMonth)
        
        // ✅ CORRIGIR: Criar datas em UTC para evitar problemas de timezone
        const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))
        const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))
        
        console.log(`📅 Filtro ${month}/${year}:`, {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          startLocal: startDate.toLocaleString('pt-BR'),
          endLocal: endDate.toLocaleString('pt-BR')
        })
        
        whereCondition.dueDate = {
          gte: startDate,
          lte: endDate
        }
      } else if (dueDateYear) {
        // Filtrar apenas por ano
        const year = Number(dueDateYear)
        const startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0))
        const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999))
        
        console.log(`📅 Filtro ano ${year}:`, {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
        
        whereCondition.dueDate = {
          gte: startDate,
          lte: endDate
        }
      } else if (dueDateMonth) {
        // Filtrar apenas por mês (ano atual)
        const currentYear = new Date().getFullYear()
        const month = Number(dueDateMonth)
        const startDate = new Date(Date.UTC(currentYear, month - 1, 1, 0, 0, 0, 0))
        const endDate = new Date(Date.UTC(currentYear, month, 0, 23, 59, 59, 999))
        
        console.log(`📅 Filtro mês ${month}/${currentYear}:`, {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
        
        whereCondition.dueDate = {
          gte: startDate,
          lte: endDate
        }
      }
    }

    // ✅ Data específica de vencimento (prioritária sobre mês/ano)
    if (dueDate && !dueDateMonth && !dueDateYear) {
      const inputDate = new Date(dueDate as string)
      // ✅ CORRIGIR: Garantir que seja o dia completo
      const startOfDay = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate(), 0, 0, 0, 0)
      const endOfDay = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate(), 23, 59, 59, 999)
      
      whereCondition.dueDate = {
        gte: startOfDay,
        lte: endOfDay
      }
      
      console.log(`📅 Filtro data específica:`, {
        input: dueDate,
        startOfDay: startOfDay.toISOString(),
        endOfDay: endOfDay.toISOString()
      })
    }

    // ✅ Filtro para tarefas atrasadas (prioritário sobre outros filtros de data)
    if (overdue === 'true') {
      const now = new Date()
      whereCondition.dueDate = {
        lt: now
      }
      whereCondition.status = {
        in: ['PENDING', 'IN_PROGRESS']
      }
      console.log(`⚠️ Filtrando apenas tarefas atrasadas antes de:`, now.toISOString())
    }

    // Busca por palavra-chave
    const searchTerm = search as string;
    if (searchTerm && typeof searchTerm === 'string' && searchTerm.trim() !== '') {
      whereCondition.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } }
      ]
    }

    console.log('🔍 Condição final de busca:', JSON.stringify(whereCondition, null, 2))

    const tasks = await prisma.task.findMany({
      where: whereCondition,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true }
        },
        attachments: true,
        _count: {
          select: { 
            attachments: true,
            comments: true
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    })

    // ✅ ADICIONAR: Flag para indicar se o usuário é o criador ou apenas atribuído
    const tasksWithPermissions = tasks.map(task => ({
      ...task,
      canEdit: task.createdById === userId,           // ✅ Só o criador pode editar
      canChangeStatus: task.assignedToId === userId, // ✅ Só o atribuído pode mudar status
      canDelete: task.createdById === userId,  // ✅ Só o criador pode deletar
      isCreator: task.createdById === userId,         // ✅ É o criador?
      isAssigned: task.assignedToId === userId        // ✅ É o atribuído?
    }))

    console.log('📋 Tarefas encontradas:', tasks.length)

    // ✅ ADICIONAR: Log das datas encontradas para debug
    if (dueDateMonth || dueDateYear) {
      console.log('📅 Datas de vencimento encontradas:')
      tasks.forEach((task, index) => {
        if (task.dueDate) {
          console.log(`${index + 1}. ${task.title}: ${task.dueDate.toISOString()} (${task.dueDate.toLocaleDateString('pt-BR')})`)
        }
      })
    }

    res.json({ 
      tasks: tasksWithPermissions 
    })

  } catch (error) {
    console.error('❌ Erro ao buscar tarefas:', error)
    res.status(500).json({ 
      error: 'Erro interno do servidor' 
    })
  }
}

// ✅ NOVA FUNÇÃO: Buscar usuários para atribuição (MANAGERS + EMPLOYEES)
export const getAssignableUsers = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user!.userId
    const userRole = req.user!.role

    console.log(`🔍 Manager ${currentUserId} buscando usuários atribuíveis`)

    // Verificar se é MANAGER
    if (userRole !== 'MANAGER') {
      return res.status(403).json({ 
        error: 'Apenas gerentes podem acessar lista de usuários atribuíveis' 
      })
    }

    // ✅ BUSCAR TODOS OS USUÁRIOS VERIFICADOS (MANAGERS + EMPLOYEES)
    const users = await prisma.user.findMany({
      where: { 
        emailVerified: true // ✅ Apenas usuários verificados
        // ✅ NÃO FILTRAR POR ROLE - incluir todos
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            assignedTasks: {
              where: {
                status: {
                  in: ['PENDING', 'IN_PROGRESS'] // ✅ Apenas tarefas ativas
                }
              }
            }
          }
        }
      },
      orderBy: [
        { role: 'desc' }, // ✅ MANAGERS primeiro
        { name: 'asc' }   // ✅ Depois por nome
      ]
    })

    // ✅ SEPARAR E ORGANIZAR USUÁRIOS
    const currentUser = users.find(u => u.id === currentUserId)
    const otherManagers = users.filter(u => u.role === 'MANAGER' && u.id !== currentUserId)
    const employees = users.filter(u => u.role === 'EMPLOYEE')

    // ✅ ADICIONAR INFORMAÇÕES EXTRAS
    const usersWithInfo = users.map(user => ({
      ...user,
      isCurrentUser: user.id === currentUserId,
      activeTasks: user._count.assignedTasks,
      category: user.id === currentUserId ? 'self' : 
                user.role === 'MANAGER' ? 'manager' : 'employee'
    }))

    console.log(`✅ Usuários atribuíveis: ${users.length} (${otherManagers.length + 1} managers, ${employees.length} employees)`)

    res.json({
      assignableUsers: usersWithInfo,
      categories: {
        self: currentUser ? [{ ...currentUser, isCurrentUser: true, activeTasks: currentUser._count.assignedTasks }] : [],
        managers: otherManagers.map(u => ({ ...u, isCurrentUser: false, activeTasks: u._count.assignedTasks })),
        employees: employees.map(u => ({ ...u, isCurrentUser: false, activeTasks: u._count.assignedTasks }))
      },
      stats: {
        totalUsers: users.length,
        totalManagers: users.filter(u => u.role === 'MANAGER').length,
        totalEmployees: employees.length
      }
    })

  } catch (error) {
    console.error('❌ Erro ao buscar usuários atribuíveis:', error)
    res.status(500).json({ 
      error: 'Erro interno do servidor' 
    })
  }
}

// Função para buscar uma tarefa específica
export const getTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    const userRole = req.user!.role

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true }
        },
        attachments: true
      }
    })

    if (!task) {
      return res.status(404).json({ 
        error: 'Tarefa não encontrada' 
      })
    }

    // Verifica se o usuário tem permissão para ver esta tarefa
    const canAccess = 
      task.createdById === userId ||    // É o criador
      task.assignedToId === userId      // É o atribuído

    if (!canAccess) {
      return res.status(403).json({ 
        error: 'Você não tem permissão para ver esta tarefa' 
      })
    }

     // ✅ ADICIONAR: Informações de permissão
    const taskWithPermissions = {
      ...task,
      canEdit: task.createdById === userId,           // ✅ Só o criador pode editar
      canChangeStatus: task.assignedToId === userId,  // ✅ Só o atribuído pode mudar status
      canDelete: task.createdById === userId,         // ✅ Só o criador pode excluir
      isCreator: task.createdById === userId,         // ✅ É o criador?
      isAssigned: task.assignedToId === userId        // ✅ É o atribuído?
    }

    res.json({ 
      task: taskWithPermissions 
    })

  } catch (error) {
    console.error('Erro ao buscar tarefa:', error)
    res.status(500).json({ 
      error: 'Erro interno do servidor' 
    })
  }
}


// Função para atualizar status da tarefa
// ✅ FUNÇÃO CORRIGIDA PARA ATUALIZAR STATUS - FUNCIONÁRIOS
export const updateTaskStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const userId = req.user!.userId
    const userRole = req.user!.role

    const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Status inválido. Use: ${validStatuses.join(', ')}` 
      })
    }

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } }
      }
    })

    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' })
    }

    // ✅ MODIFICAR: Apenas o ATRIBUÍDO pode mudar status (independente do role)
    const canUpdateStatus = task.assignedToId === userId

    if (!canUpdateStatus) {
      return res.status(403).json({ 
        error: 'Apenas a pessoa atribuída à tarefa pode alterar o status' 
      })
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { 
        status,
        updatedAt: new Date()
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } }
      }
    })

    // ✅ MODIFICAR: Notificações baseadas na mudança de status
    if (status === 'COMPLETED') {
      // Tarefa concluída - notificar criador (se não for a mesma pessoa)
      if (task.createdById !== task.assignedToId) {
        await prisma.notification.create({
          data: {
            type: 'TASK_COMPLETED',
            title: 'Tarefa concluída',
            message: `A tarefa "${task.title}" foi concluída por ${task.assignedTo.name}`,
            userId: task.createdById,
            taskId: task.id
          }
        })

        // Enviar email para o criador
        await sendEmail({
          to: task.createdBy.email,
          subject: '✅ Tarefa concluída',
          template: 'task-completed',
          data: {
            managerName: task.createdBy.name,
            taskTitle: task.title,
            assignedUserName: task.assignedTo.name,
            completedDate: new Date().toLocaleDateString('pt-BR')
          }
        })
      }

      console.log(`✅ Tarefa concluída: ${task.title} por ${task.assignedTo.name}`)
    
    } else {
      // Outras mudanças de status - notificar criador (se não for a mesma pessoa)
      if (task.createdById !== task.assignedToId) {
        await prisma.notification.create({
          data: {
            type: 'TASK_UPDATED',
            title: 'Status da tarefa atualizado',
            message: `${task.assignedTo.name} atualizou a tarefa "${task.title}" para ${status}`,
            userId: task.createdById,
            taskId: task.id
          }
        })
      }
    }

    res.json({
      message: 'Status da tarefa atualizado com sucesso',
      task: updatedTask
    })

  } catch (error) {
    console.error('❌ Erro ao atualizar tarefa:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// Função para buscar funcionários (para o gerente poder atribuir tarefas)
// ✅ MELHORAR getEmployees para incluir estatísticas básicas
export const getEmployees = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId
    const userRole = req.user!.role

    console.log(`🔍 Manager ${userId} buscando lista de usuários`)

    // Verificar se é MANAGER
    if (userRole !== 'MANAGER') {
      return res.status(403).json({ 
        error: 'Apenas gerentes podem acessar lista de usuários' 
      })
    }

    // ✅ BUSCAR TODOS OS USUÁRIOS VERIFICADOS, NÃO SÓ EMPLOYEES
    const users = await prisma.user.findMany({
      where: { 
        emailVerified: true 
        // ✅ REMOVER: role: 'EMPLOYEE' - incluir MANAGERS também
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true, // ✅ ADICIONAR: incluir role na resposta
        createdAt: true,
        assignedTasks: {
          where: {
            createdById: userId  // ✅ Apenas tarefas criadas pelo manager atual
          },
          select: {
            id: true,
            status: true,
            priority: true,
            dueDate: true,
            createdAt: true
          }
        }
      },
      orderBy: [
        { role: 'desc' }, // ✅ MANAGERS primeiro
        { name: 'asc' }
      ]
    })

    // ✅ CALCULAR ESTATÍSTICAS PARA CADA USUÁRIO (igual ao código anterior)
    const usersWithStats = users.map(user => {
      const tasks = user.assignedTasks
      const totalTasks = tasks.length
      const pendingTasks = tasks.filter(t => t.status === 'PENDING').length
      const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length
      const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length

      // Tarefas atrasadas
      const now = new Date()
      const overdueTasks = tasks.filter(t => 
        t.dueDate && 
        new Date(t.dueDate) < now && 
        ['PENDING', 'IN_PROGRESS'].includes(t.status)
      ).length

      // Taxa de conclusão
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role, // ✅ INCLUIR role
        createdAt: user.createdAt,
        totalTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
        overdueTasks,
        completionRate,
        // Manter compatibilidade com frontend atual
        _count: {
          assignedTasks: totalTasks
        }
      }
    })

    // ✅ SEPARAR POR TIPO PARA ESTATÍSTICAS
    const managers = usersWithStats.filter(u => u.role === 'MANAGER')
    const employees = usersWithStats.filter(u => u.role === 'EMPLOYEE')

    console.log(`✅ Encontrados ${usersWithStats.length} usuários (${managers.length} managers, ${employees.length} employees)`)

    res.json({ 
      employees: usersWithStats, // ✅ MANTER nome para compatibilidade
      users: usersWithStats,     // ✅ ADICIONAR campo mais genérico
      managers: managers,        // ✅ SEPARADO para facilitar frontend
      stats: {
        totalUsers: usersWithStats.length,
        totalManagers: managers.length,
        totalEmployees: employees.length
      }
    })

  } catch (error) {
    console.error('❌ Erro ao buscar usuários:', error)
    res.status(500).json({ 
      error: 'Erro interno do servidor' 
    })
  }
}

// ✅ NOVA FUNÇÃO: Buscar detalhes de um funcionário específico
export const getEmployeeDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { employeeId } = req.params
    const userId = req.user!.userId
    const userRole = req.user!.role

    console.log(`🔍 Manager ${userId} buscando detalhes do usuário ${employeeId}`)

    // Verificar se é MANAGER
    if (userRole !== 'MANAGER') {
      return res.status(403).json({ 
        error: 'Apenas gerentes podem acessar detalhes de usuários' 
      })
    }

    // ✅ BUSCAR QUALQUER USUÁRIO VERIFICADO
    const user = await prisma.user.findFirst({
      where: { 
        id: employeeId,
        emailVerified: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true
      }
    })

    if (!user) {
      return res.status(404).json({ 
        error: 'Usuário não encontrado ou não verificado'
      })
    }

    console.log(`👤 Usuário encontrado: ${user.name} (${user.role})`)

    // ✅ BUSCAR APENAS TAREFAS ATRIBUÍDAS AO USUÁRIO (INDEPENDENTE DO ROLE)
    console.log(`📋 Buscando APENAS tarefas ATRIBUÍDAS ao usuário ${user.name}`)
    
    const tasks = await prisma.task.findMany({
      where: {
        assignedToId: employeeId  // ✅ APENAS tarefas atribuídas a ele
        // ✅ REMOVER: filtro por createdById - não importa quem criou
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true }
        },
        attachments: {
          select: { id: true, fileName: true, originalName: true }
        },
        comments: {
          select: { id: true, message: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        _count: {
          select: { 
            attachments: true,
            comments: true
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { dueDate: 'asc' }
      ]
    })

    console.log(`📊 Encontradas ${tasks.length} tarefas ATRIBUÍDAS ao usuário ${user.name}`)

    // ✅ DEBUG: Log das tarefas encontradas
    if (tasks.length > 0) {
      console.log(`📋 Tarefas atribuídas:`)
      tasks.forEach((task, index) => {
        console.log(`   ${index + 1}. [${task.status}] ${task.title}`)
        console.log(`      Criada por: ${task.createdBy.name}`)
        console.log(`      Atribuída para: ${task.assignedTo.name}`)
      })
    } else {
      console.log(`⚠️ NENHUMA tarefa atribuída encontrada para ${user.name} (${user.role})`)
    }

    // ✅ CALCULAR ESTATÍSTICAS DETALHADAS
    const totalTasks = tasks.length
    const pendingTasks = tasks.filter(t => t.status === 'PENDING').length
    const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length
    const cancelledTasks = tasks.filter(t => t.status === 'CANCELLED').length

    // Calcular tarefas atrasadas
    const now = new Date()
    const overdueTasks = tasks.filter(t => 
      t.dueDate && 
      new Date(t.dueDate) < now && 
      ['PENDING', 'IN_PROGRESS'].includes(t.status)
    ).length

    // ✅ CORRIGIR CÁLCULO DA TAXA DE CONCLUSÃO
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // Estatísticas por prioridade
    const urgentTasks = tasks.filter(t => t.priority === 'URGENT').length
    const highTasks = tasks.filter(t => t.priority === 'HIGH').length
    const mediumTasks = tasks.filter(t => t.priority === 'MEDIUM').length
    const lowTasks = tasks.filter(t => t.priority === 'LOW').length

    // Tarefas recentes (últimas 30 dias)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentTasks = tasks.filter(t => new Date(t.createdAt) >= thirtyDaysAgo).length

    // ✅ ESTRUTURAR RESPOSTA
    const stats = {
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      cancelledTasks,
      overdueTasks,
      completionRate,
      priorityBreakdown: {
        urgent: urgentTasks,
        high: highTasks,
        medium: mediumTasks,
        low: lowTasks
      },
      recentTasks,
      avgTasksPerMonth: totalTasks > 0 ? Math.round(totalTasks / Math.max(1, Math.ceil((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)))) : 0
    }

    console.log(`✅ Estatísticas calculadas para ${user.name}:`, {
      totalTasks,
      pendingTasks,
      completedTasks,
      overdueTasks,
      completionRate: `${completionRate}%`
    })

    res.json({
      employee: user.role === 'EMPLOYEE' ? user : undefined,  // ✅ COMPATIBILIDADE
      user: user,                                              // ✅ CAMPO GENÉRICO
      tasks,
      stats
    })

  } catch (error) {
    console.error('❌ Erro ao buscar detalhes do usuário:', error)
    res.status(500).json({ 
      error: 'Erro interno do servidor' 
    })
  }
}

export const editTarefa = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { title, description, priority, status, dueDate, targetDate, assignedToId } = req.body

    // Verifica autenticação
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    const userRole = req.user.role
    const userId = req.user.userId

    // Verificar se é MANAGER
    if (userRole !== 'MANAGER') {
      return res.status(403).json({ error: 'Apenas gerentes podem editar tarefas' })
    }

    // Verificar se a tarefa existe
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } }
      }
    })

    if (!existingTask) {
      return res.status(404).json({ error: 'Tarefa não encontrada' })
    }

    // ✅ MODIFICAR: Apenas o CRIADOR pode editar (não o atribuído)
    const canEdit = existingTask.createdById === userId

    if (!canEdit) {
      return res.status(403).json({ 
        error: 'Apenas o criador da tarefa pode editá-la. Você pode apenas alterar o status se foi atribuído a você.' 
      })
    }

    // ✅ MODIFICAR: Verificar se o usuário a ser atribuído existe (QUALQUER USUÁRIO VERIFICADO)
    if (assignedToId && assignedToId !== existingTask.assignedToId) {
      const assignedUser = await prisma.user.findFirst({
        where: { 
          id: assignedToId,
          emailVerified: true
          // ✅ NÃO FILTRAR POR ROLE - permitir MANAGERS e EMPLOYEES
        }
      })

      if (!assignedUser) {
        return res.status(400).json({ error: 'Usuário para atribuição não encontrado' })
      }
    }

    // Monta o objeto de atualização apenas com campos enviados
    const data: any = {
      updatedAt: new Date()
    }

    if (title !== undefined && title !== null) data.title = title
    // permitir descrição vazia (string), por isso checamos !== undefined
    if (description !== undefined) data.description = description
    if (priority !== undefined && priority !== null) data.priority = priority
    if (status !== undefined && status !== null) data.status = status

    // dueDate: undefined = sem mudança, '' or null = limpar (set null), string válida = new Date(...)
    if (dueDate !== undefined) {
      if (dueDate === '' || dueDate === null) {
        data.dueDate = null
      } else {
        const parsed = new Date(dueDate)
        if (isNaN(parsed.getTime())) {
          return res.status(400).json({ error: 'Formato de dueDate inválido' })
        }
        data.dueDate = parsed
      }
    }

     // ✅ ADICIONADO: Tratar targetDate (ESTAVA FALTANDO!)
    if (targetDate !== undefined) {
      if (targetDate === '' || targetDate === null) {
        data.targetDate = null
      } else {
        const parsed = new Date(targetDate)
        if (isNaN(parsed.getTime())) {
          return res.status(400).json({ error: 'Formato de targetDate inválido' })
        }
        data.targetDate = parsed
      }
    }

    if (assignedToId !== undefined) {
      // permitir atribuir null para desatribuir
      data.assignedToId = assignedToId || null
    }

    // Executa update
    const updatedTask = await prisma.task.update({
      where: { id },
      data,
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    })

        // Se mudou o assignedTo, cria notificação para o novo responsável
    if (assignedToId && assignedToId !== existingTask.assignedToId) {
      const newAssignedUser = await prisma.user.findUnique({
        where: { id: assignedToId },
        select: { name: true, role: true }
      })

      // ✅ PERSONALIZAR notificação baseada no role
      const notificationMessage = newAssignedUser?.role === 'MANAGER'
        ? `Você foi atribuído à tarefa "${updatedTask.title}" por ${existingTask.createdBy.name}`
        : `Você foi atribuído à tarefa "${updatedTask.title}"`

      await prisma.notification.create({
        data: {
          type: 'TASK_ASSIGNED',
          title: 'Tarefa reatribuída',
          message: notificationMessage,
          userId: assignedToId,
          taskId: updatedTask.id
        }
      })

      console.log(`🔄 Tarefa reatribuída: ${updatedTask.title} para ${newAssignedUser?.name} (${newAssignedUser?.role})`)
    }

    res.json({
      message: 'Tarefa atualizada com sucesso!',
      task: updatedTask
    })
  } catch (error: any) {
    console.error('Erro ao atualizar tarefa:', error)

    // Tratamento específico para erros do Prisma
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Dados duplicados' })
      }
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Tarefa não encontrada' })
      }
    }

    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}


// Buscar comentários de uma tarefa
export const getTaskComments = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params
    const userId = req.user!.userId
    const userRole = req.user!.role

    // Verificar se a tarefa existe e o usuário tem acesso
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

    console.log('💬 Comentários encontrados:', comments.length)

    res.json({ comments })
  } catch (error) {
    console.error('Erro ao buscar comentários:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// Criar novo comentário
export const createComment = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params
    const { message } = req.body
    const userId = req.user!.userId

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Mensagem é obrigatória' })
    }

    // Verificar se a tarefa existe e o usuário tem acesso
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

    console.log('✅ Comentário criado:', comment.id)

    res.status(201).json({
      message: 'Comentário adicionado com sucesso',
      comment
    })
  } catch (error) {
    console.error('Erro ao criar comentário:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// ===== FUNÇÕES PARA ANEXOS =====

// Buscar anexos de uma tarefa
export const getTaskAttachments = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params
    const userId = req.user!.userId

    // Verificar se a tarefa existe e o usuário tem acesso
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

    console.log('📎 Anexos encontrados:', attachments.length)

    res.json({ attachments })
  } catch (error) {
    console.error('Erro ao buscar anexos:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// Upload de anexos
export const uploadAttachment = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params
    const files = req.files as Express.Multer.File[]
    const userId = req.user!.userId

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' })
    }

    // Verificar se a tarefa existe e o usuário tem acesso
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

    console.log('✅ Anexos criados:', attachments.length)

    res.status(201).json({
      message: `${attachments.length} arquivo(s) enviado(s) com sucesso`,
      attachments
    })
  } catch (error) {
    console.error('Erro ao fazer upload:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// Download de anexo
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

    console.log('📥 Download do anexo:', attachment.originalName)

    res.download(attachment.filePath, attachment.originalName)
  } catch (error) {
    console.error('Erro ao fazer download:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export const getTaskStatsByPeriod = async (req: AuthRequest, res: Response) => {
  try {
    const { month, year, dateField = 'createdAt' } = req.query
    const userId = req.user!.userId
    const userRole = req.user!.role

    let whereCondition: any = {}

    // Filtro de permissão
    if (userRole === 'EMPLOYEE') {
      whereCondition.assignedToId = userId
    } else if (userRole === 'MANAGER') {
      whereCondition.createdById = userId
    }

    // Filtro por período
    if (month && year) {
      const startDate = new Date(Number(year), Number(month) - 1, 1)
      const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59, 999)
      
      whereCondition[dateField as string] = {
        gte: startDate,
        lte: endDate
      }
    }

    const stats = await prisma.task.groupBy({
      by: ['status'],
      where: whereCondition,
      _count: {
        id: true
      }
    })

    const priorityStats = await prisma.task.groupBy({
      by: ['priority'],
      where: whereCondition,
      _count: {
        id: true
      }
    })

    res.json({ 
      statusStats: stats,
      priorityStats,
      period: { month, year, dateField }
    })

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export const debugDates = async (req: AuthRequest, res: Response) => {
  try {
    const { month, year } = req.query
    
    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year required' })
    }
    
    const monthNum = Number(month)
    const yearNum = Number(year)
    
    // Testar criação de datas
    const startDate = new Date(Date.UTC(yearNum, monthNum - 1, 1, 0, 0, 0, 0))
    const endDate = new Date(Date.UTC(yearNum, monthNum, 0, 23, 59, 59, 999))
    
    // Buscar tarefas nesse período
    const tasks = await prisma.task.findMany({
      where: {
        dueDate: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        id: true,
        title: true,
        dueDate: true
      }
    })
    
    // Buscar TODAS as tarefas para comparar
    const allTasks = await prisma.task.findMany({
      where: {
        dueDate: { not: null }
      },
      select: {
        id: true,
        title: true,
        dueDate: true
      },
      orderBy: {
        dueDate: 'asc'
      }
    })
    
    res.json({
      debug: {
        input: { month: monthNum, year: yearNum },
        range: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          startLocal: startDate.toLocaleString('pt-BR'),
          endLocal: endDate.toLocaleString('pt-BR')
        },
        found: tasks.length,
        tasks: tasks.map(t => ({
          id: t.id,
          title: t.title,
          dueDate: t.dueDate?.toISOString(),
          dueDateLocal: t.dueDate?.toLocaleString('pt-BR')
        }))
      },
      allTasks: allTasks.map(t => ({
        id: t.id,
        title: t.title,
        dueDate: t.dueDate ? t.dueDate.toISOString() : null,
        dueDateLocal: t.dueDate ? t.dueDate.toLocaleString('pt-BR') : null,
        month: t.dueDate ? t.dueDate.getMonth() + 1 : null,
        year: t.dueDate ? t.dueDate.getFullYear() : null
      }))
    })
    
  } catch (error) {
    console.error('❌ Erro no debug:', error)
    res.status(500).json({ error: 'Erro interno' })
  }
}

// ✅ EXCLUIR TAREFA INDIVIDUAL
export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId
    const userRole = req.user!.role

    // Verificar se é MANAGER
    if (userRole !== 'MANAGER') {
      return res.status(403).json({ 
        error: 'Apenas gerentes podem excluir tarefas' 
      })
    }

    // Verificar se a tarefa existe
    const task = await prisma.task.findUnique({
      where: { id },
      include: { 
        assignedTo: { select: { name: true } },
        attachments: true
      }
    })

    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' })
    }

    // Verificar se o manager é dono da tarefa
    if (task.createdById !== userId) {
      return res.status(403).json({ 
        error: 'Você só pode excluir tarefas que criou' 
      })
    }

    // Excluir arquivos físicos dos anexos
    for (const attachment of task.attachments) {
      try {
        if (fs.existsSync(attachment.filePath)) {
          await fs.remove(attachment.filePath)
          console.log(`🗑️ Arquivo removido: ${attachment.filePath}`)
        }
      } catch (fileError) {
        console.warn(`⚠️ Erro ao remover arquivo: ${attachment.filePath}`, fileError)
      }
    }

    // Excluir anexos do banco
    await prisma.attachment.deleteMany({
      where: { taskId: id }
    })

    // Excluir comentários
    await prisma.comment.deleteMany({
      where: { taskId: id }
    })

    // Excluir notificações relacionadas
    await prisma.notification.deleteMany({
      where: { taskId: id }
    })

    // Excluir a tarefa
    await prisma.task.delete({
      where: { id }
    })

    console.log(`🗑️ Tarefa "${task.title}" excluída por ${req.user!.userId}`)

    res.json({ 
      message: 'Tarefa excluída com sucesso',
      taskId: id,
      taskTitle: task.title
    })

  } catch (error) {
    console.error('❌ Erro ao excluir tarefa:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// ✅ EXCLUIR MÚLTIPLAS TAREFAS
export const bulkDeleteTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { taskIds } = req.body
    const userId = req.user!.userId
    const userRole = req.user!.role

    // Verificar se é MANAGER
    if (userRole !== 'MANAGER') {
      return res.status(403).json({ 
        error: 'Apenas gerentes podem excluir tarefas' 
      })
    }

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ 
        error: 'Lista de IDs de tarefas é obrigatória' 
      })
    }

    // Buscar tarefas que existem e pertencem ao manager
    const tasks = await prisma.task.findMany({
      where: { 
        id: { in: taskIds },
        createdById: userId  // Só suas próprias tarefas
      },
      include: { 
        attachments: true,
        assignedTo: { select: { name: true } }
      }
    })

    if (tasks.length === 0) {
      return res.status(404).json({ 
        error: 'Nenhuma tarefa válida encontrada para exclusão' 
      })
    }

    const foundIds = tasks.map(t => t.id)
    const notFoundIds = taskIds.filter(id => !foundIds.includes(id))

    // Excluir arquivos físicos dos anexos
    for (const task of tasks) {
      for (const attachment of task.attachments) {
        try {
          if (fs.existsSync(attachment.filePath)) {
            await fs.remove(attachment.filePath)
          }
        } catch (fileError) {
          console.warn(`⚠️ Erro ao remover arquivo: ${attachment.filePath}`)
        }
      }
    }

    // Excluir em cascata (anexos, comentários, notificações)
    await prisma.attachment.deleteMany({
      where: { taskId: { in: foundIds } }
    })

    await prisma.comment.deleteMany({
      where: { taskId: { in: foundIds } }
    })

    await prisma.notification.deleteMany({
      where: { taskId: { in: foundIds } }
    })

    // Excluir as tarefas
    const deleteResult = await prisma.task.deleteMany({
      where: { id: { in: foundIds } }
    })

    console.log(`🗑️ ${deleteResult.count} tarefas excluídas em lote por ${userId}`)

    res.json({ 
      message: `${deleteResult.count} tarefa(s) excluída(s) com sucesso`,
      deletedCount: deleteResult.count,
      deletedIds: foundIds,
      skippedIds: notFoundIds.length > 0 ? notFoundIds : undefined,
      deletedTasks: tasks.map(t => ({ id: t.id, title: t.title }))
    })

  } catch (error) {
    console.error('❌ Erro ao excluir tarefas em lote:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// ✅ NOVA FUNÇÃO ESPECÍFICA PARA FUNCIONÁRIOS
export const getMyTasks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId
    const userRole = req.user!.role

    console.log(`🔍 Funcionário ${userId} buscando suas tarefas`)

    // Garantir que apenas funcionários usem esta rota
    if (userRole !== 'EMPLOYEE') {
      return res.status(403).json({ 
        error: 'Esta rota é apenas para funcionários' 
      })
    }

    // Buscar apenas tarefas atribuídas ao funcionário
    const tasks = await prisma.task.findMany({
      where: {
        assignedToId: userId  // ✅ APENAS tarefas atribuídas a este funcionário
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true }
        },
        attachments: true,
        _count: {
          select: { 
            attachments: true,
            comments: true
          }
        }
      },
      orderBy: [
        { status: 'asc' },      // Pendentes primeiro
        { dueDate: 'asc' }      // Por data de vencimento
      ]
    })

    console.log(`✅ Encontradas ${tasks.length} tarefas para funcionário ${userId}`)
    
    // ✅ LOG das tarefas para debug
    tasks.forEach((task, index) => {
      console.log(`${index + 1}. [${task.status}] ${task.title} - Atribuída a: ${task.assignedTo.name}`)
    })

    res.json({ tasks })

  } catch (error) {
    console.error('❌ Erro ao buscar tarefas do funcionário:', error)
    res.status(500).json({ 
      error: 'Erro interno do servidor' 
    })
  }
}

// ✅ NOVA FUNÇÃO: Buscar tarefas atribuídas a mim (para managers que receberam tarefas)
export const getMyAssignedTasks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId

    console.log(`🔍 Usuário ${userId} buscando tarefas atribuídas a ele`)

    // Buscar APENAS tarefas atribuídas ao usuário (criadas por outros)
    const tasks = await prisma.task.findMany({
      where: {
        assignedToId: userId,
        createdById: { not: userId } // ✅ Excluir tarefas que ele mesmo criou
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true }
        },
        attachments: true,
        _count: {
          select: { 
            attachments: true,
            comments: true
          }
        }
      },
      orderBy: [
        { status: 'asc' },      // Pendentes primeiro
        { dueDate: 'asc' }      // Por data de vencimento
      ]
    })

    // ✅ ADICIONAR: Informações de permissão
    const tasksWithPermissions = tasks.map(task => ({
      ...task,
      canEdit: false,                    // ✅ Não pode editar (não é criador)
      canChangeStatus: true,             // ✅ Pode mudar status (é atribuído)
      canDelete: false,                  // ✅ Não pode excluir (não é criador)
      isCreator: false,                  // ✅ Não é criador
      isAssigned: true                   // ✅ É atribuído
    }))

    console.log(`✅ Encontradas ${tasks.length} tarefas atribuídas ao usuário ${userId}`)

    res.json({ 
      tasks: tasksWithPermissions 
    })

  } catch (error) {
    console.error('❌ Erro ao buscar tarefas atribuídas:', error)
    res.status(500).json({ 
      error: 'Erro interno do servidor' 
    })
  }
}