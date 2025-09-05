// backend/src/server.ts - VERSÃO SEGURA

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import slowDown from 'express-slow-down'
import dotenv from 'dotenv'
import path from 'path'
import metricsMiddleware from 'express-prom-bundle';

import authRoutes from './routes/authRoutes'
import taskRoutes from './routes/taskRoutes'
import notificationRoutes from './routes/notificationRoutes'
import { startNotificationScheduler } from './services/notificationService'
import { testEmailConnection } from './services/emailService'

dotenv.config()

const app = express()

// ✅ ADICIONE ESTE TRECHO AQUI
app.use((req, res, next) => {
  console.log(`--> [INÍCIO] Nova requisição recebida: ${req.method} ${req.originalUrl}`);
  next();
});

const PORT = Number(process.env.PORT) || 3001
const isProduction = process.env.NODE_ENV === 'production'

// ✅ LOGGING SEGURO
if (!isProduction) {
  console.log('🔧 Environment variables:')
  console.log('   NODE_ENV:', process.env.NODE_ENV)
  console.log('   PORT:', PORT)
  console.log('   SMTP configured:', !!process.env.SMTP_HOST)
  console.log('   Database configured:', !!process.env.DATABASE_URL)
}

// ✅ HELMET COM CONFIGURAÇÕES SEGURAS
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || "http://localhost:5173"]
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: isProduction ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false
}))

// ✅ CORS SEGURO
const allowedOrigins = isProduction 
  ? [process.env.FRONTEND_URL] // ✅ SÓ SEU DOMÍNIO EM PRODUÇÃO
  : ['http://localhost:5173', 'http://127.0.0.1:5173'] // ✅ SÓ LOCALHOST EM DEV

app.use(cors({
  origin: (origin, callback) => {
    // ✅ PERMITIR REQUESTS SEM ORIGIN (mobile apps)
    if (!origin) return callback(null, true)
    
    if (allowedOrigins.includes(origin)) {
      .06
      callback(null, true)
    } else {
      console.warn(`❌ CORS blocked: ${origin}`)
      callback(new Error('Bloqueado pelo CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// ✅ RATE LIMITING SEGURO
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: isProduction ? 100 : 1000, // ✅ MAIS RESTRITIVO EM PRODUÇÃO
  message: { error: 'Muitas requisições. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // ✅ PULAR RATE LIMITING PARA HEALTH CHECK
    return req.url === '/api/health'
  }
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // ✅ MUITO RESTRITIVO PARA AUTH
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  skipSuccessfulRequests: true
})

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10,
  message: { error: 'Muitos uploads. Aguarde 1 minuto.' }
})

// ✅ SLOW DOWN PARA REQUESTS SUSPEITAS
// ✅ CONFIGURAÇÃO CORRETA PARA express-slow-down v2
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutos
  delayAfter: 50, // Aplicar delay após 50 requests
  delayMs: () => 500, // ✅ NOVA SINTAXE - função que retorna delay fixo
  // OU usar a sintaxe dinâmica:
  // delayMs: (used, req) => {
  //   const delayAfter = req.slowDown.limit;
  //   return (used - delayAfter) * 500;
  // },
  maxDelayMs: 5000, // Delay máximo de 5 segundos
  skipFailedRequests: false,
  skipSuccessfulRequests: false,
  // ✅ DESABILITAR WARNING
  validate: {
    delayMs: false
  }
})

// ✅ APLICAR LIMITERS
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)
app.use('/api/tasks/*path/attachments', uploadLimiter)  // ✅ *path com nome
app.use(speedLimiter)
app.use(generalLimiter)

// ✅ EXPOR MÉTRICAS PARA PROMETHEUS
app.use(metricsMiddleware({ 
    includeMethod: true, 
    includePath: true,
    promClient: {
        collectDefaultMetrics: {}
    }
}))

// ✅ MORGAN LOGGING SEGURO
app.use(morgan(isProduction 
  ? ':remote-addr :method :url :status :response-time ms' // ✅ SEM USER-AGENT EM PROD
  : 'dev'
))

// ✅ BODY PARSER SEGURO
app.use(express.json({ 
  limit: '2mb', // ✅ REDUZIDO DE 10MB
  verify: (req, res, buf) => {
    // ✅ VERIFICAR SE É JSON VÁLIDO
    try {
      JSON.parse(buf.toString())
    } catch (e) {
      throw new Error('JSON inválido')
    }
  }
}))

app.use(express.urlencoded({ 
  extended: true, 
  limit: '2mb' 
}))

// ✅ SERVIR UPLOADS COM SEGURANÇA
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: isProduction ? '1d' : 0,
  etag: false,
  setHeaders: (res, filePath) => {
    // ✅ HEADERS DE SEGURANÇA PARA ARQUIVOS
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    
    // ✅ FORÇAR DOWNLOAD PARA TIPOS PERIGOSOS
    const ext = path.extname(filePath).toLowerCase()
    if (['.html', '.js', '.php', '.asp'].includes(ext)) {
      res.setHeader('Content-Disposition', 'attachment')
    }
  }
}))

// ✅ ROTAS
app.use('/api/auth', authRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/notifications', notificationRoutes)

// ✅ ADICIONE ESTA ROTA DE TESTE AQUI
app.get('/', (req, res) => {
  console.log('--> [ROTA] Rota raiz "/" foi acionada com sucesso!');
  res.status(200).send('<h1>API do Task Organizer está no ar!</h1>');
});

// ✅ HEALTH CHECK SEGURO
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  })
})

// ✅ 404 HANDLER
app.use('/*path', (req, res) => {
  console.warn(`❌ 404: ${req.method} ${req.originalUrl} from ${req.ip}`)
  res.status(404).json({ 
    error: 'Endpoint não encontrado' 
  })
})

// ✅ ERROR HANDLER SEGURO
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // ✅ LOG COMPLETO NO SERVIDOR, ERRO GENÉRICO PARA CLIENTE
  console.error('❌ Unhandled error:', {
    error: err.message,
    stack: isProduction ? undefined : err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  })
  
  res.status(500).json({ 
    error: 'Erro interno do servidor' 
  })
})

// ✅ INICIALIZAR SERVIÇOS
if (isProduction) {
  testEmailConnection()
  startNotificationScheduler()
}

// ✅ GRACEFUL SHUTDOWN
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('📴 SIGINT received, shutting down gracefully')
  process.exit(0)
})

app.listen(PORT, '0.0.0.0', () => {
  if (!isProduction) {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`)
  } else {
    console.log(`🚀 Production server started on port ${PORT}`)
  }
})