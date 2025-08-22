// "Menu" de funcionalidades relacionadas às tarefas
import { Router } from 'express'
import { 
  createTask, 
  getTasks, 
  getTask, 
  updateTaskStatus, 
  getEmployees,
  getEmployeeDetails,  // ✅ NOVA IMPORTAÇÃO
  editTarefa,
  getTaskComments,
  createComment,
  getTaskAttachments,
  uploadAttachment,
  downloadAttachment,
  getTaskStatsByPeriod,
  debugDates,
  deleteTask,
  bulkDeleteTasks,
  getMyTasks
} from '../controllers/taskController'
import { authenticateToken, requireManager } from '../middleware/auth'
import { upload } from '../middleware/upload'

const router = Router()

// Todas as rotas de tarefas precisam de autenticação
router.use(authenticateToken)

// ✅ NOVA ROTA ESPECÍFICA PARA FUNCIONÁRIOS (deve vir ANTES da rota /)
router.get('/my-tasks', getMyTasks)

// Rotas para gerentes
router.get('/employees', requireManager, getEmployees)
router.get('/employees/:employeeId', requireManager, getEmployeeDetails)  // ✅ NOVA ROTA
router.post('/', requireManager, createTask)
router.put('/:id', editTarefa)

// Rotas para todos os usuários autenticados
router.get('/', getTasks)
router.patch('/:id/status', updateTaskStatus)
router.get('/:id', getTask)

// Comentários
router.get('/:taskId/comments', getTaskComments)
router.post('/:taskId/comments', createComment)

// Anexos
router.get('/:taskId/attachments', getTaskAttachments)
router.post('/:taskId/attachments', upload.array('files', 5), uploadAttachment)
router.get('/attachments/:attachmentId/download', downloadAttachment)

// Estatísticas
router.get('/stats/period', getTaskStatsByPeriod)

// Debug (remover em produção)
router.get('/debug/dates', debugDates)

// Rotas de exclusão (só gerentes)
router.delete('/bulk', requireManager, bulkDeleteTasks)
router.delete('/:id', requireManager, deleteTask)

export default router