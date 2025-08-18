// types/index.ts - CORRIGIDO para consistência
export interface User {
    id: string;
    name: string;
    email: string;
    role: 'MANAGER' | 'EMPLOYEE';
    createdAt: string;
}

export interface Task {
    id: string;
    title: string;
    description: string;
    // CORRIGIDO: valores em inglês para match com backend
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    dueDate?: string;
    createdAt: string;
    updatedAt: string;

    // Relacionamentos
    createdBy: {
        id: string;
        name: string;
        email: string;
    }
    assignedTo: {
        id: string;
        name: string;
        email: string;
    }

    attachments?: Attachment[];
    _count?: {
        attachments: number;
    }
}

export interface Attachment {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    path: string;
    createdAt: string;
}

export interface Notification {
    id: string;
    type: 'TASK_ASSIGNED' | 'TASK_UPDATED' | 'TASK_COMPLETED' | 'TASK_OVERDUE';
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
    taskId?: string;
    task?: {
        id: string;
        title: string;
    }
}

// Tipos para formulários
export interface LoginForm {
    email: string;
    password: string;
}

export interface RegisterForm {
    name: string;
    email: string;
    password: string;
    role: 'MANAGER' | 'EMPLOYEE';
}

// CORRIGIDO: CreateTaskForm com valores em inglês
export interface CreateTaskForm {
    title: string;
    description?: string;
    assignedToId: string;
    dueDate?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

// CORRIGIDO: TaskFilter com valores em inglês
export interface TaskFilter {
    status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    search?: string;
    assignedToId?: string;
    dueDate?: string;
    overdue?: boolean;
}

// Tipos para API responses
export interface ApiResponse<T> {
    message?: string;
    data?: T;
    error?: string;
}

export interface LoginResponse {
    message: string;
    user: User;
    token: string;
}

export interface TaskResponse {
    tasks: Task[];
}

export interface CreateTaskResponse {
    message: string;
    task: Task;
}

export interface UpdateTaskResponse {
    message: string;
    task: Task;
}

export interface EmployeesResponse {
    employees: Array<{
        id: string;
        name: string;
        email: string;
        role: 'MANAGER' | 'EMPLOYEE';
        _count: {
            assignedTasks: number;
        }
    }>
}

export interface NotificationsResponse {
    notifications: Notification[];
}

// Tipos utilitários para componentes
export interface TaskCardProps {
    task: Task;
    onClick?: () => void;
    onStatusChange?: (taskId: string, newStatus: Task['status']) => void;
    userRole: string;
}

export interface TaskFiltersProps {
    onFiltersChange: (filters: TaskFilter) => void;
    userRole: string;
}

// Tipos para estatísticas
export interface TaskStats {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    overdue: number;
}

// Tipos para dashboard
export interface DashboardData {
    stats: TaskStats;
    recentTasks: Task[];
    notifications: Notification[];
}

// Enum helpers - para facilitar tradução
export const TaskStatusLabels = {
    PENDING: 'Pendente',
    IN_PROGRESS: 'Em Progresso',
    COMPLETED: 'Concluída',
    CANCELLED: 'Cancelada'
} as const;

export const TaskPriorityLabels = {
    LOW: 'Baixa',
    MEDIUM: 'Média',
    HIGH: 'Alta',
    URGENT: 'Urgente'
} as const;

export const TaskStatusIcons = {
    PENDING: '📋',
    IN_PROGRESS: '⚡',
    COMPLETED: '✅',
    CANCELLED: '❌'
} as const;

export const TaskPriorityIcons = {
    LOW: '📝',
    MEDIUM: '📋',
    HIGH: '⚡',
    URGENT: '🚨'
} as const;

// Atualizar apenas as cores dos helpers
export const TaskPriorityColors = {
  LOW: {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200'
  },
  MEDIUM: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200'
  },
  HIGH: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200'
  },
  URGENT: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200'
  }
} as const;

export const TaskStatusColors = {
  PENDING: {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200'
  },
  IN_PROGRESS: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200'
  },
  COMPLETED: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200'
  },
  CANCELLED: {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200'
  }
} as const;