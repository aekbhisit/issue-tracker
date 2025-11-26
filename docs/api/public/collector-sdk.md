# Collector SDK API Documentation

## Overview

The Issue Collector SDK is a browser widget that can be embedded in any website to allow users to report issues. The SDK automatically collects browser metadata and provides a user-friendly interface for issue submission.

## Installation

### CDN (Recommended)

```html
<script 
  data-project-key="proj_your_project_key_here"
  data-api-url="https://api.example.com"
  src="https://cdn.example.com/collector.min.js">
</script>
```

### Configuration Attributes

- **`data-project-key`** (required): Project public key (format: `proj_*`)
- **`data-api-url`** (optional): API base URL (defaults to same origin or `http://localhost:4501`)

## Usage

### Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
</head>
<body>
  <h1>My Application</h1>
  
  <!-- Issue Collector SDK -->
  <script 
    data-project-key="proj_abc123xyz"
    data-api-url="https://api.example.com"
    src="https://cdn.example.com/collector.min.js">
  </script>
</body>
</html>
```

### With User Info

```html
<script>
  // Set user info before SDK loads
  window.issueCollectorUser = {
    id: 'user-123',
    email: 'user@example.com',
    name: 'John Doe'
  }
</script>

<script 
  data-project-key="proj_abc123xyz"
  src="https://cdn.example.com/collector.min.js">
</script>
```

### Manual Initialization

```javascript
// Initialize SDK programmatically
const widget = window.IssueCollector.init({
  projectKey: 'proj_abc123xyz',
  apiUrl: 'https://api.example.com'
})

// Destroy SDK instance
window.IssueCollector.destroy()
```

## API Reference

### Global Object

The SDK exposes a global `window.IssueCollector` object:

```typescript
interface IssueCollector {
  init(config: SDKConfig): IssueCollectorWidget
  destroy(): void
}
```

### SDKConfig

```typescript
interface SDKConfig {
  projectKey: string  // Required: Project public key
  apiUrl?: string     // Optional: API base URL
}
```

### User Info

Optional user information can be provided via `window.issueCollectorUser`:

```typescript
interface IssueCollectorUser {
  id?: string
  email?: string
  name?: string
}
```

## Issue Submission

### Endpoint

```
POST /api/public/v1/issues
```

### Request Body

```json
{
  "projectKey": "proj_abc123xyz",
  "title": "Button not working",
  "description": "The submit button does not respond when clicked.",
  "severity": "high",
  "metadata": {
    "url": "https://example.com/page",
    "userAgent": "Mozilla/5.0...",
    "viewport": {
      "width": 1920,
      "height": 1080
    },
    "screen": {
      "width": 1920,
      "height": 1080
    },
    "language": "en-US",
    "timezone": "America/New_York",
    "timestamp": "2024-01-15T10:30:00.000Z"
  },
  "userInfo": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "screenshot": {
    "screenshot": {
      "dataUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
      "mimeType": "image/jpeg",
      "fileSize": 45678,
      "width": 800,
      "height": 600
    },
    "selector": {
      "cssSelector": "#submit-button",
      "xpath": "/html/body/div[1]/button[1]",
      "boundingBox": {
        "x": 100,
        "y": 200,
        "width": 120,
        "height": 40
      },
      "outerHTML": "<button id=\"submit-button\" class=\"btn-primary\">Submit</button>"
    }
  },
  "logs": {
    "logs": [
      {
        "level": "error",
        "message": "Failed to load resource",
        "timestamp": 1705312200000,
        "metadata": []
      }
    ],
    "errors": [
      {
        "message": "Uncaught TypeError: Cannot read property 'x' of undefined",
        "source": "https://example.com/app.js",
        "line": 42,
        "column": 15,
        "stack": "TypeError: Cannot read property...",
        "timestamp": 1705312201000
      }
    ],
    "networkErrors": [
      {
        "url": "https://api.example.com/users",
        "method": "POST",
        "status": 500,
        "error": "HTTP 500 Internal Server Error: Database connection failed",
        "timestamp": 1705312202000
      }
    ]
  }
}
```

**Note**: The `screenshot` field is optional. If provided, it includes:
- **screenshot**: Base64-encoded image data with metadata
- **selector**: CSS selector, XPath, bounding box, and HTML snippet of the captured element

**Note**: The `logs` field is optional. If provided, it includes:
- **logs**: Array of console log entries (max 100)
- **errors**: Array of JavaScript error entries (no limit)
- **networkErrors**: Array of network error entries (max 50)

### Response

**Success (201)**:

```json
{
  "data": {
    "id": "issue-uuid",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Issue submitted successfully",
  "status": 201
}
```

**Error (400/401/422/500)**:

```json
{
  "error": "ErrorType",
  "message": "Error message",
  "status": 400,
  "details": {}
}
```

## Error Handling

The SDK includes automatic retry logic:

- **Max Retries**: 3 attempts
- **Backoff Strategy**: Exponential (1s, 2s, 4s)
- **Retry Conditions**: Network errors and server errors (5xx)
- **No Retry**: Client errors (4xx) are not retried

## Browser Compatibility

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

**Requirements**: Shadow DOM support (modern browsers only)

## Bundle Size

- **Uncompressed**: ~241 KB (includes html2canvas and css-selector-generator)
- **Gzipped**: ~59 KB

## Security

- **Project Key Validation**: All requests validate the project key against the database
- **CORS**: Public API endpoints allow requests from any origin
- **No Authentication**: Public API does not require user authentication (project key only)

## Inspect Mode & Screenshot Capture (IC-3)

The SDK includes an inspect mode feature that allows users to select page elements and capture screenshots:

### How It Works

1. User clicks "Capture Screenshot" button in the issue form
2. Inspect mode activates with hover highlighting overlay
3. User hovers over elements (highlighted with blue border)
4. User clicks an element to select it
5. Screenshot is captured and selectors are extracted
6. Preview modal shows screenshot and metadata
7. User can use, retake, or skip the screenshot

### Screenshot Specifications

- **Maximum file size**: 10MB (automatically compressed if needed)
- **Maximum dimensions**: 4096x4096 pixels (automatically downscaled if larger)
- **Format**: JPEG (compressed with quality 0.85)
- **Timeout**: 30 seconds maximum for large/complex elements
- **Compression**: Client-side compression before upload

### Extracted Metadata

For each captured element, the SDK extracts:
- **CSS Selector**: Unique CSS selector path
- **XPath**: XPath expression for the element
- **Bounding Box**: Position and dimensions (x, y, width, height)
- **Outer HTML**: Complete HTML markup of the element

### Limitations

- **Cross-origin iframes**: Cannot capture content from cross-origin iframes (skipped gracefully)
- **Element-level only**: Full-page screenshots are not supported (deferred to IC-8)
- **Large DOM elements**: May take up to 30 seconds to capture
- **Memory usage**: Large screenshots may consume significant memory during capture

### Performance Considerations

- Inspect mode uses throttled mouse events (50ms) for smooth performance
- Screenshots are compressed client-side before upload
- Canvas and blob objects are cleaned up after capture
- Large elements are automatically downscaled to fit size limits

## Limitations (IC-3)

- Light theme only (no dark mode)
- Fixed button position (bottom-right)
- No custom branding
- English language only
- No saved drafts
- No file attachments (except screenshots)
- Element-level screenshots only (no full-page capture)
- Cross-origin iframe content cannot be captured

## Log & Error Capture (IC-4)

The SDK automatically captures console logs, JavaScript runtime errors, and network failures to provide context when reporting issues.

### What is Captured

- **Console Logs**: Last 100 entries from `console.log`, `console.warn`, and `console.error`
  - Includes: message, level (log/warn/error), timestamp, optional metadata
- **JavaScript Errors**: Runtime errors (`window.onerror`) and unhandled promise rejections
  - Includes: message, source URL, line/column numbers, stack trace, timestamp
- **Network Failures**: Failed fetch requests (status >= 400 or network errors), last 50 entries
  - Includes: URL, HTTP method, status code (if available), error message, timestamp
  - **Note**: Only failed requests are captured. Successful requests are not logged.

### Buffer Limits

- **Console logs**: Maximum 100 entries (FIFO - oldest entries removed when limit reached)
- **Network errors**: Maximum 50 entries (FIFO)
- **Errors**: No limit (all errors are captured)

### Privacy & Security

**Sensitive data is automatically redacted** before sending to the server:

- **Authorization headers**: Never captured (completely removed from network error logs)
- **Passwords**: Redacted in URLs, request bodies, and log messages (`password=[REDACTED]`)
- **Tokens**: Redacted in URLs, request bodies, and log messages (`token=[REDACTED]`, `Bearer [REDACTED]`)
- **API Keys**: Redacted in URLs, request bodies, and log messages (`api_key=[REDACTED]`)
- **Request bodies**: Sensitive keys (`password`, `token`, `secret`, `apiKey`) are redacted

**What is NOT captured**:
- Successful network requests (only failures are captured)
- Authorization headers (completely excluded)
- Sensitive data patterns (automatically redacted)

### Performance Considerations

- Log capture has minimal overhead on host application performance
- Log formatting is lazy (only formatted when issue is submitted)
- Long messages are truncated (max 1000 characters)
- Metadata size is limited (max 500 characters per entry)
- Console interception calls original console methods (normal behavior maintained)

### Opt-Out

Log capture starts automatically when the SDK initializes. To disable logging, destroy the SDK instance:

```javascript
window.IssueCollector.destroy()
```

**Note**: Log capture stops when the SDK is destroyed. Logs are only included in issue payloads if they were captured before submission.

## Future Enhancements

- Dark mode support
- Customizable button position and styling
- Per-project branding
- Internationalization (i18n)
- Draft saving
- File attachments
- Full-page screenshot capture (IC-8)
- Advanced PII detection and masking

