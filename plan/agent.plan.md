# Agent Planning Brief – Issue Collector Stack

Use this prompt whenever an AI agent must craft a new phase plan or roadmap for the Issue Collector Platform. It summarizes the current application stack and UI surface so the agent can reason over what already exists before proposing additions.

## Vision
- Platform name: **Issue Collector Platform** (IC phases IC‑0…IC‑10)
- Current focus: reusing the existing apps (API, admin dashboard, frontend portal) plus infra and docs to evolve into the Issue Collector workflow.
- UI layer: admin dashboard is built with the **TailAdmin template** (Next.js + React + Tailwind) located in `apps/admin/`. The public portal uses `apps/frontend/` (Next.js); even if minimal today, it must remain able to display issue status, filtering, and submissions.

## Stack snapshot
- **Backend**: `apps/api/` (Express/Nest style modules, routes, shared libs). Handles issue ingestion, user auth, OpenAI/RAG integrations, and datastore interactions.
- **Admin UI**: `apps/admin/` (TailAdmin-inspired Next.js project, custom components under `components/` and `lib/`). Includes contexts, hooks, and chart/form components already wired to backend endpoints.
- **Frontend UI**: `apps/frontend/` – lightweight Next.js app for user-facing status view and submission form.
- **Shared packages**: `packages/{config,locales,types,utils}` for cross-app config, i18n, type definitions, and utilities.
- **Infra**:
  - Docker/compose definitions under `infra/docker/` (includes custom Postgres w/ pgvector + PostGIS, redis, and per-app builds).
  - Scripts under `infra/scripts/`, nginx in `infra/nginx/`, and database tooling under `infra/database/`.
- **Docs & plans**: major docs live in `docs/` (api/architecture/deployment/development/changelog) and phase plans in `plan/`.
- **Support**: `storage/` for uploads/backups, `scripts/` utilities, `tests/` (future), and new `md/` notes for exploratory content.

## UI Guidelines & Design System

**Critical**: All admin UI development must follow the comprehensive guidelines in `docs/development/admin-ui-guidelines.md`. Key points:

### Design System
- **Theme**: TailAdmin theme with Tailwind CSS v4
- **Color System**: Brand colors (`brand-500`), semantic colors (success/error/warning/info), and gray scale
- **Typography**: Outfit font family with predefined text sizes (`text-title-*`, `text-theme-*`)
- **Components**: Located in `apps/admin/components/ui/`

### Button Patterns
- **Always include icons** - Every button must have an icon
- **Action-based colors**:
  - Create/Add → Brand blue (primary)
  - Edit/Update → Green (`color="success"`)
  - Delete/Remove → Red (`color="danger"`)
  - View/Details → Blue (`color="info"`)
  - Activate → Green
  - Deactivate → Yellow/Orange (`color="warning"`)
- **Icon-only in tables** - Use `ActionButton` with `iconOnly` prop for table action columns
- **Icon + text in toolbars** - Use `ActionButton` or `Button` with `startIcon` for toolbars/forms
- **Components**: 
  - `Button` - Base button with `color` prop support
  - `ActionButton` - Pre-configured action buttons (`action="add|edit|delete|view|activate|deactivate"`)

### Table Patterns
- **Library**: TanStack React Table (`@tanstack/react-table@^8.21.3`)
- **Pattern**: Separate `[Feature]Table.tsx` and `[Feature]TableColumns.tsx` files
- **Features**: Server-side sorting, pagination, and filtering
- **Structure**: Use `TablePageLayout`, `TableToolbar`, and table components
- **Filters**: Collapsible filter sections with `SearchField` and `ReactSelect`

### Component Patterns
- **Forms**: Use `FormLayout` for create/edit forms
- **Tables**: Use `TablePageLayout` with `TableToolbar` and table components
- **Loading**: Use `DTLoading` for table loading states
- **Actions**: Use `EditAction`, `DeleteAction`, `ViewAction` for table rows

### Key Guidelines
- ✅ Always use TailAdmin design tokens (colors, spacing, shadows)
- ✅ Follow button color conventions (green=edit, red=delete, etc.)
- ✅ Use TanStack React Table for all data tables
- ✅ Include icons in all buttons
- ✅ Implement server-side operations (sorting, pagination)
- ❌ Don't use arbitrary colors or styles
- ❌ Don't create text-only buttons
- ❌ Don't use client-side pagination for large datasets

**Reference**: See `docs/development/admin-ui-guidelines.md` for complete patterns, examples, and code snippets.

## Prompt for new agents
```
You are planning work for the Issue Collector Platform (nd-issue-tracker). Start from the stack snapshot above (apps/api, admin UI using TailAdmin, frontend portal, shared packages, and infra with pgvector-ready Postgres). Review existing IC phase plans (`plan/phase/`), docs (`docs/`), and rules before suggesting a new phase or updates.

**UI Guidelines**: Before planning admin UI features, review `docs/development/admin-ui-guidelines.md`. All admin UI must:
- Use TailAdmin theme and design system
- Follow button patterns (action-based colors, icons required)
- Use TanStack React Table for data tables
- Follow component patterns (TablePageLayout, FormLayout, etc.)
- Maintain consistency with existing UI patterns

Describe what requirements you would add, which apps (api/admin/frontend) those requirements touch, necessary infra changes, and any documentation updates. For admin UI features, specify:
- Which UI components will be used (Button, ActionButton, tables, forms)
- How buttons will be styled (action types, colors)
- Table structure (columns, filters, sorting)
- Form layouts and input components

Mention if you need new user_request proposals for large decisions. Keep recommendations aligned with ongoing IC phases (IC‑0…IC‑10) and note how TailAdmin components and UI guidelines will play a role.
```

Update this brief whenever the stack or higher-level plans change, so all planning agents stay aligned.



