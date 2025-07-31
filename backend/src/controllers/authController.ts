// "Cérebro" gerencia login, cadastro e recuperação de senha
import { Request, Response } from 'express'
import { hashPassword, comparePassword, generateToken } from '../utils/auth'
import prisma from '../config/database'

// Função para cadastrar novos usuários
export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password, role } = req.body

        // Verifica se todos os campos foram preenchidos
        if (!name || !email || !password) {
            return res.status(400).json({
                error: 'Todos os campos são obrigatórios'
            })
        }

        // Verifica se o email já está sendo usado
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return res.status(400).json({
                error: 'Email já cadastrado'
            })
        }

        // "Embaralha" a senha para salvar com segurança
        const hashedPassword = await hashPassword(password)

        // Cria o usuário no banco de dados
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || 'EMPLOYEE' // Define 'EMPLOYEE' como padrão se não for informado
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true
            }
        })

        // Cria um token para o usuário já ficar logado
        const token = generateToken(user.id)

        res.status(201).json({
            message: 'Usuário cadastrado com sucesso',
            user,
            token
        })
    } catch (error) {
        console.error('Erro ao cadastrar usuário:', error)
        res.status(500).json({
            error: 'Erro interno do servidor'
        })
    }
}

// Função para fazer login
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body

        // Verifica se email e senha foram preenchidos
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email e senha são obrigatórios'
            })
        }

        // Busca o usuário pelo email
        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user) {
            return res.status(400).json({
                error: 'Email ou senha incorretos'
            })
        }

        // Verifica se a senha está correta
        const isValidPassword = await comparePassword(password, user.password)

        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Email ou senha incorretos'
            })
        }

        // Cria um token de acesso
        const token = generateToken(user.id)

        res.json({
            message: 'Login realizado com sucesso',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token
        })

    } catch (error) {
        console.error('Erro ao fazer login:', error)
        res.status(500).json({
            error: 'Erro interno do servidor'
        })
    }
}

// Função para obter informações do usuário logado
export const getMe = async (req: any, res: Response) => {
    try {
        // req.user foi adicionado pelo middleware authenticateToken
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId},
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true
            }
        })

        if (!user) {
            return res.status(404).json({
                error: 'Usuário não encontrado'
            })
        }

        res.json({ user })

    } catch (error) {
        console.error('Erro ao obter usuário:', error)
        res.status(500).json({
            error: 'Erro interno do servidor'
        })
    }
}
