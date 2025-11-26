# PHASE IC-3 — INSPECT MODE + SCREENSHOT CAPTURE

> AI agent–oriented phase plan. **1 phase = 1 file.**  
> Use this together with `plan/idea/phase_IC_3_detail.txt`, the stack list, and the project overview.

## Critical Development Guidelines

**⚠️ IMPORTANT**: Before starting development, review `plan/phase/DEVELOPMENT-GUIDELINES-AND-LESSONS-LEARNED.md` for critical lessons learned.

### Pre-Development Checklist
- [ ] **Screenshot Storage**: Verify storage configuration (local/S3) is set up
- [ ] **Size Limits**: Implement 10MB max size validation before upload
- [ ] **Compression**: Plan client-side compression to reduce file size
- [ ] **Error Handling**: Plan graceful handling of capture failures/timeouts

### Performance Guidelines
- [ ] **Capture Timeout**: Set 30-second max timeout for large DOM elements
- [ ] **Memory Management**: Clean up canvas/blobs after capture
- [ ] **Non-blocking**: Don't freeze UI during capture (show progress indicator)
- [ ] **Iframe Handling**: Skip cross-origin iframes gracefully

### Testing Requirements
- [ ] **Test in browser** - Various page layouts and DOM sizes
- [ ] **Test large DOMs** - Verify timeout handling works
- [ ] **Test iframes** - Verify cross-origin iframe handling
- [ ] **Test file sizes** - Verify compression and size limits

## Phase overview (from master plan)

**Goal**: enable element-level selection and screenshot capture from the Collector SDK.

**Prerequisites**: IC-2 must be complete (basic SDK with modal).

**Tech Stack**:
- **SDK**: Collector SDK (`apps/collector-sdk/`)
- **Library**: `html2canvas` for screenshot capture
- **Library**: `css-selector-generator` (optional) for CSS selector generation

**Deliverables**:
- Overlay highlight on hover.
- Element selection with click.
- Capture screenshot using `html2canvas`.
- Extract DOM selector (CSS selector, XPath) and HTML snippet.
- Show preview in a modal before submission.

**Screenshot Configuration Decisions**:
- **Size limit**: Maximum 10MB per screenshot (client-side validation before upload)
- **Compression**: **Client-side compression** using browser APIs (reduce size before sending to API)
- **Iframe handling**: Skip cross-origin iframe content (cannot capture due to browser security restrictions)
- **Full-page screenshots**: **Deferred to IC-8** (Browser Extension) - IC-3 focuses on element-level only
- **Scrolling screenshots**: **Not supported in IC-3** - element capture only (no scrolling/stitching)
- **PII Masking**: **Not implemented in IC-3** - no automatic PII masking (blurring passwords/sensitive fields)
  - Can be added later if needed (would require detecting `<input type="password">` or `.sensitive` classes)
- **Sensitive element ignore-list**: **Not implemented in IC-3** - capture all selected elements (can add ignore-list later)
- **DOM Capture Depth**: **outerHTML only** - capture selected element's outerHTML (not full DOM tree)
  - Sufficient for element identification and debugging
  - Includes CSS selector, XPath, bounding box, and outerHTML
- **Upload Method**: **Approach A (Simple)** - Send Base64 to API → API uploads to S3
  - Simpler implementation for MVP
  - API handles S3 upload (lighter on SDK, heavier on API server)
  - Approach B (Presigned URLs) can be implemented later for better scalability

## Detailed tasks (from IC‑3 detail)

- DOM highlight overlay  
- Element selection  
- `html2canvas` screenshot  
- Element selector + HTML snippet  
- Preview modal  

## Development layers & workflow for this phase

AI agents should follow this order when implementing IC‑3 work:

1. **Create / adjust file structure**
   - In the SDK source (e.g. `packages/collector-sdk`):
     - Create modules for overlay rendering, element selection, and screenshot capture (e.g. `overlay/`, `selection/`, `screenshot/`).
   - Define shared types for screenshot payloads (e.g. element selector, bounding box, data URLs).

2. **Implement base code (selection & capture logic)**
   - **Inspect Mode** (`src/inspect.ts`):
     - Implement DOM traversal and hover highlighting
     - Create overlay element that follows mouse cursor
     - Highlight element on hover (add border/background overlay)
     - Handle click to select element
     - Exit inspect mode on ESC key
   - **Screenshot Capture** (`src/screenshot.ts`):
     - Integrate `html2canvas` library
     - Capture screenshot of selected element (or bounding box)
     - **Size limits**: 
       - Maximum file size: 10MB (validate before capture)
       - Maximum dimensions: 4096x4096 pixels (downscale if larger)
     - **Compression**: Compress image client-side before sending:
       - Use `canvas.toBlob()` with quality setting (0.8-0.9)
       - Convert to JPEG format for smaller file size
     - Handle large DOM elements (timeout: 30 seconds max)
     - **Iframe handling**: Skip cross-origin iframes (log warning, continue with parent frame)
     - Convert to base64 data URL or Blob for upload
   - **Selector Extraction** (`src/selectors.ts`):
     - Extract CSS selector (use `css-selector-generator` or custom logic)
     - Extract XPath (custom function)
     - Extract `outerHTML` of selected element (not full DOM tree - sufficient for element identification)
     - Extract bounding box coordinates (x, y, width, height)
     - **DOM Capture Depth**: Capture outerHTML only (not child elements' full DOM structure)

3. **Create UI with dummy data (confirm before full integration)**
   - Extend the existing modal or add a preview step using **mock screenshot data**:
     - Show a placeholder image or basic mock screenshot.
     - Display simulated selector/HTML snippet.
   - Verify the overlay, selection UX, and modal flow using dummy data only.
   - **Confirm with the user** that the inspect mode UX (highlight style, selection click behavior, preview layout) is acceptable before wiring to real capture.

4. **Wire SDK UI to real capture logic**
   - Replace mocks with real `html2canvas` output and real DOM metadata.
   - Ensure captured data is attached to the issue payload.
   - Handle capture errors gracefully (timeouts, large DOM, etc.).

5. **Test code (non-browser)**
   - Add tests where possible (e.g., pure utilities for selector generation and payload shaping).
   - Keep side-effect-heavy DOM code separated from easily testable logic.

6. **Test in browser**
   - Use local pages with various layouts.
   - Verify:
     - Hover highlight follows mouse over elements.
     - Click selects the correct element.
     - Preview matches the selected region.

7. **Clean up & document**
   - Remove debug overlays and console logs.
   - Document inspect mode behavior and limitations in `docs/api/public/collector-sdk.md`:
     - How to enable/disable inspect mode
     - Performance considerations
     - Browser compatibility notes
     - Known limitations (large DOM, iframes, etc.)
   - Note any performance considerations or opt-out flags.

## Acceptance Criteria

IC-3 is complete when:
- ✅ Inspect mode overlay appears and highlights elements on hover
- ✅ Click selects the correct element
- ✅ Screenshot captures the selected element accurately
- ✅ CSS selector, XPath, and HTML are extracted correctly
- ✅ Preview modal shows screenshot and metadata
- ✅ Screenshot data is included in issue submission payload
- ✅ Performance is acceptable (no lag on hover/selection)
- ✅ Works across different browsers and page layouts

## Next Phase

Once IC-3 is complete, proceed to **IC-4: Log & Error Capture** which will enhance the SDK with console log and error collection.


