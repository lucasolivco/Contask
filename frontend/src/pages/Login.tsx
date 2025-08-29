// frontend/src/pages/Login.tsx - ESTILO SIMPLES E ELEGANTE

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { LogIn, Eye, EyeOff, Mail, AlertTriangle } from 'lucide-react'

import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import Logo from '../components/ui/Logo'
import { useAuth } from '../contexts/AuthContext'
import { login, resendVerificationEmail } from '../services/authService'
import type { LoginForm } from '../types'

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
})

const Login: React.FC = () => {
  const navigate = useNavigate()
  const { login: loginUser } = useAuth()
  const [showPassword, setShowPassword] = React.useState(false)
  const [emailNotVerified, setEmailNotVerified] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  })

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setEmailNotVerified(null);
      loginUser(data.user, data.token);
      toast.success(`Bem-vindo, ${data.user.name}!`);
      navigate('/dashboard');
    },
    onError: (error: any) => {
      const errorData = error.response?.data;
      
      if (errorData?.emailNotVerified) {
        setEmailNotVerified(getValues('email'));
        toast.error('Email não verificado. Verifique sua caixa de entrada.');
      } else {
        const message = errorData?.error || 'Erro ao fazer login';
        toast.error(message);
      }
    }
  });

  const resendEmailMutation = useMutation({
    mutationFn: resendVerificationEmail,
    onSuccess: () => {
      toast.success('Email de verificação reenviado com sucesso!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Erro ao reenviar email';
      toast.error(message);
    }
  });

  const onSubmit = (data: LoginForm) => {
    setEmailNotVerified(null);
    loginMutation.mutate(data);
  }

  const handleResendEmail = () => {
    if (emailNotVerified) {
      resendEmailMutation.mutate({ email: emailNotVerified });
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4">
      <div className="max-w-sm w-full space-y-8">
        
        {/* ✅ HEADER COM LOGO */}
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <Logo size="xl"/>
          </div>
        </div>

        {/* ✅ ALERTA DE EMAIL NÃO VERIFICADO - SIMPLES */}
        {emailNotVerified && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-amber-800">
                  Email não verificado
                </p>
                <p className="text-sm text-amber-700">
                  Verifique sua caixa de entrada e pasta de spam.
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleResendEmail}
                  loading={resendEmailMutation.isPending}
                  className="text-amber-700 border-amber-300 hover:bg-amber-100"
                >
                  {resendEmailMutation.isPending ? 'Reenviando...' : 'Reenviar email'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ✅ FORMULÁRIO SIMPLES */}
        <Card className="p-6 shadow-lg border border-gray-100">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            
            {/* ✅ EMAIL INPUT */}
            <div>
              <Input
                label="Email"
                type="email"
                placeholder="seu@email.com"
                error={errors.email?.message}
                className="w-full"
                {...register('email')}
              />
            </div>

            {/* ✅ SENHA INPUT */}
            <div className="relative">
              <Input
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                error={errors.password?.message}
                className="w-full pr-12"
                {...register('password')}
              />
              
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-cyan-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* ✅ BOTÃO LOGIN */}
            <Button
              type="submit"
              loading={loginMutation.isPending}
              className="w-full h-11 mt-6"
            >
              {loginMutation.isPending ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          {/* ✅ OPÇÕES ADICIONAIS */}
          <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
            
            {/* ✅ LEMBRAR-ME E ESQUECI SENHA */}
            <div className="flex items-center justify-between">
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-gray-700">Lembrar-me</span>
              </label>

              <Link 
                to="/forgot-password"
                className="text-sm font-medium text-red-600 hover:text-red-700"
              >
                Esqueceu sua senha?
              </Link>
            </div>

            {/* ✅ LINK PARA CADASTRO */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Não tem uma conta?{' '}
                <Link
                  to="/register"
                  className="font-medium text-cyan-600 hover:text-cyan-700"
                >
                  Cadastre-se
                </Link>
              </p>
            </div>
          </div>
        </Card>

        {/* ✅ FOOTER DISCRETO */}
        <div className="text-center">
          <p className="text-xs text-gray-400">
            © 2025 Contask. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login