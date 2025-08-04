// "Cofre" global que guarda informações do usuário logado
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

// Define o que nosso "cofre" pode guardar
interface AuthContextType {
    user: User | null; // Usuário logado ou nulo se não houver
    token: string | null; // Token de autenticação ou nulo se não houver
    login: (user: User, token: string) => void; // Função para fazer login
    logout: () => void; // Função para fazer logout
    isLoading: boolean; // Indica se o carregamento está em andamento
}

//Cria o "Cofre" (mas ainda vazio)