# 🎯 Task Manager

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

**Sistema completo de gerenciamento de tarefas com autenticação, notificações em tempo real e dashboard analítico**

[✨ Demonstração](#-demonstração) • [🚀 Começando](#-começando) • [📖 Documentação](#-documentação) • [🤝 Contribuindo](#-contribuindo)

</div>

---

## 📋 Sobre o Projeto

Task Manager é uma aplicação fullstack robusta e moderna para gerenciamento de tarefas em equipes, com hierarquia de usuários (Gerentes e Funcionários), sistema de notificações por email, dashboard analítico e interface intuitiva.

### ✨ Principais Características

- 🔐 **Autenticação Completa**: Registro, login, verificação de email e recuperação de senha
- 📊 **Dashboard Analítico**: Gráficos e estatísticas em tempo real
- 🎯 **Gestão de Tarefas**: CRUD completo com permissões por role
- 🔔 **Sistema de Notificações**: In-app e por email (SMTP)
- 📎 **Anexos e Comentários**: Upload de arquivos e sistema de comentários
- 📅 **Calendário**: Visualização de tarefas por data
- 👥 **Gestão de Equipe**: Visualização detalhada de usuários e suas tarefas
- 🔒 **Segurança Robusta**: Rate limiting, CORS, Helmet, JWT
- 📧 **Emails Automatizados**: Templates HTML para todas as notificações
- ⏰ **Agendador de Tarefas**: Avisos automáticos 1 dia antes do vencimento

---

## 🏗️ Arquitetura

### Stack Tecnológica

#### Backend
- **Runtime**: Node.js 24+ com TypeScript
- **Framework**: Express.js 5
- **ORM**: Prisma (PostgreSQL)
- **Autenticação**: JWT + bcryptjs
- **Email**: Nodemailer com templates HTML
- **Agendamento**: node-cron
- **Segurança**: Helmet, CORS, express-rate-limit, express-slow-down
- **Upload**: Multer + fs-extra
- **Validação**: Joi + express-validator

#### Frontend
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Roteamento**: React Router DOM v7
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **Styling**: TailwindCSS 3
- **Notificações**: Sonner
- **Ícones**: Lucide React
- **HTTP Client**: Axios

---

## 🚀 Começando

### Pré-requisitos

- Node.js 20+ e npm/yarn
- PostgreSQL 14+
- Conta SMTP para envio de emails (Gmail, SendGrid, etc.)

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/lucasolivco/task-manager.git
cd task-manager
```

2. **Configure o Backend**
```bash
cd backend
npm install
```

3. **Configure as variáveis de ambiente**

Crie um arquivo `.env` na pasta `backend`:

```env
# Database
DATABASE_URL="postgresql://usuario:senha@localhost:5432/task_manager"

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=sua_chave_secreta_super_segura_aqui

# SMTP (Email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-aplicativo
SMTP_FROM="Task Manager <seu-email@gmail.com>"
```

4. **Configure o banco de dados**
```bash
npx prisma migrate dev
npx prisma generate
```

5. **Configure o Frontend**
```bash
cd ../frontend
npm install
```

Crie um arquivo `.env` na pasta `frontend`:

```env
VITE_API_URL=http://localhost:3001
```

6. **Inicie os servidores**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

Acesse: http://localhost:5173

---

## 📖 Documentação

### Estrutura de Pastas

```
task-manager/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Schema do banco de dados
│   │   └── migrations/            # Migrações do Prisma
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts        # Configuração do Prisma
│   │   ├── controllers/           # Lógica de negócio
│   │   │   ├── authController.ts
│   │   │   ├── taskController.ts
│   │   │   ├── commentController.ts
│   │   │   ├── attachmentController.ts
│   │   │   └── notificationController.ts
│   │   ├── middleware/            # Middlewares
│   │   │   ├── auth.ts
│   │   │   └── upload.ts
│   │   ├── routes/                # Rotas da API
│   │   │   ├── authRoutes.ts
│   │   │   ├── taskRoutes.ts
│   │   │   └── notificationRoutes.ts
│   │   ├── services/              # Serviços externos
│   │   │   ├── emailService.ts
│   │   │   └── notificationService.ts
│   │   ├── utils/                 # Utilitários
│   │   │   └── auth.ts
│   │   └── server.ts              # Servidor principal
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/            # Componentes reutilizáveis
    │   │   ├── ui/                # Componentes UI base
    │   │   ├── tasks/             # Componentes de tarefas
    │   │   └── employees/         # Componentes de usuários
    │   ├── contexts/              # Contextos React
    │   │   └── AuthContext.tsx
    │   ├── layouts/               # Layouts
    │   │   └── DashboardLayout.tsx
    │   ├── pages/                 # Páginas
    │   │   ├── Login.tsx
    │   │   ├── Register.tsx
    │   │   ├── Dashboard.tsx
    │   │   ├── Tasks.tsx
    │   │   ├── CreateTask.tsx
    │   │   ├── EditTask.tsx
    │   │   ├── Calendar.tsx
    │   │   ├── Employees.tsx
    │   │   └── Notifications.tsx
    │   ├── services/              # Serviços de API
    │   │   ├── api.ts
    │   │   ├── authService.ts
    │   │   ├── taskService.ts
    │   │   └── notificationService.ts
    │   ├── types/                 # Definições de tipos
    │   │   └── index.ts
    │   ├── App.tsx                # Componente raiz
    │   └── main.tsx               # Entry point
    └── package.json
```

### Modelo de Dados

#### User (Usuário)
```typescript
{
  id: string
  name: string
  email: string
  password: string (hash)
  role: 'MANAGER' | 'EMPLOYEE'
  emailVerified: boolean
  emailVerificationToken?: string
  passwordResetToken?: string
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### Task (Tarefa)
```typescript
{
  id: string
  title: string
  description?: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate?: DateTime
  targetDate?: DateTime
  createdById: string
  assignedToId: string
  createdAt: DateTime
  updatedAt: DateTime
}
```

### API Endpoints

#### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Obter usuário atual
- `GET /api/auth/verify-email?token=` - Verificar email
- `POST /api/auth/resend-verification` - Reenviar email de verificação
- `POST /api/auth/forgot-password` - Solicitar reset de senha
- `POST /api/auth/reset-password` - Redefinir senha

#### Tarefas
- `GET /api/tasks` - Listar tarefas (com filtros)
- `GET /api/tasks/:id` - Obter tarefa específica
- `POST /api/tasks` - Criar tarefa (MANAGER)
- `PUT /api/tasks/:id` - Editar tarefa (MANAGER - apenas criador)
- `PATCH /api/tasks/:id/status` - Atualizar status (responsável)
- `DELETE /api/tasks/:id` - Excluir tarefa (MANAGER - apenas criador)
- `POST /api/tasks/bulk-delete` - Excluir múltiplas tarefas (MANAGER)

#### Anexos
- `POST /api/tasks/:id/attachments` - Upload de anexos
- `DELETE /api/tasks/:taskId/attachments/:id` - Remover anexo

#### Comentários
- `GET /api/tasks/:id/comments` - Listar comentários
- `POST /api/tasks/:id/comments` - Adicionar comentário
- `DELETE /api/tasks/:taskId/comments/:id` - Remover comentário

#### Notificações
- `GET /api/notifications` - Listar notificações
- `PATCH /api/notifications/:id/read` - Marcar como lida
- `PATCH /api/notifications/mark-all-read` - Marcar todas como lidas
- `DELETE /api/notifications/:id` - Excluir notificação

#### Usuários (MANAGER)
- `GET /api/tasks/employees` - Listar usuários
- `GET /api/tasks/employees/:id` - Detalhes de usuário

---

## 🎨 Funcionalidades por Role

### 👔 Gerente (MANAGER)

- ✅ Criar tarefas e atribuir para qualquer usuário (managers ou employees)
- ✅ Editar tarefas que criou
- ✅ Excluir tarefas (individual ou em lote)
- ✅ Ver todas as tarefas que criou
- ✅ Ver tarefas atribuídas a ele por outros managers
- ✅ Visualizar lista completa de usuários com estatísticas
- ✅ Acessar dashboard com visão geral da equipe
- ✅ Receber notificações de conclusão e atualizações

### 👨‍💼 Funcionário (EMPLOYEE)

- ✅ Ver apenas tarefas atribuídas a ele
- ✅ Atualizar status das tarefas (Pendente → Em Progresso → Concluída)
- ✅ Adicionar comentários nas tarefas
- ✅ Fazer upload de anexos
- ✅ Visualizar dashboard pessoal
- ✅ Receber notificações de novas tarefas e atualizações

---

## 🔒 Segurança

### Medidas Implementadas

- ✅ **Autenticação JWT**: Tokens seguros com expiração
- ✅ **Hash de Senhas**: bcryptjs com salt
- ✅ **Helmet**: Proteção de headers HTTP
- ✅ **CORS**: Configuração restritiva por ambiente
- ✅ **Rate Limiting**:
  - Login/Registro: 30 requisições/15min
  - Geral: 100 requisições/15min
  - Upload: 10 requisições/min
- ✅ **Request Throttling**: Slow down progressivo para requisições excessivas
- ✅ **Validação de Inputs**: Joi + express-validator
- ✅ **Sanitização**: Proteção contra XSS e SQL Injection
- ✅ **Upload Seguro**: Validação de MIME types e tamanho
- ✅ **Verificação de Email**: Obrigatória para ativação de conta
- ✅ **Tokens de Reset**: Expirações e uso único

---

## 📧 Sistema de Notificações

### Tipos de Notificações

| Tipo | Descrição | Email | In-App |
|------|-----------|-------|--------|
| `TASK_ASSIGNED` | Nova tarefa atribuída | ✅ | ✅ |
| `TASK_REASSIGNED` | Tarefa reatribuída | ✅ | ✅ |
| `TASK_UPDATED` | Tarefa modificada | ✅ | ✅ |
| `TASK_COMPLETED` | Tarefa concluída | ✅ | ✅ |
| `TASK_CANCELLED` | Tarefa cancelada | ✅ | ✅ |
| `TASK_OVERDUE` | Tarefa vencendo (1 dia antes) | ✅ | ✅ |
| `COMMENT_ADDED` | Novo comentário | ✅ | ✅ |
| `ATTACHMENT_ADDED` | Novo anexo | ✅ | ✅ |

### Agendador (Cron)

- Execução diária às **09:00 (horário de Brasília)**
- Verifica tarefas que vencem nas próximas 24 horas
- Envia avisos automáticos para responsáveis
- Evita notificações duplicadas

---

## 🎯 Filtros e Buscas

### Filtros Disponíveis

- **Status**: PENDING, IN_PROGRESS, COMPLETED, CANCELLED
- **Prioridade**: LOW, MEDIUM, HIGH, URGENT
- **Responsável**: Filtrar por usuário específico (managers)
- **Data de Vencimento**: Dia, mês ou ano específico
- **Palavra-chave**: Busca em título e descrição
- **Tarefas Atrasadas**: Apenas tarefas vencidas não concluídas
- **Tarefas Urgentes**: Apenas prioridade URGENT

---

## 🛠️ Scripts Disponíveis

### Backend

```bash
npm run dev          # Inicia servidor em modo desenvolvimento
npm run build        # Compila TypeScript para JavaScript
npm start            # Inicia servidor em modo produção
npm run db:migrate   # Executa migrações do banco
npm run db:generate  # Gera Prisma Client
npm run db:reset     # Reseta banco de dados
npm run db:studio    # Abre Prisma Studio (GUI)
```

### Frontend

```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build de produção
npm run lint         # Verifica erros de linting
```

---

## 🚢 Deploy

### Preparação para Produção

1. **Backend**:
   - Configure variáveis de ambiente de produção
   - Configure banco PostgreSQL em produção (Railway, Supabase, etc.)
   - Configure serviço SMTP profissional (SendGrid, AWS SES, etc.)
   - Ajuste CORS para domínio de produção
   - Execute migrations: `npx prisma migrate deploy`

2. **Frontend**:
   - Configure `VITE_API_URL` para URL do backend em produção
   - Execute build: `npm run build`
   - Deploy pasta `dist` (Vercel, Netlify, etc.)

### Sugestões de Hospedagem

- **Backend**: Railway, Render, Heroku, AWS, DigitalOcean
- **Frontend**: Vercel, Netlify, Cloudflare Pages
- **Banco de Dados**: Railway, Supabase, Neon, AWS RDS
- **Email**: SendGrid, AWS SES, Mailgun, Resend

---

## 🧪 Testando a Aplicação

### Usuário de Teste

Após iniciar a aplicação, registre usuários de teste:

1. **Gerente**:
   - Email: manager@example.com
   - Role: MANAGER

2. **Funcionário**:
   - Email: employee@example.com
   - Role: EMPLOYEE

### Fluxo de Teste Completo

1. ✅ Registre um usuário gerente
2. ✅ Verifique o email (confira console do backend ou use Ethereal/Mailtrap)
3. ✅ Faça login com o gerente
4. ✅ Registre um usuário funcionário
5. ✅ Verifique o email do funcionário
6. ✅ Crie tarefas como gerente e atribua ao funcionário
7. ✅ Faça login como funcionário
8. ✅ Atualize status das tarefas
9. ✅ Adicione comentários e anexos
10. ✅ Verifique notificações em ambos os usuários

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Siga os passos:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/NovaFeature`)
5. Abra um Pull Request

### Padrões de Código

- Use TypeScript strict mode
- Siga convenções ESLint/Prettier
- Adicione comentários em lógicas complexas
- Mantenha componentes pequenos e reutilizáveis
- Escreva mensagens de commit descritivas

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Autor

**Seu Nome**

- GitHub: [@lucasolivco](https://github.com/lucasolivco)
- LinkedIn: [linkedin.com/in/lucas-costa-5479a4120](linkedin.com/in/lucas-costa-5479a4120)
- Email: lukazcosta03@gmail.com

---

## 🙏 Agradecimentos

- [React](https://react.dev/)
- [Node.js](https://nodejs.org/)
- [Prisma](https://www.prisma.io/)
- [TailwindCSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- Toda a comunidade open source

---

<div align="center">

**⭐ Se este projeto foi útil, considere dar uma estrela!**

Feito com ❤️ e ☕

</div>
