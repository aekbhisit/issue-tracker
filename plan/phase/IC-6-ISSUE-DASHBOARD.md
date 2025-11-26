# PHASE IC-6 — ISSUE DASHBOARD

> AI agent–oriented phase plan. **1 phase = 1 file.**  
> Use this together with `plan/idea/phase_IC_6_detail.txt`, the stack list, and the project overview.

## Critical Development Guidelines

**⚠️ IMPORTANT**: Before starting development, review `plan/phase/DEVELOPMENT-GUIDELINES-AND-LESSONS-LEARNED.md` for critical lessons learned from IC-0 and IC-1.

### Pre-Development Checklist
- [ ] **API Endpoints**: Verify issue API endpoints exist and work correctly
- [ ] **CORS Configuration**: Verify `ALLOWED_ORIGINS` includes port 4502
- [ ] **Database**: Ensure issue tables exist and are accessible
- [ ] **Authentication**: Verify admin authentication works correctly

### Performance & Rendering Guidelines
- [ ] **Render UI immediately** - Don't wait for API calls, show empty/default state first
- [ ] **Table loading** - Use `DTLoading` component, non-blocking
- [ ] **Pagination** - Server-side pagination, don't load all issues at once
- [ ] **Screenshot loading** - Lazy load screenshots, use signed URLs
- [ ] **Avoid hydration errors** - No `localStorage`/`window` access in render

### Testing Requirements
- [ ] **Test in browser** - Navigate through issue list and detail pages
- [ ] **Test filters** - Verify all filters work correctly
- [ ] **Test pagination** - Verify server-side pagination works
- [ ] **Test screenshots** - Verify signed URLs work and images load
- [ ] **Test performance** - Verify no blocking operations, fast initial render

## Phase overview (from master plan)

**Goal**: provide a central developer/admin dashboard for managing issues.

**Prerequisites**: IC-5 must be complete (issue API and database).

**Tech Stack**:
- **Frontend**: Next.js 15 Admin Dashboard (`apps/admin`)
- **UI Components**: TailAdmin theme, shadcn/ui
- **Tables**: TanStack React Table
- **State Management**: TanStack Query for data fetching
- **API**: Express.js backend (`apps/api`)

**User Context**:
- **Dashboard Access**: Staff-only (developers, PMs, admins) - uses existing authentication system
- **User Management**: Use existing User model - assignees selected from User table (single assignee per issue)
- **User Roles**: **Use existing roles** (Super Admin, Admin, etc.) - no new roles needed for IC-6
  - Existing permission-based access control applies
  - No new roles like "Tester", "Developer", "PM" needed (use existing role system)
- **Customer Access**: Customers view issues via frontend (`apps/frontend`) after login - not via admin dashboard
- **Visibility Rules**: **All staff can see all issues** - no project-level restrictions in IC-6
  - All authenticated staff users can view all issues regardless of project assignment
  - Project-level access control can be added later if needed
- **Project-level Permissions**: Uses existing permission system - no project-specific access control in IC-6 (can add later if needed)
- **Internationalization**: Admin dashboard uses English only in IC-6 (i18n support can be added later)
- **Dashboard Concurrency**: Optimize for **10-50 concurrent users** - reasonable for internal tool

**Deliverables**:
- Project selector and filtering.
- Issue table with pagination.
- Detailed issue view with screenshot & logs.
- Status update workflow (open → in-progress → resolved → closed, can reopen).
- Assignment to team members (single assignee, from User table).
- Internal comments (plain text, internal-only, not visible to reporters).

## Detailed tasks (from IC‑6 detail)

- Issue list with filters  
- Issue detail view  
- Screenshot viewer  
- Log viewer  
- Status/assignee workflow  

## Development layers & workflow for this phase

AI agents should follow this order when implementing IC‑6 work:

1. **Create / adjust file structure**
   - Admin (`apps/admin`):
     - Ensure `app/admin/issues/` (list) and `app/admin/issues/[id]/` (detail) routes exist.
     - Define table/column components under a feature-focused folder (e.g. `components/issues/`).
   - Shared types:
     - Extend `packages/types` with issue view models if needed (including status, assignee, etc.).

2. **Implement base code (data layer & hooks)**
   - **API Client** (`apps/admin/lib/api/issues.ts`):
     - `getIssues(params)`: Fetch paginated issues with filters (requires admin auth)
     - `getIssue(id)`: Fetch single issue with screenshots and logs (requires admin auth)
     - `updateIssue(id, data)`: Update issue (status, assignee, etc.) - requires admin auth
     - `addComment(issueId, comment)`: Add comment to issue (plain text, internal-only)
     - `getScreenshotUrl(issueId, screenshotId)`: Get signed URL for screenshot (with expiration)
   - **React Query Hooks** (`apps/admin/hooks/useIssues.ts`):
     - `useIssues(filters)`: Query hook for issue list
     - `useIssue(id)`: Query hook for single issue
     - `useUpdateIssue()`: Mutation hook for updating
     - `useAddComment()`: Mutation hook for comments
   - **Filter/Sort Logic**:
     - Support filters: project, status, severity, date range, assignee, reporter (if available)
     - Support sorting: createdAt, updatedAt, severity
     - Support pagination: page, limit (default: 20 items per page)
     - **Saved filters**: Not implemented in IC-6 (deferred to future enhancement)
     - **Real-time updates**: Polling-based (poll every 30 seconds) - no WebSocket/SSE in IC-6

3. **Create UI with dummy data (confirm before real backend wiring)**
   - Build the dashboard UI using **mocked issue data only**:
     - **Issue List Page** (`app/admin/issues/page.tsx`):
       - **Use TanStack React Table** (`@tanstack/react-table@^8.21.3`) - see `docs/development/admin-ui-guidelines.md` → [Table Patterns](#table-patterns)
       - **Table structure**: Follow pattern from guidelines:
         - Use `TablePageLayout` and `TableToolbar` components
         - Create `IssueTable.tsx` with TanStack React Table hooks
         - Create `IssueTableColumns.tsx` for column definitions
         - Implement server-side sorting and pagination (`manualSorting: true`, `manualPagination: true`)
       - **Filters**: Use `SearchField` and `ReactSelect` components - see guidelines → [Table Patterns](#table-patterns) → Filter Implementation
         - Status filter: `ReactSelect` with options (open, in-progress, resolved, closed)
         - Project filter: `ReactSelect` populated from projects list
         - Severity filter: `ReactSelect` with options (low, medium, high, critical)
         - Date range filter: Use `DateLengthPicker` component
         - Assignee filter: `ReactSelect` populated from users list
       - **Table columns**: ID, Title, Project, Severity (Badge), Status (Badge), Assignee, Created Date, Actions
     - **Issue Detail Page** (`app/admin/issues/[id]/page.tsx`):
       - **Use `FormLayout` component** - see guidelines → [Form Patterns](#form-patterns)
       - Issue header: Title, Status (Badge), Severity (Badge), Assignee (ReactSelect dropdown)
       - **Screenshot gallery/viewer**: 
         - Display placeholder images
         - Use image gallery component (can use simple `<img>` tags for IC-6)
         - Add download button using `Button` variant="outline"
       - **Log viewer**: 
         - Display mock logs grouped by level (log, warn, error)
         - Use `Badge` components for log levels
         - Basic text search input using `SearchField`
       - **Comments section**: 
         - Plain text input using `TextareaInput`
         - Comment list display (simple list for IC-6)
       - **Status/assignee update form**: 
         - Status selector: `ReactSelect` with status options
         - Assignee selector: `ReactSelect` populated from User API
         - Update button: `Button` variant="primary"
   - **Follow UI Guidelines** (`plan/phase/UI-GUIDELINES.md`):
     - **Buttons**: Use `Button` component from `@/components/ui/button/Button`
       - Primary actions: `variant="primary"` with `size="sm"` (Update, Save)
       - Secondary actions: `variant="outline"` (Cancel, Download)
       - Action buttons in table: Use `EditAction` (blue), `DeleteAction` (red), `ViewAction` from `@/components/ui/table/actions`
       - EditAction uses blue color (`border-blue-200`, `text-blue-700`)
       - DeleteAction uses red color (`border-red-200`, `text-red-700`)
     - **Tables**: Use TanStack React Table
       - Server-side sorting and pagination
       - Use `DTLoading` for loading states
       - Use `TablePageLayout` and `TableToolbar` for layout
       - **Actions column**: StatusToggleAction → EditAction → DeleteAction (if applicable)
       - Follow established table patterns from IC-1
     - **Forms**: Use form components from `@/components/form/inputs/`
       - `TextInput`, `TextareaInput`, `ReactSelect`, `ToggleSwitch`, `DateLengthPicker`
       - Use `FormLayout` for form pages with breadcrumb navigation
       - **FormLayout**: Title left, breadcrumb right, description below title
       - **Form actions**: Place at bottom only, not in header
     - **Toast Notifications**: Use `useNotification` hook
       - Glass morphism design: `bg-white/50 dark:bg-gray-900/50` with `backdrop-blur-md`
       - Compact size: `max-w-xs`, `p-2.5`, `text-xs`
       - Auto-hide: 3 seconds default duration
       - Use `ToastContainer` with `onRemoveToast` prop (not `onRemove`)
     - **Badges**: Use `Badge` component for status/severity indicators
       - `variant="light"` with appropriate colors
     - **Styling**: Use TailAdmin design system with updated UI guidelines from `plan/phase/UI-GUIDELINES.md`
   - **Confirm with the user** that table columns, filters, actions, and detail layout look correct before binding to real APIs.

4. **Wire UI to real API**
   - Replace mocked query functions with real API calls to the issue endpoints (IC‑5).
   - **Loading states**: Use `DTLoading` for table loading, `PageLoading` for page loading - see guidelines → [Loading States](#loading-states)
   - **Error handling**: Use `useNotification` hook for error/success messages - see guidelines → [Best Practices](#best-practices) → Error Handling
   - Implement status change and assignee updates via PATCH endpoints.
   - **Assignee selection**: Populate dropdown from User API (`GET /api/admin/v1/users`) - single assignee selection using `ReactSelect`
   - **Screenshot viewer**: 
     - Display screenshots using signed URLs (call `getScreenshotUrl` endpoint)
     - Basic image viewer (no annotations/markup in IC-6)
     - **Download button**: Use `Button` variant="outline" with download icon - see guidelines → [Button Patterns](#button-patterns)
     - No side-by-side comparison in IC-6
   - **Log viewer**:
     - Display logs grouped by level (log, warn, error)
     - Use `Badge` components for log level indicators (success for info, warning for warn, error for error)
     - Basic search/filter within logs using `SearchField` component
     - Highlight errors/warnings with color coding (use semantic colors from TailAdmin)
   - **Table implementation**: Follow complete table example from guidelines - see [Table Patterns](#table-patterns) → Complete Table Implementation Example
   - Ensure loading/error/empty states are handled in the UI (use `DTLoading`, empty state messages).

5. **Test code (non-browser)**
   - Add tests for:
     - Table column definitions (at least for critical logic).
     - Filtering/query param mapping to API calls.
   - Run type checks on admin code to ensure consistent types with backend.

6. **Test in browser**
   - Navigate through the issue list and open multiple issue details.
   - Verify:
     - Filters and pagination behave as expected.
     - Status/assignee updates are reflected immediately.
     - Screenshot and logs render correctly.

7. **Clean up & document**
   - Remove temporary mock data providers and fixtures.
   - Update admin UI documentation (`docs/development/admin-ui-guidelines.md`) with:
     - Issue dashboard patterns
     - Table filtering examples
     - Screenshot viewer implementation
   - Capture screenshots or short notes in `docs/` for onboarding.

## Acceptance Criteria

IC-6 is complete when:
- ✅ Issue list page displays issues correctly with pagination
- ✅ Filters work (project, status, severity, date range, assignee)
- ✅ Issue detail page shows all information (screenshots, logs, comments)
- ✅ Screenshot viewer displays images correctly (using signed URLs)
- ✅ Screenshots are downloadable
- ✅ Log viewer displays logs in readable format (grouped by level, searchable)
- ✅ Status updates work (open → in-progress → resolved → closed, can reopen)
- ✅ Assignee selection works (dropdown from User table, single assignee)
- ✅ Comments can be added and displayed (plain text, internal-only)
- ✅ UI is responsive and follows TailAdmin design system
- ✅ Loading and error states are handled gracefully
- ✅ Admin authentication is enforced (staff-only access)

## UI Components Needed

- **Issue List Page** (`app/admin/issues/page.tsx`):
  - Project selector dropdown
  - Filter bar (status, severity, date range)
  - TanStack Table with columns: ID, Title, Project, Severity, Status, Assignee, Created Date, Actions
  - Pagination controls
- **Issue Detail Page** (`app/admin/issues/[id]/page.tsx`):
  - Issue header (title, status, severity, assignee)
  - Screenshot gallery/viewer
  - Log viewer (grouped by level)
  - Comments section
  - Status/assignee update form

## Next Phase

Once IC-6 is complete, proceed to **IC-7: Notifications & Integrations** which will add Slack, email, and webhook notifications.


