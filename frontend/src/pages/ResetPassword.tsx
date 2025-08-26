// src/pages/ResetPassword.tsx - REMOVER VALIDAÇÃO COMPLEXA
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Lock, Eye, EyeOff, CheckCircle, XCircle, Loader } from 'lucide-react'

import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import { resetPassword, verifyResetToken } from '../services/authService'
import type { ResetPasswordForm } from '../types'

// ✅ VALIDAÇÃO SIMPLES - APENAS 6 CARACTERES
const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(1, 'Nova senha é obrigatória')
    .min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z
    .string()
    .min(1, 'Confirmação é obrigatória')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
})

const ResetPassword: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [isSuccess, setIsSuccess] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<Omit<ResetPasswordForm, 'token'>>({
    resolver: zodResolver(resetPasswordSchema)
  })

  const newPassword = watch('newPassword', '')
  const confirmPassword = watch('confirmPassword', '')

  // Verificar token ao carregar
  const { data: tokenData, isLoading: isValidatingToken, isError } = useQuery({
    queryKey: ['verify-reset-token', token],
    queryFn: () => verifyResetToken(token),
    enabled: !!token,
    retry: false
  })

  // Mutation para reset
  const resetMutation = useMutation({
    mutationFn: (data: Omit<ResetPasswordForm, 'token'>) => 
      resetPassword({ ...data, token }),
    onSuccess: (data) => {
      setIsSuccess(true)
      toast.success('Senha alterada com sucesso!')
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    },
    onError: (error: any) => {
      const errorData = error.response?.data
      if (errorData?.tokenExpired) {
        toast.error('Token expirado. Solicite uma nova recuperação.')
        setTimeout(() => navigate('/forgot-password'), 2000)
      } else {
        const message = errorData?.error || 'Erro ao redefinir senha'
        toast.error(message)
      }
    }
  })

  const onSubmit = (data: Omit<ResetPasswordForm, 'token'>) => {
    // ✅ REMOVIDO: validação de complexidade
    resetMutation.mutate(data)
  }

  // Loading da validação do token
  if (isValidatingToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="mx-auto h-12 w-12 text-primary-600 animate-spin" />
          <p className="mt-4 text-gray-600">Validando token...</p>
        </div>
      </div>
    )
  }

  // Token inválido
  if (isError || !token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <XCircle className="mx-auto h-16 w-16 text-red-600" />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Token inválido
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {!token ? 'Token não fornecido' : 'Este link é inválido ou expirou'}
            </p>
          </div>

          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Solicite um novo link de recuperação para continuar.
              </p>
              <Link to="/forgot-password">
                <Button className="w-full">
                  Solicitar novo link
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Sucesso
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Senha alterada!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sua senha foi redefinida com sucesso
            </p>
          </div>

          <Card>
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                Redirecionando para o login em alguns segundos...
              </p>
              <Link to="/login">
                <Button className="w-full">
                  Ir para o login
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Lock className="mx-auto h-12 w-12 text-primary-600" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Redefinir senha
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Para: <span className="font-medium">{tokenData?.email}</span>
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="relative">
              <Input
                label="Nova senha"
                type={showPassword ? 'text' : 'password'}
                placeholder="Digite sua nova senha"
                error={errors.newPassword?.message}
                {...register('newPassword')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* ✅ VALIDAÇÃO SIMPLES - APENAS TAMANHO */}
            {newPassword && (
              <div className="text-sm">
                {newPassword.length >= 6 ? (
                  <p className="text-green-600 flex items-center">
                    <CheckCircle size={16} className="mr-1" />
                    Senha válida (mínimo 6 caracteres)
                  </p>
                ) : (
                  <p className="text-red-600">
                    Senha deve ter pelo menos 6 caracteres ({newPassword.length}/6)
                  </p>
                )}
              </div>
            )}

            <div className="relative">
              <Input
                label="Confirmar nova senha"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirme sua nova senha"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* ✅ INDICADOR DE SENHAS COINCIDENTES */}
            {confirmPassword && (
              <div className="text-sm">
                {newPassword === confirmPassword ? (
                  <p className="text-green-600 flex items-center">
                    <CheckCircle size={16} className="mr-1" />
                    Senhas coincidem
                  </p>
                ) : (
                  <p className="text-red-600">
                    Senhas não coincidem
                  </p>
                )}
              </div>
            )}

            {/* ✅ BOTÃO COM VALIDAÇÃO SIMPLES */}
            <Button
              type="submit"
              loading={resetMutation.isPending}
              disabled={
                newPassword.length < 6 || 
                newPassword !== confirmPassword ||
                !newPassword ||
                !confirmPassword
              }
              className="w-full"
            >
              {resetMutation.isPending ? 'Alterando...' : 'Alterar senha'}
            </Button>
          </form>
        </Card>

        <div className="text-center">
          <Link
            to="/login"
            className="text-sm font-medium text-primary-600 hover:text-primary-500"
          >
            Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword