// services/authService.ts - ADICIONAR SERVIÇOS DE RECUPERAÇÃO
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
        
        const response = await api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`);
        
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

// Outras funções permanecem iguais...
export const login = async (data: LoginForm): Promise<LoginResponse> => {
    try {
        const response = await api.post('/auth/login', data);
        return response.data;
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        throw error;
    }
};

export const register = async (data: RegisterForm): Promise<RegisterResponse> => {
    try {
        const response = await api.post('/auth/register', data);
        return response.data;
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        throw error;
    }
}

export const resendVerificationEmail = async (data: ResendEmailRequest): Promise<ResendEmailResponse> => {
    try {
        const response = await api.post('/auth/resend-verification', data);
        return response.data;
    } catch (error) {
        console.error('Erro ao reenviar email:', error);
        throw error;
    }
};

export const getUser = async (): Promise<User> => {
    try {
        const response = await api.get('/auth/me');
        return response.data;
    } catch (error) {
        console.error('Erro ao obter usuário:', error);
        throw error;
    }
};

// ✅ NOVAS FUNÇÕES DE RECUPERAÇÃO DE SENHA
export const requestPasswordReset = async (data: RequestPasswordResetForm): Promise<RequestPasswordResetResponse> => {
    try {
        const response = await api.post('/auth/request-password-reset', data);
        return response.data;
    } catch (error) {
        console.error('Erro ao solicitar recuperação:', error);
        throw error;
    }
};

export const resetPassword = async (data: ResetPasswordForm): Promise<ResetPasswordResponse> => {
    try {
        const response = await api.post('/auth/reset-password', data);
        return response.data;
    } catch (error) {
        console.error('Erro ao redefinir senha:', error);
        throw error;
    }
};

export const verifyResetToken = async (token: string): Promise<VerifyResetTokenResponse> => {
    try {
        const response = await api.get(`/auth/verify-reset-token?token=${encodeURIComponent(token)}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao verificar token de reset:', error);
        throw error;
    }
};
