// "Menu" de funcionalidades relacionadas às tarefas
import { Router } from 'express'
import { 
  createTask, 
  getTasks, 
  getTask, 
  updateTaskStatus, 
  getEmployees 
} from '../controllers/taskController'
import { authenticateToken, requireManager } from '../middleware/auth'

const router = Router()

// Todas as rotas de tarefas precisam de autenticação
router.use(authenticateToken)

// Rotas para gerentes
router.get('/employees', requireManager, getEmployees) // Listar funcionários
router.post('/', requireManager, createTask) // Criar tarefa

// Rotas para todos os usuários autenticados
router.get('/', getTasks) // Listar tarefas
router.get('/:id', getTask) // Ver tarefa específica
router.patch('/:id/status', updateTaskStatus) // Atualizar status

export default router