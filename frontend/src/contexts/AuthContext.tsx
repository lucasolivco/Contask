// "Cofre" global que guarda informações do usuário logado
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';

// Define o que nosso "cofre" pode guardar
interface AuthContextType {
    user: User | null; // Usuário logado ou nulo se não houver
    token: string | null; // Token de autenticação ou nulo se não houver
    login: (user: User, token: string) => void; // Função para fazer login
    logout: () => void; // Função para fazer logout
    isLoading: boolean; // Indica se o carregamento está em andamento
}

//Cria o "Cofre" (mas ainda vazio)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// "Gerente do Cofre" - componente que controla o estado global
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null); // Estado do usuário
    const [token, setToken] = useState<string | null>(null); // Estado do token
    const [isLoading, setIsLoading] = useState(true) // Estado de carregamento

    // Quando o site carrega, verifica se o usuário já estava logado
    useEffect(() => {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (savedToken && savedUser) {
            try {
                // Restaura os dados salvos
                setToken(savedToken)
                setUser(JSON.parse(savedUser))
            } catch (error) {
                // Se os dados estão corrompidos, limpa tudo
                console.error('Erro ao restaurar dados do usuário:', error)
                localStorage.removeItem('token')
                localStorage.removeItem('user')
            }
        }
        setIsLoading(false); // Carregamento concluído
    }, []);


    // Função para fazer login
    const login = (userData: User, userToken: string) => {
        setUser(userData); // Atualiza o usuário
        setToken(userToken); // Atualiza o token

        // Salva os dados no "cofre" do navegador
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', userToken);
    }

    // Função para fazer logout
    const logout = () => {
        setUser(null); // Limpa o usuário
        setToken(null); // Limpa o token

        // Remove os dados do "cofre" do navegador
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    }

    // Valores que outros componentes podem acessar
    const value = {
        user,
        token,
        login,
        logout,
        isLoading,
    }

    return (
        <AuthContext.Provider value={value}>
            {children} {/* Renderiza os filhos dentro do "cofre" */}
        </AuthContext.Provider> 
    )
}

// Hook para acessar o "cofre" de forma fácil
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth deve ser usado dentro de AuthProvider');
    }
    return context; // Retorna o "cofre" para quem chamar
}


