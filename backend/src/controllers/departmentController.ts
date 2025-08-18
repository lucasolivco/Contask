import { Request, Response } from 'express'
import prisma from '../config/database'

interface AuthRequest extends Request {
  user?: {
    userId: string
    role: string
  }
}

// Criar novo setor
export const createDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Nome do setor é obrigatório' })
    }

    const department = await prisma.department.create({
      data: { name, description },
      include: {
        _count: {
          select: { users: true, tasks: true }
        }
      }
    })

    res.status(201).json({
      message: 'Setor criado com sucesso',
      department
    })

  } catch (error) {
    console.error('Erro ao criar setor:', error)
    //VERIFICAR ESSE ERROR SE FUNCIONA NO IF
    if (error === 'P2002') {
      return res.status(400).json({ error: 'Já existe um setor com este nome' })
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// Listar todos os setores
export const getDepartments = async (req: AuthRequest, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { users: true, tasks: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    res.json({ departments })

  } catch (error) {
    console.error('Erro ao buscar setores:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// Atribuir funcionário a um setor
export const assignUserToDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, departmentId } = req.body

    const user = await prisma.user.update({
      where: { id: userId },
      data: { departmentId },
      include: {
        department: true
      }
    })

    res.json({
      message: 'Funcionário atribuído ao setor com sucesso',
      user
    })

  } catch (error) {
    console.error('Erro ao atribuir funcionário ao setor:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}