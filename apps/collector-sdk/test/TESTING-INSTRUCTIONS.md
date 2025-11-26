# IC-2 Testing Instructions

This guide provides step-by-step instructions for manually testing IC-2 Collector SDK.

## Prerequisites

1. **Start API Server**
   ```bash
   pnpm dev:api
   ```
   Wait for server to start on port 4501.

2. **Get a Project Key**
   - Open admin dashboard: `http://localhost:4502/admin/projects`
   - Login if needed (default: admin@example.com / password)
   - Create a new project or use an existing one
   - Copy the `publicKey` (e.g., `proj_abc123xyz`)

## Quick Test (Automated)

### API Endpoint Testing

```bash
# Run automated API tests
cd apps/collector-sdk/test
./test-api.sh proj_your_key_here
```

This will test:
- Health endpoint
- Valid issue submission
- Invalid project key rejection
- Validation errors
- CORS headers

## Manual Browser Testing

### Step 1: Prepare Test Page

1. Open `apps/collector-sdk/test/index.html` in a text editor
2. Find the script tag:
   ```html
   <script 
     data-project-key="YOUR_PROJECT_KEY"
     data-api-url="http://localhost:4501"
     src="../dist/collector.min.js">
   </script>
   ```
3. Replace `YOUR_PROJECT_KEY` with your actual project key
4. Save the file

### Step 2: Serve Test Page

**Option A: Simple HTTP Server**
```bash
cd apps/collector-sdk/test
python3 -m http.server 8080
# Then open: http://localhost:8080/index.html
```

**Option B: Open Directly**
- Open `apps/collector-sdk/test/index.html` directly in browser
- Note: Some browsers may block local file access

### Step 3: Visual Verification

1. **Check Floating Button**
   - Button should appear in bottom-right corner
   - Blue circular button with "+" icon
   - Hover effect works

2. **Test Modal**
   - Click button → Modal should open
   - Check form fields: Title, Description, Severity
   - Try closing: × button, overlay click, ESC key, Cancel button

3. **Test Form Validation**
   - Submit empty form → Should show errors
   - Fill only title → Should show description error
   - Fill only description → Should show title error

### Step 4: Test Submission

1. **Fill Form**
   - Title: "Test Issue"
   - Description: "Testing IC-2 SDK"
   - Severity: "High"

2. **Submit**
   - Click Submit button
   - Watch for loading state ("Submitting...")
   - Check Network tab in DevTools

3. **Verify Success**
   - Success message should appear
   - Modal should close after 1.5 seconds
   - Network request should show 201 status
   - Response should include issue ID

### Step 5: Test Error Scenarios

1. **Invalid Project Key**
   - Update test HTML with invalid key: `proj_invalid`
   - Submit form
   - Should show error message
   - Modal should stay open

2. **Network Error**
   - Stop API server (`Ctrl+C`)
   - Submit form
   - Should show network error
   - Should retry 3 times (check Network tab)

### Step 6: Verify Metadata

1. Open DevTools → Network tab
2. Submit an issue
3. Click on the POST request
4. Check Request Payload → `metadata` object
5. Verify all fields are present and correct

### Step 7: Test User Info (Optional)

1. **With User Info**
   - Open browser console
   - Before page load, set:
     ```javascript
     window.issueCollectorUser = {
       id: 'test-123',
       email: 'test@example.com',
       name: 'Test User'
     }
     ```
   - Reload page
   - Submit issue
   - Check Network tab → `userInfo` should be in payload

2. **Without User Info**
   - Clear `window.issueCollectorUser`
   - Reload page
   - Submit issue
   - Should work fine (anonymous reporting)

## Browser Compatibility Testing

Test in each browser:

1. **Chrome**
   - Open test page
   - Verify all functionality works
   - Check console for errors

2. **Firefox**
   - Open test page
   - Verify all functionality works
   - Check console for errors

3. **Safari**
   - Open test page
   - Verify all functionality works
   - Check console for errors

4. **Edge**
   - Open test page
   - Verify all functionality works
   - Check console for errors

## Edge Cases Testing

1. **Missing Project Key**
   - Remove `data-project-key` attribute
   - Reload page
   - Check console for error
   - Button should not appear

2. **Invalid API URL**
   - Set `data-api-url="http://invalid-url:9999"`
   - Submit form
   - Should show network error

3. **Large Form Data**
   - Title: 255 characters (max)
   - Description: 5000 characters (max)
   - Submit → Should work

4. **Rapid Submissions**
   - Submit form multiple times quickly
   - Each should be handled separately
   - No duplicate issues

5. **Manual Initialization**
   - In browser console:
     ```javascript
     // Destroy existing widget
     window.IssueCollector.destroy()
     
     // Initialize manually
     window.IssueCollector.init({
       projectKey: 'proj_your_key',
       apiUrl: 'http://localhost:4501'
     })
     ```
   - Verify widget works

## Recording Test Results

Use `TEST-RESULTS.md` to record your test results:

1. Open `apps/collector-sdk/test/TEST-RESULTS.md`
2. Fill in test results for each phase
3. Check off completed items
4. Note any issues or observations
5. Sign off when all tests pass

## Troubleshooting

### Button Not Appearing
- Check browser console for errors
- Verify `data-project-key` is set correctly
- Ensure script tag is before `</body>`
- Check if Shadow DOM is supported

### Modal Not Opening
- Check button click handler
- Verify Shadow DOM is working
- Check for JavaScript errors

### API Request Failing
- Verify API server is running
- Check CORS configuration
- Verify project key is valid and active
- Check Network tab for request/response details

### Form Not Submitting
- Check form validation errors
- Verify all required fields are filled
- Check browser console for errors
- Verify API endpoint is accessible

## Success Criteria

All tests pass when:
- ✅ SDK builds successfully
- ✅ API endpoints work correctly
- ✅ Floating button appears and works
- ✅ Modal opens/closes correctly
- ✅ Form validation works
- ✅ Form submission succeeds
- ✅ Error handling works
- ✅ Works in all 4 browsers
- ✅ No console errors
- ✅ Documentation is complete

## Next Steps

Once all tests pass:
1. Document results in `TEST-RESULTS.md`
2. Sign off on testing
3. Proceed to IC-3: Inspect Mode + Screenshot Capture

