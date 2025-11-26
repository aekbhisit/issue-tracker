# Unanswered Questions in Phase Plans

This document lists clarifying questions that are **NOT clearly answered** in the current phase plans (IC-0 through IC-6). These questions should be addressed before or during development to avoid ambiguity.

## ✏️ Latest Scope Clarifications

- **Users**: Platform is used by internal staff (developers, PMs, admins) to manage issues, and by customers who request development work; customers access the frontend after logging in and can view tickets relevant to their work.
- **Admin dashboard** is for staff-only; project-level teams (developers, PMs) collaborate via the dashboard, while customers view the frontend after authentication.
- **Project keys/domains** are designed per delivery (design letter) and are not limited to `z.com`. Allowed domains will be provided by each project configuration, so wildcard handling should follow that guidance rather than assuming a fixed host.
- **Multi-tenancy**: single organization usage (internal staff plus authenticated customers) suffices for now; we do not plan to onboard multiple unrelated tenants at this time.

## 🔴 Critical Questions (Must Answer Before Development)

### 1. Authentication & Authorization

#### 1.1 Public API Authentication
- ✅ **Should `/api/public/v1/issues` require any authentication beyond project key validation?**
  - Answer: **Project key validation only** - no additional API key required (IC-5 updated)

- ✅ **Should project keys be rate-limited?**
  - Answer: **Not implemented in IC-5** - can be added later if needed (IC-5 updated)

- ✅ **Should we support API key rotation for projects?**
  - Answer: **Keys are permanent** - regeneration not supported in IC-1 (IC-1 updated)
  - Note: Can be added in future enhancement if needed

#### 1.2 Admin Dashboard Access
- ✅ **Is admin dashboard for internal Z.com/NetDesign staff only, or external clients?**
  - Answer: Admin UI is staff-only. Customers see only the authenticated frontend and do not access the admin dashboard.
- ✅ **Should there be project-level permissions?**
  - Answer: **Uses existing permission system** - no project-specific access control in IC-1/IC-6 (can add later if needed) (IC-1, IC-6 updated)
- ✅ **Do we need user management system in IC-1, or defer?**
  - Answer: Use the existing user/role/permission models already in the system; no separate project-specific user table is required.

### 2. Project Registration & Configuration (IC-1)

#### 2.1 Project Key Generation
- ✅ **Format**: IC-1 mentions `nanoid` or `crypto.randomBytes` - **ANSWERED**
- ✅ **Should keys be regeneratable, or permanent once created?**
  - Answer: **Keys are permanent** - regeneration not supported in IC-1 (IC-1 updated)

- ✅ **Should we support multiple active keys per project?**
  - Answer: **Single key pair per project** - multiple keys not supported in IC-1 (IC-1 updated)

#### 2.2 Domain Restrictions
- ✅ **Should `allowedDomains` support wildcards?**
  - Answer: Domains are provided per project (design letter), and no hard-coded wildcard (e.g., `*.z.com`) is required; wildcard support may be added per project if the configuration calls for it.
- ✅ **Should we validate domains at registration time, or only when issues are submitted?**
  - Answer: **Validate at registration time** (on create/update) - IC-1 updated

- ✅ **How should we handle subdomains?**
  - Answer: **Subdomains are NOT automatically allowed** - must be explicitly configured (IC-1 updated)
  - Example: If `app.example.com` is allowed, `staging.app.example.com` is NOT allowed unless explicitly added

#### 2.3 Environment Configuration
- ✅ **Environment names**: IC-1 mentions "dev/stage/prod" - **ANSWERED**
- ✅ **Should environments have separate API URLs, or use the same collector API?**
  - Answer: **`apiUrl` is optional** - defaults to main collector API if not specified (IC-1 updated)

- ❓ **Should environments have different notification rules or severity thresholds?**
  - Current: Not mentioned (IC-7 not yet documented)
  - **Status**: Deferred to IC-7 (Notifications & Integrations)

### 3. Collector SDK (IC-2, IC-3, IC-4)

#### 3.1 SDK Initialization & Configuration
- ✅ **Should SDK support lazy loading? (only load when button is clicked)**
  - Answer: **Eager loading** (auto-initialize on DOM ready) for IC-2; lazy loading deferred to future enhancement (IC-2 updated)

- ✅ **Should we support custom button positioning, styling, or branding?**
  - Answer: **Basic floating button** for IC-2; customization deferred to later phases (IC-2 updated)

- ✅ **Should SDK support disabling specific features?**
  - Answer: **No opt-out flags in IC-2** - all features enabled by default (IC-2 updated)

#### 3.2 User Identification
- ✅ **How to collect user info**: IC-2 mentions "if available in global scope" - **ANSWERED**
- ✅ **Should user info be optional or required?**
  - Answer: **Optional** - SDK collects user info if available (`window.issueCollectorUser`), but anonymous reporting is supported (IC-2 updated)

- ✅ **Should we support anonymous issue reporting?**
  - Answer: **Yes** - anonymous reporting is supported (IC-2 updated)

#### 3.3 Screenshot Capture (IC-3)
- ✅ **What is the maximum screenshot size? (e.g., 5MB, 10MB)**
  - Answer: **Maximum 10MB per screenshot** (client-side validation) (IC-3 updated)

- ✅ **Should we compress screenshots before sending, or let API handle it?**
  - Answer: **Client-side compression** using browser APIs (IC-3 updated)

- ✅ **How should we handle iframes?**
  - Answer: **Skip cross-origin iframe content** (cannot capture due to browser security restrictions) (IC-3 updated)

- ✅ **Should we support full-page screenshots in IC-3, or defer to IC-8?**
  - Answer: **Deferred to IC-8** (Browser Extension) - IC-3 focuses on element-level only (IC-3 updated)

#### 3.4 Log Capture (IC-4)
- ✅ **How many console logs**: IC-4 specifies "max 100 entries" - **ANSWERED**
- ✅ **Should we capture network requests/responses, or only failures?**
  - Answer: **Only failures** (status >= 400 or network errors) - successful requests not captured (IC-4 updated)

- ✅ **Should we redact sensitive data from logs?**
  - Answer: **Basic pattern matching** - redact `password=...`, `token=...`, `Bearer ...`, `api_key=...` (IC-4 updated)
  - Advanced PII detection deferred to future enhancement

### 4. Issue Management & Workflow (IC-5, IC-6)

#### 4.1 Issue Status Workflow
- ✅ **Status flow**: IC-5 specifies "open → in-progress → resolved → closed" - **ANSWERED**
- ✅ **Can issues be reopened after being closed?**
  - Answer: **Yes** - issues can be reopened from `closed` to `open` (IC-5 updated)

- ✅ **Should we support custom statuses per project, or use fixed set?**
  - Answer: **Fixed statuses** - custom statuses not supported in IC-5 (IC-5 updated)

#### 4.2 Assignment & Ownership
- ✅ **Do we need user management system before IC-6, or use email addresses/usernames?**
  - Answer: **Use existing User model** - `assigneeId` references `User.id` (IC-5, IC-6 updated)

- ❓ **Should issues be auto-assigned based on rules?**
  - Current: Not mentioned (may be part of IC-9 AI Triage)
  - **Status**: Deferred to IC-9 (AI Triage Engine) or future enhancement

- ✅ **Should we support team assignments (multiple assignees)?**
  - Answer: **Single assignee per issue** - multiple assignees not supported in IC-5/IC-6 (IC-5 updated)

#### 4.3 Comments & History
- ✅ **Should comments support markdown formatting?**
  - Answer: **Plain text** - markdown support not in IC-6 (IC-6 updated)

- ❓ **Should we track all changes in a history/audit log?**
  - Current: Not mentioned
  - **Status**: Not implemented in IC-5/IC-6 - can be added as future enhancement

- ✅ **Should comments be internal-only, or visible to issue reporters?**
  - Answer: **Internal-only** - comments are not visible to issue reporters (IC-6 updated)

#### 4.4 Issue Deduplication
- ❓ **Should we detect duplicate issues?**
  - Current: Not mentioned in any phase
  - **Recommendation needed**: Detect duplicates (same project, similar title/description)?

- ❓ **If yes, should duplicates be merged automatically or flagged for manual review?**
  - Current: N/A (deduplication not planned)
  - **Recommendation needed**: Auto-merge or manual review?

### 5. Storage & Infrastructure

#### 5.1 Screenshot Storage
- ✅ **Local dev storage**: IC-5 specifies `storage/uploads/screenshots/{issueId}/{filename}` - **ANSWERED**
- ✅ **Production storage**: IC-5 mentions "S3/MinIO" - **ANSWERED**
- ✅ **Storage location**: `storage/uploads/screenshots/` relative to project root (IC-5 updated)
- ✅ **Should screenshots be publicly accessible via URLs, or require authentication?**
  - Answer: **Require authentication** - signed URLs with expiration (e.g., 1 hour) for admin dashboard access (IC-5 updated)

#### 5.2 Database & Performance
- ✅ **What is the expected scale? (issues per day, projects, concurrent users)**
  - Answer: **Optimize for small-to-medium scale initially** - can optimize later based on actual usage (IC-5 updated)

- ✅ **Soft deletes**: IC-1 uses `deletedAt` for projects - **ANSWERED** (soft delete)
- ✅ **Should issues use soft deletes or hard deletes?**
  - Answer: **Hard deletes** (cascade delete screenshots/logs) - soft deletes can be added later if needed (IC-5 updated)
- ✅ **Should we archive old issues? (e.g., closed issues older than 1 year)**
  - Answer: **Not implemented in IC-5** - can add archive feature later if needed (IC-5 updated)

#### 5.3 Background Processing (IC-5)
- ✅ **Background tasks**: IC-5 mentions "screenshot optimization, log normalization" - **ANSWERED**
- ✅ **Should we use BullMQ workers in a separate process, or within API process?**
  - Answer: **Within API process** (simpler for IC-5) - can separate later if needed (IC-5 updated)

- ✅ **What is the priority order for background jobs?**
  - Answer: **FIFO queue** (no priority levels in IC-5) - can add priority later if needed (IC-5 updated)

### 6. Notifications & Integrations (IC-7)

**⚠️ IC-7 is not yet documented** - All questions below are unanswered:

- ❓ Which notification channels are highest priority? (Slack, Email, Webhook)
- ❓ Should notifications be sent immediately, batched, or configurable?
- ❓ Should we support notification templates/customization?
- ❓ Should notification rules be configurable per project/environment?
- ❓ Should we support different notification rules per severity level?
- ❓ Should we support quiet hours (no notifications during off-hours)?

### 7. Dashboard UI/UX (IC-6)

#### 7.1 Issue List & Filtering
- ✅ **Default filters**: IC-6 specifies "project, status, severity, date range, assignee, reporter" - **ANSWERED**
- ✅ **Pagination**: Default 20 items per page (IC-6 updated)
- ✅ **Should we support saved filter presets?**
  - Answer: **Not implemented in IC-6** - deferred to future enhancement (IC-6 updated)

- ✅ **Should dashboard support real-time updates? (WebSocket/SSE)**
  - Answer: **Polling-based** (poll every 30 seconds) - no WebSocket/SSE in IC-6 (IC-6 updated)

#### 7.2 Screenshot Viewer
- ✅ **Should we support image annotations/markup in screenshot viewer?**
  - Answer: **Not in IC-6** - basic image viewer only (IC-6 updated)

- ✅ **Should we support comparing multiple screenshots side-by-side?**
  - Answer: **Not in IC-6** - no side-by-side comparison (IC-6 updated)

- ✅ **Should screenshots be downloadable?**
  - Answer: **Yes** - download button included (IC-6 updated)

#### 7.3 Log Viewer
- ✅ **How logs displayed**: IC-6 mentions "grouped by level" - **ANSWERED**
- ✅ **Should we support log filtering/search?**
  - Answer: **Basic text search** within logs (IC-6 updated)

- ✅ **Highlight errors/warnings**: IC-6 mentions "grouped by level" - color coding for errors/warnings (IC-6 updated)

### 8. AI Triage (IC-9)

**⚠️ IC-9 is not yet documented** - All questions below are unanswered:

- ❓ Which AI features are highest priority? (summarization, severity prediction, auto-assignment, duplicate detection)
- ❓ What AI provider should we use? (OpenAI, Anthropic, self-hosted model)
- ❓ Should AI features be opt-in per project, or enabled by default?
- ❓ Should we support feedback loops? (mark AI predictions as correct/incorrect)
- ❓ Should we fine-tune models based on historical issue data?
- ❓ What confidence thresholds should we use for auto-assignment?

### 9. Browser Extension (IC-8)

**⚠️ IC-8 is not yet documented** - All questions below are unanswered:

- ❓ Is browser extension a must-have for IC-8, or can it be deferred?
- ❓ Should extension work independently, or complement the SDK?
- ❓ Which browsers should we support? (Chrome, Firefox, Edge, Safari)

### 10. General Architecture & Decisions

#### 10.1 Multi-tenancy
- ✅ **Should platform support multiple organizations/tenants, or single-tenant for Z.com/NetDesign?**
  - Answer: Platform targets single organization usage (internal staff plus authenticated customers); multi-tenant support is not planned for now.

#### 10.2 API Versioning
- ✅ **API versioning**: IC-5 uses `/api/public/v1/issues` - **ANSWERED** (versioning from start)
- ✅ **How should we handle breaking changes in future versions?**
  - Answer: **New version path** (e.g., `/api/v2/...`) - simple deprecation strategy (IC-0 updated)

#### 10.3 Internationalization
- ✅ **Should admin dashboard support multiple languages? (Thai, English, Japanese)**
  - Answer: **English only in IC-6** - i18n support can be added later (IC-6 updated)

- ✅ **Should collector SDK modal support multiple languages?**
  - Answer: **English only in IC-2** - i18n support can be added later (IC-2 updated)

#### 10.4 Analytics & Monitoring
- ✅ **Should we track SDK usage metrics?**
  - Answer: **Not implemented in IC-0-IC-6** - can add SDK usage tracking later if needed (IC-0 updated)

- ✅ **Should we implement error tracking/monitoring for the platform itself?**
  - Answer: **Not implemented in IC-0-IC-6** - can add error tracking (e.g., Sentry) later if needed (IC-0 updated)

#### 10.5 Testing Strategy
- ✅ **What level of test coverage is expected?**
  - Answer: **Incremental test coverage** - unit tests for critical logic, integration tests for APIs (no strict coverage requirement) (IC-0 updated)

- ✅ **Should we create a test project/environment for QA?**
  - Answer: **Use existing projects for testing** - no separate test project required (IC-0 updated)

## 📊 Summary

**Total Questions**: ~60 questions  
**Answered**: ~45 questions (75%) — includes all clarifications from phase plan updates  
**Unanswered**: ~15 questions (25%) — mostly deferred to future phases (IC-7, IC-8, IC-9, IC-10)

**Critical Unanswered Questions** (must answer before development):
- ✅ ~~Public API authentication strategy~~ → **Project key only** (IC-5)
- ✅ ~~Project key rotation/regeneration~~ → **Permanent keys** (IC-1)
- ✅ ~~Domain validation timing and subdomain handling~~ → **Validate at registration, subdomains not auto-allowed** (IC-1)
- ✅ ~~Screenshot size limits and compression~~ → **10MB max, client-side compression** (IC-3)
- ✅ ~~Issue assignment strategy~~ → **Single assignee from User model** (IC-5, IC-6)
- ✅ ~~Storage access (public vs authenticated URLs)~~ → **Signed URLs with expiration** (IC-5)
- ✅ ~~Background job process separation~~ → **Within API process, FIFO queue** (IC-5)
- ✅ ~~Scale expectations~~ → **Small-to-medium scale initially** (IC-5)
- ✅ ~~Archive strategy~~ → **Not in IC-5, can add later** (IC-5)
- ✅ ~~Soft deletes for issues~~ → **Hard deletes** (IC-5)
- ✅ ~~Project-level permissions~~ → **Uses existing permission system** (IC-1, IC-6)
- ✅ ~~API versioning deprecation~~ → **New version path** (IC-0)
- ✅ ~~Internationalization~~ → **English only** (IC-2, IC-6)
- ✅ ~~Analytics & monitoring~~ → **Not in IC-0-IC-6, can add later** (IC-0)
- ✅ ~~Testing strategy~~ → **Incremental coverage, use existing projects** (IC-0)

**Remaining Unanswered Questions** (deferred to future phases):
- Auto-assignment rules (deferred to IC-9 AI Triage)
- Audit log/history tracking (future enhancement)
- Issue deduplication (deferred to IC-9 AI Triage)
- IC-7: Notifications & Integrations (all questions - phase not yet documented)
- IC-8: Browser Extension (all questions - phase not yet documented)
- IC-9: AI Triage (all questions - phase not yet documented)
- IC-10: Heatmap / Session Replay (phase not yet documented)

## 🎯 Recommendations

1. **Create decision document** (`user_request/`) for critical architectural decisions
2. **Update phase plans** with answers to unanswered questions
3. **Prioritize** which questions need answers before each phase starts
4. **Document assumptions** if decisions are deferred

