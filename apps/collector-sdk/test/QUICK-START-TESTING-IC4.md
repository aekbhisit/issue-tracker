# IC-4 Quick Start Testing Guide

Quick reference guide for testing IC-4 Log & Error Capture functionality.

## Prerequisites Checklist

- [ ] API server running (`pnpm dev:api` on `http://localhost:4501`)
- [ ] Admin dashboard running (`pnpm dev:admin` on `http://localhost:4502`)
- [ ] SDK built (`pnpm --filter=collector-sdk build`)
- [ ] Project created with `publicKey` copied
- [ ] Test page updated with project key

## Quick Setup

```bash
# 1. Build SDK
pnpm --filter=collector-sdk build

# 2. Serve test page
cd apps/collector-sdk/test
python3 -m http.server 8080

# 3. Open browser
# Navigate to: http://localhost:8080/index-ic4.html
```

## Quick Test Scenarios

### 1. Console Log Capture (2 minutes)

```javascript
// In browser console:
console.log('Test log')
console.warn('Test warning')
console.error('Test error')

// Then submit issue via SDK modal
// Verify logs appear in Network tab → Request payload → logs.consoleLogs
```

**Expected**: ✅ 3 log entries captured

---

### 2. JavaScript Error Capture (2 minutes)

```javascript
// In browser console:
throw new Error('Test runtime error')

// Then submit issue via SDK modal
// Verify error appears in Network tab → Request payload → logs.jsErrors
```

**Expected**: ✅ Error captured with message and stack trace

---

### 3. Network Error Capture (2 minutes)

```javascript
// In browser console:
fetch('/api/nonexistent').catch(() => {})

// Then submit issue via SDK modal
// Verify network error appears in Network tab → Request payload → logs.networkErrors
```

**Expected**: ✅ Network error captured (404)

---

### 4. Sensitive Data Redaction (2 minutes)

```javascript
// In browser console:
console.log('password=secret123')
console.log('token=abc123xyz')

// Then submit issue via SDK modal
// Verify passwords/tokens are redacted in payload
```

**Expected**: ✅ Passwords/tokens show as `[REDACTED]`

---

### 5. Buffer Limits (3 minutes)

```javascript
// In browser console:
for (let i = 0; i < 150; i++) {
  console.log(`Log ${i}`)
}

// Then submit issue via SDK modal
// Verify only 100 logs are captured (check logs.consoleLogs.length)
```

**Expected**: ✅ Only 100 entries kept (FIFO)

---

### 6. Complete Integration Test (5 minutes)

```javascript
// Generate various logs/errors:
console.log('Test log 1')
console.warn('Test warning')
throw new Error('Test error')
fetch('/api/nonexistent').catch(() => {})

// Open SDK modal, fill form, submit
// Verify all logs/errors are captured in payload
```

**Expected**: ✅ All logs, errors, and network failures captured

---

## Verification Checklist

### Build Verification
- [ ] Run: `./apps/collector-sdk/test/verify-ic4.sh`
- [ ] All checks pass

### SDK Integration
- [ ] SDK loads without errors
- [ ] Console shows "Log and error capture started."
- [ ] Floating button appears
- [ ] Modal opens correctly

### Core Functionality
- [ ] Console logs captured ✅
- [ ] JavaScript errors captured ✅
- [ ] Network errors captured ✅
- [ ] Sensitive data redacted ✅
- [ ] Buffer limits enforced ✅

### API Integration
- [ ] Issue submission with logs succeeds (201)
- [ ] Logs data received by API
- [ ] Issue submission without logs succeeds (201)

### Performance
- [ ] Console interception overhead < 10%
- [ ] Fetch interception overhead < 5%
- [ ] No memory leaks

---

## Common Issues & Solutions

### SDK Not Loading
- **Check**: Browser console for errors
- **Fix**: Verify SDK build exists: `apps/collector-sdk/dist/collector.min.js`

### Logs Not Captured
- **Check**: Console shows "Log and error capture started."
- **Fix**: Ensure SDK initialized before generating logs

### API Errors
- **Check**: API server running on `http://localhost:4501`
- **Fix**: Verify project key is valid and project is active

### Performance Issues
- **Check**: Browser DevTools → Performance tab
- **Fix**: Verify buffer limits are enforced

---

## Test Results Template

Record quick results:

| Test | Status | Notes |
|------|--------|-------|
| Console Log Capture | ⬜ Pass ⬜ Fail | |
| Error Capture | ⬜ Pass ⬜ Fail | |
| Network Error Capture | ⬜ Pass ⬜ Fail | |
| Sensitive Data Redaction | ⬜ Pass ⬜ Fail | |
| Buffer Limits | ⬜ Pass ⬜ Fail | |
| Integration | ⬜ Pass ⬜ Fail | |

---

## Next Steps

After quick testing:
1. ✅ All tests pass → Proceed to detailed testing (`TESTING-INSTRUCTIONS-IC4.md`)
2. ❌ Issues found → Document in `IC-4-TEST-RESULTS.md` and create GitHub issues
3. ⚠️ Partial pass → Review specific areas and retest

---

## Detailed Testing

For comprehensive testing, see:
- **Full Instructions**: `TESTING-INSTRUCTIONS-IC4.md`
- **Test Results Template**: `IC-4-TEST-RESULTS.md`
- **Automated Verification**: `verify-ic4.sh`

