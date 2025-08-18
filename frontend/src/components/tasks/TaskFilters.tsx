import { useState } from 'react'
import { Search, Filter, X, AlertTriangle, Calendar } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Input from '../ui/Input'
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
    <div className="space-y-4">
      {/* Barra de Busca Principal */}
      <Card className="gradient-rose border-rose-100">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Campo de busca */}
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Buscar tarefas por título ou descrição..."
              value={filters.search || ''}
              onChange={(e) => updateFilter('search', e.target.value)}
              icon={<Search className="h-4 w-4" />}
              className="bg-white/80 border-rose-200 focus:bg-white"
            />
          </div>
          
          {/* Botões de ação */}
          <div className="flex gap-2">
            {/* Filtro Atrasadas */}
            <Button
              variant={filters.overdue ? 'danger' : 'ghost'}
              onClick={() => updateFilter('overdue', !filters.overdue)}
              className={`${!filters.overdue ? 'hover:bg-red-50 text-red-600' : ''}`}
            >
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Atrasadas</span>
            </Button>
            
            {/* Toggle Filtros Avançados */}
            <Button
              variant={showAdvanced ? 'secondary' : 'ghost'}
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="bg-rose-500 text-white text-xs rounded-full px-2 py-0.5 ml-1">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
            
            {/* Limpar Filtros */}
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                onClick={clearAllFilters}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              >
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">Limpar</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Filtros Avançados */}
      {showAdvanced && (
        <Card className="bg-white border-rose-100 animate-fade-in">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-rose-700">
              <Filter className="h-4 w-4" />
              <h3 className="font-medium">Filtros Avançados</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status da Tarefa
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => updateFilter('status', e.target.value || undefined)}
                  className="input-field"
                >
                  <option value="">Todos os status</option>
                  <option value="PENDING">📋 Pendente</option>
                  <option value="IN_PROGRESS">⚡ Em Progresso</option>
                  <option value="COMPLETED">✅ Concluída</option>
                  <option value="CANCELLED">❌ Cancelada</option>
                </select>
              </div>

              {/* Prioridade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioridade
                </label>
                <select
                  value={filters.priority || ''}
                  onChange={(e) => updateFilter('priority', e.target.value || undefined)}
                  className="input-field"
                >
                  <option value="">Todas as prioridades</option>
                  <option value="LOW">🟢 Baixa</option>
                  <option value="MEDIUM">🟡 Média</option>
                  <option value="HIGH">🟠 Alta</option>
                  <option value="URGENT">🔴 Urgente</option>
                </select>
              </div>

              {/* Data de vencimento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
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

      {/* Indicadores de Filtros Ativos */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 animate-fade-in">
          {filters.search && (
            <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-sm">
              <Search className="h-3 w-3" />
              "{filters.search}"
              <button
                onClick={() => updateFilter('search', '')}
                className="hover:bg-rose-200 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {filters.status && (
            <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-sm">
              Status: {filters.status}
              <button
                onClick={() => updateFilter('status', undefined)}
                className="hover:bg-rose-200 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {filters.priority && (
            <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-sm">
              Prioridade: {filters.priority}
              <button
                onClick={() => updateFilter('priority', undefined)}
                className="hover:bg-rose-200 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {filters.overdue && (
            <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
              <AlertTriangle className="h-3 w-3" />
              Atrasadas
              <button
                onClick={() => updateFilter('overdue', false)}
                className="hover:bg-red-200 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {filters.dueDate && (
            <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-sm">
              <Calendar className="h-3 w-3" />
              {new Date(filters.dueDate).toLocaleDateString('pt-BR')}
              <button
                onClick={() => updateFilter('dueDate', undefined)}
                className="hover:bg-rose-200 rounded-full p-0.5 transition-colors"
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