// Arquivo principal que inicia nosso servidor
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import path from 'path'
import os from 'os'

// Importa nossas rotas
import authRoutes from './routes/authRoutes'
import taskRoutes from './routes/taskRoutes'
import notificationRoutes from './routes/notificationRoutes'
import { startNotificationScheduler } from './services/notificationService'
import { testEmailConnection } from './services/emailService'

// Carrega variáveis de ambiente
dotenv.config()

// ✅ FUNÇÃO PARA DETECTAR IP DA REDE
function getNetworkIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]!) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const networkIP = getNetworkIP();

// ✅ CONVERSÃO CORRETA DA PORTA
const PORT = Number(process.env.PORT) || 3001;

// ✅ DEBUG: Log das variáveis de ambiente
console.log('🔧 Variáveis de ambiente carregadas:')
console.log('   NODE_ENV:', process.env.NODE_ENV)
console.log('   PORT:', PORT)
console.log('   SMTP_HOST:', process.env.SMTP_HOST)
console.log('   SMTP_USER:', process.env.SMTP_USER ? 'Configurado ✅' : 'NÃO CONFIGURADO ❌')
console.log('   SMTP_PASS:', process.env.SMTP_PASS ? 'Configurado ✅' : 'NÃO CONFIGURADO ❌')

// Cria o aplicativo Express
const app = express()

// Servir arquivos de upload estaticamente
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Middleware de segurança
app.use(helmet())

// ✅ CORS CONFIGURADO PARA REDE LOCAL
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        `http://${networkIP}:5173`,
        /^http:\/\/192\.168\.\d+\.\d+:5173$/,
        /^http:\/\/10\.\d+\.\d+\.\d+:5173$/,
        /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+:5173$/
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(morgan('combined'))

// Limite de requisições para evitar spam
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100,
    message: 'Muitas requisições, tente novamente mais tarde.'
})

app.use(limiter)

// Middleware para interpretar JSON
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Rotas da aplicação
app.use('/api/auth', authRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/notifications', notificationRoutes)

// Rota de teste
app.get('/api/health', (req, res) => {
    res.json({
        message: 'Servidor funcionando!',
        timestamp: new Date().toISOString(),
        network: {
            local: `http://localhost:${PORT}`,
            network: `http://${networkIP}:${PORT}`
        }
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

// ✅ AGORA ESTÁ CORRETO - PORT É NUMBER
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando em:`)
  console.log(`   📍 Local:    http://localhost:${PORT}`)
  console.log(`   📍 Rede:     http://${networkIP}:${PORT}`)
  console.log(`   📍 Health:   http://${networkIP}:${PORT}/api/health`)
  console.log(`\n🌐 Para acessar de outros dispositivos: http://${networkIP}:${PORT}`)
  console.log(`📱 Frontend da rede: http://${networkIP}:5173`)
})