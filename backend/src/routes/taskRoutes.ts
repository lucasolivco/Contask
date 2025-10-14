// backend/src/routes/taskRoutes.ts - VERSÃO FINAL CORRIGIDA

import { Router } from 'express'
import { 
  createTask, 
  getTasks, 
  getTask, 
  updateTaskStatus, 
  getEmployees,
  getAssignableUsers,
  getEmployeeDetails,
  editTarefa,
  getTaskStatsByPeriod,
  debugDates,
  deleteTask,
  bulkDeleteTasks,
  getMyTasks,
  getMyAssignedTasks,
  archiveTask,
  unarchiveTask,
  bulkArchiveTasks
} from '../controllers/taskController'
import { authenticateToken, requireManager } from '../middleware/auth'
import { upload } from '../middleware/upload'

import { 
  getTaskAttachments,
  uploadAttachment,
  deleteAttachment,
  downloadAttachment
} from '../controllers/attachmentController'

import { 
  getTaskComments,
  createComment
} from '../controllers/commentController'

const router = Router()

// ✅ AUTENTICAÇÃO OBRIGATÓRIA
router.use(authenticateToken)

// =====================================================
// ✅ ROTAS ESTÁTICAS (SEM PARÂMETROS) - PRIMEIRA SEÇÃO
// =====================================================
router.get('/stats/period', getTaskStatsByPeriod)
router.get('/debug/dates', debugDates)
router.get('/assignable-users', requireManager, getAssignableUsers)
router.get('/my-tasks', getMyTasks)
router.get('/assigned-to-me', getMyAssignedTasks)
router.get('/employees', requireManager, getEmployees)
router.post('/bulk-archive', requireManager, bulkArchiveTasks) // ✅ NOVA ROTA
router.delete('/bulk', requireManager, bulkDeleteTasks)

// =====================================================
// ✅ ROTAS COM PARÂMETROS ESPECÍFICOS - SEGUNDA SEÇÃO
// =====================================================
router.get('/employees/:employeeId', requireManager, getEmployeeDetails)
router.get('/attachments/:attachmentId/download', downloadAttachment)
router.delete('/attachments/:attachmentId', deleteAttachment)

// =====================================================
// ✅ ROTAS PRINCIPAIS - TERCEIRA SEÇÃO
// =====================================================
router.get('/', getTasks)
router.post('/', requireManager, createTask)

// =====================================================
// ✅ ROTAS COM :id GENÉRICO - QUARTA SEÇÃO
// =====================================================
router.get('/:id', getTask)
router.put('/:id', requireManager, editTarefa)
router.patch('/:id/status', updateTaskStatus)
router.patch('/:id/archive', requireManager, archiveTask) // ✅ NOVA ROTA
router.patch('/:id/unarchive', requireManager, unarchiveTask) // ✅ NOVA ROTA
router.delete('/:id', requireManager, deleteTask)

// =====================================================
// ✅ ROTAS ANINHADAS - QUINTA SEÇÃO (SEMPRE NO FINAL)
// =====================================================
router.get('/:taskId/comments', getTaskComments)
router.post('/:taskId/comments', createComment)
router.get('/:taskId/attachments', getTaskAttachments)
router.post('/:taskId/attachments', upload.array('files', 5), uploadAttachment)

export default router