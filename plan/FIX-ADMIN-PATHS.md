# Plan: Fix All /admin/admin Paths to Use /admin Only

## Problem Analysis

### Root Cause
- **Current Setup:**
  - `basePath: '/admin'` in `next.config.js`
  - Folder structure: `app/admin/...`
  - **Result:** Next.js creates routes at `/admin/admin/...` (basePath + folder name)

### Current Workarounds (Should Be Removed)
1. **next.config.js rewrites:** `/admin/route` → `/admin/admin/route`
2. **middleware.ts redirects:** `/admin/admin/*` → `/admin/*`
3. **nginx.conf rewrites:** `/admin/admin/*` → `/admin/*`

### Why Links Still Go to /admin/admin
- Links in code are correct (using relative paths like `/issues?projectId=...`)
- But Next.js routing with `basePath + app/admin/` creates `/admin/admin/` URLs
- The rewrites in `next.config.js` are actually creating the problem, not solving it

## Solution: Remove basePath, Handle /admin Only in Nginx

### Step 1: Remove basePath from next.config.js
- Remove `basePath: '/admin'`
- Remove `assetPrefix: '/admin'`
- Remove rewrites that create `/admin/admin/` paths
- Keep only necessary rewrites (storage, images, collector.min.js)

### Step 2: Update Nginx Configuration
- Nginx already handles `/admin` prefix correctly
- Remove `/admin/admin/` workaround location blocks
- Ensure static assets are served correctly

### Step 3: Update Static Asset Paths
- Check all image references (should work with Nginx `/images/` location)
- Update any hardcoded `/admin/` paths in components
- Test collector.min.js path

### Step 4: Update Middleware
- Remove `/admin/admin/` redirect logic
- Simplify middleware to only handle auth redirects
- Remove path normalization for `/admin/admin/`

### Step 5: Verify All Links
- All `href` attributes should use relative paths (no `/admin` prefix)
- All `router.push()` should use relative paths
- Next.js will serve at root, Nginx adds `/admin` prefix

### Step 6: Test All Routes
- Test navigation from all pages
- Test RSC requests (?_rsc=)
- Test static assets
- Test API routes

## Files to Modify

1. **apps/admin/next.config.js**
   - Remove `basePath` and `assetPrefix`
   - Remove rewrites for routes (lines 70-99)
   - Keep only storage/images/collector rewrites

2. **apps/admin/middleware.ts**
   - Remove `/admin/admin/` redirect logic (lines 17-33)
   - Simplify path normalization

3. **infra/nginx/issue.haahii.com.conf**
   - Remove `/admin/admin/` location block (lines 304-334)
   - Verify `/admin` location block works correctly

4. **All component files with links**
   - Verify all use relative paths (already correct)
   - No changes needed if paths are relative

## Expected Outcome

- All routes accessible at `/admin/*` only (not `/admin/admin/*`)
- No workarounds needed in code
- Cleaner, more maintainable configuration
- RSC requests work correctly
- Static assets served correctly

## Testing Checklist

- [ ] Remove basePath from next.config.js
- [ ] Remove rewrites that create /admin/admin/ paths
- [ ] Update middleware to remove /admin/admin/ redirects
- [ ] Update Nginx to remove /admin/admin/ workarounds
- [ ] Test all navigation links
- [ ] Test RSC requests
- [ ] Test static assets
- [ ] Test API routes
- [ ] Verify no /admin/admin/ paths in browser
- [ ] TypeScript check passes
- [ ] Build succeeds

