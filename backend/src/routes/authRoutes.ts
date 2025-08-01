// "Menu" de funcionalidades relacionadas à autenticação
import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

// Cria um "cardápio" de rotas
const router = Router()

// Rota para cadastro - qualquer pessoa pode acessar
// POST significa "enviar dados" (como preenher um formulário)
router.post('/register', register)

//Rota para login - qualquer pessoa pode acessar
router.post('/login', login)

// Rota para ver informações do usuário logado
// Precisa estar logado (authenticateToken verifica isso)
router.get('/me', authenticateToken, getMe)

export default router