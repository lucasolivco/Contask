// Página de login - onde o usuário entra no sistema
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { LogIn, Eye, EyeOff } from 'lucide-react'

import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import { useAuth } from '../contexts/AuthContext'
import { login } from '../services/authService'
import type { LoginForm } from '../types'

// Schema de validação - como uma "receita" que diz quais campos são obrigatórios
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

  // Configuração do formulário com validação
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  })

  // Mutation para fazer login (como um "botão especial" que chama a API)
  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      // Se deu certo, salva o usuário e redireciona
      loginUser(data.user, data.token)
      toast.success(`Bem-vindo, ${data.user.name}!`)
      navigate('/dashboard')
    },
    onError: (error: any) => {
      // Se deu erro, mostra mensagem
      const message = error.response?.data?.error || 'Erro ao fazer login'
      toast.error(message)
    }
  })

  // Função chamada quando o formulário é enviado
  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Cabeçalho */}
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

        {/* Formulário */}
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

        {/* Usuários de exemplo */}
        <Card className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Usuários de Teste
          </h3>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Gerente:</strong> gerente@teste.com / 123456
            </div>
            <div>
              <strong>Funcionário:</strong> funcionario@teste.com / 123456
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Login