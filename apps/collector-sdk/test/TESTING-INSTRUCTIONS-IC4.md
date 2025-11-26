# IC-4 Log & Error Capture Testing Instructions

This document provides step-by-step instructions for manually testing IC-4 Log & Error Capture functionality.

## Prerequisites

1. **API Server Running**: `pnpm dev:api` (should be running on `http://localhost:4501`)
2. **Admin Dashboard Running**: `pnpm dev:admin` (should be running on `http://localhost:4502`)
3. **Project Created**: At least one active project exists in the database
4. **Project Key**: Copy the `publicKey` of an active project from the admin dashboard
5. **SDK Built**: Run `pnpm --filter=collector-sdk build` to ensure latest build is available

## Setup

1. **Update Test Page**:
   - Open `apps/collector-sdk/test/index-ic4.html` (or `index.html`)
   - Replace `YOUR_PROJECT_KEY` with your actual project key
   - Save the file

2. **Build SDK** (if not already built):
   ```bash
   pnpm --filter=collector-sdk build
   ```

3. **Serve Test Page**:
   ```bash
   cd apps/collector-sdk/test
   python3 -m http.server 8080
   ```

4. **Open Browser**:
   - Navigate to `http://localhost:8080/index-ic4.html` (or `index.html`)
   - Open browser DevTools (F12) to monitor console and network tab

## Phase 2: SDK Integration Testing

### Steps:
1. **Verify SDK Loads**:
   - Check browser console for initialization message: "Issue Collector SDK: Log and error capture started."
   - Verify floating "+" button appears in bottom-right corner
   - Button should be blue and circular

2. **Test Modal Opening**:
   - Click the floating button
   - Modal should appear centered on screen
   - Verify form fields are visible:
     - Title input
     - Description textarea
     - Severity dropdown
   - Verify "Capture Screenshot" button is visible (IC-3 feature)

**Expected Result**: ✅ SDK loads, logging starts automatically, button appears, modal opens, form fields visible

## Phase 3: Console Log Capture Testing

### Test 3.1: Basic Console Logs

**Steps**:
1. Open browser console (F12)
2. Execute the following commands:
   ```javascript
   console.log('Test log message')
   console.warn('Test warning message')
   console.error('Test error message')
   ```
3. Verify logs appear in browser console (normal behavior maintained)
4. Open SDK modal
5. Fill in issue form:
   - Title: "Console Log Test"
   - Description: "Testing console log capture"
   - Severity: "low"
6. Submit issue
7. Check Network tab → Request payload → Verify `logs.consoleLogs` array contains the 3 log entries

**Expected Result**: ✅ All console.log/warn/error calls are captured and included in issue payload

### Test 3.2: Complex Arguments

**Steps**:
1. Execute in console:
   ```javascript
   console.log('Message', { key: 'value' }, [1, 2, 3])
   console.log('Object:', { nested: { data: 'test' } })
   ```
2. Submit issue and verify complex arguments are formatted correctly in payload
3. Check `logs.consoleLogs[].metadata` contains formatted arguments

**Expected Result**: ✅ Complex arguments are formatted correctly and captured in metadata

### Test 3.3: Circular References

**Steps**:
1. Create object with circular reference:
   ```javascript
   const circularObject = { name: 'test' }
   circularObject.self = circularObject
   console.log(circularObject)
   ```
2. Verify no errors occur in console
3. Submit issue and verify circular references are handled gracefully (should show `[Circular]`)

**Expected Result**: ✅ Circular references don't cause errors and are handled gracefully

### Test 3.4: Buffer Limits

**Steps**:
1. Generate 150+ console.log messages:
   ```javascript
   for (let i = 0; i < 150; i++) {
     console.log(`Log message ${i}`)
   }
   ```
2. Submit issue
3. Verify only last 100 entries are kept (check `logs.consoleLogs.length` should be 100)
4. Verify oldest entries are removed (FIFO)

**Expected Result**: ✅ Buffer limit (100 entries) is enforced, oldest entries removed first

## Phase 4: JavaScript Error Capture Testing

### Test 4.1: Runtime Errors

**Steps**:
1. Execute in console:
   ```javascript
   throw new Error('Test runtime error')
   ```
2. Verify error appears in console (normal behavior)
3. Submit issue
4. Verify error is captured in `logs.jsErrors` array
5. Verify error details:
   - `message`: "Test runtime error"
   - `stack`: Contains stack trace
   - `timestamp`: Present

**Expected Result**: ✅ Runtime errors are captured with full details

### Test 4.2: Unhandled Promise Rejections

**Steps**:
1. Execute in console:
   ```javascript
   Promise.reject('Test rejection')
   ```
2. Don't catch the rejection (let it be unhandled)
3. Wait a moment for unhandledrejection event
4. Submit issue
5. Verify rejection is captured in `logs.jsErrors` array
6. Verify message contains "Unhandled Promise Rejection"

**Expected Result**: ✅ Unhandled promise rejections are captured

### Test 4.3: Error with Source Information

**Steps**:
1. Create a test script in the HTML page:
   ```html
   <script>
     // This will have source URL and line numbers
     throw new Error('Error with source info')
   </script>
   ```
2. Reload page to trigger error
3. Submit issue
4. Verify `source`, `line`, and `column` are captured (if available)

**Expected Result**: ✅ Error source information is captured when available

### Test 4.4: Multiple Errors

**Steps**:
1. Trigger multiple errors:
   ```javascript
   throw new Error('Error 1')
   setTimeout(() => { throw new Error('Error 2') }, 100)
   setTimeout(() => { throw new Error('Error 3') }, 200)
   ```
2. Submit issue
3. Verify all errors are captured (check `logs.jsErrors.length`)

**Expected Result**: ✅ All errors are captured (no limit on errors)

## Phase 5: Network Error Capture Testing

### Test 5.1: Failed HTTP Requests (4xx)

**Steps**:
1. Execute in console:
   ```javascript
   fetch('/api/nonexistent')
     .then(r => r.json())
     .catch(e => console.log('Expected error:', e))
   ```
2. Check Network tab → Verify request returns 404
3. Submit issue
4. Verify 404 error is captured in `logs.networkErrors` array
5. Verify error details:
   - `url`: "/api/nonexistent"
   - `method`: "GET"
   - `status`: 404
   - `error`: Contains error message

**Expected Result**: ✅ Failed requests (status >= 400) are captured

### Test 5.2: Failed HTTP Requests (5xx)

**Steps**:
1. Make request to endpoint that returns 500 (if available) or use test endpoint
2. Submit issue
3. Verify 500 error is captured

**Expected Result**: ✅ 5xx errors are captured

### Test 5.3: Network Errors

**Steps**:
1. Execute in console:
   ```javascript
   fetch('http://invalid-domain-that-does-not-exist-12345.com')
     .catch(e => console.log('Expected network error:', e))
   ```
2. Submit issue
3. Verify network error is captured in `logs.networkErrors` array
4. Verify `status` is undefined (no HTTP status for network errors)
5. Verify `error` contains network error message

**Expected Result**: ✅ Network errors are captured correctly

### Test 5.4: Successful Requests (Not Captured)

**Steps**:
1. Execute in console:
   ```javascript
   fetch('http://localhost:4501/api/health')
     .then(r => r.json())
     .then(data => console.log('Success:', data))
   ```
2. Verify request succeeds (200 status)
3. Submit issue
4. Verify successful request is NOT captured (check `logs.networkErrors` should not contain this request)

**Expected Result**: ✅ Successful requests are NOT captured

### Test 5.5: Buffer Limits

**Steps**:
1. Generate 60+ failed fetch requests:
   ```javascript
   for (let i = 0; i < 60; i++) {
     fetch(`/api/nonexistent-${i}`).catch(() => {})
   }
   ```
2. Wait for all requests to complete
3. Submit issue
4. Verify only last 50 entries are kept (check `logs.networkErrors.length` should be 50)

**Expected Result**: ✅ Buffer limit (50 entries) is enforced

## Phase 6: Sensitive Data Redaction Testing

### Test 6.1: Password Redaction in Console Logs

**Steps**:
1. Execute in console:
   ```javascript
   console.log('password=secret123')
   console.log('Password: secret123')
   console.log('user_password=abc123')
   ```
2. Submit issue
3. Check payload → `logs.consoleLogs[].message`
4. Verify passwords are redacted as `password=[REDACTED]` or `Password: [REDACTED]`

**Expected Result**: ✅ Passwords are redacted in console logs

### Test 6.2: Token Redaction

**Steps**:
1. Execute in console:
   ```javascript
   console.log('token=abc123xyz')
   console.log('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')
   console.log('api_token=secret-token-123')
   ```
2. Submit issue
3. Verify tokens are redacted (check `logs.consoleLogs[].message`)

**Expected Result**: ✅ Tokens are redacted (including Bearer tokens)

### Test 6.3: API Key Redaction

**Steps**:
1. Execute in console:
   ```javascript
   console.log('api_key=sk_live_1234567890')
   console.log('api-key=secret-key')
   console.log('API_KEY=ABC123XYZ')
   ```
2. Submit issue
3. Verify API keys are redacted

**Expected Result**: ✅ API keys are redacted

### Test 6.4: Authorization Header Removal

**Steps**:
1. Execute in console:
   ```javascript
   fetch('/api/test', {
     headers: { 'Authorization': 'Bearer secret-token-123' }
   }).catch(() => {})
   ```
2. Wait for request to fail (404)
3. Submit issue
4. Check `logs.networkErrors[].requestHeaders`
5. Verify Authorization header is NOT present (should be `[REDACTED]` or missing)

**Expected Result**: ✅ Authorization headers are never captured in network error logs

### Test 6.5: Request Body Sanitization

**Steps**:
1. Execute in console:
   ```javascript
   fetch('/api/test', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ password: 'secret', token: 'abc123', api_key: 'sk_123' })
   }).catch(() => {})
   ```
2. Wait for request to fail (404)
3. Submit issue
4. Check `logs.networkErrors[].requestBody`
5. Verify sensitive keys are redacted (password, token, api_key values should be `[REDACTED]`)

**Expected Result**: ✅ Request bodies have sensitive keys redacted

## Phase 7: Log Truncation Testing

### Test 7.1: Long Messages

**Steps**:
1. Execute in console:
   ```javascript
   console.log('A'.repeat(2000)) // 2000 character message
   ```
2. Submit issue
3. Check `logs.consoleLogs[].message`
4. Verify message is truncated to max 1000 characters (should end with "...")

**Expected Result**: ✅ Long messages are truncated to 1000 characters

### Test 7.2: Large Metadata

**Steps**:
1. Execute in console:
   ```javascript
   console.log('Test', { data: 'X'.repeat(1000) })
   ```
2. Submit issue
3. Check `logs.consoleLogs[].metadata`
4. Verify metadata is truncated to max 500 characters per item

**Expected Result**: ✅ Large metadata is truncated to 500 characters

## Phase 8: API Validation Testing

### Test 8.1: Valid Log Data

**Steps**:
1. Generate various logs, errors, and network failures
2. Submit issue with valid logs structure
3. Check Network tab → Response
4. Verify API accepts the request (201 status)
5. Check API server console logs to confirm logs data is received

**Expected Result**: ✅ Valid log data is accepted by API

### Test 8.2: Invalid Log Structure

**Steps**:
1. Use browser DevTools to modify request payload before submission
2. Change `logs.consoleLogs` to a string instead of array
3. Submit issue
4. Verify API returns 422 validation error
5. Verify error message indicates validation failure

**Expected Result**: ✅ Invalid log structures are rejected with proper error messages

### Test 8.3: Buffer Limit Exceeded

**Steps**:
1. Manually create payload with `logs.consoleLogs` array > 100 entries
2. Submit issue
3. Verify API returns 422 validation error

**Expected Result**: ✅ Buffer limits are enforced by API validation

## Phase 9: Integration Testing

### Test 9.1: Complete Issue Submission with Logs

**Steps**:
1. Generate various console logs, errors, and network failures:
   ```javascript
   console.log('Test log 1')
   console.warn('Test warning')
   throw new Error('Test error')
   fetch('/api/nonexistent').catch(() => {})
   ```
2. Open SDK modal
3. Fill in issue form:
   - Title: "Complete Integration Test"
   - Description: "Testing complete log capture integration"
   - Severity: "high"
4. Submit issue
5. Verify logs are included in payload (check Network tab)
6. Verify API accepts and stores logs (201 status)
7. Check API server console logs to confirm logs data is received

**Expected Result**: ✅ Logs are correctly included in issue payloads and accepted by API

### Test 9.2: Issue Submission without Logs

**Steps**:
1. Clear browser console
2. Don't generate any logs/errors
3. Open SDK modal
4. Fill in and submit issue
5. Verify issue is submitted successfully
6. Verify `logs` field is optional (may be undefined or empty)

**Expected Result**: ✅ Issues can be submitted with or without logs

### Test 9.3: SDK Destroy and Cleanup

**Steps**:
1. Generate logs/errors:
   ```javascript
   console.log('Before destroy')
   ```
2. Call `window.IssueCollector.destroy()` in console
3. Verify console message: "Issue Collector SDK: Log and error capture stopped."
4. Generate more logs:
   ```javascript
   console.log('After destroy')
   ```
5. Open SDK modal and submit issue
6. Verify only logs from before destroy are captured
7. Verify original console/fetch/error handlers are restored

**Expected Result**: ✅ SDK cleanup works correctly, logging stops, handlers restored

## Phase 10: Performance Testing

### Test 10.1: Console Interception Overhead

**Steps**:
1. Open browser console
2. Measure time to execute 1000 console.log calls:
   ```javascript
   const start = performance.now()
   for (let i = 0; i < 1000; i++) {
     console.log(`Log ${i}`)
   }
   const end = performance.now()
   console.log(`Time: ${end - start}ms`)
   ```
3. Note the time
4. Compare with native console.log (disable SDK temporarily or test in incognito)
5. Verify overhead is minimal (< 10% increase)

**Expected Result**: ✅ Console interception has minimal overhead (< 10%)

### Test 10.2: Fetch Interception Overhead

**Steps**:
1. Measure time for 100 fetch requests:
   ```javascript
   const start = performance.now()
   Promise.all(Array(100).fill(0).map(() => fetch('/api/health')))
     .then(() => {
       const end = performance.now()
       console.log(`Time: ${end - start}ms`)
     })
   ```
2. Compare with native fetch performance
3. Verify overhead is minimal (< 5% increase)

**Expected Result**: ✅ Fetch interception has minimal overhead (< 5%)

### Test 10.3: Memory Usage

**Steps**:
1. Open browser DevTools → Memory tab
2. Take heap snapshot before generating logs
3. Generate 1000+ logs:
   ```javascript
   for (let i = 0; i < 1000; i++) {
     console.log(`Log ${i}`)
   }
   ```
4. Take heap snapshot after generating logs
5. Compare memory usage
6. Call `window.IssueCollector.destroy()`
7. Take heap snapshot after destroy
8. Verify no significant memory leaks

**Expected Result**: ✅ No significant memory leaks, buffer cleanup works

## Phase 11: Browser Compatibility Testing

### Test in Multiple Browsers

**For each browser** (Chrome, Firefox, Safari, Edge):

1. **Console Log Capture**:
   - Execute `console.log('Test')`
   - Submit issue
   - Verify log is captured

2. **Error Capture**:
   - Execute `throw new Error('Test')`
   - Submit issue
   - Verify error is captured

3. **Network Error Capture**:
   - Execute `fetch('/api/nonexistent').catch(() => {})`
   - Submit issue
   - Verify network error is captured

4. **Redaction**:
   - Execute `console.log('password=secret')`
   - Submit issue
   - Verify password is redacted

5. **Buffer Limits**:
   - Generate 150+ logs
   - Submit issue
   - Verify only 100 are kept

**Expected Result**: ✅ All features work consistently across browsers

## Phase 12: Edge Cases and Robustness Testing

### Test 12.1: Concurrent Operations

**Steps**:
1. Generate logs/errors while submitting issue:
   ```javascript
   // Start submitting issue
   // While modal is open, execute:
   console.log('Concurrent log 1')
   console.log('Concurrent log 2')
   throw new Error('Concurrent error')
   ```
2. Complete issue submission
3. Verify all logs are captured correctly
4. Verify no race conditions

**Expected Result**: ✅ No race conditions, all logs captured correctly

### Test 12.2: Rapid Log Generation

**Steps**:
1. Generate 1000+ logs rapidly:
   ```javascript
   for (let i = 0; i < 1000; i++) {
     console.log(`Rapid log ${i}`)
   }
   ```
2. Verify buffer handles rapid input correctly
3. Verify no performance degradation
4. Submit issue and verify buffer limit is respected

**Expected Result**: ✅ Rapid log generation handled correctly, no performance issues

### Test 12.3: Invalid Data Handling

**Steps**:
1. Test with null/undefined values:
   ```javascript
   console.log(null)
   console.log(undefined)
   ```
2. Test with very large objects:
   ```javascript
   const largeObj = {}
   for (let i = 0; i < 10000; i++) {
     largeObj[`key${i}`] = `value${i}`
   }
   console.log(largeObj)
   ```
3. Verify graceful error handling
4. Verify SDK continues to work

**Expected Result**: ✅ Invalid data doesn't break SDK, graceful handling

### Test 12.4: Multiple SDK Instances

**Steps**:
1. Initialize SDK multiple times:
   ```javascript
   window.IssueCollector.init({ projectKey: 'proj_test' })
   window.IssueCollector.init({ projectKey: 'proj_test' })
   ```
2. Generate logs
3. Verify logging doesn't conflict
4. Call destroy multiple times
5. Verify cleanup works correctly

**Expected Result**: ✅ Multiple instances don't conflict, cleanup works

## Troubleshooting

### SDK Not Loading
- Check browser console for errors
- Verify SDK build exists: `apps/collector-sdk/dist/collector.min.js`
- Verify project key is correct

### Logs Not Captured
- Verify SDK initialized successfully (check console for "Log and error capture started.")
- Check that logging started before generating logs
- Verify logs are generated before submitting issue

### API Errors
- Verify API server is running on `http://localhost:4501`
- Check API server console logs for errors
- Verify project key is valid and project is active

### Performance Issues
- Check browser DevTools → Performance tab
- Monitor memory usage
- Verify buffer limits are enforced

## Test Results Template

Record your test results in `IC-4-TEST-RESULTS.md`:

- ✅ Pass
- ❌ Fail
- ⚠️ Partial/Warning
- ➖ Not Tested

For each test, record:
- Test ID (e.g., "Test 3.1")
- Result (✅/❌/⚠️/➖)
- Notes (any issues found, browser-specific behavior, etc.)
- Screenshots (if applicable)

## Next Steps

After completing all tests:
1. Review test results
2. Document any issues found
3. Create GitHub issues for bugs
4. Update documentation if needed
5. Sign off on IC-4 implementation

