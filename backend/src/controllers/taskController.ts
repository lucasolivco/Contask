// "Cérebro" que gerencia todas as operações com tarefas
import { Request, Response } from 'express'
import prisma from '../config/database'

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
    const { title, description, assignedToId, dueDate, priority } = req.body

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

    // Cria a tarefa no banco de dados
    const task = await prisma.task.create({
      data: {
        title,
        description,
        assignedToId,
        createdById: req.user!.userId, // O gerente que está criando
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'MEDIUM'
      },
      include: {
        // Inclui informações do criador e responsável
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true }
        }
      }
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
    const { status, priority, search } = req.query
    const userId = req.user!.userId
    const userRole = req.user!.role

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
    if (status) {
      whereCondition.status = status
    }

    if (priority) {
      whereCondition.priority = priority
    }

    // Busca por palavra-chave no título ou descrição
    if (search) {
      whereCondition.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ]
    }

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
    const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
    
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