// backend/src/services/emailService.ts - VERSÃO COMPLETA E SEGURA

import nodemailer from 'nodemailer'
import validator from 'validator'
import crypto from 'crypto'
import dotenv from 'dotenv'

dotenv.config()

interface EmailData {
  to: string
  subject: string
  template: 'task-assigned' | 'task-completed' | 'task-overdue' | 'task-updated' | 'task-cancelled' | 'comment-added' | 'attachment-added'
  data: any
}

// ✅ RATE LIMITING POR EMAIL
const emailRateLimit = new Map<string, { count: number; resetTime: number }>()
const EMAIL_RATE_LIMIT = Number(process.env.EMAIL_RATE_LIMIT) || 10
const RATE_WINDOW = Number(process.env.EMAIL_RATE_WINDOW) || 3600000 // 1 hora

// ✅ BLACKLIST DE DOMÍNIOS SUSPEITOS
const SUSPICIOUS_DOMAINS = [
  'tempmail.org', '10minutemail.com', 'guerrillamail.com',
  'mailinator.com', 'throwaway.email', 'temp-mail.org',
  'sharklasers.com', 'emailfake.com', 'mohmal.com'
]

// ✅ FUNÇÃO DE RATE LIMITING
const checkEmailRateLimit = (email: string): boolean => {
  const now = Date.now()
  const userLimit = emailRateLimit.get(email)

  if (!userLimit || now > userLimit.resetTime) {
    emailRateLimit.set(email, { count: 1, resetTime: now + RATE_WINDOW })
    return true
  }

  if (userLimit.count >= EMAIL_RATE_LIMIT) {
    console.warn(`❌ Rate limit exceeded for email: ${email}`)
    return false
  }

  userLimit.count++
  return true
}

// ✅ VALIDAÇÃO ROBUSTA DE EMAIL
const validateEmail = (email: string): boolean => {
  try {
    // ✅ VERIFICAÇÕES BÁSICAS
    if (!email || typeof email !== 'string') return false
    if (email.length > 254) return false // RFC 5321
    if (!validator.isEmail(email)) return false

    // ✅ VERIFICAR DOMÍNIOS SUSPEITOS
    const domain = email.split('@')[1]?.toLowerCase()
    if (SUSPICIOUS_DOMAINS.includes(domain)) {
      console.warn(`❌ Suspicious domain blocked: ${domain}`)
      return false
    }

    // ✅ VERIFICAR CARACTERES PERIGOSOS
    if (/[<>\"'`]/.test(email)) {
      console.warn(`❌ Dangerous characters in email: ${email}`)
      return false
    }

    return true
  } catch (error) {
    console.error('❌ Email validation error:', error)
    return false
  }
}

// ✅ SANITIZAÇÃO SEGURA DE DADOS
const sanitizeData = (data: any): any => {
  if (typeof data === 'string') {
    return data
      .replace(/[<>\"'`]/g, '') // Remove caracteres perigosos
      .replace(/javascript:/gi, '') // Remove javascript:
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
      .substring(0, 1000) // Limitar tamanho
  }
  
  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(data)) {
      if (typeof key === 'string' && key.length < 100) {
        sanitized[key] = sanitizeData(value)
      }
    }
    return sanitized
  }
  
  if (Array.isArray(data)) {
    return data.slice(0, 50).map(item => sanitizeData(item)) // Máximo 50 itens
  }
  
  return data
}

// ✅ TRANSPORTER SEGURO
const createTransporter = () => {
  const config: any = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    requireTLS: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    // ✅ CONFIGURAÇÕES DE SEGURANÇA
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: true
    },
    // ✅ CONFIGURAÇÕES DE TIMEOUT
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000
  }

  return nodemailer.createTransport(config)
}

const transporter = createTransporter()
const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

// ✅ FUNÇÃO PARA GERAR TOKEN DE VERIFICAÇÃO
const generateVerificationToken = (data: any): string => {
  const timestamp = Date.now()
  const randomBytes = crypto.randomBytes(8).toString('hex')
  const hash = crypto
    .createHash('sha256')
    .update(`${JSON.stringify(data)}-${timestamp}-${randomBytes}`)
    .digest('hex')
  return hash.substring(0, 16)
}

// ✅ TEMPLATES SEGUROS
const emailTemplates = {
  'task-assigned': (data: any) => {
    const safe = sanitizeData(data)
    const token = generateVerificationToken(safe)
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nova Tarefa Atribuída</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: white;">
          <!-- Header -->
          <div style="background: #0891b2; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">📋 ${safe.isReassignment ? 'Tarefa Reatribuída' : 'Nova Tarefa Atribuída'}</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 20px;">
            <p style="margin: 0 0 15px 0;">Olá <strong>${safe.userName}</strong>,</p>
            <p style="margin: 0 0 20px 0;">${safe.isReassignment ? 'Uma tarefa foi reatribuída para você:' : 'Você recebeu uma nova tarefa:'}</p>
            
            <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0891b2;">
              <h3 style="margin: 0 0 10px 0; color: #164e63;">${safe.taskTitle}</h3>
              ${safe.taskDescription ? `<p style="margin: 0; color: #475569;">${safe.taskDescription}</p>` : ''}
            </div>
            
            ${safe.dueDate ? `<p style="margin: 10px 0;"><strong>📅 Data de vencimento:</strong> ${safe.dueDate}</p>` : ''}
            ${safe.priority ? `<p style="margin: 10px 0;"><strong>🔥 Prioridade:</strong> ${safe.priority}</p>` : ''}
            <p style="margin: 10px 0;"><strong>👤 ${safe.isReassignment ? 'Reatribuída' : 'Atribuída'} por:</strong> ${safe.managerName}</p>
            
            ${safe.isReassignment && safe.previousAssignee ? `
              <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; color: #92400e;">
                  <strong>🔄 Reatribuição:</strong> Esta tarefa estava anteriormente com ${safe.previousAssignee}
                </p>
              </div>
            ` : ''}
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${BASE_URL}/tasks?ref=${token}" 
                 style="background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Ver Tarefa
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #f8fafc; padding: 15px; text-align: center; color: #64748b; font-size: 14px;">
            <p style="margin: 0;">Sistema de Gerenciamento de Tarefas - Contask</p>
            <p style="margin: 5px 0 0 0; font-size: 12px;">ID: ${token} | ${new Date().toISOString()}</p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  'task-completed': (data: any) => {
    const safe = sanitizeData(data)
    const token = generateVerificationToken(safe)
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tarefa Concluída</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: white;">
          <div style="background: #059669; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">✅ Tarefa Concluída</h1>
          </div>
          
          <div style="padding: 20px;">
            <p style="margin: 0 0 15px 0;">Olá <strong>${safe.managerName}</strong>,</p>
            <p style="margin: 0 0 20px 0;">Uma tarefa foi marcada como concluída:</p>
            
            <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
              <h3 style="margin: 0 0 10px 0; color: #164e63;">${safe.taskTitle}</h3>
              <p style="margin: 0; color: #475569;">Concluída por: <strong>${safe.assignedUserName}</strong></p>
              <p style="margin: 5px 0 0 0; color: #475569;">Data de conclusão: ${safe.completedDate}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${BASE_URL}/tasks?ref=${token}" 
                 style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Ver Detalhes
              </a>
            </div>
          </div>
          
          <div style="background: #f8fafc; padding: 15px; text-align: center; color: #64748b; font-size: 14px;">
            <p style="margin: 0;">Sistema de Gerenciamento de Tarefas - Contask</p>
            <p style="margin: 5px 0 0 0; font-size: 12px;">ID: ${token} | ${new Date().toISOString()}</p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  'task-overdue': (data: any) => {
    const safe = sanitizeData(data)
    const token = generateVerificationToken(safe)
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tarefa ${safe.dueTomorrow ? 'Vence Amanhã' : 'Atrasada'}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: white;">
          <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">⚠️ ${safe.dueTomorrow ? 'Tarefa Vence Amanhã!' : 'Tarefa Atrasada!'}</h1>
          </div>
          
          <div style="padding: 20px;">
            <p style="margin: 0 0 15px 0;">Olá <strong>${safe.userName}</strong>,</p>
            <p style="margin: 0 0 20px 0;"><strong>${safe.dueTomorrow ? 'Lembrete:' : 'Atenção:'}</strong> ${safe.dueTomorrow ? 'Sua tarefa vence amanhã!' : 'Você tem uma tarefa atrasada!'}</p>
            
            <div style="background: ${safe.dueTomorrow ? '#fef3c7' : '#fee2e2'}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${safe.dueTomorrow ? '#f59e0b' : '#dc2626'};">
              <h3 style="margin: 0 0 10px 0; color: ${safe.dueTomorrow ? '#92400e' : '#991b1b'};">${safe.taskTitle}</h3>
              <p style="margin: 5px 0; color: ${safe.dueTomorrow ? '#92400e' : '#991b1b'};">
                <strong>📅 Data de vencimento:</strong> ${safe.dueDate}
              </p>
              <p style="margin: 5px 0; color: ${safe.dueTomorrow ? '#92400e' : '#991b1b'};">
                <strong>👤 Atribuída por:</strong> ${safe.managerName}
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${BASE_URL}/tasks?ref=${token}" 
                 style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                📋 ${safe.dueTomorrow ? 'Concluir Tarefa' : 'Ver Tarefa Atrasada'}
              </a>
            </div>
          </div>
          
          <div style="background: #f8fafc; padding: 15px; text-align: center; color: #64748b; font-size: 14px;">
            <p style="margin: 0;">Sistema de Gerenciamento de Tarefas - Contask</p>
            <p style="margin: 5px 0 0 0; font-size: 12px;">ID: ${token} | ${new Date().toISOString()}</p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  'task-updated': (data: any) => {
    const safe = sanitizeData(data)
    const token = generateVerificationToken(safe)
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tarefa Atualizada</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: white;">
          <div style="background: #ea580c; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">🔄 Tarefa Atualizada</h1>
          </div>
          
          <div style="padding: 20px;">
            <p style="margin: 0 0 15px 0;">Olá <strong>${safe.userName}</strong>,</p>
            <p style="margin: 0 0 20px 0;">Uma tarefa foi atualizada:</p>
            
            <div style="background: #fff7ed; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ea580c;">
              <h3 style="margin: 0 0 10px 0; color: #9a3412;">${safe.taskTitle}</h3>
              <p style="margin: 5px 0; color: #c2410c;">
                <strong>🔄 Atualizada por:</strong> ${safe.updatedBy}
              </p>
              <p style="margin: 5px 0; color: #c2410c;">
                <strong>📅 Data da atualização:</strong> ${safe.updatedDate}
              </p>
            </div>
            
            ${safe.changedFields && Array.isArray(safe.changedFields) && safe.changedFields.length > 0 ? `
              <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0; color: #1e40af;">📋 Campos alterados:</h4>
                <ul style="margin: 0; padding-left: 20px; color: #1e40af;">
                  ${safe.changedFields.slice(0, 10).map((field: string) => `<li>${field}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${BASE_URL}/tasks?ref=${token}" 
                 style="background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Ver Tarefa
              </a>
            </div>
          </div>
          
          <div style="background: #f8fafc; padding: 15px; text-align: center; color: #64748b; font-size: 14px;">
            <p style="margin: 0;">Sistema de Gerenciamento de Tarefas - Contask</p>
            <p style="margin: 5px 0 0 0; font-size: 12px;">ID: ${token} | ${new Date().toISOString()}</p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  'task-cancelled': (data: any) => {
    const safe = sanitizeData(data)
    const token = generateVerificationToken(safe)
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tarefa Cancelada</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: white;">
          <div style="background: #6b7280; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">❌ Tarefa Cancelada</h1>
          </div>
          
          <div style="padding: 20px;">
            <p style="margin: 0 0 15px 0;">Olá <strong>${safe.userName}</strong>,</p>
            <p style="margin: 0 0 20px 0;">Uma tarefa foi cancelada:</p>
            
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6b7280;">
              <h3 style="margin: 0 0 10px 0; color: #374151;">${safe.taskTitle}</h3>
              <p style="margin: 5px 0; color: #4b5563;">
                <strong>❌ Cancelada por:</strong> ${safe.cancelledBy}
              </p>
              <p style="margin: 5px 0; color: #4b5563;">
                <strong>📅 Data do cancelamento:</strong> ${safe.cancelledDate}
              </p>
              ${safe.reason ? `
                <p style="margin: 5px 0; color: #4b5563;">
                  <strong>📝 Motivo:</strong> ${safe.reason}
                </p>
              ` : ''}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${BASE_URL}/tasks?ref=${token}" 
                 style="background: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Ver Todas as Tarefas
              </a>
            </div>
          </div>
          
          <div style="background: #f8fafc; padding: 15px; text-align: center; color: #64748b; font-size: 14px;">
            <p style="margin: 0;">Sistema de Gerenciamento de Tarefas - Contask</p>
            <p style="margin: 5px 0 0 0; font-size: 12px;">ID: ${token} | ${new Date().toISOString()}</p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  'comment-added': (data: any) => {
    const safe = sanitizeData(data)
    const token = generateVerificationToken(safe)
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Novo Comentário</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: white;">
          <div style="background: #0891b2; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">💬 Novo Comentário</h1>
          </div>
          
          <div style="padding: 20px;">
            <p style="margin: 0 0 15px 0;">Olá <strong>${safe.recipientName}</strong>,</p>
            <p style="margin: 0 0 20px 0;">${safe.commentAuthor} adicionou um comentário ${safe.isCreator ? 'na tarefa que você criou' : 'na tarefa'}:</p>
            
            <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0891b2;">
              <h3 style="margin: 0 0 10px 0; color: #164e63;">${safe.taskTitle}</h3>
            </div>
            
            <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <div style="margin-bottom: 10px;">
                <strong style="color: #374151;">${safe.commentAuthor}</strong>
                <span style="color: #6b7280; font-size: 12px; margin-left: 10px;">${safe.commentDate}</span>
              </div>
              <p style="margin: 0; color: #374151; line-height: 1.5;">${safe.commentMessage}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${safe.taskUrl || `${BASE_URL}/tasks`}?ref=${token}" 
                 style="background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Ver Tarefa e Responder
              </a>
            </div>
          </div>
          
          <div style="background: #f8fafc; padding: 15px; text-align: center; color: #64748b; font-size: 14px;">
            <p style="margin: 0;">Sistema de Gerenciamento de Tarefas - Contask</p>
            <p style="margin: 5px 0 0 0; font-size: 12px;">ID: ${token} | ${new Date().toISOString()}</p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  'attachment-added': (data: any) => {
    const safe = sanitizeData(data)
    const token = generateVerificationToken(safe)
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Novo Anexo</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: white;">
          <div style="background: #059669; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">📎 Novo Anexo</h1>
          </div>
          
          <div style="padding: 20px;">
            <p style="margin: 0 0 15px 0;">Olá <strong>${safe.recipientName}</strong>,</p>
            <p style="margin: 0 0 20px 0;">${safe.uploaderName} anexou ${safe.fileCount > 1 ? `${safe.fileCount} arquivos` : 'um arquivo'} ${safe.isCreator ? 'na tarefa que você criou' : 'na tarefa'}:</p>
            
            <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
              <h3 style="margin: 0 0 10px 0; color: #164e63;">${safe.taskTitle}</h3>
            </div>
            
            <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <div style="margin-bottom: 10px;">
                <strong style="color: #374151;">📎 ${safe.fileCount > 1 ? 'Arquivos anexados' : 'Arquivo anexado'}</strong>
                <span style="color: #6b7280; font-size: 12px; margin-left: 10px;">${safe.attachmentDate}</span>
              </div>
              <div style="background: #f9fafb; padding: 10px; border-radius: 6px;">
                <p style="margin: 0; color: #374151; font-family: monospace; font-size: 14px;">${safe.fileNames}</p>
              </div>
              <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px;">
                Por: <strong>${safe.uploaderName}</strong>
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${safe.taskUrl || `${BASE_URL}/tasks`}?ref=${token}" 
                 style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Ver Tarefa e Anexos
              </a>
            </div>
          </div>
          
          <div style="background: #f8fafc; padding: 15px; text-align: center; color: #64748b; font-size: 14px;">
            <p style="margin: 0;">Sistema de Gerenciamento de Tarefas - Contask</p>
            <p style="margin: 5px 0 0 0; font-size: 12px;">ID: ${token} | ${new Date().toISOString()}</p>
          </div>
        </div>
      </body>
      </html>`
  }
}

// ✅ FUNÇÃO PRINCIPAL DE ENVIO DE EMAIL
export const sendEmail = async (emailData: EmailData): Promise<boolean> => {
  try {
    // ✅ VALIDAÇÃO DE ENTRADA
    if (!emailData || typeof emailData !== 'object') {
      console.error('❌ Invalid email data provided')
      return false
    }

    // ✅ VALIDAR EMAIL
    if (!validateEmail(emailData.to)) {
      console.error(`❌ Invalid email address: ${emailData.to}`)
      return false
    }

    // ✅ VERIFICAR RATE LIMIT
    if (!checkEmailRateLimit(emailData.to)) {
      return false
    }

    // ✅ VERIFICAR CONFIGURAÇÕES SMTP
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('⚠️ SMTP not configured - simulating email send')
      return true
    }

    // ✅ VERIFICAR TEMPLATE
    const template = emailTemplates[emailData.template]
    if (!template) {
      console.error(`❌ Template not found: ${emailData.template}`)
      return false
    }

    // ✅ GERAR HTML DO TEMPLATE
    const html = template(emailData.data)

    // ✅ CONFIGURAR EMAIL
    const mailOptions = {
      from: {
        name: 'Contask - Task Manager',
        address: process.env.SMTP_FROM || process.env.SMTP_USER!
      },
      to: emailData.to,
      subject: emailData.subject,
      html,
      // ✅ HEADERS DE SEGURANÇA
      headers: {
        'X-Mailer': 'Contask-System',
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'List-Unsubscribe': `<${BASE_URL}/unsubscribe>`,
        'Auto-Submitted': 'auto-generated'
      }
    }

    // ✅ ENVIAR EMAIL
    const result = await transporter.sendMail(mailOptions)
    
    console.log(`✅ Email sent successfully:`, {
      to: emailData.to,
      template: emailData.template,
      messageId: result.messageId,
      timestamp: new Date().toISOString()
    })
    
    return true

  } catch (error) {
    console.error('❌ Email sending failed:', {
      to: emailData.to,
      template: emailData.template,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
    return false
  }
}

// ✅ TESTE DE CONEXÃO COM SMTP
export const testEmailConnection = async (): Promise<boolean> => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('⚠️ SMTP credentials not configured')
      return false
    }

    await transporter.verify()
    console.log('✅ SMTP connection verified successfully')
    return true
  } catch (error) {
    console.error('❌ SMTP connection failed:', error)
    return false
  }
}

// ✅ EMAIL DE VERIFICAÇÃO
export const sendVerificationEmail = async (email: string, name: string, token: string): Promise<boolean> => {
  if (!validateEmail(email)) return false
  if (!checkEmailRateLimit(email)) return false

  const verificationUrl = `${BASE_URL}/verify-email?token=${token}`
  const safe = sanitizeData({ name, email })
  
  const mailOptions = {
    from: {
      name: 'Contask - Task Manager',
      address: process.env.SMTP_FROM || process.env.SMTP_USER!
    },
    to: email,
    subject: '📧 Confirme seu email - Contask',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirme seu email</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: white;">
          <div style="background: #e11d48; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">📧 Bem-vindo ao Contask!</h1>
          </div>
          
          <div style="padding: 20px;">
            <p style="margin: 0 0 15px 0;">Olá <strong>${safe.name}</strong>,</p>
            <p style="margin: 0 0 20px 0;">Obrigado por se cadastrar! Para ativar sua conta, clique no botão abaixo:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #e11d48; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Confirmar Email
              </a>
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 5px; padding: 15px; margin: 20px 0;">
              <p style="color: #d97706; margin: 0; font-weight: bold;">⏰ Importante:</p>
              <p style="color: #92400e; margin: 10px 0 0 0;">Este link expira em 24 horas</p>
            </div>
            
            <p style="color: #666; font-size: 14px; margin: 20px 0;">
              Se o botão não funcionar, copie e cole este link no seu navegador:<br>
              <a href="${verificationUrl}" style="color: #e11d48; word-break: break-all;">${verificationUrl}</a>
            </p>
            
            <p style="color: #666; font-size: 12px;">
              Se você não criou esta conta, ignore este email.
            </p>
          </div>
          
          <div style="background: #f8fafc; padding: 15px; text-align: center; color: #64748b; font-size: 14px;">
            <p style="margin: 0;">Sistema de Gerenciamento de Tarefas - Contask</p>
            <p style="margin: 5px 0 0 0; font-size: 12px;">${new Date().toISOString()}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`✅ Verification email sent to: ${email}`)
    return true
  } catch (error) {
    console.error('❌ Failed to send verification email:', error)
    return false
  }
}

// ✅ EMAIL DE BOAS-VINDAS
export const sendWelcomeEmail = async (email: string, name: string): Promise<boolean> => {
  if (!validateEmail(email)) return false
  if (!checkEmailRateLimit(email)) return false

  const safe = sanitizeData({ name, email })
  
  const mailOptions = {
    from: {
      name: 'Contask - Task Manager',
      address: process.env.SMTP_FROM || process.env.SMTP_USER!
    },
    to: email,
    subject: '🎉 Conta ativada - Contask',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Conta Ativada</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: white;">
          <div style="background: #059669; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">🎉 Conta ativada com sucesso!</h1>
          </div>
          
          <div style="padding: 20px;">
            <p style="margin: 0 0 15px 0;">Olá <strong>${safe.name}</strong>,</p>
            <p style="margin: 0 0 20px 0;">Sua conta foi ativada com sucesso! Agora você pode:</p>
            
            <ul style="color: #374151; margin: 20px 0; padding-left: 20px;">
              <li>Acessar o dashboard</li>
              <li>Gerenciar suas tarefas</li>
              <li>Receber notificações</li>
              <li>Colaborar com sua equipe</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${BASE_URL}/login" 
                 style="background-color: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Acessar Plataforma
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; text-align: center;">
              Bem-vindo à equipe! 🚀
            </p>
          </div>
          
          <div style="background: #f8fafc; padding: 15px; text-align: center; color: #64748b; font-size: 14px;">
            <p style="margin: 0;">Sistema de Gerenciamento de Tarefas - Contask</p>
            <p style="margin: 5px 0 0 0; font-size: 12px;">${new Date().toISOString()}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`✅ Welcome email sent to: ${email}`)
    return true
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error)
    return false
  }
}

// ✅ EMAIL DE RECUPERAÇÃO DE SENHA
export const sendPasswordResetEmail = async (email: string, name: string, token: string): Promise<boolean> => {
  if (!validateEmail(email)) return false
  if (!checkEmailRateLimit(email)) return false

  const resetUrl = `${BASE_URL}/reset-password?token=${token}`
  const safe = sanitizeData({ name, email })
  
  const mailOptions = {
    from: {
      name: 'Contask - Task Manager',
      address: process.env.SMTP_FROM || process.env.SMTP_USER!
    },
    to: email,
    subject: '🔐 Recuperação de senha - Contask',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperação de Senha</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: white;">
          <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">🔐 Recuperação de senha</h1>
          </div>
          
          <div style="padding: 20px;">
            <p style="margin: 0 0 15px 0;">Olá <strong>${safe.name}</strong>,</p>
            <p style="margin: 0 0 20px 0;">Você solicitou a recuperação da sua senha. Clique no botão abaixo para criar uma nova senha:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Redefinir Senha
              </a>
            </div>
            
            <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 5px; padding: 15px; margin: 20px 0;">
              <p style="color: #dc2626; margin: 0; font-weight: bold;">⚠️ Importante:</p>
              <ul style="color: #991b1b; margin: 10px 0; padding-left: 20px;">
                <li>Este link expira em <strong>2 horas</strong></li>
                <li>Use apenas se você solicitou a recuperação</li>
                <li>Após usar, o link se torna inválido</li>
              </ul>
            </div>
            
            <p style="color: #666; font-size: 14px; margin: 20px 0;">
              Se o botão não funcionar, copie e cole este link no seu navegador:<br>
              <a href="${resetUrl}" style="color: #dc2626; word-break: break-all;">${resetUrl}</a>
            </p>
            
            <p style="color: #666; font-size: 12px;">
              Se você não solicitou esta recuperação, ignore este email. 
              Sua senha atual permanecerá inalterada.
            </p>
          </div>
          
          <div style="background: #f8fafc; padding: 15px; text-align: center; color: #64748b; font-size: 14px;">
            <p style="margin: 0;">Sistema de Gerenciamento de Tarefas - Contask</p>
            <p style="margin: 5px 0 0 0; font-size: 12px;">${new Date().toISOString()}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`✅ Password reset email sent to: ${email}`)
    return true
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error)
    return false
  }
}

// ✅ EMAIL DE CONFIRMAÇÃO DE ALTERAÇÃO DE SENHA
export const sendPasswordChangedEmail = async (email: string, name: string): Promise<boolean> => {
  if (!validateEmail(email)) return false
  if (!checkEmailRateLimit(email)) return false

  const safe = sanitizeData({ name, email })
  
  const mailOptions = {
    from: {
      name: 'Contask - Task Manager',
      address: process.env.SMTP_FROM || process.env.SMTP_USER!
    },
    to: email,
    subject: '✅ Senha alterada - Contask',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Senha Alterada</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: white;">
          <div style="background: #059669; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">✅ Senha alterada com sucesso</h1>
          </div>
          
          <div style="padding: 20px;">
            <p style="margin: 0 0 15px 0;">Olá <strong>${safe.name}</strong>,</p>
            <p style="margin: 0 0 20px 0;">Sua senha foi alterada com sucesso em <strong>${new Date().toLocaleString('pt-BR')}</strong>.</p>
            
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 5px; padding: 15px; margin: 20px 0;">
              <p style="color: #059669; margin: 0; font-weight: bold;">✅ Alteração confirmada</p>
              <p style="color: #047857; margin: 10px 0 0 0;">
                Sua conta está segura e você já pode fazer login com a nova senha.
              </p>
            </div>
            
            <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 5px; padding: 15px; margin: 20px 0;">
              <p style="color: #d97706; margin: 0; font-weight: bold;">🛡️ Não foi você?</p>
              <p style="color: #92400e; margin: 10px 0 0 0;">
                Se você não alterou sua senha, entre em contato conosco imediatamente.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${BASE_URL}/login" 
                 style="background-color: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Fazer Login
              </a>
            </div>
          </div>
          
          <div style="background: #f8fafc; padding: 15px; text-align: center; color: #64748b; font-size: 14px;">
            <p style="margin: 0;">Sistema de Gerenciamento de Tarefas - Contask</p>
            <p style="margin: 5px 0 0 0; font-size: 12px;">${new Date().toISOString()}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`✅ Password changed confirmation sent to: ${email}`)
    return true
  } catch (error) {
    console.error('❌ Failed to send password changed confirmation:', error)
    return false
  }
}

// ✅ CLEANUP DE RATE LIMITING (EXECUTAR PERIODICAMENTE)
export const cleanupRateLimit = () => {
  const now = Date.now()
  for (const [email, data] of emailRateLimit.entries()) {
    if (now > data.resetTime) {
      emailRateLimit.delete(email)
    }
  }
}

// ✅ EXECUTAR CLEANUP A CADA HORA
setInterval(cleanupRateLimit, 60 * 60 * 1000)

export default {
  sendEmail,
  testEmailConnection,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  cleanupRateLimit
}