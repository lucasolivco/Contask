// frontend/src/pages/CreateTask.tsx - ATUALIZADO PARA MANAGERS
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Save, ArrowLeft, User, Calendar, AlertTriangle, Sparkles, Target, Crown, Users } from 'lucide-react'

import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import { createTask, getAssignableUsers } from '../services/taskService' // ✅ MUDANÇA: usar getAssignableUsers
import type { CreateTaskForm } from '../types'
import { useAuth } from '../contexts/AuthContext' // ✅ ADICIONAR: para acessar usuário atual

// Schema permanece igual
const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Título é obrigatório')
    .min(3, 'Título deve ter pelo menos 3 caracteres')
    .max(100, 'Título deve ter no máximo 100 caracteres'),
  
  description: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional(),
  
  assignedToId: z
    .string()
    .min(1, 'Usuário é obrigatório'), // ✅ MUDANÇA: "Usuário" ao invés de "Funcionário"
  
  dueDate: z
    .string()
    .optional(),

  targetDate: z
    .string()
    .optional(),

  priority: z
    .enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const)
    .describe('Prioridade é obrigatória'),
})

const CreateTask: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth() // ✅ ADICIONAR: para identificar usuário atual
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<CreateTaskForm>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      priority: 'MEDIUM'
    }
  })

  // ✅ MUDANÇA: Query para buscar usuários atribuíveis (managers + employees)
  const { 
    data: assignableData, 
    isLoading: loadingUsers,
    error: usersError
  } = useQuery({
    queryKey: ['assignable-users'],
    queryFn: getAssignableUsers,
    retry: 1
  })

  // Mutation permanece igual
  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: (data) => {
      toast.success(`Tarefa "${data.task.title}" criada com sucesso!`)
      navigate('/tasks')
    },
    onError: (error: any) => {
      console.error('Erro ao criar tarefa:', error)
      const message = error.response?.data?.error || 'Erro ao criar tarefa'
      toast.error(message)
    }
  })

  const onSubmit = (data: CreateTaskForm) => {
    console.log('Dados do formulário:', data)
    createTaskMutation.mutate(data)
  }

  const selectedPriority = watch('priority')
  const selectedUserId = watch('assignedToId') // ✅ ADICIONAR: para mostrar info do usuário selecionado

  // ✅ ADICIONAR: Encontrar usuário selecionado
  const selectedUser = assignableData?.assignableUsers.find(u => u.id === selectedUserId)

  // Configuração de prioridade permanece igual
  const priorityConfig = {
    LOW: {
      label: 'Baixa',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      icon: '📝'
    },
    MEDIUM: {
      label: 'Média',
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      icon: '📋'
    },
    HIGH: {
      label: 'Alta',
      color: 'text-orange-600 bg-orange-50 border-orange-200',
      icon: '⚡'
    },
    URGENT: {
      label: 'Urgente',
      color: 'text-red-600 bg-red-50 border-red-200',
      icon: '🚨'
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header permanece igual */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/tasks')}
          className="self-start interactive-scale"
        >
          <ArrowLeft size={20} />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
        
        <div className="flex-1">
          <h1 className="heading-xl flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl shadow-lg">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            Nova Tarefa
          </h1>
          <p className="text-muted mt-2 text-lg">
            Crie uma nova tarefa e atribua para sua equipe {/* ✅ Manter texto genérico */}
          </p>
        </div>
      </div>

      {/* Formulário atualizado */}
      <Card className="shadow-lg border-gray-200">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Seção: Informações Básicas permanece igual */}
          <div className="space-y-6">
            <h3 className="heading-md text-rose-700 border-b border-rose-100 pb-2">
              📝 Informações da Tarefa
            </h3>
            
            <Input
              label="Título da Tarefa"
              placeholder="Ex: Implementar sistema de autenticação"
              error={errors.title?.message}
              className="text-lg"
              {...register('title')}
            />

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Descrição (opcional)
              </label>
              <textarea
                placeholder="Descreva os detalhes, requisitos e observações importantes..."
                rows={4}
                className={`
                  input-field resize-none
                  ${errors.description ? 'border-red-500 focus:ring-red-500' : ''}
                `}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>

          {/* ✅ SEÇÃO: Atribuição ATUALIZADA */}
          <div className="space-y-6">
            <h3 className="heading-md text-rose-700 border-b border-rose-100 pb-2">
              👥 Atribuição e Prazo
            </h3>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <Users className="inline h-4 w-4 mr-2" />
                Atribuir Para {/* ✅ MUDANÇA: texto mais genérico */}
              </label>
              
              {usersError ? (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                  Erro ao carregar usuários. Tente recarregar a página.
                </div>
              ) : (
                <select
                  className={`
                    input-field
                    ${errors.assignedToId ? 'border-red-500 focus:ring-red-500' : ''}
                  `}
                  {...register('assignedToId')}
                >
                  <option value="">
                    {loadingUsers ? 'Carregando usuários...' : 'Selecione um usuário'}
                  </option>
                  
                  {/* ✅ VOCÊ MESMO */}
                  {assignableData?.categories.self && assignableData.categories.self.length > 0 && (
                    <optgroup label="Atribuir para mim">
                      {assignableData.categories.self.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} (Você)
                          {user.activeTasks > 0 && ` - ${user.activeTasks} tarefa(s) ativa(s)`}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  
                  {/* ✅ OUTROS MANAGERS */}
                  {assignableData?.categories.managers && assignableData.categories.managers.length > 0 && (
                    <optgroup label="Outros Managers">
                      {assignableData.categories.managers.map((manager) => (
                        <option key={manager.id} value={manager.id}>
                          {manager.name} ({manager.email})
                          {manager.activeTasks > 0 && ` - ${manager.activeTasks} tarefa(s) ativa(s)`}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  
                  {/* ✅ FUNCIONÁRIOS */}
                  {assignableData?.categories.employees && assignableData.categories.employees.length > 0 && (
                    <optgroup label="Usuários">
                      {assignableData.categories.employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name} ({employee.email})
                          {employee.activeTasks > 0 && ` - ${employee.activeTasks} tarefa(s) ativa(s)`}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              )}
              
              {loadingUsers && (
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-rose-500"></div>
                  Carregando usuários...
                </div>
              )}
              
              {errors.assignedToId && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.assignedToId.message}
                </p>
              )}

              {/* ✅ NOVA: Informação sobre usuário selecionado */}
              {selectedUser && (
                <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      selectedUser.role === 'MANAGER' 
                        ? 'bg-purple-100' 
                        : 'bg-emerald-100'
                    }`}>
                      {selectedUser.role === 'MANAGER' ? (
                        <Crown className="h-4 w-4 text-purple-600" />
                      ) : (
                        <User className="h-4 w-4 text-emerald-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-blue-900">
                          {selectedUser.name}
                        </span>
                        {selectedUser.isCurrentUser && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            Você
                          </span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          selectedUser.role === 'MANAGER'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {selectedUser.role === 'MANAGER' ? 'Manager' : 'Funcionário'}
                        </span>
                      </div>
                      <div className="text-sm text-blue-700 mt-1">
                        <span>{selectedUser.email}</span>
                        {selectedUser.activeTasks > 0 && (
                          <span className="ml-3 bg-blue-100 px-2 py-1 rounded text-xs">
                            {selectedUser.activeTasks} tarefas ativas
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Seção de datas permanece igual */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Data meta */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <Target className="inline h-4 w-4 mr-2 text-blue-600" />
                  Data Meta (Objetivo)
                </label>
                <input
                  type="date"
                  className={`
                    input-field
                    ${errors.targetDate ? 'border-red-500 focus:ring-red-500' : ''}
                  `}
                  min={new Date().toISOString().split('T')[0]}
                  {...register('targetDate')}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Data desejada para conclusão
                </p>
                {errors.targetDate && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.targetDate.message}
                  </p>
                )}
              </div>

              {/* Data de vencimento */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <Calendar className="inline h-4 w-4 mr-2 text-red-600" />
                  Data de Vencimento
                </label>
                <input
                  type="date"
                  className={`
                    input-field
                    ${errors.dueDate ? 'border-red-500 focus:ring-red-500' : ''}
                  `}
                  min={new Date().toISOString().split('T')[0]}
                  {...register('dueDate')}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Prazo limite obrigatório
                </p>
                {errors.dueDate && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.dueDate.message}
                  </p>
                )}
              </div>

              {/* Prioridade */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <AlertTriangle className="inline h-4 w-4 mr-2" />
                  Nível de Prioridade
                </label>
                
                <select
                  className={`
                    input-field
                    ${errors.priority ? 'border-red-500 focus:ring-red-500' : ''}
                  `}
                  {...register('priority')}
                >
                  <option value="LOW">📝 Baixa</option>
                  <option value="MEDIUM">📋 Média</option>
                  <option value="HIGH">⚡ Alta</option>
                  <option value="URGENT">🚨 Urgente</option>
                </select>
                
                {errors.priority && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.priority.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ✅ NOVA: Estatísticas da equipe */}
          {assignableData?.stats && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
              <h4 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Resumo da Equipe Disponível
              </h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white rounded-lg p-3">
                  <div className="text-lg font-bold text-purple-600 flex items-center justify-center gap-1">
                    <Crown className="h-4 w-4" />
                    {assignableData.stats.totalManagers}
                  </div>
                  <div className="text-xs text-gray-600">Managers</div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-lg font-bold text-emerald-600 flex items-center justify-center gap-1">
                    <User className="h-4 w-4" />
                    {assignableData.stats.totalEmployees}
                  </div>
                  <div className="text-xs text-gray-600">Funcionários</div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-lg font-bold text-blue-600 flex items-center justify-center gap-1">
                    <Users className="h-4 w-4" />
                    {assignableData.stats.totalUsers}
                  </div>
                  <div className="text-xs text-gray-600">Total</div>
                </div>
              </div>
            </div>
          )}

          {/* Explicação sobre as datas permanece igual */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Sobre as Datas:</h3>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li><strong>🎯 Data Meta:</strong> Objetivo ideal para conclusão (opcional)</li>
                  <li><strong>⏰ Data de Vencimento:</strong> Prazo limite para entrega (opcional)</li>
                  <li><strong>📌 Regra:</strong> Se definidas, a data meta deve ser anterior ou igual ao vencimento</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Indicador visual de prioridade permanece igual */}
          {selectedPriority && (
            <div className={`
              p-4 rounded-xl border animate-scale-in
              ${priorityConfig[selectedPriority].color}
            `}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {priorityConfig[selectedPriority].icon}
                </span>
                <div>
                  <p className="font-semibold">
                    Prioridade: {priorityConfig[selectedPriority].label}
                  </p>
                  <p className="text-sm opacity-80">
                    {selectedPriority === 'URGENT' && 'Esta tarefa será marcada como urgente e receberá destaque especial.'}
                    {selectedPriority === 'HIGH' && 'Esta tarefa terá prioridade alta na lista de tarefas.'}
                    {selectedPriority === 'MEDIUM' && 'Esta tarefa terá prioridade normal.'}
                    {selectedPriority === 'LOW' && 'Esta tarefa pode ser feita quando houver tempo disponível.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botões de ação permanecem iguais */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="danger"
              onClick={() => navigate('/tasks')}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            
            <Button
              type="submit"
              loading={createTaskMutation.isPending}
              disabled={loadingUsers || !!usersError}
              className="w-full sm:w-auto btn-primary interactive-glow"
              size="lg"
            >
              <Save size={16} />
              {createTaskMutation.isPending ? 'Criando...' : 'Criar Tarefa'}
            </Button>
          </div>
        </form>
      </Card>

      {/* ✅ DICA ATUALIZADA */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">
              Dica para uma boa tarefa
            </h4>
            <p className="text-blue-700 text-sm">
              Seja específico no título e descrição. Inclua critérios de aceitação e 
              informações que ajudem a pessoa responsável a entender exatamente o que deve ser feito.
              {/* ✅ MUDANÇA: "pessoa responsável" ao invés de "funcionário" */}
            </p>
            <p className="text-blue-600 text-xs mt-2">
              💡 <strong>Novo:</strong> Agora você pode atribuir tarefas para outros managers ou para si mesmo!
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default CreateTask