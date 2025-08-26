// Página de login com tratamento de email não verificado
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { LogIn, Eye, EyeOff, Mail } from 'lucide-react'

import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
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

  // ✅ MUTATION PARA LOGIN COM TRATAMENTO DE EMAIL NÃO VERIFICADO
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
      
      // ✅ VERIFICAR SE É ERRO DE EMAIL NÃO VERIFICADO
      if (errorData?.emailNotVerified) {
        setEmailNotVerified(getValues('email'));
        toast.error('Email não verificado. Verifique sua caixa de entrada.');
      } else {
        const message = errorData?.error || 'Erro ao fazer login';
        toast.error(message);
      }
    }
  });

  // ✅ MUTATION PARA REENVIAR EMAIL
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

  // ✅ FUNÇÃO PARA REENVIAR EMAIL
  const handleResendEmail = () => {
    if (emailNotVerified) {
      resendEmailMutation.mutate({ email: emailNotVerified });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <LogIn className="mx-auto h-12 w-12 text-primary-600" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Faça login na sua conta
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Ou{' '}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              cadastre-se aqui
            </Link>
          </p>
        </div>

        {/* ✅ ALERTA DE EMAIL NÃO VERIFICADO */}
        {emailNotVerified && (
          <Card className="bg-yellow-50 border-yellow-200">
            <div className="flex items-start space-x-3">
              <Mail className="text-yellow-600 mt-1" size={20} />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800">
                  Email não verificado
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Você precisa verificar seu email antes de fazer login. 
                  Verifique sua caixa de entrada (e spam).
                </p>
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleResendEmail}
                    loading={resendEmailMutation.isPending}
                    className="bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200"
                  >
                    {resendEmailMutation.isPending ? 'Reenviando...' : 'Reenviar email'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Email"
              type="email"
              placeholder="seu@email.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="relative">
              <Input
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />
              
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <Button
              type="submit"
              loading={loginMutation.isPending}
              className="w-full"
            >
              Entrar
            </Button>
          </form>
        </Card>

        <div className="flex items-center justify-between">
            <div className="flex items-center">
                <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-rose-600 focus:ring-rose-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Lembrar-me
                </label>
            </div>

            <div className="text-sm">
                <Link 
                    to="/forgot-password"  // ✅ CORRIGIDO: to em vez de href
                    className="font-medium text-rose-600 hover:text-rose-500"
                >
                    Esqueceu sua senha?
                </Link>
            </div>
        </div>
       
      </div>
    </div>
  )
}

export default Login