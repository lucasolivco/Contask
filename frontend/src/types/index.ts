// Definições de tipos - como "receitas" que dizem como os dados devem ser
export interface User {
    id: string; // Identificador único do usuário
    name: string; // Nome do usuário
    email: string; // Email do usuário
    role: 'MANAGER' | 'EMPLOYEE'; // Papel do usuário (pode ser 'user' ou 'admin')
    createdAt: string; // Data de criação do usuário
}

export interface Task {
    id: string; // Identificador único da tarefa
    title: string; // Título da tarefa
    description: string; // Descrição da tarefa
    status?: 'PENDENTE' | 'EM_PROGRESSO' | 'COMPLETADO' | 'CANCELADO';
    priority?: 'BAIXA' | 'MÉDIA' | 'ALTA' | 'URGENTE';
    dueDate?: string; // Data de vencimento da tarefa (opcional)
    createdAt: string; // Data de criação da tarefa
    updatedAt: string; // Data da última atualização da tarefa

    // Relacionamentos
    createdBy: {
        id: string; // ID do usuário que criou a tarefa
        name: string; // Nome do usuário que criou a tarefa
        email: string; // Email do usuário que criou a tarefa
    }
    assignedTo: {
        id: string; // ID do usuário a quem a tarefa está atribuída
        name: string; // Nome do usuário a quem a tarefa está atribuída
        email: string; // Email do usuário a quem a tarefa está atribuída
    }

    attachments?: Attachment[]; // Lista de anexos da tarefa (opcional)
    _count?: {
        attachments: number; // Contagem de anexos na tarefa
    }
}

export interface Attachment {
    id: string; // Identificador único do anexo
    filename: string; // Nome do arquivo anexado
    originalName: string; // Nome original do arquivo
    mimeType: string; // Tipo MIME do arquivo
    size: number; // Tamanho do arquivo em bytes
    path: string; // Caminho do arquivo no servidor
    createdAt: string; // Data de criação do anexo
}

export interface Notification {
    id: string;
    type: 'TASK_ASSIGNED' | 'TASK_UPDATED' | 'TASK_COMPLETED' | 'TASK_OVERDUE';
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
    taskId?: string; // CORRIGIDO: era objeto complexo
    task?: {
        id: string;
        title: string;
    }
}

// Tipos para formulários
export interface LoginForm {
    email: string; // Email do usuário
    password: string; // Senha do usuário
}

export interface RegisterForm {
    name: string; // Nome do usuário
    email: string; // Email do usuário
    password: string; // Senha do usuário
    role: 'MANAGER' | 'EMPLOYEE'; // Papel do usuário (pode ser 'user' ou 'admin')
}

export interface CreateTaskForm {
    title: string;
    description?: string;
    assignedToId: string; // ID do usuário a quem a tarefa será atribuída
    dueDate?: string;
    priority: 'BAIXA' | 'MÉDIA' | 'ALTA' | 'URGENTE'; // Prioridade da tarefa
}

// Tipos para filtros - MELHORADOS
export interface TaskFilter {
    status?: 'PENDENTE' | 'EM_PROGRESSO' | 'COMPLETADO' | 'CANCELADO';
    priority?: 'BAIXA' | 'MÉDIA' | 'ALTA' | 'URGENTE';
    search?: string;
    assignedToId?: string;
    dueDate?: string;
    overdue?: boolean; // ADICIONADO
}

// Tipos para API responses
export interface ApiResponse<T> {
    message?: string; // Mensagem de resposta da API
    data?: T
    error?: string
}

export interface LoginResponse {
  message: string
  user: User
  token: string
}

export interface TaskResponse {
  tasks: Task[]
}

export interface EmployeesResponse {
  employees: Array<{
    id: string
    name: string
    email: string
    _count: {
      assignedTasks: number
    }
  }>
}