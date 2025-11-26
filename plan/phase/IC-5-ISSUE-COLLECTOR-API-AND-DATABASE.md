# PHASE IC-5 — ISSUE COLLECTOR API & DATABASE

> AI agent–oriented phase plan. **1 phase = 1 file.**  
> Use this together with `plan/idea/phase_IC_5_detail.txt`, the stack list, and the project overview.

## Critical Development Guidelines

**⚠️ IMPORTANT**: Before starting development, review `plan/phase/DEVELOPMENT-GUIDELINES-AND-LESSONS-LEARNED.md` for critical lessons learned.

### Pre-Development Checklist
- [ ] **Database Schema**: Create `issue.prisma`, run `pnpm db:merge` → `pnpm db:generate` → `pnpm db:push`
- [ ] **Storage Setup**: Configure S3/MinIO or local storage, test upload/download
- [ ] **Queue Setup**: Configure BullMQ + Redis for background processing
- [ ] **CORS Configuration**: Verify public API allows cross-origin requests
- [ ] **Domain Validation**: Test project key and origin validation logic

### API Development Guidelines
- [ ] **Public API**: No authentication required (project key validation only)
- [ ] **Admin API**: Use `adminAuthMiddleware` for staff-only endpoints
- [ ] **Error Handling**: Proper error responses with clear messages
- [ ] **Rate Limiting**: Consider rate limiting for public API (optional in IC-5)
- [ ] **Signed URLs**: Implement signed URLs with expiration for screenshots

### Testing Requirements
- [ ] **Test in browser** - Submit issues from SDK, verify storage
- [ ] **Test domain validation** - Verify allowed/blocked domains work
- [ ] **Test storage** - Verify screenshots stored correctly (local/S3)
- [ ] **Test background jobs** - Verify queue processing works

## Phase overview (from master plan)

**Goal**: implement the core Issue Collector API and persistence layer for issues, logs, and screenshots.

**Prerequisites**: 
- IC-1 must be complete (project registration)
- IC-2 must be complete (collector SDK basic submission)
- IC-3 and IC-4 can be done in parallel or before IC-5

**Tech Stack**:
- **Backend**: Express.js API (`apps/api`)
- **Database**: Prisma ORM with PostgreSQL
- **Storage**: Local filesystem (dev) or S3/MinIO (production)
- **Queue**: BullMQ + Redis (for background processing)

**Deliverables**:
- Create `ISSUE`, `ISSUE_LOG`, `ISSUE_SCREENSHOT` database tables (Prisma schema).
- Store screenshots in S3/MinIO (or local filesystem for dev).
- Store logs and related metadata.
- Implement `GET/POST/PATCH` REST endpoints for issues.
- Validate project key and allowed domains.
- Add background tasks for processing (screenshot optimization, log normalization).

**API Authentication & Storage Decisions**:
- **Public API**: Project key validation only (no additional authentication required)
- **Rate limiting**: Not implemented in IC-5 (can be added later if needed)
- **Screenshot storage**: Screenshots require **authentication** (signed URLs with expiration, not publicly accessible)
- **Assignment**: Use existing User model (`assigneeId` references User.id) - single assignee per issue
- **Status workflow**: **4-step workflow** (`open` → `in-progress` → `resolved` → `closed`) - issues can be reopened from `closed` to `open`
  - Simple workflow for MVP (no complex states like "In Review", "QA Testing")
  - Custom statuses can be added later if needed
- **Issue title**: **Required from SDK** - no auto-generation in IC-5 (title must be provided by user)
- **Domain validation**: **Reject unregistered domains** - return 403 Forbidden if origin not in allowed domains
- **HTTPS enforcement**: **Enforce HTTPS in production** - reject non-HTTPS requests in production environment
- **Virus scanning**: **Not implemented in IC-5** - screenshots are images only (can add virus scanning later if needed)
- **Retention policy**: **Not implemented in IC-5** - no automatic archiving or deletion (can add retention policy later)
- **Background processing**: BullMQ workers run **within API process** (simpler for IC-5; can separate later if needed)
- **Job priority**: FIFO queue (no priority levels in IC-5; can add priority later if needed)
- **Scale expectations**: Optimize for small-to-medium scale initially (can optimize later based on actual usage)
- **Archive strategy**: Not implemented in IC-5 (can add archive feature later if needed)
- **Soft deletes**: Issues use **hard deletes** (cascade delete screenshots/logs) - soft deletes can be added later if needed

## Detailed tasks (from IC‑5 detail)

- Issue schema  
- Screenshot storage (S3/MinIO)  
- Logs storage  
- `POST /issues`  
- `GET /issues`  
- Status updates  

## Development layers & workflow for this phase

AI agents should follow this order when implementing IC‑5 work:

1. **Create / adjust file structure**
   - Backend (`apps/api`):
     - Ensure issue module (`modules/issue/`) exists with controller, service, validation, types, and routes (public/admin).
   - Database:
     - Add or update schema definitions and migrations for issue-related tables.
   - Storage:
     - Ensure storage utilities for S3/MinIO (screenshots) exist in shared utils or dedicated storage module.

2. **Implement base code (API + persistence)**
   - **Database Schema** (`infra/database/prisma/schema/`):
     - **Step 1**: Create `issue.prisma` file:
       ```prisma
       // infra/database/prisma/schema/issue.prisma
       // Issue Collector Models
       
       model Issue {
         id            Int               @id @default(autoincrement())
         projectId     Int               @map("project_id")
         title         String
         description   String?
         severity      String            // low, medium, high, critical
         status        String            @default("open") // open, in-progress, resolved, closed
         assigneeId    Int?              @map("assignee_id")
         reporterInfo  Json?             @map("reporter_info")
         metadata      Json?
         createdAt     DateTime          @default(now()) @map("created_at")
         updatedAt     DateTime          @updatedAt @map("updated_at")
         project       Project           @relation(fields: [projectId], references: [id], onDelete: Cascade)
         screenshots   IssueScreenshot[]
         logs          IssueLog[]
         
         @@index([projectId])
         @@index([status])
         @@index([severity])
         @@index([createdAt])
         @@map("issues")
       }
       
       model IssueScreenshot {
         id            Int      @id @default(autoincrement())
         issueId       Int      @map("issue_id")
         storagePath   String   @map("storage_path")
         storageType   String   @map("storage_type") // local, s3
         mimeType      String?  @map("mime_type")
         width         Int?
         height        Int?
         elementSelector String? @map("element_selector")
         elementHtml   String?  @map("element_html")
         createdAt     DateTime @default(now()) @map("created_at")
         issue         Issue    @relation(fields: [issueId], references: [id], onDelete: Cascade)
         
         @@index([issueId])
         @@map("issue_screenshots")
       }
       
       model IssueLog {
         id        Int      @id @default(autoincrement())
         issueId   Int      @map("issue_id")
         level     String   // log, warn, error
         message   String
         stack     String?
         metadata  Json?
         timestamp DateTime
         createdAt DateTime @default(now()) @map("created_at")
         issue     Issue    @relation(fields: [issueId], references: [id], onDelete: Cascade)
         
         @@index([issueId])
         @@index([level])
         @@map("issue_logs")
       }
       ```
       - **Note**: Add `issues Issue[]` relation to `Project` model in `project.prisma` if not already present
     - **Step 2**: Generate Prisma Client: `pnpm db:generate`
     - **Step 3**: Create and apply migration: `pnpm db:migrate:dev --name add_issue_models`
     - **Note**: See `infra/database/README.md` for detailed schema management guide
   - **Backend Service** (`apps/api/src/modules/issue/`):
     - Implement `issue.service.ts`:
       - `create()`: Create issue with validation
         - **Title**: Required from SDK (no auto-generation in IC-5)
         - Validate title is not empty
         - Validate project key and allowed origin before creating
       - `list()`: List issues with filters (project, status, severity, pagination) - **staff-only**
       - `getById()`: Get issue with screenshots and logs - **staff-only**
       - `updateStatus()`: Update issue status (supports reopening: `closed` → `open`)
       - `assign()`: Assign issue to user (single assignee, uses User.id)
       - `attachScreenshot()`: Save screenshot and create record
       - `attachLogs()`: Save logs array
       - **Status workflow**: Fixed statuses (`open`, `in-progress`, `resolved`, `closed`) - custom statuses not supported in IC-5
       - **Retention policy**: Not implemented in IC-5 (no automatic archiving or deletion)
     - Implement `project.service.ts` validation:
       - `validateProjectKey()`: Verify project key exists and is active
         - **Authentication**: Project key in payload is sufficient (no additional API key)
         - **Rate limiting**: Not implemented in IC-5 (can be added later)
       - `validateAllowedOrigin()`: Check if origin is in allowed domains
         - Validate against project-level `allowedDomains` array
         - Check per-environment `allowedOrigins` if specified
         - Support exact matches and wildcards (if configured per project)
         - Subdomains are NOT automatically allowed (must be explicitly configured)
         - **Reject unregistered domains**: Return 403 Forbidden if origin is not in allowed domains
         - Log rejected submissions for security monitoring
   - **Storage Integration** (`apps/api/src/shared/storage/`):
     - Create storage utility for saving screenshots:
       - **Local development**: `storage/uploads/screenshots/{issueId}/{filename}` (relative to project root)
       - **Production**: S3/MinIO - upload to bucket and return URL
       - **Storage selection**: Use environment variable to determine storage type (local vs S3)
       - **S3/MinIO Configuration**: 
         - Use environment variables for credentials (`S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`)
         - AI can generate default local MinIO credentials for development if not provided
         - Production should use actual S3/MinIO credentials from `.env`
     - **Upload Method**: Receive Base64 from SDK → decode → upload to S3/MinIO → store URL in database
     - **Screenshot access**: 
       - Screenshots are **NOT publicly accessible**
       - Generate signed URLs with expiration (e.g., 1 hour) for admin dashboard access
       - Use S3 presigned URLs for S3 storage, or custom signed URL generation for local storage
     - Store storage path/URL in database
     - **File size limits**: Enforce 10MB max per screenshot (reject larger files)
   - **Background Processing** (`apps/api/src/shared/queue/`):
     - Set up BullMQ queue with Redis connection
     - **Worker process**: Run workers **within API process** (simpler for IC-5)
     - **Job priority**: FIFO queue (no priority levels in IC-5)
     - Background tasks:
       - Screenshot optimization (resize/compress if needed)
       - Log normalization (format/clean logs)
       - Notification jobs (deferred to IC-7)
   - **API Endpoints**:
     - **Public API** (no authentication required, project key validation only):
       - `POST /api/public/v1/issues` - Submit new issue (project key in payload)
     - **Admin API** (requires JWT authentication via `adminAuthMiddleware`):
       - `GET /api/admin/v1/issues` - List issues (with filters: project, status, severity, pagination)
       - `GET /api/admin/v1/issues/:id` - Get issue details (with screenshots and logs)
       - `PATCH /api/admin/v1/issues/:id` - Update issue (status, assignee, etc.)
       - `POST /api/admin/v1/issues/:id/comments` - Add comment to issue

3. **Create admin UI with dummy data (confirm before real API wiring)**
   - If IC‑6 dashboard is not implemented yet, create temporary/admin-only views that:
     - Show a table of **mocked issues** with basic fields (id, title, status, createdAt).
     - Show a dummy detail view with placeholder screenshot and logs.
   - Use static/mock data only at this step.
   - **Follow UI Guidelines** (`plan/phase/UI-GUIDELINES.md`):
     - Use established button, table, and form patterns
     - Follow toast notification guidelines for feedback
     - Use FormLayout with breadcrumbs for detail pages
   - **Confirm with the user** that the fields and basic layout align with expectations before wiring to real endpoints.

4. **Wire admin UI and SDK to real API**
   - Connect SDK submissions to `POST /issues`.
   - Connect admin issue list/detail UI to `GET /issues` and update endpoints.
   - Ensure pagination and basic filters are supported via API parameters.

5. **Test code (non-browser)**
   - Add tests for:
     - Issue service logic.
     - Validation and domain checks.
     - Screenshot/storage handling (mocked S3/MinIO).
   - Run migrations in a test environment to verify schema correctness.

6. **Test in browser**
   - Submit issues from a test application using the SDK.
   - Verify issues appear correctly in the admin interface (once wired).
   - Confirm screenshots and logs are retrievable and linked correctly.

7. **Clean up & document**
   - Remove temporary endpoints or debug routes.
   - Document issue API in `docs/api/public/issues.md` and `docs/api/admin/issues.md`:
     - Request/response formats
     - Authentication requirements
     - Error codes and messages
   - Update `docs/architecture/database-design.md` with issue schema documentation.
   - Document storage flow in `docs/architecture/storage.md` (if file exists).

## Acceptance Criteria

IC-5 is complete when:
- ✅ Database schema for issues, screenshots, and logs is created and migrated
- ✅ Public API endpoint accepts issue submissions from SDK
- ✅ Project key and origin validation works correctly
- ✅ Screenshots are stored successfully (local or S3)
- ✅ Logs are stored and linked to issues
- ✅ Admin API endpoints work for listing/viewing/updating issues
- ✅ Background processing tasks are set up (BullMQ workers in same process, FIFO queue)
- ✅ Screenshot signed URLs work correctly (with expiration)
- ✅ All tests pass (if tests are written)
- ✅ API documentation is complete

**Note**: Performance optimizations, archive features, and advanced background processing can be added later based on actual usage patterns.

## API Endpoints (Expected)

**Public API** (for Collector SDK - no authentication required):
- `POST /api/public/v1/issues` - Submit new issue
  - Authentication: Project key validation only (key in request payload)
  - Rate limiting: Not implemented in IC-5

**Admin API** (requires JWT authentication - staff-only):
- `GET /api/admin/v1/issues` - List issues (with filters: project, status, severity, pagination)
- `GET /api/admin/v1/issues/:id` - Get issue details (with screenshots and logs)
- `PATCH /api/admin/v1/issues/:id` - Update issue (status, assignee, etc.)
- `POST /api/admin/v1/issues/:id/comments` - Add comment to issue

## Next Phase

Once IC-5 is complete, proceed to **IC-6: Issue Dashboard** which will provide the UI for managing issues.


