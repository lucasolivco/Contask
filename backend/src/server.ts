// Arquivo principal que inicia nosso servidor
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import path from 'path'

// Importa nossas rotas
import authRoutes from './routes/authRoutes'
import taskRoutes from './routes/taskRoutes'

import notificationRoutes from './routes/notificationRoutes'
import { startNotificationScheduler } from './services/notificationService'
import { testEmailConnection } from './services/emailService'

// Carrega variáveis de ambiente
dotenv.config()

// ✅ DEBUG: Log das variáveis de ambiente
console.log('🔧 Variáveis de ambiente carregadas:')
console.log('   NODE_ENV:', process.env.NODE_ENV)
console.log('   PORT:', process.env.PORT)
console.log('   SMTP_HOST:', process.env.SMTP_HOST)
console.log('   SMTP_USER:', process.env.SMTP_USER ? 'Configurado ✅' : 'NÃO CONFIGURADO ❌')
console.log('   SMTP_PASS:', process.env.SMTP_PASS ? 'Configurado ✅' : 'NÃO CONFIGURADO ❌')

// Cria o aplicativo Express
const app = express()
const PORT = process.env.PORT || 3001

// Servir arquivos de upload estaticamente
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Middleware de segurança
app.use(helmet()) // Adiciona cabeçalhos de segurança
app.use(cors()) // Permite requisições do frontend
app.use(morgan('combined')) // Log das requisições

// Limite de requisições para evitar spam
const limiter = rateLimit({
    windowMs:15*60*1000, // 15 minutos
    max: 100, // Limite de 100 requisições por IP
    message: 'Muitas requisições, tente novamente mais tarde.'
})

app.use(limiter) // Aplica o limite de requisições

// Middleware para interpretar JSON
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Rotas da aplicação
app.use('/api/auth', authRoutes) // Todas as rotas de auth começam com /api/auth
app.use('/api/tasks', taskRoutes) // Todas as rotas de tarefas começam com /api/tasks

// Rotas de notificações
app.use('/api/notifications', notificationRoutes) // NOVA LINHA

// Rota de teste para verificar se o servidor está funcionando
app.get('/api/health', (req, res) => {
    res.json({
        message: 'Servidor funcionando!',
        timestamp: new Date().toISOString()
    })
})

// Middleware para rotas não encontradas
app.use('/*path', (req, res) => {
  res.status(404).json({ 
    error: 'Rota não encontrada',
    path: req.originalUrl
  })
})

// Middleware global de tratamento de erros
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erro não tratado:', err)
  res.status(500).json({ 
    error: 'Erro interno do servidor' 
  })
})

// Inicializar serviços
testEmailConnection()
startNotificationScheduler()

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`)
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`)
  console.log(`📍 Rotas da API: http://localhost:${PORT}/api`)
})