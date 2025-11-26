# IC-3 Quick Start Testing Guide

This is a quick reference guide for testing IC-3 functionality. For detailed instructions, see `TESTING-INSTRUCTIONS-IC3.md`.

## Quick Setup (5 minutes)

1. **Start API Server**:
   ```bash
   pnpm dev:api
   ```

2. **Get Project Key**:
   - Open `http://localhost:4502/admin/projects`
   - Login (default: `admin@example.com` / `password`)
   - Create or select a project
   - Copy the `publicKey` (starts with `proj_`)

3. **Update Test Page**:
   - Edit `apps/collector-sdk/test/index.html`
   - Replace `YOUR_PROJECT_KEY` with your project key
   - Save file

4. **Build SDK** (if needed):
   ```bash
   pnpm --filter=collector-sdk build
   ```

5. **Serve Test Page**:
   ```bash
   cd apps/collector-sdk/test
   python3 -m http.server 8080
   ```

6. **Open Browser**:
   - Navigate to `http://localhost:8080/index.html`
   - Open DevTools (F12) to monitor console

## Quick Test Checklist

### Basic Functionality (2 minutes)
- [ ] Floating button appears in bottom-right
- [ ] Click button → modal opens
- [ ] "Capture Screenshot" button is visible in form

### Inspect Mode (2 minutes)
- [ ] Click "Capture Screenshot" → inspect mode activates
- [ ] Hover over elements → blue highlight appears
- [ ] Click element → screenshot captured
- [ ] Preview modal shows screenshot and metadata

### Form Submission (1 minute)
- [ ] Fill form and submit with screenshot
- [ ] Verify success message
- [ ] Check API logs for screenshot data

## Automated Verification

Run the automated verification script:

```bash
cd apps/collector-sdk
./test/verify-ic3.sh
```

This will verify:
- ✅ Build completed successfully
- ✅ Bundle size is acceptable
- ✅ All source files exist
- ✅ TypeScript compilation passes

## Common Issues

**SDK not loading?**
- Check browser console for errors
- Verify project key is correct
- Verify `collector.min.js` exists in `dist/` folder

**Inspect mode not working?**
- Check browser console for errors
- Verify html2canvas is loaded (check Network tab)
- Try refreshing the page

**Screenshot capture failing?**
- Check browser console for errors
- Verify element is visible (not hidden)
- Try selecting a simpler element

**API errors?**
- Verify API server is running (`pnpm dev:api`)
- Check API server logs
- Verify project key is valid and project is active

## Next Steps

After quick testing, proceed with comprehensive testing:
1. Read `TESTING-INSTRUCTIONS-IC3.md` for detailed steps
2. Complete all 12 phases
3. Update `IC-3-TEST-RESULTS.md` with results
4. Sign off on IC-3 completion

