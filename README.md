# 🎯 Task Manager

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

**Sistema completo de gerenciamento de tarefas com autenticação, notificações em tempo real e dashboard analítico**

[✨ Características](#-principais-características) • [🐳 Docker](#-instalação-com-docker) • [🚀 Instalação Local](#-instalação-local-sem-docker) • [📖 Documentação](#-documentação) • [🤝 Contribuindo](#-contribuindo)

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

#### Instalação Local
- Node.js 20+ e npm/yarn
- PostgreSQL 14+
- Conta SMTP para envio de emails (Gmail, SendGrid, etc.)

#### Instalação com Docker (Recomendado)
- Docker 20.10+
- Docker Compose 2.0+

---

## 🐳 Instalação com Docker

### Quick Start (5 minutos)

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/task-manager.git
cd task-manager

# 2. Configure o ambiente
cp .env.example .env
# Edite o .env e configure: SMTP_USER, SMTP_PASS, JWT_SECRET

# 3. Inicie com Docker
docker-compose up -d

# 4. Execute as migrações
docker-compose exec backend npx prisma migrate dev

# 5. Acesse a aplicação
# Frontend: http://localhost:5173
# Backend: http://localhost:3001/api/health
```

### Desenvolvimento (Detalhado)

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/task-manager.git
cd task-manager
```

2. **Configure as variáveis de ambiente**

Crie um arquivo `.env` na **raiz do projeto**:

```env
# Database Configuration
DB_USER=postgres
DB_PASSWORD=postgres123
DB_NAME=task_manager_dev
DB_PORT=5432
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:${DB_PORT}/${DB_NAME}?schema=public

# Redis
REDIS_PASSWORD=redis123

# Backend Configuration
BACKEND_PORT=3001
NODE_ENV=development
JWT_SECRET=sua_chave_secreta_super_segura_aqui

# Frontend Configuration
FRONTEND_PORT=5173
VITE_API_URL=http://localhost:3001

# SMTP (Email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-aplicativo
SMTP_FROM="Task Manager <seu-email@gmail.com>"

# URLs
FRONTEND_URL=http://localhost:5173
```

3. **Inicie os containers**
```bash
docker-compose up -d
```

Isso irá iniciar:
- ✅ Backend (Node.js) na porta 3001
- ✅ Frontend (React + Vite) na porta 5173
- ✅ PostgreSQL na porta 5432
- ✅ Redis na porta 6379

4. **Execute as migrações do banco**
```bash
docker-compose exec backend npx prisma migrate dev
docker-compose exec backend npx prisma generate
```

5. **Acesse a aplicação**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/api/health

### Comandos Úteis (Docker)

```bash
# Ver logs dos containers
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f backend
docker-compose logs -f frontend

# Parar os containers
docker-compose down

# Parar e remover volumes (CUIDADO: apaga dados do banco)
docker-compose down -v

# Reconstruir as imagens
docker-compose build

# Reconstruir e iniciar
docker-compose up -d --build

# Executar comandos no backend
docker-compose exec backend npm run db:studio
docker-compose exec backend npx prisma migrate reset

# Acessar o shell do container
docker-compose exec backend sh
docker-compose exec postgres psql -U postgres -d task_manager_dev
```

### Produção com Docker

1. **Configure as variáveis de produção**

Crie o arquivo `env/.env.production`:

```env
# Database
DB_USER=postgres
DB_PASSWORD=senha_super_segura_aqui
DB_NAME=task_manager_prod
DB_PORT=5432
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:${DB_PORT}/${DB_NAME}?schema=public

# Redis
REDIS_PASSWORD=redis_senha_super_segura

# Backend
NODE_ENV=production
JWT_SECRET=sua_chave_jwt_super_segura_de_producao
PORT=3001

# URLs
FRONTEND_URL=https://seu-dominio.com
VITE_API_URL=https://api.seu-dominio.com

# SMTP
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=sua-api-key-sendgrid
SMTP_FROM="Task Manager <noreply@seu-dominio.com>"
```

2. **Inicie em produção**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

3. **Execute as migrações**
```bash
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### Estrutura Docker

```
task-manager/
├── docker-compose.yml              # Configuração de desenvolvimento
├── docker-compose.prod.yml         # Configuração de produção
├── backend/
│   ├── Dockerfile                  # Imagem de desenvolvimento
│   ├── Dockerfile.prod             # Imagem de produção
│   └── .dockerignore
├── frontend/
│   ├── Dockerfile                  # Imagem de desenvolvimento
│   └── Dockerfile.prod             # Imagem de produção
└── docker/
    ├── nginx/                      # Configuração do Nginx (produção)
    └── monitoring/                 # Prometheus + Grafana (opcional)
```

### Troubleshooting Docker

#### Problema: Porta já em uso
```bash
# Verificar processos usando portas
# Windows
netstat -ano | findstr :5173
netstat -ano | findstr :3001

# Linux/Mac
lsof -i :5173
lsof -i :3001

# Solução: Alterar portas no arquivo .env
FRONTEND_PORT=5174
BACKEND_PORT=3002
```

#### Problema: Migrações do Prisma não funcionam
```bash
# Limpar e recriar banco
docker-compose down -v
docker-compose up -d postgres
docker-compose exec backend npx prisma migrate reset --force
docker-compose exec backend npx prisma migrate dev
```

#### Problema: Hot-reload não funciona
```bash
# Windows: Adicione polling no docker-compose.yml
# No serviço frontend, adicione:
environment:
  - CHOKIDAR_USEPOLLING=true
```

#### Problema: Erro de permissão no volume
```bash
# Linux/Mac: Ajustar permissões
sudo chown -R $USER:$USER ./backend/node_modules
sudo chown -R $USER:$USER ./frontend/node_modules
```

### Dicas Importantes (Docker)

- 🔥 **Hot Reload**: Código é montado via volumes, alterações refletem automaticamente
- 💾 **Dados Persistentes**: Volumes separados para dev e produção
- 🔒 **Segurança**: Redis protegido por senha, PostgreSQL isolado na rede interna
- 📊 **Monitoramento**: Acesse Prisma Studio com `docker-compose exec backend npm run db:studio`
- 🧪 **Testes**: Execute testes dentro do container com `docker-compose exec backend npm test`

---

## 📦 Instalação Local (Sem Docker)

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/task-manager.git
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

- GitHub: [@seu-usuario](https://github.com/seu-usuario)
- LinkedIn: [Seu Nome](https://linkedin.com/in/seu-perfil)
- Email: seu-email@example.com

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
