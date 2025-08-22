import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Users, 
  Mail, 
  CheckSquare, 
  Clock, 
  AlertTriangle,
  Eye,
  Search,
  Filter,
  RotateCcw,
  User,
  TrendingUp,
  Zap
} from 'lucide-react'

import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import EmployeeDetailsModal from '../components/employees/EmployeeDetailsModal'
import { getEmployees } from '../services/taskService'

interface EmployeeFromAPI {
  id: string
  name: string
  email: string
  role: 'MANAGER' | 'EMPLOYEE'
  _count: {
    assignedTasks: number
  }
}

const Employees: React.FC = () => {
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeFromAPI | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'low-tasks'>('all')

  // ✅ BUSCAR FUNCIONÁRIOS
  const { data: employeesData, isLoading, error } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
    staleTime: 1000 * 60 * 5,
  })

  const employees: EmployeeFromAPI[] = employeesData?.employees || []

  // ✅ FILTRAR E BUSCAR FUNCIONÁRIOS
  const filteredEmployees = useMemo(() => {
    let filtered = employees

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por status
    if (statusFilter === 'active') {
      filtered = filtered.filter(emp => emp._count.assignedTasks > 0)
    } else if (statusFilter === 'low-tasks') {
      filtered = filtered.filter(emp => emp._count.assignedTasks <= 2)
    }

    return filtered
  }, [employees, searchTerm, statusFilter])

  const handleViewEmployee = (employee: EmployeeFromAPI) => {
    setSelectedEmployee(employee)
    setIsDetailsModalOpen(true)
  }

  const handleCloseDetails = () => {
    setIsDetailsModalOpen(false)
    setSelectedEmployee(null)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
  }

  // ✅ CARD DO FUNCIONÁRIO - REDESENHADO
  const EmployeeCard: React.FC<{ 
    employee: EmployeeFromAPI
    index: number 
  }> = ({ employee, index }) => {
    const totalTasks = employee._count.assignedTasks
    
    // Mock data para demonstração - na prática viria da API
    const mockStats = {
      completed: Math.floor(totalTasks * 0.6),
      inProgress: Math.floor(totalTasks * 0.25),
      overdue: Math.floor(totalTasks * 0.15)
    }

    const completionRate = totalTasks > 0 ? Math.round((mockStats.completed / totalTasks) * 100) : 0

    return (
      <Card 
        className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-l-4 border-l-blue-500 hover:border-l-blue-600"
        onClick={() => handleViewEmployee(employee)}
      >
        <div className="p-6 space-y-5">
          {/* ✅ HEADER DO FUNCIONÁRIO */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
                  <span className="text-2xl font-bold text-white">
                    {employee.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                {/* Status indicator */}
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${
                  totalTasks > 0 ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                  {employee.name}
                </h3>
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{employee.email}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    <User className="h-3 w-3 mr-1" />
                    {employee.role === 'MANAGER' ? 'Gerente' : 'Funcionário'}
                  </span>
                  {totalTasks > 0 && (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      completionRate >= 80 ? 'bg-green-100 text-green-700' :
                      completionRate >= 50 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {completionRate}% concluído
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation()
                handleViewEmployee(employee)
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>

          {/* ✅ ESTATÍSTICAS DE TAREFAS - PROTAGONISTAS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-700">Tarefas Atribuídas</h4>
              <span className="text-2xl font-bold text-gray-900">{totalTasks}</span>
            </div>
            
            {totalTasks > 0 ? (
              <>
                {/* Barra de progresso visual */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Progresso Geral</span>
                    <span>{completionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        completionRate >= 80 ? 'bg-green-500' : 
                        completionRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.max(completionRate, 5)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Grid de estatísticas */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex items-center justify-center mb-1">
                      <CheckSquare className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-lg font-bold text-green-700">{mockStats.completed}</p>
                    <p className="text-xs text-green-600">Concluídas</p>
                  </div>
                  
                  <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-center mb-1">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="text-lg font-bold text-blue-700">{mockStats.inProgress}</p>
                    <p className="text-xs text-blue-600">Em Progresso</p>
                  </div>

                  <div className="text-center p-3 bg-red-50 rounded-lg border border-red-100">
                    <div className="flex items-center justify-center mb-1">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    </div>
                    <p className="text-lg font-bold text-red-700">{mockStats.overdue}</p>
                    <p className="text-xs text-red-600">Atrasadas</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
                <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 font-medium">Nenhuma tarefa atribuída</p>
                <p className="text-xs text-gray-400">Funcionário disponível para novas tarefas</p>
              </div>
            )}
          </div>

          {/* ✅ FOOTER COM CALL TO ACTION */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Clique para ver detalhes completos
              </div>
              <div className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                <TrendingUp className="h-3 w-3" />
                Ver Performance
              </div>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="text-center py-12 border-red-200 bg-red-50">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Erro ao carregar funcionários</h3>
          <p className="text-red-600">Tente novamente em alguns instantes</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      {/* ✅ HEADER LIMPO */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
            <Users className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Equipe</h1>
            <p className="text-gray-600 text-lg">
              Gerencie e acompanhe sua equipe de trabalho
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>{employees.filter(e => e._count.assignedTasks > 0).length} ativos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span>{employees.filter(e => e._count.assignedTasks === 0).length} disponíveis</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{employees.length} total</span>
          </div>
        </div>
      </div>

      {/* ✅ FILTROS E BUSCA */}
      <Card className="bg-gray-50 border-gray-200">
        <div className="p-6 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* Filtros */}
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'Todos', count: employees.length },
                { key: 'active', label: 'Ativos', count: employees.filter(e => e._count.assignedTasks > 0).length },
                { key: 'low-tasks', label: 'Poucas Tarefas', count: employees.filter(e => e._count.assignedTasks <= 2).length }
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === key
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
              
              {(searchTerm || statusFilter !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Indicador de resultados */}
          {filteredEmployees.length !== employees.length && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter className="h-4 w-4" />
              <span>
                Mostrando {filteredEmployees.length} de {employees.length} funcionários
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* ✅ GRID DE FUNCIONÁRIOS */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-80 bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredEmployees.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredEmployees.map((employee, index) => (
            <div 
              key={employee.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <EmployeeCard employee={employee} index={index} />
            </div>
          ))}
        </div>
      ) : (
        <Card className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-6">
              <Users className="h-16 w-16 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {searchTerm || statusFilter !== 'all' 
                ? 'Nenhum funcionário encontrado' 
                : 'Nenhum funcionário cadastrado'
              }
            </h3>
            <p className="text-gray-600 mb-8">
              {searchTerm || statusFilter !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Aguarde novos funcionários se cadastrarem no sistema'
              }
            </p>
            {(searchTerm || statusFilter !== 'all') && (
              <Button onClick={clearFilters} className="mt-4">
                <RotateCcw className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* ✅ MODAL DE DETALHES */}
      {selectedEmployee && (
        <EmployeeDetailsModal
          employee={selectedEmployee}
          isOpen={isDetailsModalOpen}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  )
}

export default Employees