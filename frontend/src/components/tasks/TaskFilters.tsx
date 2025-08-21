import React, { useState, useEffect } from 'react'
import { Search, Filter, Calendar, X, Clock, AlertTriangle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getEmployees } from '../../services/taskService'
import type { TaskFilter } from '../../types'

interface TaskFiltersProps {
  onFiltersChange: (filters: TaskFilter) => void
  userRole: string
}

const TaskFilters: React.FC<TaskFiltersProps> = ({ onFiltersChange, userRole }) => {
  const [filters, setFilters] = useState<TaskFilter>({})
  const [isExpanded, setIsExpanded] = useState(false)

  // Buscar funcionários se for manager
  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
    enabled: userRole === 'MANAGER'
  })

  const employees = employeesData?.employees || []

  // Gerar anos (últimos 2 anos + próximos 2)
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear()
    const years = []
    
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
      years.push(i)
    }
    
    return years.reverse()
  }

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

  const yearOptions = generateYearOptions()

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

  // Filtros rápidos para data de vencimento
  const applyQuickFilter = (type: 'thisMonth' | 'nextMonth') => {
    const now = new Date()
    
    switch (type) {
      case 'thisMonth':
        setFilters(prev => ({
          ...prev,
          dueDateMonth: now.getMonth() + 1,
          dueDateYear: now.getFullYear()
        }))
        break
      case 'nextMonth':
        const nextMonth = now.getMonth() === 11 ? 1 : now.getMonth() + 2
        const yearForNextMonth = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear()
        setFilters(prev => ({
          ...prev,
          dueDateMonth: nextMonth,
          dueDateYear: yearForNextMonth
        }))
        break
    }
  }

  const getCurrentMonthYear = () => {
    const now = new Date()
    const currentMonth = monthOptions.find(m => m.value === now.getMonth() + 1)?.label
    return `${currentMonth} ${now.getFullYear()}`
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* ✅ HEADER MELHORADO */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Filter className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Filtros</h3>
              <p className="text-sm text-gray-500">
                {hasActiveFilters ? 'Filtros ativos aplicados' : 'Refine sua busca por tarefas'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* ✅ FILTRO DE ATRASADAS NO HEADER */}
            <label className="flex items-center gap-2 px-3 py-2 border border-red-200 rounded-lg hover:bg-red-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={filters.overdue || false}
                onChange={(e) => updateFilter('overdue', e.target.checked || undefined)}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-red-700">Atrasadas</span>
            </label>

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
                Limpar
              </button>
            )}
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
            >
              <Calendar className="h-4 w-4" />
              {isExpanded ? 'Ocultar Datas' : 'Filtrar Vencimento'}
            </button>
          </div>
        </div>
      </div>

      {/* FILTROS BÁSICOS */}
      <div className="p-4 space-y-4">
        {/* Linha 1: Busca e Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título ou descrição..."
              value={filters.search || ''}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={filters.status || 'all'}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">📋 Todos os Status</option>
            <option value="PENDING">⏳ Pendente</option>
            <option value="IN_PROGRESS">🔄 Em Progresso</option>
            <option value="COMPLETED">✅ Completada</option>
            <option value="CANCELLED">❌ Cancelada</option>
          </select>
        </div>

        {/* Linha 2: Prioridade e Funcionário */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={filters.priority || 'all'}
            onChange={(e) => updateFilter('priority', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">🎯 Todas as Prioridades</option>
            <option value="LOW">📝 Baixa</option>
            <option value="MEDIUM">📋 Média</option>
            <option value="HIGH">⚡ Alta</option>
            <option value="URGENT">🚨 Urgente</option>
          </select>

          {userRole === 'MANAGER' && (
            <select
              value={filters.assignedToId || 'all'}
              onChange={(e) => updateFilter('assignedToId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">👥 Todos os Funcionários</option>
              {employees.map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* ✅ FILTROS DE DATA - ORGANIZADOS E ELEGANTES */}
        {isExpanded && (
          <div className="border-t border-gray-100 pt-4 space-y-4">
            {/* Header da Seção */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                <span className="font-medium text-gray-900">Data de Vencimento</span>
              </div>
              <div className="text-sm text-gray-500">
                Hoje: {getCurrentMonthYear()}
              </div>
            </div>

            {/* Filtros Rápidos */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => applyQuickFilter('thisMonth')}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-blue-200 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Calendar className="h-4 w-4" />
                Este Mês
              </button>
              <button
                onClick={() => applyQuickFilter('nextMonth')}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-orange-200 text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
              >
                <Clock className="h-4 w-4" />
                Próximo Mês
              </button>
            </div>

            {/* Seletores de Mês e Ano */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mês
                </label>
                <select
                  value={filters.dueDateMonth || ''}
                  onChange={(e) => updateFilter('dueDateMonth', e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos os meses</option>
                  {monthOptions.map(month => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ano
                </label>
                <select
                  value={filters.dueDateYear || ''}
                  onChange={(e) => updateFilter('dueDateYear', e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos os anos</option>
                  {yearOptions.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Específica
                </label>
                <input
                  type="date"
                  value={filters.dueDate || ''}
                  onChange={(e) => updateFilter('dueDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* ✅ PREVIEW LIMPO DOS FILTROS DE DATA */}
            {(filters.dueDateMonth || filters.dueDateYear || filters.dueDate) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-blue-700">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Filtrando por vencimento:</span>
                  <div className="flex flex-wrap gap-2">
                    {filters.dueDateMonth && filters.dueDateYear && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {monthOptions.find(m => m.value === filters.dueDateMonth)?.label} {filters.dueDateYear}
                      </span>
                    )}
                    {filters.dueDateMonth && !filters.dueDateYear && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {monthOptions.find(m => m.value === filters.dueDateMonth)?.label}
                      </span>
                    )}
                    {!filters.dueDateMonth && filters.dueDateYear && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        Ano {filters.dueDateYear}
                      </span>
                    )}
                    {filters.dueDate && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                        {new Date(filters.dueDate).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ✅ PREVIEW GERAL - APENAS FILTROS BÁSICOS */}
        {(filters.search || (filters.status && filters.status !== 'all') || (filters.priority && filters.priority !== 'all') || (filters.assignedToId && filters.assignedToId !== 'all')) && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-sm text-gray-700">
              <span className="font-medium">Filtros ativos:</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {filters.search && (
                  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                    🔍 "{filters.search}"
                  </span>
                )}
                {filters.status && filters.status !== 'all' && (
                  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                    📊 {filters.status}
                  </span>
                )}
                {filters.priority && filters.priority !== 'all' && (
                  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                    🎯 {filters.priority}
                  </span>
                )}
                {filters.assignedToId && filters.assignedToId !== 'all' && (
                  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                    👤 {employees.find(e => e.id === filters.assignedToId)?.name || 'Funcionário'}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskFilters