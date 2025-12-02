# Nginx Static Assets Configuration

## Problem

502 Bad Gateway errors for static assets like `logo-icon.svg` when requested from root path `/images/...` instead of `/admin/images/...`.

## Root Cause

Next.js `assetPrefix` only affects `_next/static` assets (CSS, JS, fonts), **NOT** files in the `public/` folder. 

When the admin app uses:
```tsx
<Image src="/images/logo/logo-icon.svg" />
```

Next.js serves this from `public/images/logo/logo-icon.svg` at the **root** path `/images/logo/logo-icon.svg`, not `/admin/images/logo/logo-icon.svg`.

## Solution

### Option 1: Add Nginx Location for Root /images/ (Current Implementation)

Added location block in nginx to proxy `/images/` requests to admin container:

```nginx
location /images/ {
    proxy_pass http://localhost:3411;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

**Pros:**
- Works immediately without code changes
- Handles existing image paths

**Cons:**
- If both admin and frontend use `/images/`, there's a conflict
- Admin takes precedence

### Option 2: Update Image Paths in Admin App (Recommended Long-term)

Update all image paths to use `/admin/images/` prefix:

```tsx
// Before
<Image src="/images/logo/logo-icon.svg" />

// After
<Image src="/admin/images/logo/logo-icon.svg" />
```

Or create a utility function:

```tsx
function getAdminImagePath(path: string): string {
  return `/admin${path.startsWith('/') ? path : '/' + path}`
}

<Image src={getAdminImagePath('/images/logo/logo-icon.svg')} />
```

**Pros:**
- Clear separation between admin and frontend assets
- No nginx conflicts
- More maintainable

**Cons:**
- Requires updating all image references in admin app

### Option 3: Use Next.js basePath (Not Recommended)

Add `basePath: '/admin'` to `next.config.js`:

```js
const nextConfig = {
  basePath: '/admin',
  assetPrefix: '/admin',
  // ...
}
```

**Pros:**
- Automatically prefixes all routes and assets

**Cons:**
- Would require updating all internal links
- Routes are already under `app/admin/` which creates `/admin/...` routes
- Would cause double-prefixing (`/admin/admin/...`)

## Current Nginx Configuration

The nginx config now handles:

1. `/admin/images/` → Admin container (port 3411) at `/images/`
2. `/images/` → Admin container (port 3411) at `/images/` (for root-relative paths)
3. `/admin/_next/static/` → Admin container (port 3411)
4. `/` → Frontend container (port 3412)
5. `/_next/static/` → Frontend container (port 3412)

## Troubleshooting

### 502 Bad Gateway on /images/logo/logo-icon.svg

**Check:**
1. Is admin container running?
   ```bash
   docker ps | grep issue-collector-admin
   ```

2. Can admin container serve images directly?
   ```bash
   curl http://localhost:3411/images/logo/logo-icon.svg
   ```

3. Is nginx configuration correct?
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### Images Load But Wrong Path

If images load but from wrong container:
- Check nginx location block order (more specific paths should come first)
- Verify `proxy_pass` targets correct container

## Best Practice

For future development:
1. Use absolute paths with `/admin/` prefix for admin app images
2. Use root paths `/images/` only for frontend app
3. Or use environment-based path resolution utility


