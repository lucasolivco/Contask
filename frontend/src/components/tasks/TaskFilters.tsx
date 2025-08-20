import { useState } from 'react'
import { Search, Filter, X, AlertTriangle, Calendar, Settings } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import type { TaskFilter } from '../../types'

interface TaskFiltersProps {
  onFiltersChange: (filters: TaskFilter) => void
  userRole: string
}

const TaskFilters = ({ onFiltersChange, userRole }: TaskFiltersProps) => {
  const [filters, setFilters] = useState<TaskFilter>({})
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Atualizar filtros
  const updateFilter = (key: keyof TaskFilter, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  // Limpar todos os filtros
  const clearAllFilters = () => {
    const emptyFilters: TaskFilter = {}
    setFilters(emptyFilters)
    onFiltersChange(emptyFilters)
  }

  // Contar filtros ativos
  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'search') return value && value.trim() !== ''
    if (key === 'overdue') return value === true
    return value && value !== ''
  }).length

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Barra de Busca Principal - DESIGN NEUTRO E ELEGANTE */}
      <Card className="bg-white border-gray-200 shadow-lg">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Campo de busca - CORES NEUTRAS */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar tarefas por título ou descrição..."
                value={filters.search || ''}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 focus:outline-none transition-all duration-200 shadow-sm hover:border-gray-300"
              />
            </div>
          </div>
          
          {/* Botões de ação - DESIGN MINIMALISTA */}
          <div className="flex gap-3">
            {/* Filtro Atrasadas - COR LARANJA */}
            <Button
              variant={filters.overdue ? 'danger' : 'ghost'}
              onClick={() => updateFilter('overdue', !filters.overdue)}
              className={`interactive-scale ${!filters.overdue ? 'hover:bg-amber-50' : 'bg-amber-100 text-amber-800 border-amber-300'}`}
            >
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Atrasadas</span>
            </Button>
            
            {/* Toggle Filtros Avançados */}
            <Button
              variant={showAdvanced ? 'secondary' : 'blue'}
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="interactive-scale relative"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gray-900 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-scale-in">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
            
            {/* Limpar Filtros */}
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                onClick={clearAllFilters}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-gray-200 interactive-scale"
              >
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">Limpar</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Filtros Avançados - DESIGN CLEAN */}
      {showAdvanced && (
        <Card className="bg-white border-gray-200 shadow-lg animate-fade-in">
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Filter className="h-4 w-4 text-gray-600" />
              </div>
              <h3 className="heading-sm text-gray-800">Filtros Avançados</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Status da Tarefa
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => updateFilter('status', e.target.value || undefined)}
                  className="input-field"
                >
                  <option value="">🔍 Todos os status</option>
                  <option value="PENDING">📋 Pendente</option>
                  <option value="IN_PROGRESS">⚡ Em Progresso</option>
                  <option value="COMPLETED">✅ Concluída</option>
                  <option value="CANCELLED">❌ Cancelada</option>
                </select>
              </div>

              {/* Prioridade */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Nível de Prioridade
                </label>
                <select
                  value={filters.priority || ''}
                  onChange={(e) => updateFilter('priority', e.target.value || undefined)}
                  className="input-field"
                >
                  <option value="">🎯 Todas as prioridades</option>
                  <option value="URGENT">🚨 Urgente</option>
                  <option value="HIGH">⚡ Alta</option>
                  <option value="MEDIUM">📋 Média</option>
                  <option value="LOW">📝 Baixa</option>
                </select>
              </div>

              {/* Data de vencimento */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <Calendar className="inline h-4 w-4 mr-2" />
                  Data de Vencimento
                </label>
                <input
                  type="date"
                  value={filters.dueDate || ''}
                  onChange={(e) => updateFilter('dueDate', e.target.value || undefined)}
                  className="input-field"
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Indicadores de Filtros Ativos - DESIGN MELHORADO */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-3 animate-fade-in">
          {filters.search && (
            <span className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium shadow-sm border border-gray-200">
              <Search className="h-3 w-3" />
              "{filters.search}"
              <button
                onClick={() => updateFilter('search', '')}
                className="hover:bg-gray-200 rounded-full p-1 transition-colors interactive-scale"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {filters.status && (
            <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-xl text-sm font-medium shadow-sm border border-blue-200">
              Status: {filters.status}
              <button
                onClick={() => updateFilter('status', undefined)}
                className="hover:bg-blue-200 rounded-full p-1 transition-colors interactive-scale"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {filters.priority && (
            <span className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-xl text-sm font-medium shadow-sm border border-orange-200">
              Prioridade: {filters.priority}
              <button
                onClick={() => updateFilter('priority', undefined)}
                className="hover:bg-orange-200 rounded-full p-1 transition-colors interactive-scale"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {filters.overdue && (
            <span className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 px-4 py-2 rounded-xl text-sm font-medium shadow-sm border">
              <AlertTriangle className="h-3 w-3" />
              Atrasadas
              <button
                onClick={() => updateFilter('overdue', false)}
                className="hover:bg-yellow-400 rounded-full p-1 transition-colors interactive-scale"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {filters.dueDate && (
            <span className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-xl text-sm font-medium shadow-sm border border-purple-200">
              <Calendar className="h-3 w-3" />
              {new Date(filters.dueDate).toLocaleDateString('pt-BR')}
              <button
                onClick={() => updateFilter('dueDate', undefined)}
                className="hover:bg-purple-200 rounded-full p-1 transition-colors interactive-scale"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default TaskFilters