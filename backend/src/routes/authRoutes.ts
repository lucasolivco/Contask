// Rotas de autenticação e sessão SSO
import { Router } from 'express';
import {
  register,
  login,
  getMe,
  verifyEmail,
  resendVerificationEmail,
  requestPasswordReset,
  resetPassword,
  verifyResetToken,
  hubLogin,
  ssoLogin,
  validateSession,
  hubLogout,
  findUsername
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router()

// ✅ ROTAS PÚBLICAS (não precisam de autenticação)
router.post('/register', register)
router.post('/login', login)
router.post('/hub-login', hubLogin)
router.post('/sso-login', ssoLogin)
router.get('/verify-email', verifyEmail)
router.post('/resend-verification', resendVerificationEmail)

// ✅ ROTAS DE SESSÃO SSO (cookie compartilhado entre subdomínios)
router.get('/validate-session', validateSession)
router.post('/hub-logout', hubLogout)
router.post('/find-username', findUsername)

// ✅ ROTAS DE RESET DE SENHA
router.post('/request-password-reset', requestPasswordReset)
router.post('/reset-password', resetPassword)
router.get('/verify-reset-token', verifyResetToken)

// ✅ ROTAS PROTEGIDAS (precisam de autenticação)
router.get('/me', authenticateToken, getMe)

export default router
