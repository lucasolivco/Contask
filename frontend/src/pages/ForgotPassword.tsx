// src/pages/ForgotPassword.tsx
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'

import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import { requestPasswordReset } from '../services/authService'
import type { RequestPasswordResetForm } from '../types'

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
})

const ForgotPassword: React.FC = () => {
  const [isSuccess, setIsSuccess] = React.useState(false)
  const [userEmail, setUserEmail] = React.useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<RequestPasswordResetForm>({
    resolver: zodResolver(forgotPasswordSchema)
  })

  const requestResetMutation = useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: (data, variables) => {
      setIsSuccess(true)
      setUserEmail(variables.email)
      reset()
      toast.success('Email enviado com sucesso!')
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Erro ao solicitar recuperação'
      toast.error(message)
    }
  })

  const onSubmit = (data: RequestPasswordResetForm) => {
    requestResetMutation.mutate(data)
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Email enviado!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Instruções foram enviadas para
            </p>
            <p className="font-medium text-gray-900">{userEmail}</p>
          </div>

          <Card>
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                Verifique sua caixa de entrada e clique no link para redefinir sua senha.
              </p>
              <p className="text-xs text-gray-500">
                ✉️ Não esqueça de verificar a pasta de spam<br/>
                ⏰ O link expira em 2 horas
              </p>
              
              <div className="pt-4">
                <Button
                  onClick={() => setIsSuccess(false)}
                  variant="primary"
                  size="sm"
                >
                  Enviar para outro email
                </Button>
              </div>
            </div>
          </Card>

          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              <ArrowLeft className="mr-1" size={16} />
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Mail className="mx-auto h-12 w-12 text-primary-600" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Esqueceu sua senha?
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Digite seu email para receber instruções de recuperação
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Email"
              type="email"
              placeholder="seu@email.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <Button
              type="submit"
              loading={requestResetMutation.isPending}
              className="w-full"
            >
              {requestResetMutation.isPending ? 'Enviando...' : 'Enviar instruções'}
            </Button>
          </form>
        </Card>

        <div className="text-center space-y-2">
          <Link
            to="/login"
            className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500"
          >
            <ArrowLeft className="mr-1" size={16} />
            Voltar para o login
          </Link>
          
          <div>
            <span className="text-sm text-gray-500">Não tem conta? </span>
            <Link
              to="/register"
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              Cadastre-se aqui
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword