// "Menu" de funcionalidades relacionadas às tarefas
import { Router } from 'express'
import { 
  createTask, 
  getTasks, 
  getTask, 
  updateTaskStatus, 
  getEmployees,
  editTarefa,
  getTaskComments,
  createComment,
  getTaskAttachments,
  uploadAttachment,
  downloadAttachment
} from '../controllers/taskController'
import { authenticateToken, requireManager } from '../middleware/auth'
import { upload } from '../middleware/upload'

const router = Router()

// Todas as rotas de tarefas precisam de autenticação
router.use(authenticateToken)

// Rotas para gerentes
router.get('/employees', requireManager, getEmployees) // Listar funcionários
router.post('/', requireManager, createTask) // Criar tarefa
router.put('/:id', editTarefa) // atualizar tarefa

// Rotas para todos os usuários autenticados
router.get('/', getTasks) // Listar tarefas
router.get('/:id', getTask) // Ver tarefa específica
router.patch('/:id/status', updateTaskStatus) // Atualizar status

// ✅ NOVAS ROTAS - Comentários
router.get('/:taskId/comments', getTaskComments)        // Buscar comentários
router.post('/:taskId/comments', createComment)         // Criar comentário

// ✅ NOVAS ROTAS - Anexos
router.get('/:taskId/attachments', getTaskAttachments)  // Buscar anexos
router.post('/:taskId/attachments', upload.array('files', 5), uploadAttachment) // Upload
router.get('/attachments/:attachmentId/download', downloadAttachment) // Download

export default router