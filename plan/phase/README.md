# IC Phase Plans (`plan/phase/`)

This folder contains **AI agent–oriented implementation plans** for each Issue Collector phase (IC‑0…IC‑10).

- **1 phase = 1 file** – each file here corresponds to exactly one IC phase.
- These files are higher-level **development guides** for agents and developers.
- They are based on the idea documents in `plan/idea/` and the stack/overview docs:
  - `plan/idea/issue_collector_project_overview_and_phases.txt`
  - `plan/idea/issue_collector_stack_list.txt`

## Phase Plan Structure

Each phase file includes:

- **Phase Overview**: Goals, prerequisites, tech stack, and deliverables
- **Detailed Tasks**: Specific tasks from the idea documents
- **Development Workflow**: Standard 7-step process for AI agents:
  1. Create/adjust file structure
  2. Implement base code (backend/SDK/worker/etc.)
  3. Create UI (if any) using dummy data and confirm with the user
  4. Wire UI to real code and APIs
  5. Test the code (unit/integration where applicable)
  6. Test in the browser
  7. Clean up and update documentation
- **Acceptance Criteria**: Clear checklist for phase completion
- **API Endpoints** (where applicable): Expected endpoint specifications
- **Next Phase**: Link to the following phase

## Tech Stack (Actual Implementation)

**Important**: The phase plans reflect the **actual tech stack** used in the codebase:

- **API Framework**: Express.js (not Hono.js as originally planned)
- **ORM**: Prisma (not Drizzle as originally planned)
- **Admin Dashboard**: Next.js 15 (App Router)
- **Database**: PostgreSQL 17 with **pgvector** extension (for AI/vector search)
- **Cache/Queue**: Redis + BullMQ
- **Storage**: Local filesystem (dev) / S3/MinIO (production)

**Note**: pgvector is already configured in Docker images and will be useful for IC-9 AI Triage Engine features.

## Available Phase Plans

- ✅ **IC-0**: Foundation & Environment Setup (mostly complete, needs config loader enhancement)
- 📋 **IC-1**: Project Registration System
- 📋 **IC-2**: Collector SDK (Basic)
- 📋 **IC-3**: Inspect Mode + Screenshot Capture
- 📋 **IC-4**: Log & Error Capture
- 📋 **IC-5**: Issue Collector API & Database
- 📋 **IC-6**: Issue Dashboard
- 📋 **IC-7**: Notifications & Integrations (not yet documented)
- 📋 **IC-8**: Browser Extension (not yet documented)
- 📋 **IC-9**: AI Triage Engine (not yet documented)
- 📋 **IC-10**: Heatmap / Session Replay (not yet documented)

## Database Schema Management

**📖 Complete Guide**: See **[DATABASE-SCHEMA-GUIDE.md](./DATABASE-SCHEMA-GUIDE.md)** for detailed instructions.

### ⚠️ Important: Docker is Already Running

**Docker services are already configured and running:**
- ✅ **PostgreSQL** with pgvector extension (port 5432 or 5435)
- ✅ **Redis** for caching and queues
- ✅ Extensions auto-enabled: `vector`, `postgis`, `uuid-ossp`, `pg_trgm`

**You don't need to set up Docker** - just create the database schema/tables using Prisma migrations.

### Quick Summary

**Who manages the database schema?**
- **Prisma ORM** manages all database schemas and migrations
- Schema files are located in: `infra/database/prisma/schema/`
- Each feature/domain has its own `.prisma` file (e.g., `user.prisma`, `project.prisma`, `issue.prisma`)

**How to create database and tables** (Docker already running):

1. **Create schema file** in `infra/database/prisma/schema/` (e.g., `project.prisma`)
2. **Generate Prisma Client**: `pnpm db:generate`
3. **Create and apply migration**: `pnpm db:migrate:dev --name add_project_table`
   - This creates tables in the **existing PostgreSQL database** (Docker container)
   - No need to create database manually - Prisma handles it via migrations

**Database setup steps** (for new developers):
- ✅ **Docker**: Already running (PostgreSQL + Redis containers)
- ✅ **Connection**: Configured via `DATABASE_URL` in `.env`
- 📖 See `docs/development/setup.md` - Step 5: Database Migration
- 📖 See `GETTING_STARTED.md` - Step 3: Database Setup
- 📖 See `infra/database/README.md` - Complete database package documentation
- 📖 See `plan/phase/DATABASE-SCHEMA-GUIDE.md` - **Complete schema management guide**

**Phase-specific schema creation:**
- **IC-1**: Create `project.prisma` in `infra/database/prisma/schema/` → run `pnpm db:migrate:dev`
- **IC-5**: Create `issue.prisma` in `infra/database/prisma/schema/` → run `pnpm db:migrate:dev`

## Usage

Use these phase files together with:
- `plan/agent.plan.md` - General agent guidelines
- `docs/development/admin-ui-guidelines.md` - **Admin UI/UX guidelines** (TailAdmin theme, TanStack React Table, component patterns)
- `docs/` - Technical documentation
- `RULES.md` - Repository rules and conventions
- `PROJECT_STRUCTURE.md` - Project structure reference
- `infra/database/README.md` - Database schema management guide

**Important for UI Development**: When implementing admin dashboard UI (IC-1, IC-6), always refer to:
- **`plan/phase/UI-GUIDELINES.md`** - **Updated UI guidelines** with established patterns:
  - Button guidelines (EditAction blue, DeleteAction red, StatusToggleAction)
  - Toast notification design (glass morphism, 50% opacity, auto-hide)
  - Form layout patterns (breadcrumb navigation, compact headers)
  - Table column guidelines (Issues column, Actions column structure)
  - Status toggle patterns (play/pause icons)
- `docs/development/admin-ui-guidelines.md` - Additional component patterns (if exists)
- TanStack React Table implementation
- TailAdmin design system (colors, typography, spacing)

## ⚠️ Unanswered Questions

**Important**: Before starting development, review:
- **[UNANSWERED-QUESTIONS.md](./UNANSWERED-QUESTIONS.md)** - General unanswered questions
- **[DEVELOPMENT-PROCESS-QUESTIONS.md](./DEVELOPMENT-PROCESS-QUESTIONS.md)** - Development process questions focused on implementation details

**Status**: ~75% of questions are now answered (45/60 questions). Remaining questions are mostly deferred to future phases (IC-7, IC-8, IC-9, IC-10) or are implementation details.

**Critical Development Questions**: See [DEVELOPMENT-PROCESS-QUESTIONS.md](./DEVELOPMENT-PROCESS-QUESTIONS.md) for 14 critical questions that should be answered before starting respective phases.

**Critical questions** - **ALL ANSWERED** ✅:
- ✅ Public API authentication strategy → **Project key validation only** (IC-5)
- ✅ Project key rotation/regeneration → **Permanent keys** (IC-1)
- ✅ Domain validation rules → **Validate at registration, subdomains not auto-allowed** (IC-1)
- ✅ User management integration → **Use existing User model** (IC-1, IC-5, IC-6)
- ✅ Screenshot size limits → **10MB max, client-side compression** (IC-3)
- ✅ Issue assignment strategy → **Single assignee from User model** (IC-5, IC-6)
- ✅ Storage access → **Signed URLs with expiration** (IC-5)
- ✅ Multi-tenancy → **Single-tenant** (scope clarifications)

**Remaining questions** are mostly:
- Deferred to IC-7 (Notifications), IC-8 (Browser Extension), IC-9 (AI Triage), IC-10 (Heatmap)
- Future enhancements (saved filters, audit logs, advanced features)
- Implementation details (can be decided during development)

## Usage

When starting a new phase:
1. Read the phase plan file completely
2. **Review unanswered questions** in `UNANSWERED-QUESTIONS.md` relevant to your phase
3. Check prerequisites (previous phases must be complete)
4. Review tech stack requirements
5. **If creating new tables**: Create schema file in `infra/database/prisma/schema/`, then run `pnpm db:migrate:dev`
6. **If implementing UI**: Review `docs/development/admin-ui-guidelines.md` for component patterns and design system
7. Follow the 7-step development workflow
8. Verify acceptance criteria before marking phase as complete


