// "Segurança" que verifica se a pessoa pode acessar determinadas áreas
import { NextFunction, Request, Response } from 'express'
import { verifyToken } from '../utils/auth'
import prisma from '../config/database'

// Tipo personalizado para incluir informações do usuário na requisição
interface AuthRequest extends Request {
    user?: {
        userId: string
        role: string
    }
}

//Middleware que verifica se o usário está logado
export const authenticateToken = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        //Busca o token no cabeçalho
        //É como mostrar seu ingresso na entrada do cinema
        const authHeader = req.headers.authorization
        const token = authHeader && authHeader.split('')[1] // Remove "Beater" do início

        if (!token) {
            return res.status(401).json({
                message: 'Token não fornecido'
            })
        }

        // Verifica se o token é válido
        const decoded = verifyToken(token)
        if (!decoded) {
            return res.status(403).json({
                error: 'Token inválido'
            })
        }

        // Busca informações do usuário no banco de dados
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, role: true } // Só busca o que precisamos
        })

        if (!user) {
            return res.status(404).json({
                error: 'Usuário não encontrado'
            })
        }

        // Adiciona as informações do usuário na requisição
        req.user = { userId: user.id, role: user.role}

        // Permite que a requisição continue
        next()
        } catch (error) {
          return res.status(500).json({
            error: 'Erro interno do servidor'
          })
    }
    
}

// Middleware que verifica se o usuário é um gerente
export const requireManager= (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    // Só gerentes podem criar e gerenciar tarefas
    if (req.user?.role !== 'manager') {
        return res.status(403).json({
            error: 'Acesso negado: apenas gerentes podem acessar esta área.'
        })
    }

    next()
}

