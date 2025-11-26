# IC-2 Collector SDK Verification Guide

This guide helps you verify that the IC-2 Collector SDK implementation is complete and working correctly.

## Prerequisites Check

Before testing, ensure:

- [ ] API server is running (`pnpm dev:api` or `pnpm dev:all`)
- [ ] At least one project exists in the database with an active status
- [ ] You have the project's `publicKey` (starts with `proj_`)

## Step 1: Build Verification

### Check SDK Build Output

```bash
# Build the SDK
cd apps/collector-sdk
pnpm build

# Verify build output exists
ls -lh dist/collector.min.js

# Expected: File should exist and be ~14 KB (uncompressed) or ~4 KB (gzipped)
```

**Success Criteria:**
- ✅ Build completes without errors
- ✅ `dist/collector.min.js` file exists
- ✅ File size is under 50 KB gzipped (target: ~4 KB)

## Step 2: API Endpoint Verification

### Test API Endpoint Directly

```bash
# Replace YOUR_PROJECT_KEY with an actual project key
curl -X POST http://localhost:4501/api/public/v1/issues \
  -H "Content-Type: application/json" \
  -d '{
    "projectKey": "YOUR_PROJECT_KEY",
    "title": "Test Issue",
    "description": "This is a test issue",
    "severity": "medium",
    "metadata": {
      "url": "https://example.com",
      "userAgent": "Mozilla/5.0",
      "viewport": { "width": 1920, "height": 1080 },
      "screen": { "width": 1920, "height": 1080 },
      "language": "en-US",
      "timezone": "America/New_York",
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  }'
```

**Expected Response (201):**
```json
{
  "data": {
    "id": "uuid-here",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Issue submitted successfully",
  "status": 201
}
```

**Test Invalid Project Key:**
```bash
curl -X POST http://localhost:4501/api/public/v1/issues \
  -H "Content-Type: application/json" \
  -d '{
    "projectKey": "proj_invalid_key",
    "title": "Test",
    "description": "Test",
    "severity": "low",
    "metadata": { ... }
  }'
```

**Expected Response (401):**
```json
{
  "error": "UnauthorizedError",
  "message": "Invalid project key",
  "status": 401
}
```

**Success Criteria:**
- ✅ Valid project key returns 201 with issue ID
- ✅ Invalid project key returns 401
- ✅ Validation errors return 422 with details
- ✅ CORS headers allow requests from any origin

## Step 3: SDK Functionality Testing

### Setup Test Page

1. **Get a Project Key:**
   - Go to `http://localhost:4502/admin/projects`
   - Create a project or use an existing one
   - Copy the `publicKey` (e.g., `proj_abc123xyz`)

2. **Update Test HTML:**
   - Open `apps/collector-sdk/test/index.html`
   - Replace `YOUR_PROJECT_KEY` with your actual project key
   - Update `data-api-url` if needed (default: `http://localhost:4501`)

3. **Serve the Test Page:**
   ```bash
   # Option 1: Use a simple HTTP server
   cd apps/collector-sdk/test
   python3 -m http.server 8080
   # Then open http://localhost:8080/index.html
   
   # Option 2: Open directly in browser (file:// protocol)
   # Note: Some browsers may block local file access
   ```

### Visual Verification Checklist

- [ ] **Floating Button Appears**
  - Button should be visible in bottom-right corner
  - Button should have a "+" icon
  - Button should be blue (#3b82f6)
  - Button should be circular (56x56px)

- [ ] **Button Interaction**
  - Hover effect works (slight scale and color change)
  - Click opens modal
  - Button is accessible (keyboard focus works)

- [ ] **Modal Opens**
  - Modal appears centered on screen
  - Overlay background is semi-transparent dark
  - Modal has white background
  - Form fields are visible: Title, Description, Severity

- [ ] **Form Validation**
  - Empty form submission shows error messages
  - Title field shows error if empty
  - Description field shows error if empty
  - Severity dropdown has options: Low, Medium, High, Critical

- [ ] **Form Submission**
  - Submit button shows loading state ("Submitting...")
  - Success message appears on successful submission
  - Modal closes automatically after success (1.5 seconds)
  - Error message appears on failure
  - Modal stays open on error

- [ ] **Modal Close**
  - Close button (×) closes modal
  - Clicking overlay closes modal
  - ESC key closes modal
  - Cancel button closes modal

## Step 4: Browser Console Verification

Open browser DevTools (F12) and check:

### No Errors
- [ ] No JavaScript errors in console
- [ ] No CORS errors
- [ ] No network errors (except intentional test failures)

### SDK Initialization
```javascript
// In browser console, verify:
console.log(window.IssueCollector)
// Should output: { init: function, destroy: function }
```

### Network Requests
- [ ] POST request to `/api/public/v1/issues` is made on form submission
- [ ] Request includes correct headers (`Content-Type: application/json`)
- [ ] Request payload includes all required fields
- [ ] Response status is 201 on success

## Step 5: Metadata Collection Verification

### Check Collected Metadata

In the browser console, before submitting an issue, you can verify metadata collection:

```javascript
// The SDK automatically collects:
// - window.location.href (current URL)
// - navigator.userAgent (browser info)
// - window.innerWidth/innerHeight (viewport)
// - screen.width/height (screen resolution)
// - navigator.language (language)
// - Intl.DateTimeFormat().resolvedOptions().timeZone (timezone)
```

**Verify in Network Tab:**
- Open DevTools → Network tab
- Submit an issue
- Check the request payload
- Verify `metadata` object contains all expected fields

## Step 6: User Info Testing (Optional)

### Test with User Info

```javascript
// In browser console before loading SDK:
window.issueCollectorUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User'
}

// Then reload the page and submit an issue
// Verify userInfo is included in the request payload
```

### Test without User Info

- [ ] SDK works without `window.issueCollectorUser`
- [ ] Issue submission succeeds (anonymous reporting)
- [ ] `userInfo` field is omitted or null in payload

## Step 7: Error Scenarios Testing

### Test Invalid Project Key

1. Update test HTML with invalid project key: `proj_invalid`
2. Submit an issue
3. **Expected:** Error message displayed, modal stays open

### Test Network Error

1. Stop API server
2. Submit an issue
3. **Expected:** Network error message, retry logic attempts 3 times

### Test Validation Errors

1. Submit form with empty title
2. **Expected:** Error message under title field

1. Submit form with empty description
2. **Expected:** Error message under description field

## Step 8: Browser Compatibility Testing

Test in multiple browsers:

- [ ] **Chrome** (latest version)
- [ ] **Firefox** (latest version)
- [ ] **Safari** (latest version)
- [ ] **Edge** (latest version)

**Check:**
- Button appears correctly
- Modal renders correctly
- Form submission works
- Shadow DOM isolates styles (no conflicts with test page styles)

## Step 9: API Server Verification

### Check API Logs

When submitting issues, check API server console for:

- [ ] Request received: `POST /api/public/v1/issues`
- [ ] Project key validation successful
- [ ] Issue created successfully
- [ ] Response sent: `201 Created`

### Verify In-Memory Storage

The issue is stored in memory. You can verify by checking the service:

```typescript
// In issue.service.ts, the issueStore Map contains all issues
// For debugging, you can add a temporary endpoint or log
```

## Step 10: Integration Checklist

### File Structure Verification

- [ ] `apps/collector-sdk/` directory exists
- [ ] `apps/collector-sdk/src/` contains all source files
- [ ] `apps/collector-sdk/dist/collector.min.js` exists
- [ ] `apps/api/src/modules/issue/` contains all API files
- [ ] Routes are registered in `apps/api/src/routes/public/v1/index.ts`

### Documentation Verification

- [ ] `apps/collector-sdk/README.md` exists and is complete
- [ ] `docs/api/public/collector-sdk.md` exists and is complete
- [ ] `apps/collector-sdk/test/index.html` exists

### Build Scripts Verification

```bash
# Test build script
pnpm build:sdk

# Should complete successfully
```

## Quick Verification Script

Run this quick test:

```bash
#!/bin/bash

echo "=== IC-2 Verification ==="

# 1. Check build
echo "1. Checking SDK build..."
if [ -f "apps/collector-sdk/dist/collector.min.js" ]; then
  SIZE=$(ls -lh apps/collector-sdk/dist/collector.min.js | awk '{print $5}')
  echo "   ✅ SDK built: $SIZE"
else
  echo "   ❌ SDK build missing"
fi

# 2. Check API endpoint
echo "2. Checking API endpoint..."
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4501/api/public/v1/health)
if [ "$API_RESPONSE" = "200" ]; then
  echo "   ✅ API server is running"
else
  echo "   ❌ API server not responding (status: $API_RESPONSE)"
fi

# 3. Check routes
echo "3. Checking routes..."
if grep -q "/issues" apps/api/src/routes/public/v1/index.ts; then
  echo "   ✅ Issue routes registered"
else
  echo "   ❌ Issue routes not found"
fi

echo "=== Verification Complete ==="
```

## Success Criteria Summary

✅ **All items below should pass:**

1. SDK builds successfully (< 50KB gzipped)
2. API endpoint responds correctly
3. Floating button appears and works
4. Modal opens and closes correctly
5. Form validation works
6. Issue submission succeeds
7. Error handling works (invalid key, network errors)
8. Metadata collection is accurate
9. User info (optional) works
10. Browser compatibility confirmed
11. Documentation is complete
12. No console errors

## Troubleshooting

### Button Not Appearing

- Check browser console for errors
- Verify `data-project-key` attribute is set correctly
- Ensure script tag is before closing `</body>` tag
- Check if Shadow DOM is supported (modern browsers only)

### Modal Not Opening

- Check button click handler
- Verify Shadow DOM is working
- Check for JavaScript errors in console

### API Request Failing

- Verify API server is running
- Check CORS configuration
- Verify project key is valid and active
- Check network tab for request/response details

### Form Not Submitting

- Check form validation errors
- Verify all required fields are filled
- Check browser console for errors
- Verify API endpoint is accessible

## Next Steps

Once verification is complete:

1. ✅ IC-2 is ready for use
2. 📋 Proceed to IC-3: Inspect Mode + Screenshot Capture
3. 📋 Proceed to IC-4: Log & Error Capture
4. 📋 Proceed to IC-5: Issue Collector API & Database (replace in-memory storage)

