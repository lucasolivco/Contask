// "Menu" de funcionalidades relacionadas a tarefas
import { Router } from 'express'
import {
    createTask,
    getTasks,
    getTask,
    updateTaskStatus,
    getEmployees
} from  '../controllers/taskController'
import { authenticateToken, requireManager } from '../middleware/auth'

const router = Router()

// Todas as rotas de tarefas precisam de autenticação
router.use(authenticateToken)

// Rotas para gerentes
router.post('/', requireManager, createTask) // Criar tarefa
router.get('/', requireManager, getTasks) // Listar tarefas

// Rotas para todos os usuários autenticados
router.get('/employees', getTasks) // Listar tarefas
router.get('/:id', getTask) // Obter tarefa específica
router.patch('/:id/status', updateTaskStatus) // Atualizar status da tarefa

export default router