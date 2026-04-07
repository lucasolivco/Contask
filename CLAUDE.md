# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Regra importante:** Sempre que houver alterações significativas no projeto (nova feature, mudança de arquitetura, novo comando, etc.), este arquivo deve ser atualizado para refletir o estado atual.

## Visão Geral do Projeto

**Contask** é um sistema fullstack de gerenciamento de tarefas para equipes, com controle de acesso baseado em papéis (MANAGER/EMPLOYEE), notificações por email, dashboard analítico e integração SSO com um Hub externo.

- **Repositório:** https://github.com/lucasolivco/Contask
- **Licença:** MIT

## Stack Tecnológica

| Camada | Tecnologias |
|--------|-------------|
| **Frontend** | React 19, Vite 7, TypeScript 5.8, TailwindCSS 3.4, TanStack Query 5, React Hook Form + Zod, Axios, React Router 7 |
| **Backend** | Express 5, TypeScript 5.8, Prisma 6.13, Node.js 20 |
| **Banco de Dados** | PostgreSQL 15, Redis 7 |
| **Infraestrutura** | Docker, Nginx (reverse proxy), Certbot (SSL), Prometheus + Grafana |

## Comandos de Desenvolvimento

### Backend (`cd backend`)

```bash
npm run dev          # Inicia com nodemon (hot-reload)
npm run build        # Compila TypeScript para ./dist
npm start            # Executa servidor de produção (node dist/server.ts)
npm run db:migrate   # Executa migrações Prisma (npx prisma migrate dev)
npm run db:generate  # Gera o Prisma Client
npm run db:reset     # Reseta o banco (CUIDADO: apaga todos os dados)
npm run db:studio    # Abre o Prisma Studio (GUI do banco)
```

### Frontend (`cd frontend`)

```bash
npm run dev          # Inicia Vite dev server (porta 5173)
npm run build        # Build de produção para ./dist
npm run lint         # Executa ESLint
npm run preview      # Preview do build de produção
```

### Docker Compose

```bash
# Desenvolvimento (backend + frontend + PostgreSQL + Redis)
docker compose up -d

# Produção (inclui Nginx, Certbot, monitoramento)
docker compose -f docker-compose.prod.yml up -d

# Monitoramento (Grafana + Prometheus)
docker compose -f docker/monitoring/docker-compose.monitoring.yml up -d
```

### Prisma CLI (dentro de `backend/`)

```bash
npx prisma migrate dev --name nome_da_migracao   # Cria nova migração
npx prisma migrate deploy                         # Aplica migrações em produção
npx prisma db push                                # Sincroniza schema sem migração
npx prisma studio                                 # Interface visual do banco
```

## Arquitetura do Projeto

```
task-organizer/
├── backend/                # API REST (Express + TypeScript)
│   ├── src/
│   │   ├── server.ts       # Entry point — inicializa Express, middleware, rotas
│   │   ├── config/         # database.ts — instância Prisma com middleware de logging
│   │   ├── controllers/    # Lógica de negócio (auth, task, comment, attachment, notification)
│   │   ├── routes/         # Definição de endpoints (authRoutes, taskRoutes, notificationRoutes)
│   │   ├── middleware/     # auth.ts (JWT + role check), upload.ts (Multer)
│   │   ├── services/       # emailService.ts (Nodemailer + templates HTML), notificationService.ts (cron + criação)
│   │   ├── utils/          # auth.ts (hash, JWT, validações)
│   │   └── types/          # Declarações de tipos customizados
│   └── prisma/
│       ├── schema.prisma   # Schema do banco (modelos, enums, relações)
│       └── migrations/     # Histórico de migrações
│
├── frontend/               # SPA React
│   ├── src/
│   │   ├── App.tsx         # Definição de rotas (ProtectedRoute, PublicRoute, SemiProtectedRoute)
│   │   ├── main.tsx        # Entry point React
│   │   ├── pages/          # Componentes de página (Dashboard, Tasks, Login, Calendar, etc.)
│   │   ├── components/     # UI (ui/), tasks/, employees/, forms/
│   │   ├── contexts/       # AuthContext.tsx — estado global de autenticação
│   │   ├── services/       # Clientes API (api.ts com interceptors Axios, authService, taskService, etc.)
│   │   ├── types/          # index.ts — interfaces TypeScript (User, Task, Notification, etc.)
│   │   └── layouts/        # DashboardLayout.tsx — sidebar + header + conteúdo
│   ├── tailwind.config.js  # Paleta customizada: primary (cyan), secondary (green), gradients
│   └── vite.config.ts      # Polling habilitado para Docker, host 0.0.0.0
│
├── docker/
│   ├── nginx/              # Configurações de reverse proxy (default.conf, subdomínios)
│   └── monitoring/         # Prometheus + Grafana
│
├── hub/                    # Portal estático (HTML/CSS/JS) integrado via SSO
├── env/                    # Arquivos .env por ambiente (local, production, staging)
├── scripts/                # Scripts de deploy, backup, monitoramento
└── uploads/                # Diretório de uploads organizados por data (yyyy-mm-dd)
```

### Padrão Arquitetural (Backend)

O backend segue **MVC com camada de Services**:

```
Requisição HTTP → Route → Controller → Service → Prisma (DB)
                           ↓
                     Middleware (auth, upload, rate-limit)
```

- **Routes** definem endpoints e aplicam middleware
- **Controllers** contêm a lógica de negócio e validações
- **Services** encapsulam operações transversais (email, notificações)
- **Middleware** trata autenticação JWT, upload de arquivos, rate-limiting

### Padrão Arquitetural (Frontend)

O frontend é uma **SPA com TanStack Query** para gerenciamento de estado server-side:

```
Page → useQuery/useMutation (TanStack Query) → Service (Axios) → API Backend
 ↓
Component Tree (props drilling ou contexto para auth)
```

- **AuthContext** gerencia estado de autenticação global (token, user, auto-refresh)
- **Services** (`services/*.ts`) encapsulam chamadas Axios com tipagem
- **api.ts** configura interceptors: injeção automática de token, tratamento de 401/429, retry com backoff

## Schema do Banco de Dados (Prisma)

### Modelos

| Modelo | Campos Principais | Relações |
|--------|-------------------|----------|
| **User** | name, email (unique), password, role (MANAGER/EMPLOYEE), emailVerified, ssoToken | → createdTasks, assignedTasks, comments, attachments, notifications |
| **Task** | title, description, status, priority, dueDate, targetDate, archivedAt | → createdBy (User), assignedTo (User), comments, attachments, notifications |
| **Comment** | message (Text) | → task (cascade delete), author (User) |
| **Attachment** | fileName, originalName, mimeType, fileSize, filePath | → task (cascade delete), uploadedBy (User, cascade delete) |
| **Notification** | type, title, message, read, metadata (Json) | → user, task (optional, cascade delete) |

### Enums

- **Role:** `MANAGER`, `EMPLOYEE`
- **TaskStatus:** `PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `ARCHIVED`
- **Priority:** `LOW`, `MEDIUM`, `HIGH`, `URGENT`
- **NotificationType:** `TASK_ASSIGNED`, `TASK_REASSIGNED`, `TASK_UPDATED`, `TASK_COMPLETED`, `TASK_CANCELLED`, `TASK_OVERDUE`, `COMMENT_ADDED`, `ATTACHMENT_ADDED`

## Endpoints da API

### Autenticação (`/api/auth`)
- `POST /register` — Registro com verificação de email (**requer `registrationCode`**)
- `POST /login` — Login padrão (JWT, 3 dias de expiração)
- `POST /hub-login` — Login via Hub (gera token SSO de 5 min + seta cookie `canellahub_session`)
- `POST /sso-login` — Login automático com token SSO (uso único)
- `GET /verify-email` — Verificação de email via token
- `POST /resend-verification` — Reenvio de email de verificação
- `GET /me` — Dados do usuário autenticado
- `POST /request-password-reset` — Solicita reset de senha (token expira em 2h)
- `POST /reset-password` — Reseta senha com token
- `GET /validate-session` — Valida cookie de sessão SSO (usado pelo Nginx `auth_request`)
- `POST /hub-logout` — Limpa cookie de sessão SSO
- `POST /find-username` — Envia nome de usuário por email (recuperação)

### Tarefas (`/api/tasks`)
- CRUD completo: `GET /`, `POST /`, `GET /:id`, `PUT /:id`, `DELETE /:id`
- `PATCH /:id/status` — Atualiza status (apenas assignee)
- `PATCH /:id/archive` / `PATCH /:id/unarchive` — Arquivar/desarquivar (manager)
- `POST /bulk-archive`, `DELETE /bulk` — Operações em lote
- `GET /stats/period` — Estatísticas por período
- `GET /my-tasks`, `GET /assigned-to-me` — Filtros por responsabilidade
- `GET /employees`, `GET /employees/:id` — Gestão de equipe (manager only)
- Subrotas: `/:taskId/comments`, `/:taskId/attachments`

### Notificações (`/api/notifications`)
- `GET /`, `GET /unread-count`
- `PATCH /:id/read`, `PATCH /bulk/read`
- `DELETE /:id`, `DELETE /bulk`

## Regras de Negócio Importantes

1. **Papéis:** Apenas MANAGER pode criar, editar e deletar tarefas. EMPLOYEE vê apenas tarefas atribuídas a ele.
2. **Permissões de tarefa:** Somente o criador pode editar/deletar. Somente o assignee pode alterar o status.
3. **Email obrigatório:** Usuário não pode fazer login sem verificar o email.
4. **Token SSO:** Expira em 5 minutos e é de uso único (limpo após primeiro uso).
5. **Uploads:** Máximo 10MB por arquivo, 5 arquivos por request. Tipos permitidos: imagens (JPEG, PNG, GIF), PDF, DOC/DOCX, TXT. Organizados em pastas por data.
6. **Notificações automáticas:** Cron job diário às 09:00 (horário de Brasília) verifica tarefas vencendo em 24h e envia lembretes.
7. **Arquivamento ≠ Exclusão:** Tarefas podem ser arquivadas (preservadas) ou deletadas permanentemente.

## Autenticação — Fluxo Completo

```
Registro → Email de verificação → Verificação via token → Login (JWT)
                                                            ↓
                                                     Token no header Authorization
                                                            ↓
                                                     Middleware auth.ts valida JWT
                                                     + verifica blacklist
                                                     + verifica mudança de senha
```

- **Hashing:** bcryptjs com 12 rounds de salt
- **JWT:** Expira em 3 dias, inclui userId e role
- **Blacklist:** Tokens são invalidados no logout (limpeza automática a cada 24h)
- **SSO (Token):** Hub gera token → usuário redireciona para `/sso-login` → login automático
- **SSO (Cookie):** Login no Hub seta cookie `canellahub_session` (JWT, 10h, `Domain=.canellahub.com.br`, httpOnly). Nginx usa `auth_request` para validar o cookie em todos os subdomínios (exceto Moodle). Cookie é auto-renovado quando faltam menos de 5h.
- **Código de registro:** Campo `registrationCode` obrigatório no cadastro. Valor padrão: `Canellahub123*` (configurável via `REGISTRATION_CODE` no `.env`)

## Segurança

- **Rate Limiting:** Auth: 30 req/15min, Geral: 100 req/15min, Upload: 10 req/min, Hub Login: 20 req/15min, SSO: 10 req/5min, Validate Session: 120 req/min
- **Headers:** Helmet.js (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- **CORS:** Origins whitelist por ambiente
- **Sanitização:** DOMPurify para HTML, express-mongo-sanitize contra NoSQL injection
- **Validação:** express-validator + Joi no backend, Zod no frontend

## Configuração de Ambiente

Copie `.env.example` para os arquivos necessários em `env/`:

```bash
cp .env.example env/.env.local       # Desenvolvimento
cp .env.example env/.env.production  # Produção
```

**Variáveis essenciais:**

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Connection string PostgreSQL |
| `JWT_SECRET` | Segredo para tokens JWT (mín. 32 caracteres) |
| `SMTP_HOST/PORT/USER/PASS/FROM` | Configuração de email (Nodemailer) |
| `VITE_API_URL` | URL da API para o frontend (ex: `http://localhost:3001`) |
| `FRONTEND_URL` | URL do frontend (usado para CORS e links em emails) |
| `REDIS_URL` | Connection string Redis |
| `REGISTRATION_CODE` | Código obrigatório para registro (padrão: `Canellahub123*`) |

## Deploy e Infraestrutura

### Arquitetura de Produção

```
Internet → Nginx (SSL/TLS, reverse proxy)
              ├── / → Frontend (Nginx servindo SPA estática)
              ├── /api → Backend (Express, porta 3001)
              └── Subdomínios → Outros projetos (protegidos por SSO via auth_request)
                  ├── contask (frontend protegido, /api e /sso-login sem auth)
                  ├── ata, tree, contratos, gestaovendas, fiscoprev, canellaview (totalmente protegidos)
                  └── moodle (EXCLUÍDO do SSO — login próprio)
           PostgreSQL (persistent volume) + Redis (AOF persistence)
           Certbot (renovação SSL automática a cada 12h)

Fluxo SSO nos subdomínios:
  Requisição → Nginx auth_request (/_validate_session) → Backend valida cookie
    ├── 200 (válido) → conteúdo normal
    ├── 401 (inválido) → redirect para canellahub.com.br?redirect=URL_ORIGINAL
    └── 502/503 (backend fora) → página de manutenção
```

### Scripts de Deploy (raiz do projeto)

| Script | Função |
|--------|--------|
| `deploy.sh` | Deploy principal: git pull → build → backup → migrações → health check |
| `test-sso-auth.sh` | Testes automatizados do SSO, registro com código e recuperação |
| `auto-backup-postgresql.sh` | Backup automatizado com rotação, compressão e verificação |
| `setup-daily-backup.sh` | Configura cron para backup diário às 02:00 |
| `restore-backup.sh` | Restauração interativa do banco |
| `run-prisma-migrations.sh` | Executa migrações com validação e testes |
| `create-ssl.sh` / `renew-ssl.sh` | Gerenciamento de certificados SSL |

### Docker em Produção

- **Backend:** Multi-stage build, usuário não-root, dumb-init para signal handling
- **Frontend:** Multi-stage (Node build → Nginx serve), `VITE_API_URL` passado como ARG
- **Health checks:** Backend (`/api/health`), Frontend (`/health`), PostgreSQL (`pg_isready`), Redis (`redis-cli ping`)

## Convenções do Projeto

- **Idioma do código:** Inglês (variáveis, funções, comentários no código)
- **Idioma da interface:** Português brasileiro
- **Estilo de commits:** Mensagens curtas e descritivas (ex: `feat: Configure reverse proxy for Moodle subdomain`)
- **Temas visuais:** Paleta cyan/teal (primary) e verde (secondary), com gradientes customizados definidos no `tailwind.config.js`
- **Timezone:** America/Sao_Paulo (usado em cron jobs e exibição de datas)
- **Organização de uploads:** Pastas por data no formato `yyyy-mm-dd` dentro de `/uploads`
