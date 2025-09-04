// backend/src/middleware/auth.ts - VERSÃO SEGURA

import { NextFunction, Request, Response } from 'express'
import { verifyToken } from '../utils/auth'
import prisma from '../config/database'

interface AuthRequest extends Request {
    user?: {
        userId: string
        role: string
        sessionId?: string
    }
}

// ✅ BLACKLIST DE TOKENS (em produção use Redis)
const tokenBlacklist = new Set<string>()

export const authenticateToken = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization
        const token = authHeader && authHeader.split(' ')[1]

        if (!token) {
            return res.status(401).json({
                error: 'Token de acesso requerido'
            })
        }

        // ✅ VERIFICAR BLACKLIST
        if (tokenBlacklist.has(token)) {
            return res.status(401).json({
                error: 'Token inválido'
            })
        }

        // ✅ VERIFICAR TOKEN COM TRATAMENTO SEGURO
        let decoded: any
        try {
            decoded = verifyToken(token)
        } catch (error: any) {
            // ✅ NÃO VAZAR DETALHES DO ERRO
            console.error('Token verification failed:', error.message)
            return res.status(401).json({
                error: 'Token inválido'
            })
        }

        if (!decoded || !decoded.userId) {
            return res.status(401).json({
                error: 'Token inválido'
            })
        }

        // ✅ VERIFICAR IDADE DO TOKEN
        const tokenAge = Date.now() - (decoded.iat * 1000)
        const maxAge = 24 * 60 * 60 * 1000 // 24 horas
        
        if (tokenAge > maxAge) {
            return res.status(401).json({
                error: 'Token expirado, faça login novamente'
            })
        }

        // ✅ BUSCAR USUÁRIO COM VERIFICAÇÕES ADICIONAIS
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { 
                id: true, 
                role: true,
                emailVerified: true,
                updatedAt: true
            }
        })

        if (!user) {
            return res.status(401).json({
                error: 'Usuário não encontrado'
            })
        }

        // ✅ VERIFICAÇÕES DE SEGURANÇA
        if (!user.emailVerified) {
            return res.status(401).json({
                error: 'Email não verificado',
                requiresVerification: true
            })
        }

        // ✅ VERIFICAR SE SENHA FOI ALTERADA APÓS EMISSÃO DO TOKEN
        // ✅ VERIFICAR SE SENHA FOI ALTERADA APÓS EMISSÃO DO TOKEN (COM TOLERÂNCIA)
        if (user.updatedAt && decoded.iat) {
            const tokenIssuedAt = decoded.iat * 1000;
            const userUpdatedAt = user.updatedAt.getTime();
            const tolerance = 10000; // 5 segundos de tolerância

            const passwordChangedAfterToken = userUpdatedAt > (tokenIssuedAt + tolerance);

            if (passwordChangedAfterToken) {
                return res.status(401).json({
                    error: 'Token inválido após alteração de senha'
                });
            }
        }

        req.user = { 
            userId: user.id, 
            role: user.role,
            sessionId: decoded.sessionId 
        }

        next()
    } catch (error) {
        // ✅ LOG DE SEGURANÇA SEM VAZAR DADOS
        console.error(`Auth error for IP ${req.ip}:`, {
            userAgent: req.headers['user-agent'],
            url: req.originalUrl,
            timestamp: new Date().toISOString()
        })
        
        return res.status(500).json({
            error: 'Erro interno do servidor'
        })
    }
}

export const requireManager = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    if (req.user?.role !== 'MANAGER') {
        // ✅ LOG DE TENTATIVA DE ACESSO NÃO AUTORIZADO
        console.warn(`Unauthorized manager access attempt:`, {
            userId: req.user?.userId,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            url: req.originalUrl
        })
        
        return res.status(403).json({
            error: 'Acesso negado'
        })
    }
    next()
}

// ✅ FUNÇÃO PARA INVALIDAR TOKEN (LOGOUT)
export const invalidateToken = (token: string) => {
    tokenBlacklist.add(token)
    
    // ✅ REMOVER DA BLACKLIST APÓS 24H PARA EVITAR MEMORY LEAK
    setTimeout(() => {
        tokenBlacklist.delete(token)
    }, 24 * 60 * 60 * 1000)
}

// ✅ MIDDLEWARE DE LOGOUT
export const logout = (req: AuthRequest, res: Response) => {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]
    
    if (token) {
        invalidateToken(token)
    }
    
    res.json({ message: 'Logout realizado com sucesso' })
}