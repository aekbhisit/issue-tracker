# Z Issue Collector Platform - Project Structure

## 📦 Tech Stack

- **Package Manager**: pnpm
- **Monorepo Tool**: Turborepo
- **API**: Hono.js + TypeScript
- **Frontend/Admin**: Next.js 14+ (App Router)
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Queue**: BullMQ + Redis
- **Storage**: MinIO (S3-compatible) / AWS S3
- **Deployment**: Docker + Nginx

---

## 🗂️ Directory Structure

```
nd-issue-tracker/
│
├── apps/                              # Applications
│   │
│   ├── api/                          # Hono.js API Server (Issue Collector Backend)
│   │   ├── src/
│   │   │   ├── routes/              # API Routes
│   │   │   │   ├── index.ts        # Main router
│   │   │   │   ├── public/         # Public API Routes (for Collector SDK)
│   │   │   │   │   └── v1/
│   │   │   │   │       └── index.ts
│   │   │   │   └── admin/          # Admin API Routes
│   │   │   │       └── v1/
│   │   │   │           └── index.ts
│   │   │   │
│   │   │   ├── modules/             # Feature Modules
│   │   │   │   │
│   │   │   │   ├── project/        # Project Registration (IC-1)
│   │   │   │   │   ├── project.controller.ts
│   │   │   │   │   ├── project.service.ts
│   │   │   │   │   ├── project.validation.ts
│   │   │   │   │   ├── project.types.ts
│   │   │   │   │   └── routes/
│   │   │   │   │       └── admin.routes.ts
│   │   │   │   │
│   │   │   │   ├── issue/          # Issue Management (IC-5)
│   │   │   │   │   ├── issue.controller.ts
│   │   │   │   │   ├── issue.service.ts
│   │   │   │   │   ├── issue.validation.ts
│   │   │   │   │   ├── issue.types.ts
│   │   │   │   │   └── routes/
│   │   │   │   │       ├── public.routes.ts    # Collector SDK submits here
│   │   │   │   │       └── admin.routes.ts     # Admin dashboard
│   │   │   │   │
│   │   │   │   ├── notification/   # Notifications (IC-7)
│   │   │   │   │   ├── notification.controller.ts
│   │   │   │   │   ├── notification.service.ts
│   │   │   │   │   ├── notification.types.ts
│   │   │   │   │   └── routes/
│   │   │   │   │       └── admin.routes.ts
│   │   │   │   │
│   │   │   │   └── worker/         # Background Worker (BullMQ)
│   │   │   │       ├── queues/
│   │   │   │       │   ├── screenshot.processor.ts
│   │   │   │       │   ├── log.processor.ts
│   │   │   │       │   └── notification.processor.ts
│   │   │   │       └── worker.ts
│   │   │   │
│   │   │   ├── shared/              # Shared Resources
│   │   │   │   ├── middlewares/
│   │   │   │   │   ├── error.middleware.ts
│   │   │   │   │   ├── cors.middleware.ts
│   │   │   │   │   ├── logger.middleware.ts
│   │   │   │   │   └── validation.middleware.ts
│   │   │   │   ├── utils/
│   │   │   │   │   ├── response.util.ts
│   │   │   │   │   ├── error.util.ts
│   │   │   │   │   └── storage.util.ts
│   │   │   │   └── types/
│   │   │   │       └── common.types.ts
│   │   │   │
│   │   │   ├── app.ts               # Hono app setup
│   │   │   └── index.ts             # Entry point
│   │   │
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── Dockerfile
│   │
│   ├── admin/                        # Next.js Admin Dashboard (Issue Management)
│   │   ├── app/                     # App Router
│   │   │   ├── admin/              # Admin routes
│   │   │   │   ├── projects/      # Project management (IC-1)
│   │   │   │   │   ├── page.tsx   # List projects
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   │   ├── issues/        # Issue Dashboard (IC-6)
│   │   │   │   │   ├── page.tsx   # Issue list
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx  # Issue detail
│   │   │   │   │
│   │   │   │   ├── settings/      # Settings
│   │   │   │   │   └── page.tsx
│   │   │   │   │
│   │   │   │   ├── layout.tsx     # Admin layout
│   │   │   │   └── page.tsx       # Dashboard home
│   │   │   │
│   │   │   ├── layout.tsx          # Root layout
│   │   │   └── page.tsx            # Login page
│   │   │
│   │   ├── components/              # Shared Components
│   │   │   ├── ui/                # UI components
│   │   │   ├── charts/            # Chart components
│   │   │   └── common/            # Common components
│   │   │
│   │   ├── lib/                    # Utilities & Configs
│   │   │   ├── api/               # API client
│   │   │   └── utils/            # Utilities
│   │   │
│   │   ├── hooks/                  # Shared Hooks
│   │   ├── context/               # React Context
│   │   ├── public/               # Static Files
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── next.config.js
│   │
│   └── frontend/                    # Next.js Public Frontend (Optional)
│       ├── app/
│       ├── components/
│       ├── lib/
│       ├── package.json
│       └── tsconfig.json
│
├── packages/                         # Shared Internal Packages
│   ├── database/                    # @workspace/database
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # Prisma schema
│   │   │   └── migrations/         # DB migrations
│   │   ├── src/
│   │   │   └── index.ts            # Export Prisma client
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── types/                       # @workspace/types
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── api.types.ts
│   │   │   ├── issue.types.ts
│   │   │   ├── project.types.ts
│   │   │   └── common.types.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── config/                      # @workspace/config
│   │   ├── eslint-config/
│   │   ├── typescript-config/
│   │   └── package.json
│   │
│   ├── utils/                       # @workspace/utils
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   └── *.utils.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── locales/                     # @workspace/locales
│       ├── src/
│       │   ├── en.json
│       │   └── th.json
│       ├── package.json
│       └── tsconfig.json
│
├── infra/                            # Infrastructure & DevOps
│   ├── docker/                      # Docker configurations
│   │   ├── api/
│   │   │   └── Dockerfile
│   │   ├── admin/
│   │   │   └── Dockerfile
│   │   ├── frontend/
│   │   │   └── Dockerfile
│   │   ├── postgres/
│   │   │   └── Dockerfile
│   │   ├── docker-compose.yml       # Development
│   │   └── docker-compose.prod.yml  # Production
│   │
│   ├── database/                    # Database setup
│   │   ├── prisma/
│   │   │   ├── schema/             # Schema modules
│   │   │   └── seeds/              # Seed scripts
│   │   └── env.example
│   │
│   ├── nginx/                       # Nginx configurations
│   │   └── nginx.conf
│   │
│   └── scripts/                     # Setup & Utility Scripts
│       └── setup.js
│
├── docs/                             # Documentation
│   ├── architecture/                # Architecture docs
│   ├── api/                         # API documentation
│   ├── development/                 # Development guides
│   ├── deployment/                   # Deployment guides
│   └── changelog/                   # Change logs
│
├── plan/                             # Planning & Roadmap
│   ├── idea/                        # Phase planning documents
│   │   ├── issue_collector_project_overview_and_phases.txt
│   │   └── phase_IC_*.txt
│   └── agent.plan.md
│
├── storage/                          # File Storage
│   ├── uploads/                     # User uploaded files
│   │   ├── screenshots/            # Issue screenshots
│   │   └── logs/                   # Issue logs
│   └── backups/                     # Backup files
│
├── scripts/                          # Root-level scripts
│   └── setup.js
│
├── md/                               # Supplemental markdown notes
│   └── README.md
│
├── turbo.json                       # Turborepo configuration
├── pnpm-workspace.yaml              # pnpm workspace config
├── package.json                     # Root package.json
├── README.md
├── GETTING_STARTED.md
├── PROJECT_STRUCTURE.md             # This file
└── RULES.md                         # Coding rules
```

---

## 🎯 Key Components

### 1. Issue Collector API (`apps/api/`)
- **Purpose**: Backend API for receiving and processing issues
- **Framework**: Hono.js
- **Key Modules**:
  - `project/`: Project registration and management (IC-1)
  - `issue/`: Issue CRUD and processing (IC-5)
  - `notification/`: Notification system (IC-7)
  - `worker/`: Background job processing (BullMQ)

### 2. Admin Dashboard (`apps/admin/`)
- **Purpose**: Issue management interface for developers/admins
- **Framework**: Next.js 14+ (App Router)
- **Key Features**:
  - Project management (IC-1)
  - Issue dashboard with filters (IC-6)
  - Screenshot and log viewer
  - Status workflow management

### 3. Collector SDK (Future - `packages/collector-sdk/`)
- **Purpose**: JavaScript SDK injected into target applications
- **Features**:
  - Floating "Report Issue" button (IC-2)
  - Inspect mode with element selection (IC-3)
  - Screenshot capture (IC-3)
  - Log and error capture (IC-4)

### 4. Background Worker
- **Purpose**: Process screenshots, normalize logs, send notifications
- **Queue System**: BullMQ + Redis
- **Processors**:
  - Screenshot processing
  - Log normalization
  - Notification dispatch
  - AI triage (IC-9)

---

## 📊 Database Schema (Planned)

### Core Tables
- `projects`: Registered projects
- `project_environments`: Environment configurations per project
- `issues`: Reported issues
- `issue_screenshots`: Screenshot attachments
- `issue_logs`: Console logs and errors
- `notifications`: Notification history

---

## 🔄 Development Phases

The project follows a phased development approach:

- **IC-0**: Foundation & Environment Setup ✅
- **IC-1**: Project Registration System
- **IC-2**: Collector SDK (Basic)
- **IC-3**: Inspect Mode + Screenshot Capture
- **IC-4**: Log & Error Capture
- **IC-5**: Issue Collector API & Database
- **IC-6**: Issue Dashboard
- **IC-7**: Notifications & Integrations
- **IC-8**: Browser Extension (Optional)
- **IC-9**: AI Triage Engine
- **IC-10**: Heatmap / Session Replay / Rage Click (Future)

See [Issue Collector Overview](./plan/idea/issue_collector_project_overview_and_phases.txt) for detailed phase descriptions.

---

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start infrastructure (PostgreSQL, Redis, MinIO)
docker-compose up -d postgres redis minio

# Setup database
pnpm db:generate
pnpm db:migrate

# Start development servers
pnpm dev
```

---

## 📚 Documentation

- [Getting Started](./GETTING_STARTED.md) - Setup guide
- [Coding Rules](./RULES.md) - Development conventions
- [Issue Collector Overview](./plan/idea/issue_collector_project_overview_and_phases.txt) - Complete project overview

---

**Last Updated**: January 2025  
**Version**: 1.0.0
