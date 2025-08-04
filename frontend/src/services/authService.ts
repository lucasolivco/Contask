// Serviços para autenticação - como "formulários" que ajudam a entrar e sair
import api from './api'; // Importa a configuração da API
import type { LoginForm, RegisterForm, LoginResponse, User } from '../types'; //

// Função para fazer login
export const login = async (data: LoginForm): Promise<LoginResponse> => {
    try {
        // Envia os dados do usuário para o backend
        const response = await api.post('/auth/login', data);
        return response.data; // Retorna a resposta do backend
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        throw error; // Lança o erro para ser tratado em outro lugar
    }
};

// Função para registrar novo usuário
export const register = async (data: RegisterForm): Promise<LoginResponse> => {
    try {
        // Envia os dados do novo usuário para o backend
        const response = await api.post('/auth/register', data);
        return response.data; // Retorna a resposta do backend
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        throw error; // Lança o erro para ser tratado em outro lugar
    }
}

// Função para obter os dados do usuário logado
export const getUser = async (): Promise<User> => {
    try {
        // Faz uma requisição para obter os dados do usuário logado
        const response = await api.get('/auth/me');
        return response.data; // Retorna os dados do usuário
    } catch (error) {
        console.error('Erro ao obter usuário:', error);
        throw error; // Lança o erro para ser tratado em outro lugar
    }
};

