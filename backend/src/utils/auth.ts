// utils/auth.ts - VERSÃO CORRIGIDA
import bcrypt from 'bcryptjs'
import jwt, { SignOptions } from 'jsonwebtoken'
import crypto from 'crypto'

// ✅ CONFIGURAÇÃO CORRIGIDA COM VALIDAÇÃO
const JWT_SECRET = process.env.JWT_SECRET || 'seu-jwt-secret-super-seguro-minimo-32-caracteres'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

// Validar se JWT_SECRET existe
if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET deve ter pelo menos 32 caracteres')
}

// ✅ FUNÇÕES DE SENHA EXISTENTES
export const hashPassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, 12)
}

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
    return bcrypt.compare(password, hashedPassword)
}

// ✅ FUNÇÃO CORRIGIDA DE GERAÇÃO DE TOKEN
export const generateToken = (userId: string): string => {
    if (!userId) {
        throw new Error('UserId é obrigatório para gerar token')
    }

    const payload = { userId }
    const options: SignOptions = { 
        expiresIn: '3d',
        issuer: 'task-manager',
        audience: 'task-manager-users'
    }

    return jwt.sign(payload, JWT_SECRET as string, options)
}

// ✅ FUNÇÃO CORRIGIDA DE VERIFICAÇÃO DE TOKEN
export const verifyToken = (token: string): { userId: string } | null => {
    try {
        if (!token) {
            return null
        }

        const decoded = jwt.verify(token, JWT_SECRET as string) as jwt.JwtPayload
        
        if (typeof decoded === 'object' && decoded.userId) {
            return { userId: decoded.userId }
        }
        
        return null
    } catch (error) {
        console.error('Erro ao verificar token:', error)
        return null
    }
}

// ✅ FUNÇÕES DE VERIFICAÇÃO DE EMAIL
export const generateEmailVerificationToken = (): string => {
    return crypto.randomBytes(32).toString('hex')
}

export const getTokenExpirationDate = (): Date => {
    const expiration = new Date()
    expiration.setHours(expiration.getHours() + 24) // 24 horas
    return expiration
}

// ✅ FUNÇÕES DE RESET DE SENHA
export const generatePasswordResetToken = (): string => {
    return crypto.randomBytes(32).toString('hex')
}

export const getPasswordResetExpirationDate = (): Date => {
    const expiration = new Date()
    expiration.setHours(expiration.getHours() + 2) // 2 horas
    return expiration
}

export const isTokenExpired = (expirationDate: Date): boolean => {
    return new Date() > expirationDate
}

// ✅ VALIDAÇÃO DE FORÇA DA SENHA
export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    if (!password) {
        errors.push('Senha é obrigatória')
        return { isValid: false, errors }
    }
    
    if (password.length < 8) {
        errors.push('Senha deve ter pelo menos 8 caracteres')
    }
    
    if (!/[A-Z]/.test(password)) {
        errors.push('Senha deve conter pelo menos uma letra maiúscula')
    }
    
    if (!/[a-z]/.test(password)) {
        errors.push('Senha deve conter pelo menos uma letra minúscula')
    }
    
    if (!/\d/.test(password)) {
        errors.push('Senha deve conter pelo menos um número')
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Senha deve conter pelo menos um caractere especial')
    }
    
    return {
        isValid: errors.length === 0,
        errors
    }
}

// ✅ VALIDAÇÃO DE NOME
export const validateName = (name: string): { isValid: boolean; error?: string } => {
    if (!name) {
        return { isValid: false, error: 'Nome é obrigatório' }
    }

    const trimmedName = name.trim()
    
    if (trimmedName.length < 2) {
        return { isValid: false, error: 'Nome deve ter pelo menos 2 caracteres' }
    }
    
    if (trimmedName.length > 50) {
        return { isValid: false, error: 'Nome deve ter no máximo 50 caracteres' }
    }
    
    // Permitir letras, espaços, acentos e alguns caracteres especiais
    const nameRegex = /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s'-]+$/
    if (!nameRegex.test(trimmedName)) {
        return { isValid: false, error: 'Nome contém caracteres inválidos' }
    }
    
    return { isValid: true }
}

// ✅ FUNÇÃO HELPER PARA VALIDAR EMAIL
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
    if (!email) {
        return { isValid: false, error: 'Email é obrigatório' }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        return { isValid: false, error: 'Email inválido' }
    }

    return { isValid: true }
}

// ✅ FUNÇÃO PARA SANITIZAR ENTRADA
export const sanitizeInput = (input: string): string => {
    return input.trim().toLowerCase()
}

// ✅ FUNÇÃO PARA GERAR SENHAS TEMPORÁRIAS (ÚTIL PARA TESTES)
export const generateTemporaryPassword = (length: number = 12): string => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    
    return password
}