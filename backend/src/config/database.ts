// Este arquivo ensina nosso programa a "falar" com o banco de dados
import { PrismaClient } from '@prisma/client'

// Cria uma conexão com o banco (como abrir a porta de um cofre)
const prisma = new PrismaClient({
  log: ['query'], // Isso mostra no console o que está acontecendo no banco
})

// Exporta para outros arquivos usarem
export default prisma