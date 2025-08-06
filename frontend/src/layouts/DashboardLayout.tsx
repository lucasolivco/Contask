// Layout principal - como a "moldura" de todas as páginas
import React from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import {
    Home,
    CheckSquare,
    Users,
    Bell,
    LogOut,
    Menu,
    X,
    Plus
} from 'lucide-react'

import { useAuth } from '../contexts/AuthContext'
import Button from '../components/ui/Button'

const DashboardLayout: React.FC = () => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = React.useState(false)

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    // Itens do menu baseados no tipo de usuário
    const menuItems = [
        {
            name: 'Dashboard',
            icon: Home,
            path: '/dashboard',
            show: true
        },
        {
            name: 'Minhas Tarefas',
            icon: CheckSquare,
            path: '/tasks',
            show: true
        },
        {
            name: 'Funcionários',
            icon: Users,
            path: '/employees',
            show: user?.role === 'MANAGER' // Só gerentes veem
        },
        {
            name: 'Notificações',
            icon: Bell,
            path: '/notifications',
            show: true
        }
    ].filter(item => item.show)


    return (
        <div className="flex h-screen bg-gray-50">
        {/* Sidebar Desktop */}
        <div className="hidden md:flex md:w-64 md:flex-col">
            <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
            {/* Logo */}
            <div className="flex items-center px-6 py-4 border-b border-gray-200">
                <CheckSquare className="h-8 w-8 text-primary-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">
                TaskOrganizer
                </span>
            </div>

            {/* Menu Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
                {menuItems.map((item) => (
                <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                </button>
                ))}

                {/* Botão Criar Tarefa (só para gerentes) */}
                {user?.role === 'MANAGER' && (
                <Button
                    onClick={() => navigate('/tasks/create')}
                    className="w-full mt-4"
                    size="sm"
                >
                    <Plus size={16} />
                    Nova Tarefa
                </Button>
                )}
            </nav>

            {/* User Info */}
            <div className="px-4 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                        {user?.name?.charAt(0).toUpperCase()}
                    </span>
                    </div>
                    <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700">
                        {user?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                        {user?.role === 'MANAGER' ? 'Gerente' : 'Funcionário'}
                    </p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                >
                    <LogOut size={16} />
                </Button>
                </div>
            </div>
            </div>
        </div>

        {/* Sidebar Mobile */}
        {sidebarOpen && (
            <div className="fixed inset-0 z-40 md:hidden">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
                <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                >
                    <X className="h-6 w-6 text-white" />
                </button>
                </div>
                {/* Mesmo conteúdo da sidebar desktop */}
            </div>
            </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Bar Mobile */}
            <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
                <button
                onClick={() => setSidebarOpen(true)}
                className="text-gray-500 hover:text-gray-600"
                >
                <Menu size={24} />
                </button>
                <span className="text-lg font-semibold">TaskOrganizer</span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut size={16} />
                </Button>
            </div>
            </div>

            {/* Page Content */}
            <main className="flex-1 overflow-y-auto">
            <Outlet />
            </main>
        </div>
        </div>
    )
}

export default DashboardLayout


