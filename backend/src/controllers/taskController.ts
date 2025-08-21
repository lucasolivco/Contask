// "Cérebro" que gerencia todas as operações com tarefas
import { Request, Response } from 'express'
import prisma from '../config/database'
import { Prisma } from '@prisma/client' // para checar erros do Prisma
import fs from 'fs-extra'
import path from 'path'

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

    // ✅ DEBUG: Log para ver se targetDate está chegando
    console.log('📝 Criando tarefa com dados:', {
      title,
      assignedToId,
      dueDate,
      targetDate, // ✅ VERIFICAR SE ESTÁ CHEGANDO
      priority
    })

    // Verifica se os campos obrigatórios foram preenchidos
    if (!title || !assignedToId) {
      return res.status(400).json({ 
        error: 'Título e funcionário responsável são obrigatórios' 
      })
    }

    // Verifica se o funcionário existe
    const assignedUser = await prisma.user.findUnique({
      where: { id: assignedToId }
    })

    if (!assignedUser) {
      return res.status(404).json({ 
        error: 'Funcionário não encontrado' 
      })
    }

    // ✅ CORRIGIDO: Cria a tarefa no banco de dados INCLUINDO targetDate
    const task = await prisma.task.create({
      data: {
        title,
        description,
        assignedToId,
        createdById: req.user!.userId,
        dueDate: dueDate ? new Date(dueDate) : null,
        targetDate: targetDate ? new Date(targetDate) : null, // ✅ ADICIONADO: targetDate
        priority: priority || 'MEDIUM' // ✅ CORRIGIDO: usar inglês
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

    // ✅ DEBUG: Log para ver se foi salvo
    console.log('✅ Tarefa criada:', {
      id: task.id,
      title: task.title,
      targetDate: task.targetDate,
      dueDate: task.dueDate
    })

    // Cria uma notificação para o funcionário
    await prisma.notification.create({
      data: {
        type: 'TASK_ASSIGNED',
        title: 'Nova tarefa atribuída',
        message: `Você recebeu uma nova tarefa: ${title}`,
        userId: assignedToId,
        taskId: task.id
      }
    })

    res.status(201).json({
      message: 'Tarefa criada com sucesso',
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
      dueDateMonth, dueDateYear 
    })

    let whereCondition: any = {}

    // Filtros de permissão
    if (userRole === 'EMPLOYEE') {
      whereCondition.assignedToId = userId
    } else if (userRole === 'MANAGER') {
      whereCondition.createdById = userId
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

    // ✅ ADICIONAR: Busca as tarefas com logs
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
        dueDate: 'asc' // ✅ MELHORAR: Ordenar por data de vencimento quando filtrando por data
      }
    })

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

    res.json({ tasks })

  } catch (error) {
    console.error('❌ Erro ao buscar tarefas:', error)
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
      userRole === 'MANAGER' && task.createdById === userId ||
      userRole === 'EMPLOYEE' && task.assignedToId === userId

    if (!canAccess) {
      return res.status(403).json({ 
        error: 'Você não tem permissão para ver esta tarefa' 
      })
    }

    res.json({ task })

  } catch (error) {
    console.error('Erro ao buscar tarefa:', error)
    res.status(500).json({ 
      error: 'Erro interno do servidor' 
    })
  }
}

// Função para atualizar status da tarefa
export const updateTaskStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const userId = req.user!.userId
    const userRole = req.user!.role

    // Lista de status válidos
    const validStatuses = ['PENDENTE', 'EM_PROGRESSO', 'COMPLETADO', 'CANCELADO']
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Status inválido' 
      })
    }

    // Busca a tarefa atual
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        createdBy: true,
        assignedTo: true
      }
    })

    if (!task) {
      return res.status(404).json({ 
        error: 'Tarefa não encontrada' 
      })
    }

    // Verifica permissões
    const canUpdate = 
      userRole === 'MANAGER' && task.createdById === userId ||
      userRole === 'EMPLOYEE' && task.assignedToId === userId

    if (!canUpdate) {
      return res.status(403).json({ 
        error: 'Você não tem permissão para atualizar esta tarefa' 
      })
    }

    // Atualiza a tarefa
    const updatedTask = await prisma.task.update({
      where: { id },
      data: { status },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Cria notificação para o gerente se um funcionário atualizou
    if (userRole === 'EMPLOYEE') {
      await prisma.notification.create({
        data: {
          type: 'TASK_UPDATED',
          title: 'Tarefa atualizada',
          message: `A tarefa "${task.title}" foi marcada como ${status}`,
          userId: task.createdById,
          taskId: task.id
        }
      })
    }

    res.json({
      message: 'Status da tarefa atualizado com sucesso',
      task: updatedTask
    })

  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error)
    res.status(500).json({ 
      error: 'Erro interno do servidor'
    })
  }
}

// Função para buscar funcionários (para o gerente poder atribuir tarefas)
export const getEmployees = async (req: AuthRequest, res: Response) => {
  try {
    const employees = await prisma.user.findMany({
      where: { role: 'EMPLOYEE' },
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: { 
            assignedTasks: {
              where: { status: { in: ['PENDING', 'IN_PROGRESS'] } }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    res.json({ employees })

  } catch (error) {
    console.error('Erro ao buscar funcionários:', error)
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
      where: { id }
    })

    if (!existingTask) {
      return res.status(404).json({ error: 'Tarefa não encontrada' })
    }

    // Verificar se o funcionário existe (se enviado)
    if (assignedToId) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: assignedToId }
      })

      if (!assignedUser || assignedUser.role !== 'EMPLOYEE') {
        return res.status(400).json({ error: 'Funcionário não encontrado' })
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
      await prisma.notification.create({
        data: {
          type: 'TASK_ASSIGNED',
          title: 'Tarefa atribuída',
          message: `Você foi atribuído à tarefa "${updatedTask.title}"`,
          userId: assignedToId,
          taskId: updatedTask.id
        }
      })
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