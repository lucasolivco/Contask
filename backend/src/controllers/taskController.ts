// "Cérebro" que gerencia todas as operações com tarefas
import { Request, Response } from 'express'
import prisma from '../config/database'
import { Prisma } from '@prisma/client' // para checar erros do Prisma

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
    const { status, priority, search, assignedToId, dueDate, overdue } = req.query
    const userId = req.user!.userId
    const userRole = req.user!.role

    console.log('🔍 Filtros recebidos:', { status, priority, search, assignedToId, dueDate, overdue })

    // Condições de busca baseadas no que o usuário digitou
    let whereCondition: any = {}

    // Se for funcionário, só vê tarefas atribuídas a ele
    // Se for gerente, vê todas as tarefas que criou
    if (userRole === 'EMPLOYEE') {
      whereCondition.assignedToId = userId
    } else if (userRole === 'MANAGER') {
      whereCondition.createdById = userId
    }

    // Filtros opcionais
    if (status && status !== 'all') {
      whereCondition.status = status
    }

    if (priority && priority !== 'all') {
      whereCondition.priority = priority
    }

    // Se é gerente e quer filtrar por funcionário específico
    if (userRole === 'MANAGER' && assignedToId && assignedToId !== 'all') {
      whereCondition.assignedToId = assignedToId
    }

    // Filtro por data de vencimento
    if (dueDate) {
      const date = new Date(dueDate as string)
      whereCondition.dueDate = {
        gte: new Date(date.setHours(0, 0, 0, 0)),
        lt: new Date(date.setHours(23, 59, 59, 999))
      }
    }

    // Filtro para tarefas atrasadas
    if (overdue === 'true') {
      const now = new Date()
      whereCondition.dueDate = {
        lt: now
      }
      whereCondition.status = {
        in: ['PENDENTE', 'EM_PROGRESSO']
      }
    }

    // Busca por palavra-chave no título ou descrição
    const searchTerm = search as string;
    if (searchTerm && typeof searchTerm === 'string' && searchTerm.trim() !== '') {
      whereCondition.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } }
      ]
    }

    console.log('🔍 Condição final de busca:', JSON.stringify(whereCondition, null, 2))

    // Busca as tarefas no banco
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
          select: { attachments: true }
        }
      },
      orderBy: {
        createdAt: 'desc' // Mais recentes primeiro
      }
    })

    console.log('📋 Tarefas encontradas:', tasks.length)

    res.json({ tasks })

  } catch (error) {
    console.error('Erro ao buscar tarefas:', error)
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