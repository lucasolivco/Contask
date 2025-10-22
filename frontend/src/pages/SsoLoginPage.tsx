// frontend/src/pages/SsoLoginPage.tsx

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // ✅ CORRIGIDO: useAuth importado
import { ssoLogin } from '../services/authService'; // ✅ CORRIGIDO: ssoLogin importado
import { toast } from 'sonner';

const SsoLoginPage: React.FC = () => {
  const [status, setStatus] = useState('Autenticando...');
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const processSsoLogin = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');

      if (!token) {
        setError('Token de autenticação não encontrado.');
        setStatus('Falha na autenticação.');
        toast.error('Token de autenticação ausente.');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      try {
        const { user, token: sessionToken } = await ssoLogin(token);
        
        if (user && sessionToken) {
          setStatus('Autenticado com sucesso! Redirecionando...');
          toast.success(`Bem-vindo, ${user.name}!`);
          login(user, sessionToken);
          // Redireciona para o dashboard após um pequeno delay para o toast aparecer
          setTimeout(() => navigate('/dashboard'), 1500);
        } else {
          throw new Error('Resposta inválida do servidor.');
        }
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || 'Falha ao validar o token de acesso.';
        setError(errorMessage);
        setStatus('Falha na autenticação.');
        toast.error(errorMessage);
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    processSsoLogin();
  }, [location, navigate, login]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">{status}</h1>
        {error && <p className="text-red-500">{error}</p>}
        <div className="mt-4">
          {/* Você pode adicionar um spinner aqui */}
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
        </div>
      </div>
    </div>
  );
};

export default SsoLoginPage;
