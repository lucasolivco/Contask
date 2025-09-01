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
  FileText,
  Target,
  Crown,
  Users
} from 'lucide-react'

import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useAuth } from '../contexts/AuthContext'
import { getTask, updateTask, getAssignableUsers } from '../services/taskService' // ✅ MUDANÇA: getAssignableUsers
import { TaskPriorityLabels, TaskStatusLabels } from '../types'
import type { Task } from '../types'

interface UpdateTaskData {
  title: string
  description?: string
  priority: Task['priority']
  status: Task['status']
  dueDate?: string
  targetDate?: string
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
    targetDate: '',
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

  // ✅ MUDANÇA: Buscar usuários atribuíveis (managers + employees)
  const { 
    data: assignableData, 
    isLoading: loadingUsers, 
    error: usersError 
  } = useQuery({
    queryKey: ['assignable-users'],
    queryFn: getAssignableUsers,
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
        targetDate: task.targetDate ? new Date(task.targetDate).toISOString().split('T')[0] : '',
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
      toast.error('Título e usuário são obrigatórios') // ✅ MUDANÇA: "usuário" ao invés de "funcionário"
      return
    }

    // Validar datas
    if (formData.dueDate && formData.targetDate) {
      const dueDate = new Date(formData.dueDate)
      const targetDate = new Date(formData.targetDate)
      
      if (targetDate > dueDate) {
        toast.error('A data meta não pode ser posterior à data de vencimento')
        return
      }
    }

    const submitData = {
      ...formData,
      dueDate: formData.dueDate || undefined,
      targetDate: formData.targetDate || undefined
    }

    updateTaskMutation.mutate(submitData)
  }

  // ✅ MUDANÇA: Encontrar usuário selecionado para mostrar informações
  const selectedUser = assignableData?.assignableUsers.find(u => u.id === formData.assignedToId)

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

  // ✅ MUDANÇA: Verificar erro de usuários ao invés de employees
  if (usersError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          Erro ao carregar usuários. Tente novamente.
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
            <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg">
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
                <FileText className="h-5 w-5 text-blue-500" />
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

                {/* Data Meta */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <Target className="inline h-4 w-4 mr-2 text-blue-600" />
                    Data Meta (Objetivo)
                  </label>
                  <Input
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => handleInputChange('targetDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    disabled={updateTaskMutation.isPending}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Data desejada para conclusão da tarefa
                  </p>
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

                {/* ✅ NOVA SEÇÃO: Atribuir Para (com todos os usuários) */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <Users className="inline h-4 w-4 mr-2" />
                    Atribuir Para *
                  </label>
                  
                  {usersError ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                      Erro ao carregar usuários. Tente recarregar a página.
                    </div>
                  ) : (
                    <select
                      value={formData.assignedToId}
                      onChange={(e) => handleInputChange('assignedToId', e.target.value)}
                      className="input-field"
                      required
                      disabled={updateTaskMutation.isPending || loadingUsers}
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
                        <optgroup label="Managers">
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
                        <optgroup label="Usuários (Equipe)">
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
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-500"></div>
                      Carregando usuários...
                    </div>
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

            {/* Aviso sobre alterações */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Importante:</h3>
                  <p className="text-blue-800 text-sm">
                    As alterações feitas nesta tarefa serão visíveis para a pessoa responsável. 
                    Certifique-se de comunicar mudanças importantes diretamente.
                    {/* ✅ MUDANÇA: "pessoa responsável" ao invés de "funcionário" */}
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
                disabled={loadingUsers || !!usersError}
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