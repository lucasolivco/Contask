// frontend/src/layouts/DashboardLayout.tsx - COM LOGO PNG

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
    Plus,
    Calendar,
    ChevronUp,
    Mail
} from 'lucide-react'

import { useAuth } from '../contexts/AuthContext'
import Button from '../components/ui/Button'
import Logo from '../components/ui/Logo'

const DashboardLayout: React.FC = () => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [sidebarOpen, setSidebarOpen] = React.useState(false)
    const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false)

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

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
            name: 'Calendário',
            icon: Calendar,
            path: '/calendar',
            show: true
        },
        {
            name: 'Equipe',
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
                            ? 'bg-cyan-100 text-cyan-700 border border-cyan-200'
                            : 'text-gray-700 hover:bg-cyan-50 hover:text-cyan-600'
                        }
                    `}
                >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                </button>
            ))}

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

    // Ref para o menu de perfil
    const profileMenuRef = React.useRef<HTMLDivElement>(null)

    // Efeito para fechar o menu ao clicar fora
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setIsProfileMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])
    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar Desktop */}
            <div className="hidden md:flex md:w-64 md:flex-col">
                <div className="flex flex-col flex-grow bg-white border-r border-gray-200 shadow-sm">
                    {/* ✅ LOGO PNG NO SIDEBAR DESKTOP */}
                    <div className="flex items-center justify-center px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-green-50">
                        <Logo 
                          size="lg" 
                          onClick={() => navigate('/dashboard')}
                        />
                    </div>

                    <nav className="flex-1 px-4 py-6 space-y-2 scrollbar-thin overflow-y-auto">
                        <NavigationItems />
                    </nav>

                    {/* ✅ MENU DE PERFIL ATUALIZADO (DESKTOP) */}
                    <div className="relative" ref={profileMenuRef}>
                        {isProfileMenuOpen && (
                            <div className="absolute bottom-full left-0 right-0 mb-2 p-2">
                                <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 animate-fade-in-up">
                                    <div className="text-center mb-4">
                                        <p className="font-semibold text-gray-800">{user?.name}</p>
                                        <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                                            <Mail className="h-3 w-3" />
                                            {user?.email}
                                        </p>
                                        <span className={`mt-2 inline-block text-xs px-2 py-1 rounded-full ${
                                            user?.role === 'MANAGER' 
                                            ? 'bg-purple-100 text-purple-700' 
                                            : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {user?.role === 'MANAGER' ? 'Gerente' : 'Funcionário'}
                                        </span>
                                    </div>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={handleLogout}
                                        className="w-full"
                                    >
                                        <LogOut size={16} />
                                        Sair
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div 
                            className="px-4 py-4 border-t border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center min-w-0 flex-1">
                                    <div className="h-9 w-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
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
                                <ChevronUp className={`h-5 w-5 text-gray-500 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                            </div>
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
                        <div className="absolute top-0 right-0 -mr-12 pt-2">
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                            >
                                <X className="h-6 w-6 text-white" />
                            </button>
                        </div>

                        {/* ✅ LOGO PNG NO SIDEBAR MOBILE */}
                        <div className="flex items-center justify-center px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-green-50">
                            <Logo 
                              size="md" 
                              onClick={() => {
                                navigate('/dashboard')
                                setSidebarOpen(false)
                              }}
                            />
                        </div>

                        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                            <NavigationItems onItemClick={() => setSidebarOpen(false)} />
                        </nav>

                        {/* ✅ MENU DE PERFIL ATUALIZADO (MOBILE) */}
                        <div className="relative">
                            {isProfileMenuOpen && (
                                <div className="absolute bottom-full left-0 right-0 mb-2 p-2">
                                    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 animate-fade-in-up">
                                        <div className="text-center mb-4">
                                            <p className="font-semibold text-gray-800">{user?.name}</p>
                                            <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                                                <Mail className="h-3 w-3" />
                                                {user?.email}
                                            </p>
                                            <span className={`mt-2 inline-block text-xs px-2 py-1 rounded-full ${
                                                user?.role === 'MANAGER' 
                                                ? 'bg-purple-100 text-purple-700' 
                                                : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {user?.role === 'MANAGER' ? 'Gerente' : 'Funcionário'}
                                            </span>
                                        </div>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={handleLogout}
                                            className="w-full"
                                        >
                                            <LogOut size={16} />
                                            Sair
                                        </Button>
                                    </div>
                                </div>
                            )}
                            <div 
                                className="px-4 py-4 border-t border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center min-w-0 flex-1">
                                        <div className="h-9 w-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
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
                                    <ChevronUp className={`h-5 w-5 text-gray-500 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* ✅ TOP BAR MOBILE COM LOGO PNG */}
                <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="text-gray-500 hover:text-gray-600 p-2"
                        >
                            <Menu size={24} />
                        </button>
                        <Logo 
                          size="sm" 
                          onClick={() => navigate('/dashboard')}
                        />
                        {/* ✅ BOTÃO DE PERFIL NO HEADER MOBILE */}
                        <button 
                            className="flex items-center gap-2"
                            onClick={() => {
                                setSidebarOpen(true)
                                setIsProfileMenuOpen(true)
                            }}
                        >
                            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-xs font-semibold text-white">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        </button>
                    </div>
                </div>

                <main className="flex-1 overflow-y-auto bg-gray-50 scrollbar-thin">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default DashboardLayout