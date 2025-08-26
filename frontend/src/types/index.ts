// types/index.ts - ATUALIZADO COM VERIFICAÇÃO POR EMAIL
export interface User {
    id: string;
    name: string;
    email: string;
    role: 'MANAGER' | 'EMPLOYEE';
    emailVerified?: boolean; // ✅ NOVO CAMPO
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
}

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

// ✅ TIPOS DE FORMULÁRIOS ATUALIZADOS
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

// ✅ NOVOS TIPOS PARA VERIFICAÇÃO DE EMAIL
export interface ResendEmailRequest {
    email: string;
}

export interface CreateTaskForm {
    title: string;
    description?: string;
    assignedToId: string;
    dueDate?: string;
    targetDate?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export interface TaskFilter {
    status?: string;
    priority?: string;
    search?: string
    assignedToId?: string
    dueDate?: string
    overdue?: boolean
    dueDateMonth?: number
    dueDateYear?: number
}

// ✅ TIPOS DE API RESPONSES ATUALIZADOS
export interface ApiResponse<T> {
    message?: string;
    data?: T;
    error?: string;
}

// ✅ RESPONSE DE LOGIN ATUALIZADA
export interface LoginResponse {
    message: string;
    user: User;
    token: string;
    emailNotVerified?: boolean; // Para tratamento de erro
}

// ✅ RESPONSE DE REGISTRO ATUALIZADA
export interface RegisterResponse {
    message: string;
    user: User;
    token?: string; // Opcional porque pode não ser gerado se precisar verificar email
    emailSent: boolean;
    requiresEmailVerification: boolean;
}

// ✅ NOVOS TIPOS PARA VERIFICAÇÃO DE EMAIL
export interface VerifyEmailResponse {
    message: string;
    user: User;
}

export interface ResendEmailResponse {
    message: string;
}

// ✅ TIPO PARA ERROS DE API COM CAMPOS ESPECÍFICOS
export interface ApiError {
    error: string;
    emailNotVerified?: boolean;
    tokenExpired?: boolean;
    requiresEmailVerification?: boolean;
}

// Tipos de responses existentes
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
    unreadCount: number;
}

export interface MarkNotificationResponse {
    message: string;
    notification: Notification;
}

export interface DeleteNotificationResponse {
    message: string;
}

export interface UnreadCountResponse {
    unreadCount: number;
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

export type StatusChangeCallback = (taskId: string, newStatus: Task['status']) => void

export interface Comment {
  id: string
  message: string
  createdAt: string
  updatedAt: string
  taskId: string
  authorId: string
  author: {
    id: string
    name: string
    email: string
    role: string
  }
}

export interface Attachment {
  id: string
  fileName: string
  originalName: string
  filePath: string
  fileSize: number
  mimeType: string
  createdAt: string
  taskId: string
  uploadedById: string
  uploadedBy: {
    id: string
    name: string
    email: string
  }
}

export interface Employee {
  id: string
  name: string
  email: string
  role: 'EMPLOYEE' | 'MANAGER'
  createdAt?: string
  emailVerified?: boolean // ✅ NOVO CAMPO
  totalTasks?: number
  pendingTasks?: number
  inProgressTasks?: number
  completedTasks?: number
  overdueTasks?: number
  completionRate?: number
  _count?: {
    assignedTasks: number
  }
}

export interface EmployeeDetailsStats {
  totalTasks: number
  pendingTasks: number
  inProgressTasks: number
  completedTasks: number
  cancelledTasks?: number
  overdueTasks: number
  completionRate: number
  priorityBreakdown?: {
    urgent: number
    high: number
    medium: number
    low: number
  }
  recentTasks?: number
  avgTasksPerMonth?: number
}

export interface EmployeeDetailsResponse {
  employee: {
    id: string
    name: string
    email: string
    role: string
    emailVerified?: boolean // ✅ NOVO CAMPO
    createdAt: string
  }
  tasks: Task[]
  stats: EmployeeDetailsStats
}

// ✅ NOVOS TIPOS PARA COMPONENTES DE VERIFICAÇÃO
export interface EmailVerificationProps {
  email?: string;
  onResendEmail?: () => void;
  isResending?: boolean;
}

export interface VerifyEmailPageProps {
  token: string;
}

// ✅ TIPOS PARA ESTADOS DE VERIFICAÇÃO
export type EmailVerificationStatus = 'loading' | 'success' | 'error' | 'expired';

export interface EmailVerificationState {
  status: EmailVerificationStatus;
  message?: string;
  userEmail?: string;
}

// ✅ UTILITÁRIOS PARA VALIDAÇÃO DE EMAIL
export const EmailValidation = {
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  maskEmail: (email: string): string => {
    const [local, domain] = email.split('@');
    if (local.length <= 2) return email;
    
    const maskedLocal = local[0] + '*'.repeat(local.length - 2) + local[local.length - 1];
    return `${maskedLocal}@${domain}`;
  }
} as const;

// ✅ CONSTANTES PARA MENSAGENS DE VERIFICAÇÃO
export const EmailVerificationMessages = {
  VERIFICATION_SENT: 'Email de verificação enviado com sucesso!',
  VERIFICATION_SUCCESS: 'Email verificado com sucesso!',
  VERIFICATION_ERROR: 'Erro ao verificar email',
  TOKEN_EXPIRED: 'Link de verificação expirado',
  TOKEN_INVALID: 'Link de verificação inválido',
  RESEND_SUCCESS: 'Email reenviado com sucesso!',
  RESEND_ERROR: 'Erro ao reenviar email',
  EMAIL_NOT_VERIFIED: 'Email não verificado. Verifique sua caixa de entrada.',
  CHECK_SPAM: 'Verifique também sua pasta de spam/lixo eletrônico.'
} as const;

// ✅ HELPER PARA FORMATAÇÃO DE TEMPO
export const TimeHelpers = {
  getRelativeTime: (date: string): string => {
    const now = new Date();
    const targetDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - targetDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'agora';
    if (diffInMinutes < 60) return `${diffInMinutes} min atrás`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d atrás`;
    
    return targetDate.toLocaleDateString('pt-BR');
  }
} as const;

// ✅ NOVOS TIPOS PARA RECUPERAÇÃO DE SENHA
export interface RequestPasswordResetForm {
  email: string;
}

export interface ResetPasswordForm {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface RequestPasswordResetResponse {
  message: string;
}

export interface ResetPasswordResponse {
  message: string;
  user: User;
}

export interface VerifyResetTokenResponse {
  message: string;
  email: string;
}

// ✅ ATUALIZAR API ERROR PARA INCLUIR DETALHES DE VALIDAÇÃO
export interface ApiError {
  error: string;
  details?: string[]; // Para erros de validação de senha
  emailNotVerified?: boolean;
  tokenExpired?: boolean;
  requiresEmailVerification?: boolean;
}

// ✅ CONSTANTES PARA VALIDAÇÃO DE SENHA
export const PasswordValidationMessages = {
  MIN_LENGTH: 'Senha deve ter pelo menos 8 caracteres',
  UPPERCASE: 'Senha deve conter pelo menos uma letra maiúscula',
  LOWERCASE: 'Senha deve conter pelo menos uma letra minúscula',
  NUMBER: 'Senha deve conter pelo menos um número',
  SPECIAL_CHAR: 'Senha deve conter pelo menos um caractere especial (!@#$%^&*)',
  DIFFERENT: 'A nova senha deve ser diferente da senha atual'
} as const;

// ✅ HELPER PARA VALIDAÇÃO DE SENHA NO FRONTEND
export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push(PasswordValidationMessages.MIN_LENGTH);
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push(PasswordValidationMessages.UPPERCASE);
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push(PasswordValidationMessages.LOWERCASE);
  }
  
  if (!/\d/.test(password)) {
    errors.push(PasswordValidationMessages.NUMBER);
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push(PasswordValidationMessages.SPECIAL_CHAR);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};