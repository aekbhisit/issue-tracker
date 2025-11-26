# PHASE IC-4 — LOG & ERROR CAPTURE

> AI agent–oriented phase plan. **1 phase = 1 file.**  
> Use this together with `plan/idea/phase_IC_4_detail.txt`, the stack list, and the project overview.

## Critical Development Guidelines

**⚠️ IMPORTANT**: Before starting development, review `plan/phase/DEVELOPMENT-GUIDELINES-AND-LESSONS-LEARNED.md` for critical lessons learned.

### Pre-Development Checklist
- [ ] **Log Storage**: Verify database schema supports log storage
- [ ] **Buffer Limits**: Plan FIFO buffer with size limits (100 console, 50 network)
- [ ] **Privacy**: Implement sensitive data redaction (passwords, tokens, API keys)
- [ ] **Performance**: Ensure interception doesn't impact host app performance

### Security & Privacy Guidelines
- [ ] **Redact Authorization headers** - Never send Authorization headers to server
- [ ] **Redact sensitive patterns** - Passwords, tokens, API keys
- [ ] **Request body sanitization** - Redact common sensitive keys
- [ ] **Document privacy** - Clear documentation on what is/isn't captured

### Testing Requirements
- [ ] **Test in browser** - Various console log scenarios
- [ ] **Test error capture** - Runtime errors, promise rejections
- [ ] **Test network failures** - Failed fetch requests
- [ ] **Test redaction** - Verify sensitive data is properly redacted

## Phase overview (from master plan)

**Goal**: collect console logs, runtime errors, and network failures and attach them to issue payloads.

**Prerequisites**: IC-2 must be complete (basic SDK). Can be done in parallel with IC-3.

**Tech Stack**:
- **SDK**: Collector SDK (`apps/collector-sdk/`)
- **Browser APIs**: `console`, `window.onerror`, `unhandledrejection`, `fetch`

**Deliverables**:
- Patch `console.log/warn/error` to capture logs.
- Capture JS runtime errors (`window.onerror`, `unhandledrejection`).
- Capture network failures from `fetch` (intercept fetch calls).
- Attach logs and errors to the issue payload with timestamps.

**Log Capture Configuration Decisions**:
- **Console logs**: Capture last 100 entries (FIFO buffer)
- **Network capture**: **Only failures** (status >= 400 or network errors) - successful requests not captured
- **Log redaction**: Basic pattern matching for sensitive data:
  - **Sanitize Authorization headers**: Remove `Authorization` header from captured fetch requests
  - **Redact patterns**: passwords (`password=...`), tokens (`token=...`, `Bearer ...`), API keys (`api_key=...`)
  - **Request body sanitization**: Redact common sensitive keys in request bodies (password, token, secret, apiKey)
  - Simple regex-based redaction (advanced PII detection deferred)
  - **Security**: All sensitive data is sanitized before sending to server

## Detailed tasks (from IC‑4 detail)

- Intercept `console.log/warn/error`  
- Capture JS errors  
- Capture network failures  
- Attach logs to payload  

## Development layers & workflow for this phase

AI agents should follow this order when implementing IC‑4 work:

1. **Create / adjust file structure**
   - In the SDK source:
     - Create modules for logging/error capture (e.g. `logging/`, `errors/`, `network/`).
   - In backend (`apps/api`) and database packages:
     - Prepare or extend schema/types for `ISSUE_LOG` / log entries if not already present.

2. **Implement base code (capture & buffering logic)**
   - **Console Interception** (`src/logging/console.ts`):
     - Store original `console.log`, `console.warn`, `console.error`
     - Wrap with interceptor that captures: message, arguments, timestamp, level
     - Call original console methods to maintain normal behavior
     - Buffer logs in memory array (max 100 entries, FIFO)
   - **Error Capture** (`src/logging/errors.ts`):
     - Attach `window.onerror` handler: capture message, source, line, column, error object
     - Attach `unhandledrejection` handler: capture promise rejection reason
     - Extract stack traces when available
   - **Network Capture** (`src/logging/network.ts`):
     - Intercept `fetch` calls: wrap original fetch
     - Capture: URL, method, status, response time, error messages
     - Only capture failed requests (status >= 400 or network errors)
     - **Sanitize sensitive data**:
       - Remove `Authorization` header from captured requests (never send to server)
       - Redact sensitive keys in request bodies (password, token, secret, apiKey)
     - Buffer network errors (max 50 entries)
   - **Log Buffer** (`src/logging/buffer.ts`):
     - Implement in-memory buffer with size limits:
       - Console logs: max 100 entries (FIFO)
       - Network errors: max 50 entries (FIFO)
     - **Log redaction** (basic patterns):
       - Redact: `password=...`, `token=...`, `Bearer ...`, `api_key=...`
       - Replace with: `[REDACTED]`
       - Simple regex-based redaction (advanced PII detection not in scope for IC-4)
     - Format logs for payload: `{ level, message, timestamp, metadata }`

3. **Create UI with dummy data (confirm before real logs)**
   - In the admin issue detail (if already existing) or a temporary view:
     - Display **mocked log entries** (timestamp, level, message, metadata).
   - Do not depend on real captured logs yet; hard-code or mock example data.
   - **Confirm with the user** that the log display format and grouping meet expectations before wiring to real data.

4. **Wire capture to backend & UI**
   - Attach captured logs/errors to the issue payload from the SDK.
   - Persist logs in the backend and expose them via issue detail endpoints.
   - Replace UI mocks with real data from the API.

5. **Test code (non-browser)**
   - Add tests for:
     - Log normalization utilities.
     - Payload transformation and redaction.
   - Ensure error handling does not break the host application.

6. **Test in browser**
   - Trigger various log and error scenarios:
     - Console logs and warnings.
     - Handled and unhandled exceptions.
     - Failed network requests.
   - Verify they appear correctly attached to created issues.

7. **Clean up & document**
   - Remove intrusive debugging or test hooks.
   - Document what is captured, how it is limited, and privacy considerations in `docs/api/public/collector-sdk.md`:
     - What logs/errors are captured
     - Buffer size limits
     - Privacy considerations (no sensitive data capture)
     - How to opt-out or disable logging
   - Update API docs for log-related fields in issue resources.

## Acceptance Criteria

IC-4 is complete when:
- ✅ Console logs are captured correctly (log/warn/error)
- ✅ JavaScript errors are captured (runtime errors, promise rejections)
- ✅ Network failures are captured (failed fetch requests)
- ✅ Logs are buffered with size limits
- ✅ Logs are attached to issue payload correctly
- ✅ Timestamps are accurate
- ✅ Stack traces are preserved when available
- ✅ No performance impact on host application
- ✅ Privacy considerations are documented

## Log Payload Structure

```typescript
{
  logs: Array<{
    level: 'log' | 'warn' | 'error',
    message: string,
    timestamp: number,
    metadata?: any
  }>,
  errors: Array<{
    message: string,
    source?: string,
    line?: number,
    column?: number,
    stack?: string,
    timestamp: number
  }>,
  networkErrors: Array<{
    url: string,
    method: string,
    status?: number,
    error: string,
    timestamp: number
  }>
}
```

## Next Phase

Once IC-4 is complete, proceed to **IC-5: Issue Collector API & Database**.  
After IC-5 is complete, continue with **IC-6: Issue Dashboard** which will consume the stored logs in the UI.


