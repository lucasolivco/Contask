# 🎯 Task Manager

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)

**Complete task management system with authentication, real-time notifications and analytical dashboard**

[✨ Features](#-key-features) • [🐳 Docker](#-docker-installation) • [🚀 Local Setup](#-local-installation-without-docker) • [📖 Documentation](#-documentation) • [🤝 Contributing](#-contributing)

</div>

---

## 📋 About The Project

Task Manager is a robust and modern fullstack application for team task management, with user hierarchy (Managers and Employees), email notification system, analytical dashboard and intuitive interface.

### ✨ Key Features

- 🔐 **Complete Authentication**: Registration, login, email verification and password recovery
- 📊 **Analytical Dashboard**: Real-time charts and statistics
- 🎯 **Task Management**: Full CRUD with role-based permissions
- 🔔 **Notification System**: In-app and email (SMTP)
- 📎 **Attachments & Comments**: File upload and comment system
- 📅 **Calendar**: Date-based task visualization
- 👥 **Team Management**: Detailed view of users and their tasks
- 🔒 **Robust Security**: Rate limiting, CORS, Helmet, JWT
- 📧 **Automated Emails**: HTML templates for all notifications
- ⏰ **Task Scheduler**: Automatic reminders 1 day before due date

---

## 🏗️ Architecture

### Technology Stack

#### Backend
- **Runtime**: Node.js 24+ with TypeScript
- **Framework**: Express.js 5
- **ORM**: Prisma (PostgreSQL)
- **Authentication**: JWT + bcryptjs
- **Email**: Nodemailer with HTML templates
- **Scheduling**: node-cron
- **Security**: Helmet, CORS, express-rate-limit, express-slow-down
- **Upload**: Multer + fs-extra
- **Validation**: Joi + express-validator

#### Frontend
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Routing**: React Router DOM v7
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **Styling**: TailwindCSS 3
- **Notifications**: Sonner
- **Icons**: Lucide React
- **HTTP Client**: Axios

---

## 🚀 Getting Started

### Prerequisites

#### Local Installation
- Node.js 20+ and npm/yarn
- PostgreSQL 14+
- SMTP account for email sending (Gmail, SendGrid, etc.)

#### Docker Installation (Recommended)
- Docker 20.10+
- Docker Compose 2.0+

---

## 🐳 Docker Installation

### Quick Start (5 minutes)

```bash
# 1. Clone the repository
git clone https://github.com/your-username/task-manager.git
cd task-manager

# 2. Configure environment
cp .env.example .env
# Edit .env and set: SMTP_USER, SMTP_PASS, JWT_SECRET

# 3. Start with Docker
docker-compose up -d

# 4. Run migrations
docker-compose exec backend npx prisma migrate dev

# 5. Access the application
# Frontend: http://localhost:5173
# Backend: http://localhost:3001/api/health
```

### Development (Detailed)

1. **Clone the repository**
```bash
git clone https://github.com/your-username/task-manager.git
cd task-manager
```

2. **Configure environment variables**

Create a `.env` file in the **project root**:

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
JWT_SECRET=your_super_secure_jwt_key_here

# Frontend Configuration
FRONTEND_PORT=5173
VITE_API_URL=http://localhost:3001

# SMTP (Email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Task Manager <your-email@gmail.com>"

# URLs
FRONTEND_URL=http://localhost:5173
```

3. **Start the containers**
```bash
docker-compose up -d
```

This will start:
- ✅ Backend (Node.js) on port 3001
- ✅ Frontend (React + Vite) on port 5173
- ✅ PostgreSQL on port 5432
- ✅ Redis on port 6379

4. **Run database migrations**
```bash
docker-compose exec backend npx prisma migrate dev
docker-compose exec backend npx prisma generate
```

5. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/api/health

### Useful Commands (Docker)

```bash
# View container logs
docker-compose logs -f

# View logs of specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop containers
docker-compose down

# Stop and remove volumes (WARNING: deletes database data)
docker-compose down -v

# Rebuild images
docker-compose build

# Rebuild and start
docker-compose up -d --build

# Execute commands in backend
docker-compose exec backend npm run db:studio
docker-compose exec backend npx prisma migrate reset

# Access container shell
docker-compose exec backend sh
docker-compose exec postgres psql -U postgres -d task_manager_dev
```

### Production with Docker

1. **Configure production variables**

Create the file `env/.env.production`:

```env
# Database
DB_USER=postgres
DB_PASSWORD=super_secure_password_here
DB_NAME=task_manager_prod
DB_PORT=5432
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:${DB_PORT}/${DB_NAME}?schema=public

# Redis
REDIS_PASSWORD=redis_super_secure_password

# Backend
NODE_ENV=production
JWT_SECRET=your_super_secure_production_jwt_key
PORT=3001

# URLs
FRONTEND_URL=https://your-domain.com
VITE_API_URL=https://api.your-domain.com

# SMTP
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM="Task Manager <noreply@your-domain.com>"
```

2. **Start in production**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

3. **Run migrations**
```bash
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### Docker Structure

```
task-manager/
├── docker-compose.yml              # Development configuration
├── docker-compose.prod.yml         # Production configuration
├── backend/
│   ├── Dockerfile                  # Development image
│   ├── Dockerfile.prod             # Production image
│   └── .dockerignore
├── frontend/
│   ├── Dockerfile                  # Development image
│   └── Dockerfile.prod             # Production image
└── docker/
    ├── nginx/                      # Nginx configuration (production)
    └── monitoring/                 # Prometheus + Grafana (optional)
```

### Docker Troubleshooting

#### Problem: Port already in use
```bash
# Check processes using ports
# Windows
netstat -ano | findstr :5173
netstat -ano | findstr :3001

# Linux/Mac
lsof -i :5173
lsof -i :3001

# Solution: Change ports in .env file
FRONTEND_PORT=5174
BACKEND_PORT=3002
```

#### Problem: Prisma migrations not working
```bash
# Clean and recreate database
docker-compose down -v
docker-compose up -d postgres
docker-compose exec backend npx prisma migrate reset --force
docker-compose exec backend npx prisma migrate dev
```

#### Problem: Hot-reload not working
```bash
# Windows: Add polling in docker-compose.yml
# In frontend service, add:
environment:
  - CHOKIDAR_USEPOLLING=true
```

#### Problem: Volume permission error
```bash
# Linux/Mac: Fix permissions
sudo chown -R $USER:$USER ./backend/node_modules
sudo chown -R $USER:$USER ./frontend/node_modules
```

### Important Tips (Docker)

- 🔥 **Hot Reload**: Code is mounted via volumes, changes reflect automatically
- 💾 **Persistent Data**: Separate volumes for dev and production
- 🔒 **Security**: Redis protected by password, PostgreSQL isolated in internal network
- 📊 **Monitoring**: Access Prisma Studio with `docker-compose exec backend npm run db:studio`
- 🧪 **Testing**: Run tests inside container with `docker-compose exec backend npm test`

---

## 📦 Local Installation (Without Docker)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/task-manager.git
cd task-manager
```

2. **Configure Backend**
```bash
cd backend
npm install
```

3. **Configure environment variables**

Create a `.env` file in the `backend` folder:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/task_manager"

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=your_super_secure_key_here

# SMTP (Email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Task Manager <your-email@gmail.com>"
```

4. **Configure database**
```bash
npx prisma migrate dev
npx prisma generate
```

5. **Configure Frontend**
```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend` folder:

```env
VITE_API_URL=http://localhost:3001
```

6. **Start the servers**

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

Access: http://localhost:5173

---

## 📖 Documentation

### Folder Structure

```
task-manager/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   └── migrations/            # Prisma migrations
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts        # Prisma configuration
│   │   ├── controllers/           # Business logic
│   │   │   ├── authController.ts
│   │   │   ├── taskController.ts
│   │   │   ├── commentController.ts
│   │   │   ├── attachmentController.ts
│   │   │   └── notificationController.ts
│   │   ├── middleware/            # Middlewares
│   │   │   ├── auth.ts
│   │   │   └── upload.ts
│   │   ├── routes/                # API routes
│   │   │   ├── authRoutes.ts
│   │   │   ├── taskRoutes.ts
│   │   │   └── notificationRoutes.ts
│   │   ├── services/              # External services
│   │   │   ├── emailService.ts
│   │   │   └── notificationService.ts
│   │   ├── utils/                 # Utilities
│   │   │   └── auth.ts
│   │   └── server.ts              # Main server
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/            # Reusable components
    │   │   ├── ui/                # Base UI components
    │   │   ├── tasks/             # Task components
    │   │   └── employees/         # User components
    │   ├── contexts/              # React contexts
    │   │   └── AuthContext.tsx
    │   ├── layouts/               # Layouts
    │   │   └── DashboardLayout.tsx
    │   ├── pages/                 # Pages
    │   │   ├── Login.tsx
    │   │   ├── Register.tsx
    │   │   ├── Dashboard.tsx
    │   │   ├── Tasks.tsx
    │   │   ├── CreateTask.tsx
    │   │   ├── EditTask.tsx
    │   │   ├── Calendar.tsx
    │   │   ├── Employees.tsx
    │   │   └── Notifications.tsx
    │   ├── services/              # API services
    │   │   ├── api.ts
    │   │   ├── authService.ts
    │   │   ├── taskService.ts
    │   │   └── notificationService.ts
    │   ├── types/                 # Type definitions
    │   │   └── index.ts
    │   ├── App.tsx                # Root component
    │   └── main.tsx               # Entry point
    └── package.json
```

### Data Model

#### User
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

#### Task
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

#### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `GET /api/auth/verify-email?token=` - Verify email
- `POST /api/auth/resend-verification` - Resend verification email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

#### Tasks
- `GET /api/tasks` - List tasks (with filters)
- `GET /api/tasks/:id` - Get specific task
- `POST /api/tasks` - Create task (MANAGER)
- `PUT /api/tasks/:id` - Edit task (MANAGER - creator only)
- `PATCH /api/tasks/:id/status` - Update status (assignee)
- `DELETE /api/tasks/:id` - Delete task (MANAGER - creator only)
- `POST /api/tasks/bulk-delete` - Delete multiple tasks (MANAGER)

#### Attachments
- `POST /api/tasks/:id/attachments` - Upload attachments
- `DELETE /api/tasks/:taskId/attachments/:id` - Remove attachment

#### Comments
- `GET /api/tasks/:id/comments` - List comments
- `POST /api/tasks/:id/comments` - Add comment
- `DELETE /api/tasks/:taskId/comments/:id` - Remove comment

#### Notifications
- `GET /api/notifications` - List notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/mark-all-read` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

#### Users (MANAGER)
- `GET /api/tasks/employees` - List users
- `GET /api/tasks/employees/:id` - User details

---

## 🎨 Features by Role

### 👔 Manager

- ✅ Create tasks and assign to any user (managers or employees)
- ✅ Edit tasks they created
- ✅ Delete tasks (individual or bulk)
- ✅ View all tasks they created
- ✅ View tasks assigned to them by other managers
- ✅ View complete user list with statistics
- ✅ Access dashboard with team overview
- ✅ Receive completion and update notifications

### 👨‍💼 Employee

- ✅ View only tasks assigned to them
- ✅ Update task status (Pending → In Progress → Completed)
- ✅ Add comments to tasks
- ✅ Upload attachments
- ✅ View personal dashboard
- ✅ Receive new task and update notifications

---

## 🔒 Security

### Implemented Measures

- ✅ **JWT Authentication**: Secure tokens with expiration
- ✅ **Password Hashing**: bcryptjs with salt
- ✅ **Helmet**: HTTP headers protection
- ✅ **CORS**: Restrictive configuration per environment
- ✅ **Rate Limiting**:
  - Login/Register: 30 requests/15min
  - General: 100 requests/15min
  - Upload: 10 requests/min
- ✅ **Request Throttling**: Progressive slow down for excessive requests
- ✅ **Input Validation**: Joi + express-validator
- ✅ **Sanitization**: Protection against XSS and SQL Injection
- ✅ **Secure Upload**: MIME type and size validation
- ✅ **Email Verification**: Required for account activation
- ✅ **Reset Tokens**: Expirations and single use

---

## 📧 Notification System

### Notification Types

| Type | Description | Email | In-App |
|------|-------------|-------|--------|
| `TASK_ASSIGNED` | New task assigned | ✅ | ✅ |
| `TASK_REASSIGNED` | Task reassigned | ✅ | ✅ |
| `TASK_UPDATED` | Task modified | ✅ | ✅ |
| `TASK_COMPLETED` | Task completed | ✅ | ✅ |
| `TASK_CANCELLED` | Task cancelled | ✅ | ✅ |
| `TASK_OVERDUE` | Task due soon (1 day before) | ✅ | ✅ |
| `COMMENT_ADDED` | New comment | ✅ | ✅ |
| `ATTACHMENT_ADDED` | New attachment | ✅ | ✅ |

### Scheduler (Cron)

- Daily execution at **09:00 AM (Brazil Time)**
- Checks tasks due in next 24 hours
- Sends automatic reminders to assignees
- Avoids duplicate notifications

---

## 🎯 Filters and Search

### Available Filters

- **Status**: PENDING, IN_PROGRESS, COMPLETED, CANCELLED
- **Priority**: LOW, MEDIUM, HIGH, URGENT
- **Assignee**: Filter by specific user (managers)
- **Due Date**: Specific day, month or year
- **Keyword**: Search in title and description
- **Overdue Tasks**: Only uncompleted overdue tasks
- **Urgent Tasks**: Only URGENT priority

---

## 🛠️ Available Scripts

### Backend

```bash
npm run dev          # Start development server
npm run build        # Compile TypeScript to JavaScript
npm start            # Start production server
npm run db:migrate   # Run database migrations
npm run db:generate  # Generate Prisma Client
npm run db:reset     # Reset database
npm run db:studio    # Open Prisma Studio (GUI)
```

### Frontend

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Check linting errors
```

---

## 🚢 Deploy

### Production Preparation

1. **Backend**:
   - Configure production environment variables
   - Configure PostgreSQL database in production (Railway, Supabase, etc.)
   - Configure professional SMTP service (SendGrid, AWS SES, etc.)
   - Adjust CORS for production domain
   - Run migrations: `npx prisma migrate deploy`

2. **Frontend**:
   - Configure `VITE_API_URL` to backend production URL
   - Run build: `npm run build`
   - Deploy `dist` folder (Vercel, Netlify, etc.)

### Hosting Suggestions

- **Backend**: Railway, Render, Heroku, AWS, DigitalOcean
- **Frontend**: Vercel, Netlify, Cloudflare Pages
- **Database**: Railway, Supabase, Neon, AWS RDS
- **Email**: SendGrid, AWS SES, Mailgun, Resend

---

## 🧪 Testing the Application

### Test User

After starting the application, register test users:

1. **Manager**:
   - Email: manager@example.com
   - Role: MANAGER

2. **Employee**:
   - Email: employee@example.com
   - Role: EMPLOYEE

### Complete Test Flow

1. ✅ Register a manager user
2. ✅ Verify email (check backend console or use Ethereal/Mailtrap)
3. ✅ Login as manager
4. ✅ Register an employee user
5. ✅ Verify employee email
6. ✅ Create tasks as manager and assign to employee
7. ✅ Login as employee
8. ✅ Update task status
9. ✅ Add comments and attachments
10. ✅ Check notifications in both users

---

## 🤝 Contributing

Contributions are welcome! Follow these steps:

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Standards

- Use TypeScript strict mode
- Follow ESLint/Prettier conventions
- Add comments for complex logic
- Keep components small and reusable
- Write descriptive commit messages

---

## 📝 License

This project is under the MIT license. See the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Your Name**

- GitHub: [lucasolivco](https://github.com/lucasolivco)
- LinkedIn: [https://www.linkedin.com/in/lucas-costa-5479a4120/](https://www.linkedin.com/in/lucas-costa-5479a4120/)
- Email: lukazcosta03@gmail.com

---

## 🙏 Acknowledgments

- [React](https://react.dev/)
- [Node.js](https://nodejs.org/)
- [Prisma](https://www.prisma.io/)
- [TailwindCSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- All the open source community

---

<div align="center">

**⭐ If this project was helpful, consider giving it a star!**

Made with ❤️ and ☕

</div>
