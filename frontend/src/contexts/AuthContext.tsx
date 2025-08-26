// ✅ AUTHCONTEXT COM REACT QUERY
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { User } from '../types';

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (user: User, token: string) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const queryClient = useQueryClient();

    useEffect(() => {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (savedToken && savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);
                
                // ✅ VERIFICAR SE USUÁRIO TEM EMAIL VERIFICADO
                if (parsedUser.emailVerified !== false) {
                    setToken(savedToken);
                    setUser(parsedUser);
                    console.log('✅ Usuário restaurado:', parsedUser.email);
                } else {
                    console.log('⚠️ Usuário não verificado, removendo do localStorage');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            } catch (error) {
                console.error('❌ Erro ao restaurar dados:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setIsLoading(false);
    }, []);

    // Resto do código permanece igual...
    const login = (userData: User, userToken: string) => {
        console.log('🔑 Fazendo login:', userData.email);
        queryClient.clear();
        setUser(userData);
        setToken(userToken);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', userToken);
        console.log('✅ Login concluído');
    };

    const logout = () => {
        console.log('🚪 Fazendo logout...');
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        queryClient.clear();
        queryClient.invalidateQueries();
        console.log('✅ Logout completo');
    };

    const value = {
        user,
        token,
        login,
        logout,
        isLoading,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth deve ser usado dentro de AuthProvider');
    }
    return context;
};