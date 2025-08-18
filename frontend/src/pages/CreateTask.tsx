// CreateTask.tsx - Página para gerentes criarem novas tarefas
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Save, ArrowLeft, User, Calendar, AlertTriangle } from 'lucide-react'

import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import { createTask, getEmployees } from '../services/taskService'
import type { CreateTaskForm } from '../types'

// Schema de validação - Define as regras para cada campo do formulário
// É como uma "receita" que diz o que é obrigatório e como deve estar formatado
const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Título é obrigatório') // Não pode estar vazio
    .min(3, 'Título deve ter pelo menos 3 caracteres') // Mínimo 3 caracteres
    .max(100, 'Título deve ter no máximo 100 caracteres'), // Máximo 100 caracteres
  
  description: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional(), // Campo opcional
  
  assignedToId: z
    .string()
    .min(1, 'Funcionário é obrigatório'), // Deve selecionar um funcionário
  
  dueDate: z
    .string()
    .optional(), // Data de vencimento é opcional
  
  priority: z
    .enum(['BAIXA', 'MÉDIA', 'ALTA', 'URGENTE'] as const)
    .describe('Prioridade é obrigatória'),
})

const CreateTask: React.FC = () => {
  const navigate = useNavigate() // Hook para navegação programática
  
  // Hook do React Hook Form - gerencia todo o estado do formulário
  const {
    register, // Função para "registrar" campos no formulário
    handleSubmit, // Função que processa o envio do formulário
    formState: { errors }, // Objeto com todos os erros de validação
    watch // Função para "observar" valores de campos em tempo real
  } = useForm<CreateTaskForm>({
    resolver: zodResolver(createTaskSchema), // Usa o Zod para validação
    defaultValues: {
      priority: 'MÉDIA' // Valor padrão para prioridade
    }
  })

  // Query para buscar lista de funcionários
  // useQuery é usado para BUSCAR dados (GET)
  const { 
    data: employeesData, 
    isLoading: loadingEmployees 
  } = useQuery({
    queryKey: ['employees'], // Chave única para cache
    queryFn: getEmployees, // Função que faz a requisição
    // Esta query só roda se estivermos na página (automático)
  })

  // Mutation para criar tarefa
  // useMutation é usado para MODIFICAR dados (POST, PUT, DELETE)
  const createTaskMutation = useMutation({
    mutationFn: createTask, // Função que faz a requisição
    
    // Callback executado quando a requisição é bem-sucedida
    onSuccess: (data) => {
        toast.success(`Tarefa "${data.task.title}" criada com sucesso!`)
        navigate('/tasks')
    },
    
    // Callback executado quando há erro
    onError: (error: any) => {
      console.error('Erro ao criar tarefa:', error)
      
      // Extrai a mensagem de erro da resposta da API
      const message = error.response?.data?.error || 'Erro ao criar tarefa'
      toast.error(message)
    }
  })

  // Função executada quando o formulário é enviado
  const onSubmit = (data: CreateTaskForm) => {
    console.log('Dados do formulário:', data) // Para debug
    
    // Chama a mutation para criar a tarefa
    createTaskMutation.mutate(data)
  }

  // Observa o valor da prioridade para mudar a cor do indicador
  const selectedPriority = watch('priority')

  // Mapeamento de cores para cada prioridade
  const priorityColors = {
    BAIXA: 'text-green-600 bg-green-50 border-green-200',
    MÉDIA: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    ALTA: 'text-orange-600 bg-orange-50 border-orange-200',
    URGENTE: 'text-red-600 bg-red-50 border-red-200'
  }

  // Mapeamento de labels para cada prioridade
  const priorityLabels = {
    BAIXA: 'Baixa',
    MÉDIA: 'Média',
    ALTA: 'Alta',
    URGENTE: 'Urgente'
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header da página */}
      <div className="flex items-center space-x-4">
        {/* Botão para voltar */}
        <Button
          variant="ghost"
          onClick={() => navigate('/tasks')}
          className="p-2"
        >
          <ArrowLeft size={20} />
        </Button>
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Nova Tarefa
          </h1>
          <p className="text-gray-600">
            Crie uma nova tarefa para sua equipe
          </p>
        </div>
      </div>

      {/* Formulário principal */}
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Campo: Título da tarefa */}
          <div>
            <Input
              label="Título da Tarefa"
              placeholder="Ex: Implementar nova funcionalidade"
              error={errors.title?.message}
              {...register('title')} // Conecta o campo ao React Hook Form
            />
          </div>

          {/* Campo: Descrição (opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição (opcional)
            </label>
            <textarea
              placeholder="Descreva os detalhes da tarefa..."
              rows={4}
              className={`
                input-field resize-none
                ${errors.description ? 'border-red-500 focus:ring-red-500' : ''}
              `}
              {...register('description')} // Conecta o campo ao React Hook Form
            />
            {/* Mostra erro se houver */}
            {errors.description && (
              <p className="text-sm text-red-600 mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Campo: Funcionário */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="inline h-4 w-4 mr-1" />
              Atribuir para
            </label>
            
            <select
              className={`
                input-field
                ${errors.assignedToId ? 'border-red-500 focus:ring-red-500' : ''}
              `}
              {...register('assignedToId')} // Conecta o campo ao React Hook Form
            >
              <option value="">Selecione um funcionário</option>
              
              {/* Renderiza opções dinamicamente baseado na API */}
              {employeesData?.employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} ({employee.email})
                  {/* Mostra quantas tarefas o funcionário já tem */}
                  {employee._count?.assignedTasks > 0 && 
                    ` - ${employee._count.assignedTasks} tarefa(s)`
                  }
                </option>
              ))}
            </select>
            
            {/* Loading state para quando está buscando funcionários */}
            {loadingEmployees && (
              <p className="text-sm text-gray-500 mt-1">
                Carregando funcionários...
              </p>
            )}
            
            {/* Mostra erro se houver */}
            {errors.assignedToId && (
              <p className="text-sm text-red-600 mt-1">
                {errors.assignedToId.message}
              </p>
            )}
          </div>

          {/* Campos lado a lado: Data e Prioridade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Campo: Data de vencimento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Data de Vencimento (opcional)
              </label>
              <input
                type="date"
                className={`
                  input-field
                  ${errors.dueDate ? 'border-red-500 focus:ring-red-500' : ''}
                `}
                // Define data mínima como hoje
                min={new Date().toISOString().split('T')[0]}
                {...register('dueDate')} // Conecta o campo ao React Hook Form
              />
              {errors.dueDate && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.dueDate.message}
                </p>
              )}
            </div>

            {/* Campo: Prioridade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <AlertTriangle className="inline h-4 w-4 mr-1" />
                Prioridade
              </label>
              
              <select
                className={`
                  input-field
                  ${errors.priority ? 'border-red-500 focus:ring-red-500' : ''}
                `}
                {...register('priority')} // Conecta o campo ao React Hook Form
              >
                <option value="BAIXA">Baixa</option>
                <option value="MÉDIA">Média</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </select>
              
              {errors.priority && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.priority.message}
                </p>
              )}
            </div>
          </div>

          {/* Indicador visual de prioridade */}
          {selectedPriority && (
            <div className={`
              p-3 rounded-lg border
              ${priorityColors[selectedPriority]}
            `}>
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                <span className="font-medium">
                  Prioridade: {priorityLabels[selectedPriority]}
                </span>
              </div>
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            {/* Botão Cancelar */}
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/tasks')}
            >
              Cancelar
            </Button>
            
            {/* Botão Criar Tarefa */}
            <Button
              type="submit"
              loading={createTaskMutation.isPending} // Mostra loading durante requisição
            >
              <Save size={16} />
              Criar Tarefa
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default CreateTask