// types/index.ts - SIMPLIFICADO E UNIFICADO
export interface User {
    id: string;
    name: string;
    email: string;
    role: 'MANAGER' | 'EMPLOYEE';
    emailVerified?: boolean;
    createdAt: string;
}

export interface Task {
    id: string;
    title: string;
    description: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    dueDate?: string;
    targetDate?: string;
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

    // ✅ PERMISSÕES UNIFICADAS
    canEdit?: boolean;
    canChangeStatus?: boolean;
    canDelete?: boolean;
    isCreator?: boolean;
    isAssigned?: boolean;
}

// ✅ INTERFACE ÚNICA PARA DETALHES DE USUÁRIO
export interface UserDetailsResponse {
    employee?: {
        id: string;
        name: string;
        email: string;
        role: string;
        emailVerified?: boolean;
        createdAt?: string;
    };
    user?: {
        id: string;
        name: string;
        email: string;
        role: string;
        emailVerified?: boolean;
        createdAt?: string;
    };
    tasks: Task[];
    stats: {
        totalTasks: number;
        pendingTasks: number;
        inProgressTasks: number;
        completedTasks: number;
        overdueTasks: number;
        completionRate: number;
        cancelledTasks?: number;
        priorityBreakdown?: {
            urgent: number;
            high: number;
            medium: number;
            low: number;
        };
        recentTasks?: number;
        avgTasksPerMonth?: number;
    };
}

// ✅ INTERFACES DE RESPOSTA SIMPLIFICADAS
export interface TasksResponse {
    tasks: Task[];
}

export interface UsersResponse {
    users?: Array<{
        id: string;
        name: string;
        email: string;
        role: 'MANAGER' | 'EMPLOYEE';
        _count: { assignedTasks: number };
    }>;
    employees?: Array<{
        id: string;
        name: string;
        email: string;
        role: 'MANAGER' | 'EMPLOYEE';
        _count: { assignedTasks: number };
    }>;
    managers?: Array<{
        id: string;
        name: string;
        email: string;
        role: 'MANAGER';
        _count: { assignedTasks: number };
    }>;
    stats?: {
        totalUsers: number;
        totalManagers: number;
        totalEmployees: number;
    };
}

// ✅ OUTRAS INTERFACES NECESSÁRIAS
export interface Notification {
    id: string;
    type: 'TASK_ASSIGNED' | 'TASK_UPDATED' | 'TASK_COMPLETED' | 'TASK_OVERDUE';
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
    userId: string;
    taskId?: string;
    task?: {
        id: string;
        title: string;
    } | null;
}

export interface TaskFilter {
    status?: string;
    priority?: string;
    search?: string;
    assignedToId?: string;
    dueDate?: string;
    overdue?: boolean;
    dueDateMonth?: number;
    dueDateYear?: number;
}

export interface CreateTaskForm {
    title: string;
    description?: string;
    assignedToId: string;
    dueDate?: string;
    targetDate?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export interface Comment {
    id: string;
    message: string;
    createdAt: string;
    updatedAt: string;
    taskId: string;
    authorId: string;
    author: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
}

export interface Attachment {
    id: string;
    fileName: string;
    originalName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    createdAt: string;
    taskId: string;
    uploadedById: string;
    uploadedBy: {
        id: string;
        name: string;
        email: string;
    };
}

// ✅ LABELS E CORES
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
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200'
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

// ✅ TIPOS PARA COMPONENTES
export interface TaskCardProps {
    task: Task;
    onClick?: () => void;
    onStatusChange?: (taskId: string, newStatus: Task['status']) => void;
    onEdit?: (taskId: string) => void;
    onViewDetails?: (task: Task) => void;
    onDelete?: (taskId: string) => void;
    onToggleSelect?: (taskId: string) => void;
    isSelected?: boolean;
    userRole: string;
    currentUserId?: string;
}

export interface TaskFiltersProps {
    onFiltersChange: (filters: TaskFilter) => void;
    userRole: string;
}

// ✅ ALIASES PARA COMPATIBILIDADE (se necessário)
export type EmployeeDetailsResponse = UserDetailsResponse;
export type UserDetailsApiResponse = UserDetailsResponse;
export type EmployeeDetailsStats = UserDetailsResponse['stats'];