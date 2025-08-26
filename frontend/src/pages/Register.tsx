// Página de cadastro com verificação por email
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { UserPlus, Eye, EyeOff } from 'lucide-react'

import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import { register as registerUser } from '../services/authService'
import type { RegisterForm } from '../types'

const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['MANAGER', 'EMPLOYEE'])
})

export type RegisterSchemaType = z.infer<typeof registerSchema>;

const Register: React.FC = () => {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterSchemaType>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'EMPLOYEE'
    }
  })

  // ✅ MUTATION ATUALIZADA - NÃO FAZ LOGIN AUTOMÁTICO
  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      console.log('✅ Cadastro realizado:', data);
      
      if (data.requiresEmailVerification) {
        // Redirecionar para página de verificação
        navigate('/verify-email-sent', { 
          state: { 
            email: data.user.email, 
            name: data.user.name 
          } 
        });
        toast.success('Conta criada! Verifique seu email para ativar.');
      } else {
        // Fluxo antigo (se verificação estiver desabilitada)
        toast.success(`Conta criada com sucesso! Bem-vindo, ${data.user.name}!`);
        navigate('/login');
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Erro ao criar conta'
      toast.error(message)
    }
  })

  const onSubmit = (data: RegisterForm) => {
    registerMutation.mutate(data)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <UserPlus className="mx-auto h-12 w-12 text-primary-600" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Criar nova conta
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Ou{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              faça login aqui
            </Link>
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Nome completo"
              placeholder="Seu nome"
              error={errors.name?.message}
              {...register('name')}
            />

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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de conta
              </label>
              <select
                {...register('role')}
                className="input-field"
              >
                <option value="EMPLOYEE">Equipe</option>
                <option value="MANAGER">Gerente</option>
              </select>
            </div>

            <Button
              type="submit"
              loading={registerMutation.isPending}
              className="w-full"
            >
              {registerMutation.isPending ? 'Cadastrando...' : 'Criar conta'}
            </Button>
          </form>
        </Card>

        
      </div>
    </div>
  )
}

export default Register