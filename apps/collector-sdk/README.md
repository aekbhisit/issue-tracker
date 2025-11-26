# Issue Collector SDK

Browser widget SDK for reporting issues to the Issue Collector Platform.

## Installation

### CDN (Recommended)

Include the SDK in your HTML page using a script tag:

```html
<script 
  data-project-key="proj_your_project_key_here"
  data-api-url="https://api.example.com"
  src="https://cdn.example.com/collector.min.js">
</script>
```

### Local Development

For local development, you can serve the built file:

```html
<script 
  data-project-key="proj_your_project_key_here"
  data-api-url="http://localhost:4501"
  src="/path/to/collector.min.js">
</script>
```

## Configuration

### Script Tag Attributes

- **`data-project-key`** (required): Your project's public key (starts with `proj_`)
- **`data-api-url`** (optional): API base URL (defaults to same origin or `http://localhost:4501`)

### Example

```html
<script 
  data-project-key="proj_abc123xyz"
  data-api-url="https://api.example.com"
  src="https://cdn.example.com/collector.min.js">
</script>
```

## User Info (Optional)

You can optionally provide user information by setting a global object:

```javascript
window.issueCollectorUser = {
  id: 'user-123',
  email: 'user@example.com',
  name: 'John Doe'
}
```

This information will be included in issue reports if available. The SDK works without user info (anonymous reporting is supported).

## Manual Initialization

You can also initialize the SDK programmatically:

```javascript
// Initialize SDK
const widget = window.IssueCollector.init({
  projectKey: 'proj_abc123xyz',
  apiUrl: 'https://api.example.com'
})

// Destroy SDK
window.IssueCollector.destroy()
```

## Features

- **Floating Button**: Fixed-position button in bottom-right corner
- **Modal Form**: User-friendly form for reporting issues
- **Inspect Mode**: Element selection with hover highlighting for precise issue reporting
- **Screenshot Capture**: Capture screenshots of selected page elements
- **Selector Extraction**: Automatically extracts CSS selector, XPath, bounding box, and HTML
- **Log & Error Capture**: Automatically captures console logs, JavaScript errors, and network failures
- **Metadata Collection**: Automatically collects browser and environment metadata
- **Shadow DOM**: CSS isolation prevents conflicts with host website styles
- **Auto-initialization**: SDK initializes automatically when DOM is ready
- **Error Handling**: Retry logic with exponential backoff
- **Accessibility**: ARIA labels and keyboard support

## Browser Compatibility

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

**Note**: Shadow DOM is required. Older browsers without Shadow DOM support are not supported.

## Bundle Size

- **Uncompressed**: ~241 KB (includes html2canvas and css-selector-generator)
- **Gzipped**: ~59 KB

## Development

### Build

```bash
pnpm build
```

### Development Mode

```bash
pnpm dev
```

### Type Checking

```bash
pnpm typecheck
```

## API Endpoint

The SDK submits issues to:

```
POST /api/public/v1/issues
```

**Authentication**: Project key validation only (no additional API key required)

**Payload Structure**:

```typescript
{
  projectKey: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  metadata: {
    url: string
    userAgent: string
    viewport: { width: number, height: number }
    screen: { width: number, height: number }
    language: string
    timezone: string
    timestamp: string
  }
  userInfo?: {
    id?: string
    email?: string
    name?: string
  }
  screenshot?: {
    screenshot: {
      dataUrl: string  // Base64 data URL
      mimeType: string // image/jpeg or image/png
      fileSize: number // bytes
      width: number
      height: number
    }
    selector: {
      cssSelector: string
      xpath: string
      boundingBox: {
        x: number
        y: number
        width: number
        height: number
      }
      outerHTML: string
    }
  }
  logs?: {
    logs: Array<{
      level: 'log' | 'warn' | 'error'
      message: string
      timestamp: number
      metadata?: any
    }>
    errors: Array<{
      message: string
      source?: string
      line?: number
      column?: number
      stack?: string
      timestamp: number
    }>
    networkErrors: Array<{
      url: string
      method: string
      status?: number
      error: string
      timestamp: number
    }>
  }
}
```

## Inspect Mode & Screenshot Capture

The SDK includes an inspect mode feature that allows users to select page elements and capture screenshots:

1. **Click "Capture Screenshot"** button in the issue form
2. **Inspect Mode Activates**: An overlay appears with hover highlighting
3. **Select Element**: Click on any page element to select it
4. **Screenshot Captured**: The selected element is captured as a screenshot
5. **Preview**: Review the screenshot and extracted metadata (CSS selector, XPath, HTML)
6. **Use or Retake**: Choose to use the screenshot or retake it

### Screenshot Limitations

- **Maximum file size**: 10MB (automatically compressed if needed)
- **Maximum dimensions**: 4096x4096 pixels (automatically downscaled if larger)
- **Timeout**: 30 seconds maximum for large/complex elements
- **Cross-origin iframes**: Cannot capture content from cross-origin iframes (skipped gracefully)
- **Element-level only**: Full-page screenshots are not supported in IC-3 (deferred to IC-8)

### Performance Considerations

- Inspect mode uses throttled mouse events (50ms) for smooth performance
- Screenshots are compressed client-side before upload (JPEG quality 0.85)
- Large DOM elements may take longer to capture (up to 30 seconds)
- Canvas and blob objects are cleaned up after capture to prevent memory leaks

### Browser Compatibility

Inspect mode and screenshot capture require:
- Modern browsers with Shadow DOM support
- Canvas API support
- FileReader API support

Tested browsers:
- Chrome (latest 2 versions) ✅
- Firefox (latest 2 versions) ✅
- Safari (latest 2 versions) ✅
- Edge (latest 2 versions) ✅

## Testing

See `test/index.html` for a test page that demonstrates SDK usage.

## License

Private - Internal use only

