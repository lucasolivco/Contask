// pages/VerifyEmail.tsx - VERSÃO CORRIGIDA
import React, { useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';

import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { verifyEmail } from '../services/authService';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = React.useState<'loading' | 'success' | 'error'>('loading');
  const [userEmail, setUserEmail] = React.useState<string>('');
  const [errorMessage, setErrorMessage] = React.useState<string>('');

  const token = searchParams.get('token');

  // ✅ MUTATION CORRIGIDA COM LOGS DETALHADOS
  const verifyEmailMutation = useMutation({
    mutationFn: verifyEmail,
    onSuccess: (data) => {
      console.log('🎉 Verificação bem-sucedida:', data);
      setVerificationStatus('success');
      setUserEmail(data.user.email);
      toast.success('Email verificado com sucesso!');
    },
    onError: (error: any) => {
      console.error('❌ Erro na mutation:', error);
      
      setVerificationStatus('error');
      
      // Tratar diferentes tipos de erro
      let message = 'Erro desconhecido';
      
      if (error.response?.data?.error) {
        message = error.response.data.error;
      } else if (error.message) {
        message = error.message;
      }
      
      setErrorMessage(message);
      toast.error(`Erro na verificação: ${message}`);
    }
  });

  // ✅ VERIFICAÇÃO AUTOMÁTICA COM TIMEOUT
  useEffect(() => {
    if (!token) {
      setVerificationStatus('error');
      setErrorMessage('Token de verificação não encontrado na URL');
      toast.error('Token de verificação não encontrado');
      return;
    }

    console.log('🔄 Iniciando verificação com token:', token);
    
    // Pequeno delay para melhor UX
    const timer = setTimeout(() => {
      verifyEmailMutation.mutate(token);
    }, 500);

    return () => clearTimeout(timer);
  }, [token]);

  // ✅ COMPONENTE DE LOADING MELHORADO
  if (verificationStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <Card className="max-w-md w-full text-center">
          <div className="space-y-4">
            <Loader2 className="mx-auto h-16 w-16 text-blue-600 animate-spin" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Verificando seu email...
              </h2>
              <p className="text-gray-600">
                Aguarde enquanto confirmamos seu endereço de email.
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                ⏳ Este processo pode levar alguns segundos
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // ✅ ESTADO DE SUCESSO
  if (verificationStatus === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Email verificado!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sua conta foi ativada com sucesso
            </p>
          </div>

          <Card>
            <div className="text-center space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-800">
                  🎉 <strong>Parabéns!</strong> Seu email foi confirmado.
                </p>
                {userEmail && (
                  <p className="text-sm text-green-700 mt-1 break-all">
                    {userEmail}
                  </p>
                )}
              </div>

              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">Sua conta está ativa e você já pode:</p>
                <ul className="text-left space-y-1 bg-gray-50 p-3 rounded-lg">
                  <li>✅ Fazer login na plataforma</li>
                  <li>✅ Acessar o dashboard</li>
                  <li>✅ Gerenciar suas tarefas</li>
                  <li>✅ Receber notificações</li>
                </ul>
              </div>

              <div className="pt-4">
                <Link to="/login" className="block">
                  <Button className="w-full">
                    Fazer Login Agora
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ✅ ESTADO DE ERRO DETALHADO
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Erro na verificação
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Não foi possível verificar seu email
          </p>
        </div>

        <Card>
          <div className="text-center space-y-4">
            <div className="bg-red-50 p-4 rounded-lg text-left">
              <p className="text-sm font-medium text-red-800 mb-2">
                ❌ Erro encontrado:
              </p>
              <p className="text-sm text-red-700 font-mono bg-red-100 p-2 rounded">
                {errorMessage || 'Link de verificação inválido ou expirado'}
              </p>
            </div>

            <div className="text-sm text-gray-600 text-left">
              <p className="font-medium mb-2">Possíveis motivos:</p>
              <ul className="space-y-1 bg-gray-50 p-3 rounded-lg">
                <li>• Link já foi usado anteriormente</li>
                <li>• Link expirou (válido por 24h)</li>
                <li>• Link está corrompido ou incompleto</li>
                <li>• Problema temporário de conexão</li>
              </ul>
            </div>

            <div className="space-y-2 pt-4">
              <Link to="/register" className="block">
                <Button className="w-full">
                  Tentar Novamente
                </Button>
              </Link>
              <Link to="/login" className="block">
                <Button variant="ghost" className="w-full">
                  Voltar ao Login
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* ✅ DEBUG INFO (REMOVER EM PRODUÇÃO) */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="bg-yellow-50 border-yellow-200">
            <div className="text-xs text-yellow-800">
              <p className="font-medium">🐛 Debug Info:</p>
              <p>Token: {token}</p>
              <p>Error: {errorMessage}</p>
              <p>Status: {verificationStatus}</p>
            </div>
          </Card>
        )}

      </div>
    </div>
  );
};

export default VerifyEmail;