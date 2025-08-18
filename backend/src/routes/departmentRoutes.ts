import { Router } from 'express'
import { 
  createDepartment, 
  getDepartments, 
  assignUserToDepartment 
} from '../controllers/departmentController'
import { authenticateToken, requireManager } from '../middleware/auth'

const router = Router()

router.use(authenticateToken)

// Apenas gerentes podem gerenciar setores
router.post('/', requireManager, createDepartment)
router.get('/', getDepartments)
router.patch('/assign-user', requireManager, assignUserToDepartment)

export default router