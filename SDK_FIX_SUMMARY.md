# SDK Fix Summary - "Can't find variable: attempt"

**Date:** 2025-12-02  
**Issue:** Form submission failing with "Can't find variable: attempt" error  
**Status:** ✅ FIXED

---

## 🐛 Problem

When trying to submit the form on `http://localhost:8080/test-sdk-embed.html`, the browser console showed:

```
Can't find variable: attempt
```

The form submission was failing, and the Issue Collector SDK widget was not working properly.

---

## 🔍 Root Cause

The `collector.min.js` file was **outdated or corrupted**. The minified version didn't match the source code in `apps/collector-sdk/src/`.

The variable `attempt` is used in the retry logic in `src/api.ts`:

```typescript
for (let attempt = 0; attempt <= maxRetries; attempt++) {
  console.log('[SDK API] Submitting payload (attempt):', {
    attempt: attempt + 1,
    url: `${apiUrl}/api/public/v1/issues`,
    payload: logPayload,
  })
  // ... retry logic
}
```

The minified version was missing proper variable declarations, causing the runtime error.

---

## 🔧 Solution

Rebuilt the collector SDK from source and deployed the new version:

```bash
# 1. Navigate to collector SDK directory
cd /Applications/XAMPP/xamppfiles/htdocs/issue-tracker/apps/collector-sdk

# 2. Rebuild the SDK
npm run build

# 3. Copy to admin public directory
cp dist/collector.min.js ../admin/public/collector.min.js
```

---

## 📋 Files Updated

1. **`apps/collector-sdk/dist/collector.min.js`**
   - Size: 265.83 kB (gzip: 64.64 kB)
   - Built with Vite 5.4.21
   - Contains all latest source code changes

2. **`apps/admin/public/collector.min.js`**
   - Size: 260 KB
   - Deployed version accessible at `https://issue.haahii.com/collector.min.js`

---

## ✅ Verification Steps

1. **Clear browser cache:**
   - Chrome/Edge: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - Safari: `Cmd+Option+R`
   - Firefox: `Ctrl+Shift+R`

2. **Reload the test page:**
   ```
   http://localhost:8080/test-sdk-embed.html
   ```

3. **Check browser console (F12):**
   - Should see: `✅ SDK loaded successfully!`
   - Should see: `✅ Widget found in DOM`
   - Should NOT see: `Can't find variable: attempt`

4. **Test the widget:**
   - Look for floating button in bottom-right corner
   - Click the button to open the issue reporting modal
   - Fill out the form and submit
   - Should see success message

---

## 🔄 Build Process

The collector SDK uses Vite for building:

**Build Configuration (`vite.config.ts`):**
```typescript
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'IssueCollector',
      fileName: () => 'collector.min.js',
      formats: ['iife'],
    },
    outDir: 'dist',
    minify: 'terser',
    sourcemap: false,
  },
})
```

**Build Commands:**
- `npm run build` - Build once
- `npm run dev` - Build and watch for changes
- `npm run clean` - Remove dist directory

---

## 🚀 Deployment Checklist

When updating the SDK:

- [ ] Make changes to source files in `apps/collector-sdk/src/`
- [ ] Run `npm run build` in `apps/collector-sdk/`
- [ ] Copy `dist/collector.min.js` to `apps/admin/public/collector.min.js`
- [ ] Test locally on `http://localhost:8080/test-sdk-embed.html`
- [ ] Clear browser cache before testing
- [ ] Check browser console for errors
- [ ] Test form submission
- [ ] Deploy to production if needed

---

## 📝 Related Files

**Source Files:**
- `apps/collector-sdk/src/api.ts` - API submission with retry logic (contains `attempt` variable)
- `apps/collector-sdk/src/widget.ts` - Main widget logic
- `apps/collector-sdk/src/modal.ts` - Modal UI
- `apps/collector-sdk/src/panel.ts` - Form panel
- `apps/collector-sdk/src/screenshot.ts` - Screenshot capture
- `apps/collector-sdk/src/selectors.ts` - Element selector extraction

**Build Files:**
- `apps/collector-sdk/dist/collector.min.js` - Built SDK
- `apps/collector-sdk/vite.config.ts` - Build configuration
- `apps/collector-sdk/package.json` - Dependencies and scripts

**Deployment:**
- `apps/admin/public/collector.min.js` - Deployed SDK (served at `/collector.min.js`)

**Test Files:**
- `/Applications/XAMPP/xamppfiles/htdocs/issue-tracker/test-sdk-embed.html` - Test page
- `apps/collector-sdk/test/index.html` - Another test page

---

## 🐛 Common Issues

### Issue: "Can't find variable: [variable_name]"
**Cause:** Outdated or corrupted minified file  
**Fix:** Rebuild SDK with `npm run build`

### Issue: SDK not loading
**Cause:** File not found or CORS error  
**Fix:** Check file exists at `apps/admin/public/collector.min.js`

### Issue: Widget not appearing
**Cause:** JavaScript error or initialization failure  
**Fix:** Check browser console for errors, rebuild SDK

### Issue: Form submission failing
**Cause:** API endpoint not accessible or CORS issues  
**Fix:** Check API is running, verify CORS settings

---

## 📚 Additional Resources

- **SDK Documentation:** `apps/collector-sdk/README.md`
- **API Documentation:** `apps/collector-sdk/docs/api/public/issues.md`
- **Testing Guide:** `apps/collector-sdk/TESTING-SUMMARY.md`

---

**Status:** ✅ Issue resolved  
**Next Steps:** Test form submission on `http://localhost:8080/test-sdk-embed.html`


