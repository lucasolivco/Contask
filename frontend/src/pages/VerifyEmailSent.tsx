// pages/VerifyEmailSent.tsx
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Mail, CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react';

import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { resendVerificationEmail } from '../services/authService';

const VerifyEmailSent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Pegar dados do estado da navegação
  const email = location.state?.email;
  const name = location.state?.name;

  // Se não tem email, redirecionar
  React.useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  // Mutation para reenviar email
  const resendEmailMutation = useMutation({
    mutationFn: resendVerificationEmail,
    onSuccess: () => {
      toast.success('Email reenviado com sucesso!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Erro ao reenviar email';
      toast.error(message);
    }
  });

  const handleResendEmail = () => {
    if (email) {
      resendEmailMutation.mutate({ email });
    }
  };

  if (!email) {
    return null; // ou loading spinner
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Verifique seu email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enviamos um link de confirmação para você
          </p>
        </div>

        {/* Main Card */}
        <Card>
          <div className="text-center space-y-4">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Email enviado com sucesso!
              </h3>
              {name && (
                <p className="text-sm text-gray-600 mt-1">
                  Olá, <strong>{name}</strong>!
                </p>
              )}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg text-left">
              <p className="text-sm text-blue-800">
                📧 <strong>Enviamos um email para:</strong>
              </p>
              <p className="text-sm font-mono text-blue-900 mt-1 break-all">
                {email}
              </p>
            </div>

            <div className="text-sm text-gray-600 space-y-2">
              <p>
                <strong>Para ativar sua conta:</strong>
              </p>
              <ol className="text-left space-y-1 ml-4">
                <li>1. Abra seu email</li>
                <li>2. Procure o email do Task Manager</li>
                <li>3. Clique no link de confirmação</li>
                <li>4. Faça login na plataforma</li>
              </ol>
            </div>

            {/* Buttons */}
            <div className="space-y-3 pt-4">
              <Button
                onClick={handleResendEmail}
                loading={resendEmailMutation.isPending}
                variant="primary"
                className="w-full"
              >
                <RefreshCw size={16} className="mr-2" />
                {resendEmailMutation.isPending ? 'Reenviando...' : 'Reenviar email'}
              </Button>
              
              <Link to="/login" className="block">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft size={16} className="mr-2" />
                  Voltar ao login
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Help Card */}
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="text-sm">
            <h4 className="font-medium text-yellow-800 mb-2">
              ⚠️ Não recebeu o email?
            </h4>
            <ul className="text-yellow-700 space-y-1 text-xs">
              <li>• Verifique sua pasta de spam/lixo eletrônico</li>
              <li>• Aguarde alguns minutos (pode demorar)</li>
              <li>• Certifique-se que o email está correto</li>
              <li>• Clique em "Reenviar email" se necessário</li>
            </ul>
          </div>
        </Card>

      </div>
    </div>
  );
};

export default VerifyEmailSent;