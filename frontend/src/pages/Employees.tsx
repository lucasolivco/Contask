// Página para gerentes visualizarem sua equipe
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users, Mail, CheckSquare, Clock, TrendingUp } from 'lucide-react'

import Card from '../components/ui/Card'
import { getEmployees } from '../services/taskService'

const Employees: React.FC = () => {
  // Busca lista de funcionários
  const { data: employeesData, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees
  })

  const employees = employeesData?.employees || []

  // Componente para card de cada funcionário
  const EmployeeCard: React.FC<{ employee: any }> = ({ employee }) => {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <div className="space-y-4">
          {/* Header do funcionário */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {/* Avatar com inicial do nome */}
              <div className="h-12 w-12 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-lg font-medium text-white">
                  {employee.name.charAt(0).toUpperCase()}
                </span>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {employee.name}
                </h3>
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-1" />
                  {employee.email}
                </div>
              </div>
            </div>
            
            {/* Badge com número de tarefas */}
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {employee._count.assignedTasks} tarefa(s)
            </div>
          </div>

          {/* Estatísticas do funcionário */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <CheckSquare className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">
                {employee._count.assignedTasks}
              </p>
              <p className="text-xs text-gray-500">Tarefas</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">-</p>
              <p className="text-xs text-gray-500">Pendentes</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">-</p>
              <p className="text-xs text-gray-500">Concluídas</p>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Funcionários
        </h1>
        <p className="text-gray-600">
          Gerencie sua equipe e veja o progresso de cada funcionário
        </p>
      </div>

      {/* Estatísticas gerais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-blue-500 rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total de Funcionários
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {employees.length}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-green-500 rounded-lg">
              <CheckSquare className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Tarefas Atribuídas
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {employees.reduce((total, emp) => total + emp._count.assignedTasks, 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-yellow-500 rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Média por Funcionário
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {employees.length > 0 
                  ? Math.round(employees.reduce((total, emp) => total + emp._count.assignedTasks, 0) / employees.length)
                  : 0
                }
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Lista de funcionários */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : employees.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((employee) => (
            <EmployeeCard key={employee.id} employee={employee} />
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Nenhum funcionário encontrado
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Aguarde novos funcionários se cadastrarem no sistema.
          </p>
        </Card>
      )}
    </div>
  )
}

export default Employees