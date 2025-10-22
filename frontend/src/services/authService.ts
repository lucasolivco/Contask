// services/authService.ts - CORRIGIR TODAS AS ROTAS
import api from './api';
import type { 
  LoginForm, 
  RegisterForm, 
  LoginResponse, 
  RegisterResponse,
  VerifyEmailResponse,
  ResendEmailRequest,
  ResendEmailResponse,
  RequestPasswordResetForm,
  RequestPasswordResetResponse,
  ResetPasswordForm,
  ResetPasswordResponse,
  VerifyResetTokenResponse,
  User 
} from '../types';

// ✅ FUNÇÃO DE VERIFICAÇÃO CORRIGIDA
export const verifyEmail = async (token: string): Promise<VerifyEmailResponse> => {
    try {
        console.log('🔍 Verificando token:', token);
        
        const response = await api.get(`/api/auth/verify-email?token=${encodeURIComponent(token)}`); // ✅ /api/auth/
        
        console.log('✅ Resposta da verificação:', response.data);
        
        // Verificar se a resposta tem a estrutura esperada
        if (response.data && response.data.user) {
            return response.data;
        } else {
            throw new Error('Resposta inválida da API');
        }
        
    } catch (error: any) {
        console.error('❌ Erro na verificação:', error);
        
        // Log detalhado do erro
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        
        throw error;
    }
};

// ✅ LOGIN CORRIGIDO
export const login = async (data: LoginForm): Promise<LoginResponse> => {
    try {
        const response = await api.post('/api/auth/login', data); // ✅ /api/auth/login
        return response.data;
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        throw error;
    }
};

// ✅ REGISTER CORRIGIDO
export const register = async (data: RegisterForm): Promise<RegisterResponse> => {
    try {
        const response = await api.post('/api/auth/register', data); // ✅ /api/auth/register
        return response.data;
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        throw error;
    }
}

// ✅ RESEND EMAIL CORRIGIDO
export const resendVerificationEmail = async (data: ResendEmailRequest): Promise<ResendEmailResponse> => {
    try {
        const response = await api.post('/api/auth/resend-verification', data); // ✅ /api/auth/resend-verification
        return response.data;
    } catch (error) {
        console.error('Erro ao reenviar email:', error);
        throw error;
    }
};

// ✅ GET USER CORRIGIDO
export const getUser = async (): Promise<User> => {
    try {
        const response = await api.get('/api/auth/me'); // ✅ /api/auth/me
        return response.data;
    } catch (error) {
        console.error('Erro ao obter usuário:', error);
        throw error;
    }
};

// ✅ REQUEST PASSWORD RESET CORRIGIDO
export const requestPasswordReset = async (data: RequestPasswordResetForm): Promise<RequestPasswordResetResponse> => {
    try {
        const response = await api.post('/api/auth/request-password-reset', data); // ✅ /api/auth/request-password-reset
        return response.data;
    } catch (error) {
        console.error('Erro ao solicitar recuperação:', error);
        throw error;
    }
};

// ✅ RESET PASSWORD CORRIGIDO
export const resetPassword = async (data: ResetPasswordForm): Promise<ResetPasswordResponse> => {
    try {
        const response = await api.post('/api/auth/reset-password', data); // ✅ /api/auth/reset-password
        return response.data;
    } catch (error) {
        console.error('Erro ao redefinir senha:', error);
        throw error;
    }
};

// ✅ VERIFY RESET TOKEN CORRIGIDO
export const verifyResetToken = async (token: string): Promise<VerifyResetTokenResponse> => {
    try {
        const response = await api.get(`/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`); // ✅ /api/auth/verify-reset-token
        return response.data;
    } catch (error) {
        console.error('Erro ao verificar token de reset:', error);
        throw error;
    }
};

// ✅ NOVA: FUNÇÃO PARA LOGIN SSO
export const ssoLogin = async (token: string): Promise<LoginResponse> => {
    try {
        const response = await api.post('/api/auth/sso-login', { token });
        return response.data;
    } catch (error) {
        console.error('Erro ao fazer login SSO:', error);
        throw error;
    }
};

// ✅ LOGOUT (SE EXISTIR)
export const logout = async (): Promise<void> => {
    try {
        await api.post('/api/auth/logout'); // ✅ /api/auth/logout
        localStorage.removeItem('access_token'); // ✅ Corrigido
        localStorage.removeItem('user_data');   // ✅ Corrigido
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        // Remove do localStorage mesmo se der erro na API
        localStorage.removeItem('access_token'); // ✅ Corrigido
        localStorage.removeItem('user_data');   // ✅ Corrigido
    }
};