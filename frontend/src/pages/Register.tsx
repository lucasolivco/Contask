// frontend/src/pages/Register.tsx - ESTILO SIMPLES E ELEGANTE

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { UserPlus, Eye, EyeOff, Users, Crown } from 'lucide-react'

import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import Logo from '../components/ui/Logo'
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
    formState: { errors },
    watch
  } = useForm<RegisterSchemaType>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'EMPLOYEE'
    }
  })

  const selectedRole = watch('role')

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      console.log('✅ Cadastro realizado:', data);
      
      if (data.requiresEmailVerification) {
        navigate('/verify-email-sent', { 
          state: { 
            email: data.user.email, 
            name: data.user.name 
          } 
        });
        toast.success('Conta criada! Verifique seu email para ativar.');
      } else {
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
    <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4">
      <div className="max-w-sm w-full space-y-8">
        
        {/* ✅ HEADER COM LOGO */}
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <Logo size="xl"/>
          </div>
        </div>

        {/* ✅ FORMULÁRIO SIMPLES */}
        <Card className="p-6 shadow-lg border border-gray-100">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            
            {/* ✅ NOME INPUT */}
            <div>
              <Input
                label="Nome completo"
                placeholder="Seu nome"
                error={errors.name?.message}
                className="w-full"
                {...register('name')}
              />
            </div>

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

            {/* ✅ TIPO DE CONTA - SIMPLES */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Tipo de conta
              </label>
              
              <div className="space-y-2">
                {/* ✅ OPÇÃO EQUIPE */}
                <label className={`
                  flex items-center p-3 rounded-lg border cursor-pointer transition-all
                  ${selectedRole === 'EMPLOYEE' 
                    ? 'border-cyan-500 bg-cyan-50' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}>
                  <input
                    type="radio"
                    value="EMPLOYEE"
                    className="sr-only"
                    {...register('role')}
                  />
                  
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-lg mr-3
                    ${selectedRole === 'EMPLOYEE' ? 'bg-cyan-100' : 'bg-gray-100'}
                  `}>
                    <Users className={`h-4 w-4 ${selectedRole === 'EMPLOYEE' ? 'text-cyan-600' : 'text-gray-500'}`} />
                  </div>
                  
                  <div>
                    <p className={`text-sm font-medium ${selectedRole === 'EMPLOYEE' ? 'text-cyan-900' : 'text-gray-900'}`}>
                      Membro da Equipe
                    </p>
                    <p className="text-xs text-gray-500">
                      Executar tarefas e colaborar
                    </p>
                  </div>
                </label>

                {/* ✅ OPÇÃO GERENTE */}
                <label className={`
                  flex items-center p-3 rounded-lg border cursor-pointer transition-all
                  ${selectedRole === 'MANAGER' 
                    ? 'border-cyan-500 bg-cyan-50' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}>
                  <input
                    type="radio"
                    value="MANAGER"
                    className="sr-only"
                    {...register('role')}
                  />
                  
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-lg mr-3
                    ${selectedRole === 'MANAGER' ? 'bg-cyan-100' : 'bg-gray-100'}
                  `}>
                    <Crown className={`h-4 w-4 ${selectedRole === 'MANAGER' ? 'text-cyan-600' : 'text-gray-500'}`} />
                  </div>
                  
                  <div>
                    <p className={`text-sm font-medium ${selectedRole === 'MANAGER' ? 'text-cyan-900' : 'text-gray-900'}`}>
                      Gerente
                    </p>
                    <p className="text-xs text-gray-500">
                      Gerenciar equipe e atribuir tarefas
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* ✅ BOTÃO CADASTRAR */}
            <Button
              type="submit"
              loading={registerMutation.isPending}
              className="w-full h-11 mt-6"
            >
              {registerMutation.isPending ? 'Cadastrando...' : 'Criar conta'}
            </Button>
          </form>

          {/* ✅ LINK PARA LOGIN */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Já tem uma conta?{' '}
                <Link
                  to="/login"
                  className="font-medium text-cyan-600 hover:text-cyan-700"
                >
                  Faça login
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

export default Register