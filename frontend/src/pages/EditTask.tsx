import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  ArrowLeft, 
  Save, 
  Edit3,
  Calendar,
  User,
  AlertTriangle,
  FileText
} from 'lucide-react'

import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useAuth } from '../contexts/AuthContext'
import { getTask, updateTask, getEmployees } from '../services/taskService'
import { TaskPriorityLabels, TaskStatusLabels } from '../types'
import type { Task } from '../types'

interface UpdateTaskData {
  title: string
  description?: string
  priority: Task['priority']
  status: Task['status']
  dueDate?: string
  assignedToId: string
}

const EditTask: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  // Estados do formulário
  const [formData, setFormData] = useState<UpdateTaskData>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    status: 'PENDING',
    dueDate: '',
    assignedToId: ''
  })

  // Redirecionar se não for MANAGER
  useEffect(() => {
    if (user && user.role !== 'MANAGER') {
      navigate('/tasks')
    }
  }, [user, navigate])

  // Buscar tarefa para edição
  const { data: taskData, isLoading: loadingTask, error: taskError } = useQuery({
    queryKey: ['task', id],
    queryFn: () => getTask(id!),
    enabled: !!id,
    retry: 1
  })

  // Buscar funcionários
  const { data: employeesData, isLoading: loadingEmployees, error: employeesError } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
    retry: 1
  })

  // Preencher formulário quando tarefa carregar
  useEffect(() => {
    if (taskData?.task) {
      const task = taskData.task
      setFormData({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        assignedToId: task.assignedTo.id
      })
    }
  }, [taskData])

  // Mutation para atualizar tarefa
  const updateTaskMutation = useMutation({
    mutationFn: (data: UpdateTaskData) => updateTask(id!, data),
    onSuccess: (data) => {
      toast.success(data.message || 'Tarefa atualizada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task', id] })
      navigate('/tasks')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao atualizar tarefa')
    }
  })

  // Handlers
  const handleInputChange = (field: keyof UpdateTaskData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.assignedToId) {
      toast.error('Título e funcionário são obrigatórios')
      return
    }

    const submitData = {
      ...formData,
      dueDate: formData.dueDate || undefined
    }

    updateTaskMutation.mutate(submitData)
  }

  const employees = employeesData?.employees || []

  if (!user || user.role !== 'MANAGER') {
    return null
  }

  if (taskError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          Erro ao carregar tarefa. {taskError.message}
        </div>
      </div>
    )
  }

  if (employeesError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          Erro ao carregar funcionários. Tente novamente.
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8 scrollbar-modern">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/tasks')}
          className="interactive-scale"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex-1">
          <h1 className="heading-xl flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl shadow-lg">
              <Edit3 className="h-8 w-8 text-white" />
            </div>
            Editar Tarefa
          </h1>
          <p className="text-muted mt-3 text-lg">
            Modifique os dados da tarefa conforme necessário
          </p>
        </div>
      </div>

      {/* Formulário */}
      {loadingTask ? (
        <div className="space-y-6">
          <div className="h-32 bg-gray-200 rounded-2xl animate-pulse"></div>
          <div className="h-64 bg-gray-200 rounded-2xl animate-pulse"></div>
        </div>
      ) : (
        <Card className="max-w-4xl mx-auto shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Informações Básicas */}
            <div>
              <h2 className="heading-md mb-6 flex items-center gap-3">
                <FileText className="h-5 w-5 text-rose-500" />
                Informações da Tarefa
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Título */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Título da Tarefa *
                  </label>
                  <Input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Digite o título da tarefa..."
                    required
                    disabled={updateTaskMutation.isPending}
                  />
                </div>

                {/* Descrição */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Descreva os detalhes da tarefa..."
                    rows={4}
                    className="input-field resize-none"
                    disabled={updateTaskMutation.isPending}
                  />
                </div>

                {/* Prioridade */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Prioridade *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="input-field"
                    required
                    disabled={updateTaskMutation.isPending}
                  >
                    <option value="LOW">📝 {TaskPriorityLabels.LOW}</option>
                    <option value="MEDIUM">📋 {TaskPriorityLabels.MEDIUM}</option>
                    <option value="HIGH">⚡ {TaskPriorityLabels.HIGH}</option>
                    <option value="URGENT">🚨 {TaskPriorityLabels.URGENT}</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="input-field"
                    required
                    disabled={updateTaskMutation.isPending}
                  >
                    <option value="PENDING">📋 {TaskStatusLabels.PENDING}</option>
                    <option value="IN_PROGRESS">⚡ {TaskStatusLabels.IN_PROGRESS}</option>
                    <option value="COMPLETED">✅ {TaskStatusLabels.COMPLETED}</option>
                    <option value="CANCELLED">❌ {TaskStatusLabels.CANCELLED}</option>
                  </select>
                </div>

                {/* Data de Vencimento */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <Calendar className="inline h-4 w-4 mr-2" />
                    Data de Vencimento
                  </label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    disabled={updateTaskMutation.isPending}
                  />
                </div>

                {/* Funcionário */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <User className="inline h-4 w-4 mr-2" />
                    Atribuir para *
                  </label>
                  <select
                    value={formData.assignedToId}
                    onChange={(e) => handleInputChange('assignedToId', e.target.value)}
                    className="input-field"
                    required
                    disabled={updateTaskMutation.isPending || loadingEmployees}
                  >
                    <option value="">Selecione um funcionário</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} - {employee.email}
                      </option>
                    ))}
                  </select>
                  {loadingEmployees && (
                    <p className="text-sm text-gray-500 mt-2">Carregando funcionários...</p>
                  )}
                </div>
              </div>
            </div>

            {/* Aviso sobre alterações */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Importante:</h3>
                  <p className="text-blue-800 text-sm">
                    As alterações feitas nesta tarefa serão visíveis para o funcionário responsável. 
                    Certifique-se de comunicar mudanças importantes diretamente.
                  </p>
                </div>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/tasks')}
                className="w-full sm:w-auto"
                disabled={updateTaskMutation.isPending}
              >
                Cancelar
              </Button>
              
              <Button
                type="submit"
                loading={updateTaskMutation.isPending}
                disabled={loadingEmployees || !!employeesError}
                className="w-full sm:w-auto btn-primary interactive-glow"
                size="lg"
              >
                <Save size={16} />
                {updateTaskMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  )
}

export default EditTask