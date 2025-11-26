# PHASE IC-0 — FOUNDATION & ENVIRONMENT SETUP

> AI agent–oriented phase plan. **1 phase = 1 file.**  
> Use this together with `plan/idea/phase_IC_0_detail.txt`, the stack list, and the project overview.

## Critical Development Guidelines

**⚠️ IMPORTANT**: Review `plan/phase/DEVELOPMENT-GUIDELINES-AND-LESSONS-LEARNED.md` for lessons learned from IC-0 and IC-1 development.

### Key Lessons Learned
- **Database Setup**: Always run `pnpm db:merge` → `pnpm db:generate` → `pnpm db:push` after schema changes
- **CORS Configuration**: Must include all frontend ports (4502, 4503) in `ALLOWED_ORIGINS`
- **Environment Variables**: Document all required vars, use centralized config
- **Performance**: Render UI immediately, load data non-blocking
- **Hydration**: Never access `localStorage`/`window` in render, use `useEffect`

### Pre-Development Checklist
- [ ] **Environment Variables**: Document all required vars in `.env.example` files
- [ ] **Port Configuration**: Verify ports are correct (API: 4501, Admin: 4502, Frontend: 4503)
- [ ] **CORS Setup**: Configure CORS to allow localhost origins in development
- [ ] **Database Setup**: Ensure PostgreSQL is running, schema is migrated

## Phase overview (from master plan)

**Goal**: establish the monorepo, core infrastructure, and base services required for the Issue Collector Platform.

**Current Status**: ✅ **Mostly Complete** - Monorepo, Docker, API, and Admin dashboard are set up. Remaining tasks focus on completing config loader and ensuring readiness for IC-1.

**Tech Stack (Actual Implementation)**:
- **API Framework**: Express.js (not Hono.js - see note below)
- **ORM**: Prisma (not Drizzle - see note below)
- **Admin Dashboard**: Next.js 15 (App Router)
- **Monorepo**: PNPM Workspaces + Turborepo
- **Database**: PostgreSQL 17 with **pgvector** extension (for AI/vector search features)
- **Cache/Queue**: Redis
- **Storage**: Local filesystem (S3/MinIO ready for production)

**Note on Tech Stack**: The original plan specified Hono.js and Drizzle ORM, but the codebase currently uses Express.js and Prisma. This is acceptable and functional. Future phases should work with the existing Express + Prisma stack unless explicitly migrating.

**Architecture Decisions**:
- **Tech Stack**: **Option B (Express.js + Prisma)** - Use existing Express.js + Prisma stack (not Hono.js + Drizzle)
- **API Versioning**: `/api/v1/...` from start - breaking changes handled via new version (e.g., `/api/v2/...`)
- **Authentication**: **Email/Password login** for MVP (JWT-based) - SSO can be added later if needed
- **Multi-tenancy**: **Single-tenant** (one organization, internal staff + authenticated customers) - uses existing User/Role/Permission system
- **Internationalization**: Not implemented in IC-0-IC-6 (can add i18n support later if needed)
- **Analytics & Monitoring**: Not implemented in IC-0-IC-6 (can add SDK usage tracking and error monitoring later)
- **Testing Strategy**: Incremental test coverage (unit tests for critical logic, integration tests for APIs) - no strict coverage requirement
- **Test Environment**: Use existing projects for testing (no separate test project required)
- **Infrastructure**: MinIO/S3 credentials should be configured via environment variables (AI can generate default local credentials for development)

## Phase tasks

### ✅ Completed
- ✅ PNPM monorepo with apps (API, admin, frontend)
- ✅ Docker Compose with PostgreSQL (using `Dockerfile.custom` with pgvector extension), Redis configuration
- ✅ Express.js API base structure with health endpoints
- ✅ Next.js admin dashboard skeleton
- ✅ Prisma ORM setup and migrations
- ✅ Basic shared packages structure (`packages/config`, `packages/types`, `packages/utils`, `packages/locales`)
- ✅ PostgreSQL with pgvector extension enabled (ready for IC-9 AI features)

### 🔄 Remaining Tasks
- ⚠️ **Enhanced config loader** in `packages/config` (currently basic; needs env parsing and typed config)
- ⚠️ **Version endpoint** in API (health exists, but version endpoint needed)
- ⚠️ **Admin dashboard skeleton** with dummy data (needs placeholder pages/components)
- ⚠️ **CI/CD pipeline** setup (Jenkinsfile exists but may need GitHub Actions)
- ⚠️ **Environment configuration** documentation and examples

## Detailed tasks (from IC‑0 detail)

- ✅ Monorepo setup  
- ✅ Docker environment  
- ✅ Express.js API bootstrapping (using Express, not Hono.js)  
- ✅ Next.js dashboard setup  
- ✅ Redis + PostgreSQL setup  
- ⚠️ Enhanced config loader (needs completion)
- ⚠️ CI pipeline and env config (needs completion)  

## Development layers & workflow for this phase

AI agents should follow this order when implementing IC‑0 work:

1. **Create / adjust file structure**
   - Ensure base folders exist and match `PROJECT_STRUCTURE.md`:
     - `apps/api`, `apps/admin`, `apps/frontend` (if needed), `apps/worker` or worker module, `packages/{config,types,utils,locales}`, `infra/{docker,database,nginx,scripts}`.
   - Add or update minimal entrypoints:
     - `apps/api/src/app.ts`, `index.ts`
     - `apps/admin/app/layout.tsx`, `app/page.tsx`
   - Keep structure changes small and consistent; avoid adding new top-level folders.

2. **Implement base code (no UI wiring yet)**
   - ✅ Express.js app with health check endpoint exists.
   - ⚠️ **Add version endpoint** (`GET /version` or `/api/version`) returning app version from package.json.
   - ✅ Basic error handling, logging, and CORS middleware exist.
   - ⚠️ **Enhance config loader** in `packages/config`:
     - Parse environment variables with validation (using Zod recommended)
     - Export typed config object (e.g., `getConfig()` function)
     - Support different environments (dev, staging, production)
     - Document required env vars in `env.example` files
   - ✅ Prisma ORM setup and migration commands exist (`pnpm db:*` scripts).

3. **Create UI skeletons with dummy data (for admin/frontend)**
   - ⚠️ For `apps/admin`, enhance existing pages with placeholder content:
     - **Dashboard home** (`app/admin/page.tsx`): Add placeholder cards/stats showing dummy metrics
     - **Navigation**: Ensure sidebar includes placeholders for future routes:
       - Projects (IC-1) - placeholder link
       - Issues (IC-6) - placeholder link
       - Settings - placeholder link
     - Create placeholder components that render static/dummy data (no API calls)
   - Ensure the UI builds and runs locally with **no backend dependency** (mock or hard-coded data).
   - **Confirm with the user** that the dummy UI structure is acceptable before wiring to real APIs.

4. **Wire UI and services to real code**
   - Connect the admin dashboard to the API health/status endpoints:
     - Create API client utility in `apps/admin/lib/api/` (if not exists)
     - Add health check indicator in admin dashboard (optional status badge)
   - Use shared config for API base URLs and feature flags:
     - Ensure `packages/config` exports API base URL config
     - Use environment variables for `NEXT_PUBLIC_API_URL`
   - Keep IC‑0 focused on platform readiness, not business logic.

5. **Test code (non-browser)**
   - Add or prepare basic tests (future `tests/` folder) for:
     - Config loader (env parsing, validation)
     - Health/status endpoints (API health check)
     - Version endpoint
   - Run type checking (`pnpm typecheck`) and linting (`pnpm lint`) to ensure no new violations.
   - Ensure all apps build successfully (`pnpm build`).

6. **Test in browser**
   - Run admin and API locally:
     ```bash
     pnpm dev:api    # API on port 3401 (or configured port)
     pnpm dev:admin  # Admin on port 3412 (or configured port)
     ```
   - Verify:
     - Admin dashboard loads without runtime errors (`http://localhost:3412`)
     - API health endpoint responds (`http://localhost:3401/health`)
     - API version endpoint responds (`http://localhost:3401/version` or `/api/version`)
     - Basic navigation works in admin dashboard
     - Health/status indicators show correctly (even if mocked)

7. **Clean up & document**
   - Remove temporary scaffolding that is no longer needed.
   - Ensure file/folder names match `RULES.md`.
   - Update `docs/development/setup.md` with:
     - Config loader usage examples
     - Environment variable requirements
     - API endpoint documentation (health, version)
   - Create or update `docs/development/environment-variables.md` documenting all required env vars.
   - Ensure `infra/docker/*/env.example` files are complete and documented.

## Acceptance Criteria

IC-0 is complete when:
- ✅ All apps build and run without errors
- ✅ Config loader properly parses and validates environment variables
- ✅ API has working health and version endpoints
- ✅ Admin dashboard displays placeholder content without errors
- ✅ Docker Compose setup works for local development
- ✅ Database migrations run successfully
- ✅ Documentation is updated with setup instructions
- ✅ Type checking and linting pass

## Next Phase

Once IC-0 is complete, proceed to **IC-1: Project Registration System** which will build on this foundation.


