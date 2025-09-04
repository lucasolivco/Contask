// backend/src/config/database.ts - VERSÃO SEGURA

import { PrismaClient } from '@prisma/client'

const isDevelopment = process.env.NODE_ENV === 'development'

const prisma = new PrismaClient({
  log: isDevelopment ? ['query', 'info', 'warn', 'error'] : ['error'], // ✅ SÓ ERROS EM PRODUÇÃO
  
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
})

// ✅ MIDDLEWARE PARA LOG SEGURO
prisma.$use(async (params, next) => {
  const start = Date.now()
  
  try {
    const result = await next(params)
    
    // ✅ LOG SEGURO (SEM DADOS SENSÍVEIS)
    if (isDevelopment) {
      const duration = Date.now() - start
      console.log(`🔍 DB Query: ${params.model}.${params.action} - ${duration}ms`)
    }
    
    return result
  } catch (error) {
    // ✅ LOG DE ERRO SEGURO
    console.error(`❌ DB Error: ${params.model}.${params.action}`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
    throw error
  }
})

// ✅ TESTE DE CONEXÃO SEGURO
async function testDatabaseConnection() {
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully')
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    process.exit(1)
  }
}

// ✅ GRACEFUL SHUTDOWN
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

// Testar conexão na inicialização
testDatabaseConnection()

export default prisma