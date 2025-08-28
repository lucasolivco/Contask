// frontend/src/components/tasks/TaskFilters.tsx - INCLUINDO MANAGERS

import React, { useState, useEffect } from 'react'
import { 
  Search, 
  Filter, 
  Calendar, 
  X, 
  Clock, 
  AlertTriangle, 
  User,
  Target,
  Crown,
  Users,
  ChevronDown
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getAssignableUsers } from '../../services/taskService' // ✅ MUDANÇA: usar getAssignableUsers
import type { TaskFilter } from '../../types'

interface TaskFiltersProps {
  onFiltersChange: (filters: TaskFilter) => void
  userRole: string
  currentUserId?: string
}

const TaskFilters: React.FC<TaskFiltersProps> = ({ 
  onFiltersChange, 
  userRole, 
  currentUserId 
}) => {
  const [filters, setFilters] = useState<TaskFilter>({})
  const [isDateExpanded, setIsDateExpanded] = useState(false)

  // ✅ MUDANÇA: Buscar usuários atribuíveis (managers + employees)
  const { data: assignableData, isLoading: loadingUsers } = useQuery({
    queryKey: ['assignable-users'],
    queryFn: getAssignableUsers,
    enabled: userRole === 'MANAGER'
  })

  const monthOptions = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ]

  const currentYear = new Date().getFullYear()
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1]

  useEffect(() => {
    console.log('🔍 Frontend enviando filtros:', filters)
    onFiltersChange(filters)
  }, [filters, onFiltersChange])

  const updateFilter = (key: keyof TaskFilter, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' || value === 'all' ? undefined : value
    }))
  }

  const clearAllFilters = () => {
    setFilters({})
  }

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && 
    value !== '' && 
    value !== false &&
    value !== null
  )

  // ✅ FILTROS RÁPIDOS PARA TYPES DE TAREFA
  const applyTaskTypeFilter = (type: 'all' | 'my' | 'created') => {
    if (type === 'my' && currentUserId) {
      // Minhas tarefas (atribuídas a mim)
      setFilters(prev => ({ ...prev, assignedToId: currentUserId }))
    } else if (type === 'created') {
      // Todas as tarefas (padrão para manager)
      setFilters(prev => ({ ...prev, assignedToId: undefined }))
    } else {
      // Todas as tarefas
      setFilters(prev => ({ ...prev, assignedToId: undefined }))
    }
  }

  const applyQuickFilter = (type: 'thisMonth' | 'nextMonth') => {
    const now = new Date()
    
    if (type === 'thisMonth') {
      setFilters(prev => ({
        ...prev,
        dueDateMonth: now.getMonth() + 1,
        dueDateYear: now.getFullYear()
      }))
    } else {
      const nextMonth = now.getMonth() === 11 ? 1 : now.getMonth() + 2
      const yearForNextMonth = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear()
      setFilters(prev => ({
        ...prev,
        dueDateMonth: nextMonth,
        dueDateYear: yearForNextMonth
      }))
    }
  }

  // ✅ NOVA: Função para encontrar nome do usuário selecionado
  const getSelectedUserName = (userId: string) => {
    if (!assignableData || !userId) return 'Usuário'
    
    // Buscar em todas as categorias
    const allUsers = [
      ...(assignableData.categories.self || []),
      ...(assignableData.categories.managers || []),
      ...(assignableData.categories.employees || [])
    ]
    
    const user = allUsers.find(u => u.id === userId)
    return user?.name || 'Usuário'
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* ✅ HEADER SIMPLES */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">Filtros</h3>
          {hasActiveFilters && (
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
              {Object.values(filters).filter(v => v !== undefined && v !== false).length}
            </span>
          )}
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
            Limpar
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* ✅ FILTROS RÁPIDOS PARA MANAGERS - MINIMALISTA */}
        {userRole === 'MANAGER' && currentUserId && (
          <div className="flex flex-wrap gap-2 pb-4 border-b border-gray-100">
            {[
              {
                key: 'created',
                label: 'Todas',
                icon: Users,
                color: 'gray',
                isActive: !filters.assignedToId
              },
              {
                key: 'my',
                label: 'Atribuídas a Mim',
                icon: Target,
                color: 'blue',
                isActive: filters.assignedToId === currentUserId
              }
            ].map(({ key, label, icon: Icon, color, isActive }) => (
              <button
                key={key}
                onClick={() => applyTaskTypeFilter(key as any)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive 
                    ? `bg-${color}-100 text-${color}-700 border border-${color}-200` 
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        )}

        {/* ✅ BUSCA */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar tarefas..."
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        {/* ✅ FILTROS PRINCIPAIS - GRID COMPACTO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Status */}
          <select
            value={filters.status || 'all'}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">Todos Status</option>
            <option value="PENDING">⏳ Pendente</option>
            <option value="IN_PROGRESS">🔄 Em Progresso</option>
            <option value="COMPLETED">✅ Concluída</option>
            <option value="CANCELLED">❌ Cancelada</option>
          </select>

          {/* Prioridade */}
          <select
            value={filters.priority || 'all'}
            onChange={(e) => updateFilter('priority', e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">Todas Prioridades</option>
            <option value="URGENT">🚨 Urgente</option>
            <option value="HIGH">⚡ Alta</option>
            <option value="MEDIUM">📋 Média</option>
            <option value="LOW">📝 Baixa</option>
          </select>

          {/* ✅ USUÁRIOS - ATUALIZADO PARA INCLUIR MANAGERS */}
          {userRole === 'MANAGER' && !filters.assignedToId && (
            <select
              value={filters.assignedToId || 'all'}
              onChange={(e) => updateFilter('assignedToId', e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              disabled={loadingUsers}
            >
              <option value="all">
                {loadingUsers ? 'Carregando...' : 'Todos Usuários'}
              </option>
              
              {/* ✅ VOCÊ MESMO */}
              {assignableData?.categories.self && assignableData.categories.self.length > 0 && (
                <optgroup label="Você">
                  {assignableData.categories.self.map((user) => (
                    <option key={user.id} value={user.id}>
                        {user.name} (Você)
                    </option>
                  ))}
                </optgroup>
              )}
              
              {/* ✅ OUTROS MANAGERS */}
              {assignableData?.categories.managers && assignableData.categories.managers.length > 0 && (
                <optgroup label="Managers">
                  {assignableData.categories.managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                        {manager.name}
                    </option>
                  ))}
                </optgroup>
              )}
              
              {/* ✅ FUNCIONÁRIOS */}
              {assignableData?.categories.employees && assignableData.categories.employees.length > 0 && (
                <optgroup label="Funcionários">
                  {assignableData.categories.employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                        {employee.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          )}

          {/* Atrasadas */}
          <label className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={filters.overdue || false}
              onChange={(e) => updateFilter('overdue', e.target.checked || undefined)}
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-red-700">Atrasadas</span>
          </label>
        </div>

        {/* ✅ FILTROS DE DATA - EXPANSÍVEL MINIMALISTA */}
        <div>
          <button
            onClick={() => setIsDateExpanded(!isDateExpanded)}
            className="flex items-center justify-between w-full text-left text-sm text-gray-600 hover:text-gray-900"
          >
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Filtrar por vencimento
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isDateExpanded ? 'rotate-180' : ''}`} />
          </button>

          {isDateExpanded && (
            <div className="mt-3 space-y-3 bg-gray-50 rounded-lg p-3">
              {/* Filtros Rápidos */}
              <div className="flex gap-2">
                <button
                  onClick={() => applyQuickFilter('thisMonth')}
                  className="flex items-center gap-1 px-2 py-1 text-xs border border-blue-200 text-blue-700 hover:bg-blue-50 rounded"
                >
                  <Calendar className="h-3 w-3" />
                  Este Mês
                </button>
                <button
                  onClick={() => applyQuickFilter('nextMonth')}
                  className="flex items-center gap-1 px-2 py-1 text-xs border border-orange-200 text-orange-700 hover:bg-orange-50 rounded"
                >
                  <Clock className="h-3 w-3" />
                  Próximo
                </button>
              </div>

              {/* Seletores */}
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={filters.dueDateMonth || ''}
                  onChange={(e) => updateFilter('dueDateMonth', e.target.value ? Number(e.target.value) : '')}
                  className="px-2 py-1 text-xs border border-gray-200 rounded"
                >
                  <option value="">Mês</option>
                  {monthOptions.map(month => (
                    <option key={month.value} value={month.value}>
                      {month.label.slice(0, 3)}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.dueDateYear || ''}
                  onChange={(e) => updateFilter('dueDateYear', e.target.value ? Number(e.target.value) : '')}
                  className="px-2 py-1 text-xs border border-gray-200 rounded"
                >
                  <option value="">Ano</option>
                  {yearOptions.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>

                <input
                  type="date"
                  value={filters.dueDate || ''}
                  onChange={(e) => updateFilter('dueDate', e.target.value)}
                  className="px-2 py-1 text-xs border border-gray-200 rounded"
                />
              </div>
            </div>
          )}
        </div>

        {/* ✅ PREVIEW DOS FILTROS ATIVOS - MINIMALISTA */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-1 pt-2 border-t border-gray-100">
            {filters.search && (
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                🔍 "{filters.search.slice(0, 20)}"
              </span>
            )}
            {filters.status && filters.status !== 'all' && (
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                📊 {filters.status}
              </span>
            )}
            {filters.priority && filters.priority !== 'all' && (
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                🎯 {filters.priority}
              </span>
            )}
            {filters.assignedToId && filters.assignedToId !== 'all' && (
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                👤 {filters.assignedToId === currentUserId ? 'Minhas' : getSelectedUserName(filters.assignedToId)}
              </span>
            )}
            {filters.overdue && (
              <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">
                ⚠️ Atrasadas
              </span>
            )}
            {(filters.dueDateMonth || filters.dueDateYear || filters.dueDate) && (
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                📅 Data
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskFilters