# PHASE IC-1 — PROJECT REGISTRATION SYSTEM

> AI agent–oriented phase plan. **1 phase = 1 file.**  
> Use this together with `plan/idea/phase_IC_1_detail.txt`, the stack list, and the project overview.

## Critical Development Guidelines

**⚠️ IMPORTANT**: Before starting development, review `plan/phase/DEVELOPMENT-GUIDELINES-AND-LESSONS-LEARNED.md` for critical lessons learned from IC-0 and IC-1.

### Pre-Development Checklist
- [ ] **Database Setup**: Run `pnpm db:merge` → `pnpm db:generate` → `pnpm db:push` before starting
- [ ] **CORS Configuration**: Verify `ALLOWED_ORIGINS` includes ports 4502, 4503 in `apps/api/.env.local`
- [ ] **Environment Variables**: Check all required env vars are documented and set correctly
- [ ] **API Server**: Restart API server after any Prisma/config changes

### Performance & Rendering Guidelines
- [ ] **Render UI immediately** - Don't wait for API calls, use default/empty state first
- [ ] **Check localStorage synchronously** - Use `useState(() => ...)` initializer for immediate checks
- [ ] **Load data non-blocking** - Fetch in background after initial render
- [ ] **Avoid hydration errors** - Never access `localStorage`/`window` in render, use `useEffect`

### Testing Requirements
- [ ] **Test in browser** - Not just terminal/API testing
- [ ] **Check browser console** - Verify no CORS errors, no hydration warnings
- [ ] **Test with different roles** - Super admin vs regular admin
- [ ] **Verify performance** - Sidebar/menu should render instantly (< 50ms)

## Phase overview (from master plan)

**Goal**: enable registration and management of projects and environments that can use the Issue Collector.

**Prerequisites**: IC-0 must be complete (monorepo, API, admin dashboard, database setup).

**Tech Stack**:
- **Backend**: Express.js API (`apps/api`)
- **Database**: Prisma ORM with PostgreSQL  
- **Frontend**: Next.js 15 Admin Dashboard (`apps/admin`)
- **Validation**: Zod (recommended) or express-validator

**Deliverables**:
- Implement `PROJECT` and `PROJECT_ENVIRONMENT` database tables (Prisma schema).
- Create REST API endpoints for project CRUD operations.
- Generate unique public/private keys for the collector snippet.
- Provide dashboard UI for project management (staff-only access).
- Enforce domain restrictions for allowed origins (per project configuration).

**User Context**:
- **Admin Dashboard**: Staff-only (developers, PMs, admins) - uses existing User/Role/Permission system
- **Projects**: Created per delivery/design letter - domains configured per project (not limited to z.com)
- **User Management**: Use existing User model from `infra/database/prisma/schema/user.prisma` - no separate project-specific users needed
- **Project-level Permissions**: Uses existing permission system - no project-specific access control in IC-1 (can add later if needed)

## Detailed tasks (from IC‑1 detail)

- Project table schema  
- Environment mapping  
- Public/private key generation  
- Project CRUD API  
- Dashboard page for project management  

## Development layers & workflow for this phase

AI agents should follow this order when implementing IC‑1 work:

1. **Create / adjust file structure**
   - Backend (`apps/api`):
     - Ensure `modules/project/` (or equivalent) exists with controller, service, validation, types, and routes files.
   - Admin (`apps/admin`):
     - Ensure `app/admin/projects/` routing structure exists for listing and editing projects.
   - Shared:
     - Add shared types for `Project` and `ProjectEnvironment` in `packages/types`.

2. **Implement base code (backend & types)**
   - **Database Schema** (`infra/database/prisma/schema/`):
     - **Step 1**: Create `project.prisma` file:
       ```prisma
       // infra/database/prisma/schema/project.prisma
       // Project Registration Models
       
       model Project {
         id            Int                  @id @default(autoincrement())
         name          String
         description   String?
         publicKey     String               @unique
         privateKey    String               @unique
         status        Boolean              @default(true)
         allowedDomains Json                // Array of allowed domains
         deletedAt     DateTime?            @map("deleted_at")
         createdAt     DateTime             @default(now()) @map("created_at")
         updatedAt     DateTime             @updatedAt @map("updated_at")
         environments  ProjectEnvironment[]
         
         @@map("projects")
       }
       
       model ProjectEnvironment {
         id            Int      @id @default(autoincrement())
         projectId     Int      @map("project_id")
         name          String   // dev, stage, prod, etc.
         apiUrl        String?  @map("api_url")
         allowedOrigins Json?   @map("allowed_origins")
         isActive      Boolean  @default(true) @map("is_active")
         createdAt     DateTime @default(now()) @map("created_at")
         updatedAt     DateTime @updatedAt @map("updated_at")
         project       Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
         
         @@unique([projectId, name])
         @@map("project_environments")
       }
       ```
     - **Step 2**: Generate Prisma Client: `pnpm db:generate`
     - **Step 3**: Create and apply migration: `pnpm db:migrate:dev --name add_project_models`
     - **Note**: See `infra/database/README.md` for detailed schema management guide
   - **Backend Service** (`apps/api/src/modules/project/`):
     - Implement `project.service.ts`:
       - `create()`: Create project with auto-generated keys
       - `update()`: Update project details
       - `list()`: List all projects (with pagination) - **staff-only access**
       - `getById()`: Get single project - **staff-only access**
       - `softDelete()`: Soft delete project
       - `generateKeys()`: Generate unique public/private key pair (using `nanoid` or `crypto.randomBytes`)
         - **Dual-key system**: Both `publicKey` (for frontend SDK) and `privateKey` (for backend admin usage) are generated
         - Format: `proj_` prefix + random string (e.g., `proj_abc123xyz`)
         - `publicKey`: Used by Collector SDK in frontend (`data-project-key` attribute)
         - `privateKey`: Reserved for future backend admin operations (not used in IC-1-IC-6)
         - Keys are **permanent** once created (regeneration not supported in IC-1)
         - Single key pair per project (no multiple keys support in IC-1)
     - Implement environment management methods:
       - `addEnvironment()`, `updateEnvironment()`, `removeEnvironment()`
   - **Validation** (`project.validation.ts`):
     - Use Zod schemas or express-validator for:
       - Project creation/update payloads
       - Domain validation:
         - **Validate at registration time** (on create/update)
         - Support exact domain matches (e.g., `app.example.com`)
         - **Wildcard support**: Optional per-project configuration (e.g., `*.example.com` if configured)
         - **Subdomain handling**: If `app.example.com` is allowed, subdomains like `staging.app.example.com` are **NOT automatically allowed** unless explicitly configured
         - Validate URL format and prevent invalid domains
       - Environment configuration validation:
         - Environment names: `dev`, `staging`, `prod`, `test` (standard names)
         - `apiUrl` is optional - defaults to main collector API if not specified
         - Per-environment `allowedOrigins` override project-level domains if specified
   - **Types** (`packages/types/src/project.types.ts`):
     - Export `Project`, `ProjectEnvironment`, `CreateProjectDto`, `UpdateProjectDto` types

3. **Create admin UI with dummy data (confirm before wiring)**
   - **Create route structure** (`apps/admin/app/admin/projects/`):
     - `page.tsx`: Projects list page
     - `[id]/page.tsx`: Project detail/edit page
     - `new/page.tsx`: Create new project page (optional, can use modal)
   - **Build UI components** using **static/mocked data**:
     - **Projects List** (`page.tsx`):
       - Table showing: Name, Public Key (truncated), Status, Environments, Created Date, Actions
       - **Use TanStack React Table** (`@tanstack/react-table@^8.21.3`) - see `docs/development/admin-ui-guidelines.md` → [Table Patterns](#table-patterns)
       - **Table structure**: Follow pattern from guidelines:
         - Use `TablePageLayout` and `TableToolbar` components
         - Create `ProjectTable.tsx` with TanStack React Table hooks
         - Create `ProjectTableColumns.tsx` for column definitions
         - Implement server-side sorting and pagination (`manualSorting: true`, `manualPagination: true`)
       - **Add "Create Project" button**: Use `Button` component with primary variant - see guidelines → [Button Patterns](#button-patterns)
     - **Project Form** (detail/edit page or modal):
       - **Use `FormLayout` component** - see guidelines → [Form Patterns](#form-patterns)
       - Fields: Name (`TextInput`), Description (`TextareaInput`), Allowed Domains (`ReactSelect` multi-select), Status toggle (`ToggleSwitch`)
       - Environment management section: Add/Edit/Remove environments (use `Button` with appropriate variants)
       - Display generated Public/Private keys (with copy button using `Button` variant="outline")
   - **Follow UI Guidelines** (`plan/phase/UI-GUIDELINES.md`):
     - **Buttons**: Use `Button` component from `@/components/ui/button/Button`
       - Primary actions: `variant="primary"` with `size="sm"` (Create, Save, Add)
       - Action buttons in table: Use `EditAction` (blue), `DeleteAction` (red), `StatusToggleAction` from `@/components/ui/table/actions`
       - EditAction uses blue color (`border-blue-200`, `text-blue-700`)
       - DeleteAction uses red color (`border-red-200`, `text-red-700`)
       - StatusToggleAction: Green with play icon for active, Gray with pause icon for inactive
     - **Tables**: Use TanStack React Table
       - Server-side sorting and pagination
       - Use `DTLoading` for loading states
       - Use `TablePageLayout` and `TableToolbar` for layout
       - **Actions column**: StatusToggleAction → EditAction → DeleteAction (in that order)
       - **Issues column**: Clickable link showing "X pending / Y total" format, links to `/admin/issues?projectId={id}`
       - **Removed columns**: Status (moved to Actions), Environments (removed from table)
     - **Forms**: Use form components from `@/components/form/inputs/`
       - `TextInput`, `TextareaInput`, `ReactSelect`, `ToggleSwitch`
       - Use `FormLayout` for form pages with breadcrumb navigation
       - **FormLayout**: Title left, breadcrumb right, description below title
       - **Form actions**: Place at bottom only, not in header
     - **Toast Notifications**: Use `useNotification` hook
       - Glass morphism design: `bg-white/50 dark:bg-gray-900/50` with `backdrop-blur-md`
       - Compact size: `max-w-xs`, `p-2.5`, `text-xs`
       - Auto-hide: 3 seconds default duration
       - Use `ToastContainer` with `onRemoveToast` prop (not `onRemove`)
     - **Styling**: Use TailAdmin design system with updated UI guidelines
   - Make sure the page runs correctly with dummy data only (no API calls).
   - **Confirm with the user** that the UI layout, fields, and workflows are correct before connecting to real APIs.

4. **Wire admin UI to real project APIs**
   - **API Client** (`apps/admin/lib/api/projects.ts`):
     - Create functions: `getProjects()`, `getProject(id)`, `createProject()`, `updateProject()`, `deleteProject()`
     - Use TanStack Query hooks: `useProjects()`, `useProject(id)`, `useCreateProject()`, etc.
   - **Connect UI to APIs**:
     - Replace mocked data with real API calls
     - **Loading states**: Use `DTLoading` for table loading, `PageLoading` for page loading - see `docs/development/admin-ui-guidelines.md` → [Loading States](#loading-states)
     - **Error handling**: Use `useNotification` hook for error/success messages - see guidelines → [Best Practices](#best-practices) → Error Handling
     - Implement success feedback (toast notifications using `useNotification`)
   - **Form handling**:
     - Use React Hook Form for form state management
     - Validate form data before submission
     - Handle API errors and display validation messages (show errors below inputs)
     - Use `FormLayout` component for form pages - see guidelines → [Form Patterns](#form-patterns)
   - **Table implementation**: Follow complete table example from guidelines - see `docs/development/admin-ui-guidelines.md` → [Table Patterns](#table-patterns) → Complete Table Implementation Example
   - **Enforce business rules**:
     - Validate allowed domains format in UI (exact matches, optional wildcards)
     - Prevent duplicate environment names per project
     - Show warning when deleting projects with active issues (if IC-5 is done) - use `Alert` component
     - **Access control**: Only staff users (with appropriate permissions) can manage projects
     - Use existing `adminAuthMiddleware` and `permissionMiddleware` for route protection

5. **Test code (non-browser)**
   - Add tests for:
     - Project service (CRUD, key generation).
     - Validation logic for project/environment payloads.
   - Run linting and type checks.

6. **Test in browser**
   - From the admin dashboard:
     - Create projects and environments.
     - Edit and (soft-)delete projects.
     - Confirm keys and allowed domains behave as expected.

7. **Clean up & document**
   - Remove unused mocks and temporary helpers.
   - Update API docs under `docs/api/admin/` for project endpoints:
     - Document all endpoints: `GET /api/admin/v1/projects`, `POST /api/admin/v1/projects`, etc.
     - Include request/response examples
     - Document authentication requirements
   - Document project registration flow in `docs/development/` as needed.
   - Update `docs/architecture/database-design.md` with project schema documentation.

## Acceptance Criteria

IC-1 is complete when:
- ✅ Database schema for projects and environments is created and migrated
- ✅ All CRUD API endpoints work correctly
- ✅ Public/private keys are generated securely and uniquely
- ✅ Admin UI displays projects list and allows create/edit/delete
- ✅ Domain validation works (both frontend and backend)
- ✅ Environment management works per project
- ✅ All tests pass (if tests are written)
- ✅ API documentation is updated

## API Endpoints (Expected)

**All endpoints require admin authentication** (JWT token via `adminAuthMiddleware`):

- `GET /api/admin/v1/projects` - List all projects (staff-only, paginated)
- `GET /api/admin/v1/projects/:id` - Get project details (staff-only)
- `POST /api/admin/v1/projects` - Create new project (staff-only, requires permission)
- `PATCH /api/admin/v1/projects/:id` - Update project (staff-only, requires permission)
- `DELETE /api/admin/v1/projects/:id` - Soft delete project (staff-only, requires permission)
- `POST /api/admin/v1/projects/:id/environments` - Add environment (staff-only)
- `PATCH /api/admin/v1/projects/:id/environments/:envId` - Update environment (staff-only)
- `DELETE /api/admin/v1/projects/:id/environments/:envId` - Remove environment (staff-only)

**Authentication**: All endpoints use existing `adminAuthMiddleware` and `permissionMiddleware` from `apps/api/src/shared/middlewares/`

## Next Phase

Once IC-1 is complete, proceed to **IC-2: Collector SDK (Basic)** which will use the project keys for authentication.


