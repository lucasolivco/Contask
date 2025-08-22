import React from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
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
    const location = useLocation()
    const [sidebarOpen, setSidebarOpen] = React.useState(false)

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    // Itens do menu
    const menuItems = [
        {
            name: 'Dashboard',
            icon: Home,
            path: '/dashboard',
            show: true
        },
        {
            name: user?.role === 'MANAGER' ? 'Todas as Tarefas' : 'Minhas Tarefas',
            icon: CheckSquare,
            path: '/tasks',
            show: true
        },
        {
            name: 'Funcionários',
            icon: Users,
            path: '/employees',
            show: user?.role === 'MANAGER'
        },
        {
            name: 'Notificações',
            icon: Bell,
            path: '/notifications',
            show: true
        }
    ].filter(item => item.show)

    const isActivePath = (path: string) => location.pathname === path

    // Componente de navegação reutilizável
    const NavigationItems = ({ onItemClick }: { onItemClick?: () => void }) => (
        <>
            {menuItems.map((item) => (
                <button
                    key={item.path}
                    onClick={() => {
                        navigate(item.path)
                        onItemClick?.()
                    }}
                    className={`
                        w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                        ${isActivePath(item.path)
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                        }
                    `}
                >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                </button>
            ))}

            {/* Botão Criar Tarefa */}
            {user?.role === 'MANAGER' && (
                <Button
                    onClick={() => {
                        navigate('/tasks/create')
                        onItemClick?.()
                    }}
                    className="w-full mt-4"
                    size="sm"
                >
                    <Plus size={16} />
                    Nova Tarefa
                </Button>
            )}
        </>
    )

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar Desktop */}
            <div className="hidden md:flex md:w-64 md:flex-col">
                <div className="flex flex-col flex-grow bg-white border-r border-gray-200 shadow-sm">
                    {/* Logo */}
                    <div className="flex items-center px-6 py-5 border-b border-gray-200 gradient-rose">
                        <CheckSquare className="h-8 w-8 text-pink-600" />
                        <span className="ml-2 text-xl font-bold bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
                            TaskManager
                        </span>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-2 scrollbar-thin overflow-y-auto">
                        <NavigationItems />
                    </nav>

                    {/* User Info */}
                    <div className="px-4 py-4 border-t border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center min-w-0 flex-1">
                                <div className="h-9 w-9 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm font-semibold text-white">
                                        {user?.name?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="ml-3 min-w-0 flex-1">
                                    <p className="text-sm font-medium text-gray-700 truncate">
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
                                className="flex-shrink-0 p-2"
                            >
                                <LogOut size={16} />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar Mobile Overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    <div 
                        className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity" 
                        onClick={() => setSidebarOpen(false)} 
                    />
                    <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl">
                        {/* Close button */}
                        <div className="absolute top-0 right-0 -mr-12 pt-2">
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                            >
                                <X className="h-6 w-6 text-white" />
                            </button>
                        </div>

                        {/* Logo */}
                        <div className="flex items-center px-6 py-5 border-b border-gray-200 gradient-rose">
                            <CheckSquare className="h-8 w-8 text-blue-600" />
                            <span className="ml-2 text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                                TaskManager
                            </span>
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                            <NavigationItems onItemClick={() => setSidebarOpen(false)} />
                        </nav>

                        {/* User Info Mobile */}
                        <div className="px-4 py-4 border-t border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="h-9 w-9 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                                        <span className="text-sm font-semibold text-white">
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
                                    onClick={() => {
                                        handleLogout()
                                        setSidebarOpen(false)
                                    }}
                                    className="p-2"
                                >
                                    <LogOut size={16} />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar Mobile */}
                <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="text-gray-500 hover:text-gray-600 p-2"
                        >
                            <Menu size={24} />
                        </button>
                        <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">TaskManager</span>
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-gradient-to-br from-rose-500 to-pink-600 rounded-full flex items-center justify-center">
                                <span className="text-xs font-semibold text-white">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto bg-gray-50 scrollbar-thin">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default DashboardLayout