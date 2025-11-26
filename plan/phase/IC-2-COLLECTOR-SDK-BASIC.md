# PHASE IC-2 — COLLECTOR SDK (BASIC)

> AI agent–oriented phase plan. **1 phase = 1 file.**  
> Use this together with `plan/idea/phase_IC_2_detail.txt`, the stack list, and the project overview.

## Critical Development Guidelines

**⚠️ IMPORTANT**: Before starting development, review `plan/phase/DEVELOPMENT-GUIDELINES-AND-LESSONS-LEARNED.md` for critical lessons learned.

### Pre-Development Checklist
- [ ] **API Endpoints**: Verify `POST /api/public/v1/issues` exists and accepts project key
- [ ] **CORS Configuration**: Ensure API allows requests from any origin (public API)
- [ ] **Project Keys**: Test project key validation works correctly
- [ ] **Error Handling**: Plan graceful error handling for network failures

### SDK Performance Guidelines
- [ ] **Bundle Size**: Target < 50KB gzipped (use code splitting, tree shaking)
- [ ] **Lazy Loading**: Consider lazy loading for non-critical features
- [ ] **Error Recovery**: SDK should not break host application on errors
- [ ] **Shadow DOM**: Use Shadow DOM for CSS isolation (prevents style conflicts)

### Testing Requirements
- [ ] **Test in browser** - Embed SDK in test HTML page
- [ ] **Test error scenarios** - Network failures, invalid project keys
- [ ] **Test cross-origin** - Verify CORS works from different domains
- [ ] **Test browser compatibility** - Chrome, Firefox, Safari, Edge

## Phase overview (from master plan)

**Goal**: build the first version of `collector.min.js` that can submit basic issues to the API.

**Prerequisites**: IC-1 must be complete (project registration and key generation).

**Tech Stack**:
- **Build Tool**: Vite (recommended) or esbuild
- **SDK Location**: `apps/collector-sdk/` or `packages/collector-sdk/` (to be decided)
- **Distribution**: CDN-hosted `collector.min.js` bundle
- **API**: Express.js backend (`apps/api`)

**Deliverables**:
- Build collector bundle with Vite or esbuild.
- Add floating "Report Issue" button (configurable position in future, fixed position for IC-2).
- Show a simple modal for manual issue submission.
- Collect URL, browser metadata, and user info (if available).
- POST payload to the Issue Collector API (`POST /api/public/v1/issues`).

**SDK Configuration Decisions**:
- **Loading**: Eager loading (auto-initialize on DOM ready) for IC-2; lazy loading can be added later
- **User Info**: **Optional** - SDK collects user info if available in global scope (`window.issueCollectorUser`), but anonymous reporting is supported
- **Customization**: Basic floating button for IC-2; custom positioning/styling deferred to later phases
- **Feature Flags**: No opt-out flags in IC-2; all features enabled by default
- **Internationalization**: SDK modal uses English only in IC-2 (i18n support can be added later)
- **CSS Isolation**: **Shadow DOM** for widget CSS isolation (prevents conflicts with host website styles)
  - Modern browsers only (Chrome, Firefox, Safari, Edge - latest 2 versions) - no support for older browsers without Shadow DOM
- **Distribution**: **CDN-hosted script tag only** (`<script src="...">`) for IC-2
  - NPM package (`npm install @z-issue/collector`) can be added later if needed for React/Vue apps
- **Dark Mode**: **No dark mode in IC-2** - light theme only (can add dark mode support later if needed)
- **Custom Branding**: **No custom branding in IC-2** - standard widget appearance (can add per-project branding later)
- **Bundle Size Target**: **< 50KB gzipped** - optimize build for reasonable file size
- **Browser Support**: **Modern browsers only** - Chrome, Firefox, Safari, Edge (latest 2 versions)

## Detailed tasks (from IC‑2 detail)

- Floating report button  
- Simple modal  
- Collect URL, metadata, user  
- Submit basic issue  

## Development layers & workflow for this phase

AI agents should follow this order when implementing IC‑2 work:

1. **Create / adjust file structure**
   - **Decide SDK location**: 
     - Option A: `apps/collector-sdk/` (if it's a standalone app with its own build)
     - Option B: `packages/collector-sdk/` (if it's a shared package)
     - **Recommendation**: Use `apps/collector-sdk/` since it produces a distributable bundle
   - **Create SDK structure**:
     ```
     apps/collector-sdk/
     ├── src/
     │   ├── index.ts          # Main entry point
     │   ├── widget.ts         # Widget initialization
     │   ├── button.ts         # Floating button component
     │   ├── modal.ts          # Modal component
     │   ├── metadata.ts       # Metadata collection
     │   ├── api.ts            # API client
     │   └── types.ts          # TypeScript types
     ├── package.json
     ├── vite.config.ts        # Vite config for building
     └── tsconfig.json
     ```
   - **Configure bundler**:
     - Set up Vite config to build UMD bundle (`collector.min.js`)
     - Configure output format for browser compatibility
     - **Optimize bundle size**: Target < 50KB gzipped (use code splitting, tree shaking, minification)
     - Set up build script in `package.json`

2. **Implement base code (SDK core, no UI wiring to API yet)**
   - **Bootstrap logic** (`src/index.ts`):
     - Read `data-project-key` from script tag: `<script data-project-key="xxx" src="collector.min.js"></script>`
     - Read optional `data-api-url` for custom API endpoint (defaults to same origin or configured base URL)
     - Initialize SDK context with config
     - **Eager loading**: Auto-initialize widget when DOM is ready (lazy loading deferred to future enhancement)
   - **Metadata collection** (`src/metadata.ts`):
     - Collect: `url`, `userAgent`, `viewport` (width/height), `screen` (resolution), `language`, `timezone`, `timestamp`
     - **User info collection** (optional):
       - Check for `window.issueCollectorUser` object: `{ id?: string, email?: string, name?: string }`
       - If not available, issue reporting still works (anonymous reporting supported)
       - User info is **optional** - SDK works without it
   - **Type definitions** (`src/types.ts`):
     - Define `IssuePayload`, `Metadata`, `SDKConfig` interfaces
     - Export types for use in other modules

3. **Create UI with dummy data (confirm before hitting real API)**
   - Implement:
     - Floating button component (using Shadow DOM for CSS isolation).
     - Simple modal UI for issue description, severity, etc. (also in Shadow DOM).
   - **Shadow DOM Implementation**:
     - Create shadow root for widget container to isolate styles
     - Ensure widget CSS doesn't conflict with host website styles
     - Test in modern browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)
   - **Styling**:
     - Use light theme only (no dark mode support in IC-2)
     - Standard widget appearance (no custom branding per project)
   - For this step, **do not call the real API**:
     - Simulate submissions with local logging or an in-memory queue.
   - Test by embedding the script in a local HTML page and verifying UI behavior with dummy data.
   - **Confirm with the user** that the button position, modal layout, and fields look correct before sending real requests.

4. **Wire SDK to real API**
   - **API Client** (`src/api.ts`):
     - Implement `submitIssue(payload)` function using `fetch`
     - Include retry logic with exponential backoff (3 retries max)
     - Handle network errors gracefully
     - **Authentication**: Include `projectKey` in request payload (not headers)
     - **Rate limiting**: Not implemented in SDK (handled by API if needed)
   - **Endpoint**: `POST /api/public/v1/issues`
   - **Authentication**: Project key validation only (no additional API key required)
   - **Payload structure**:
     ```typescript
     {
       projectKey: string,
       title: string,
       description: string,
       severity: 'low' | 'medium' | 'high' | 'critical',
       metadata: Metadata,
       userInfo?: { id?: string, email?: string }
     }
     ```
   - **Error handling**: Show user-friendly error messages in modal if submission fails

5. **Test code (non-browser)**
   - Add unit tests for:
     - Metadata collection.
     - Payload construction.
     - Config handling.
   - Ensure the build step succeeds and types are correct.

6. **Test in browser**
   - Load `collector.min.js` into a sample app page.
   - Verify:
     - Floating button appears.
     - Modal opens/closes correctly.
     - Issues are POSTed successfully to the API (when enabled).

7. **Clean up & document**
   - Remove experimental debug logging.
   - Document SDK usage in `docs/api/public/collector-sdk.md`:
     - Script tag format and attributes
     - Basic usage examples
     - Configuration options
     - Browser compatibility
   - Ensure bundle naming and exports follow repository rules.
   - Add build instructions to `apps/collector-sdk/README.md`.

## Acceptance Criteria

IC-2 is complete when:
- ✅ SDK builds successfully as `collector.min.js`
- ✅ Floating button appears and is positioned correctly
- ✅ Modal opens/closes correctly
- ✅ Metadata is collected accurately
- ✅ Issues can be submitted to API successfully
- ✅ Error handling works (network errors, validation errors)
- ✅ SDK works in modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Documentation is complete

## SDK Usage Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>Test App</title>
</head>
<body>
  <h1>My Application</h1>
  
  <!-- Collector SDK -->
  <script 
    data-project-key="proj_abc123xyz"
    data-api-url="https://api.example.com"
    src="https://cdn.example.com/collector.min.js">
  </script>
</body>
</html>
```

## Next Phase

Once IC-2 is complete, proceed to **IC-3: Inspect Mode + Screenshot Capture** which will enhance the SDK with element selection and screenshot capabilities.


