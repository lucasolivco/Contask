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
    tittle: string; // Título da tarefa
    description: string; // Descrição da tarefa
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'; // Status da tarefa
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'; // Prioridade da tarefa
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

    attachments?: attachment[]; // Lista de anexos da tarefa (opcional)
    _count?: {
        attachments: number; // Contagem de anexos na tarefa
    }
}

export interface attachment {
    id: string; // Identificador único do anexo
    filename: string; // Nome do arquivo anexado
    originalName: string; // Nome original do arquivo
    mimetype: string; // Tipo MIME do arquivo
    size: number; // Tamanho do arquivo em bytes
    path: string; // Caminho do arquivo no servidor
    createdAt: string; // Data de criação do anexo
}

export interface Notification {
    id: string; // Identificador único da notificação
    type: 'TASK_ASSIGNED' | 'TASK_UPDATED' | 'TASK_COMPLETED' | 'TASK_OVERDUE'; // Tipo da notificação
    title: string; // Título da notificação
    message: string; // Mensagem da notificação
    read: boolean; // Indica se a notificação foi lida
    createdAt: string; // Data de criação da notificação
    taskId?:  {
        id: string;
        title: string // Título da tarefa associada (opcional)
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
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'; // Prioridade da tarefa
}

// Tipos para filtros
export interface TaskFilter {
    status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'; // Filtro por status da tarefa
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'; // Filtro por prioridade da tarefa
    search?: string; // Filtro por texto no título ou descrição
    assignedToId?: string; // Filtro por ID do usuário a quem a tarefa está atribuída
    dueDate?: string; // Filtro por data de vencimento
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
  task: Task[]
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