# Z Issue Collector Platform

A standalone system designed to provide a powerful, centralized issue-reporting experience across ALL Z.com and NetDesign Group applications. It allows any tester, staff member, or user to report UI/UX or functional issues directly from the browser with one click.

## 🎯 Overview

When integrated into any web application via a lightweight JavaScript snippet (`collector.min.js`), users can:

- Capture screenshots of UI elements  
- Automatically collect DOM selectors + HTML snippets  
- Gather browser metadata  
- Capture console logs, JS errors, and network failures  
- Add comments, severity, and reproduction steps  
- Send the issue to a central Issue Collector API  
- View and manage issues in a unified dashboard  

This platform dramatically improves QA workflow, developer debugging efficiency, and overall product quality across all Z.com systems.

## 🏗️ Project Structure

This monorepo contains:
- **API**: Hono.js REST API (Issue Collector backend)
- **Admin**: Next.js admin dashboard (Issue management interface)
- **Frontend**: Next.js public-facing website (optional)
- **Collector SDK**: JavaScript SDK for issue collection (to be built)

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker & Docker Compose

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Start database and services
docker-compose up -d postgres redis minio

# 3. Generate Prisma client and run migrations
pnpm db:generate
pnpm db:migrate

# 4. Start development servers
pnpm dev
```

### Access Applications

- **API**: http://localhost:4501
- **Admin Dashboard**: http://localhost:4502
- **Frontend**: http://localhost:4503 (if applicable)

### Default Admin Login

After seeding the database (`pnpm db:seed`), login with:
- **Username**: `admin`
- **Password**: `admin`

## 📚 Documentation

- [Project Structure](./PROJECT_STRUCTURE.md) - Detailed architecture
- [Coding Rules](./RULES.md) - Naming conventions and best practices
- [Getting Started](./GETTING_STARTED.md) - Setup and development guide
- [Issue Collector Overview](./plan/idea/issue_collector_project_overview_and_phases.txt) - Complete project overview and phases

## 🐳 Docker

### Development (Database only)
```bash
docker-compose up -d postgres redis
pnpm dev
```

### Full Stack
```bash
docker-compose up -d
```

### Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🛠️ Available Commands

```bash
# Development
pnpm dev              # Run all apps
pnpm dev:all          # Run all apps (API, Admin, Frontend)
pnpm dev:api          # Run API only
pnpm dev:admin        # Run Admin only
pnpm dev:frontend     # Run Frontend only
pnpm dev:kill         # Kill all dev servers (ports 4501, 4502, 4503)

# Build
pnpm build            # Build all apps

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Prisma Studio

# Docker
pnpm docker:up        # Start containers
pnpm docker:down      # Stop containers
pnpm docker:logs      # View logs

# Code Quality
pnpm lint             # Lint all code
pnpm format           # Format all code
pnpm typecheck        # Type check
```

## 🏢 Tech Stack

- **Monorepo**: Turborepo + pnpm workspaces
- **Backend**: Hono.js + TypeScript
- **Frontend**: Next.js 14+ (App Router)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Queue**: BullMQ + Redis
- **Storage**: MinIO (S3-compatible) / AWS S3
- **Deployment**: Docker + Nginx

## 📦 Workspace Packages

- `@workspace/database` - Prisma client and schema
- `@workspace/types` - Shared TypeScript types
- `@workspace/config` - Shared configurations
- `@workspace/utils` - Shared utility functions
- `@workspace/locales` - i18n translations

## 🗺️ Development Phases

The project follows a phased development approach (IC-0 to IC-10):

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

## 📖 Learn More

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Hono.js Documentation](https://hono.dev/)

## 📄 License

MIT
