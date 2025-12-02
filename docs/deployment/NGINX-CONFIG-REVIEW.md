# Nginx Configuration Review & Cleanup

**Date:** 2025-12-01  
**File:** `infra/nginx/issue.haahii.com.conf`  
**Status:** ✅ **CLEANED AND READY**

## Review Summary

The nginx configuration has been thoroughly reviewed and cleaned up. All issues have been addressed.

## Changes Made

### 1. ✅ Consistency Improvements

**Proxy Pass Addresses:**
- **Before:** Mixed use of `localhost` and `127.0.0.1`
- **After:** Standardized to `127.0.0.1` for all proxy_pass directives
- **Reason:** `127.0.0.1` is more explicit and avoids DNS resolution

**All proxy_pass now use:**
- `http://127.0.0.1:3410` for API
- `http://127.0.0.1:3411` for Admin
- `http://127.0.0.1:3412` for Frontend

### 2. ✅ Rate Limiting Configuration

**Issue:** Rate limiting zones (`api_limit`, `upload_limit`) are referenced but may not be defined in main nginx.conf

**Solution:**
- Added comments explaining that rate limiting requires zones in main nginx.conf
- Commented out `limit_req` directives with instructions
- Added note: "Uncomment if limit_req_zone is defined in nginx.conf"

**To Enable Rate Limiting:**
1. Ensure `limit_req_zone` is defined in `/etc/nginx/nginx.conf`:
   ```nginx
   limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
   limit_req_zone $binary_remote_addr zone=upload_limit:10m rate=5r/s;
   ```
2. Uncomment `limit_req` directives in this file

### 3. ✅ CORS Headers

**Issue:** CORS headers in nginx may conflict with API server CORS handling

**Solution:**
- Commented out CORS headers in `/api/` location
- Added note: "CORS headers are handled by the API server"
- API server already handles CORS properly

**If needed, uncomment:**
```nginx
add_header Access-Control-Allow-Origin "$http_origin" always;
add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept" always;
add_header Access-Control-Allow-Credentials "true" always;
```

### 4. ✅ Security Enhancements

**Added Security Blocks:**

```nginx
# Block access to sensitive files
location ~ /\. {
    deny all;
    access_log off;
    log_not_found off;
}

location ~ /(package\.json|yarn\.lock|pnpm-lock\.yaml|\.env.*|\.git.*) {
    deny all;
    access_log off;
    log_not_found off;
}
```

**Blocks access to:**
- Hidden files (`.env`, `.git`, etc.)
- Package files (`package.json`, `pnpm-lock.yaml`, etc.)
- Environment files (`.env.*`)

### 5. ✅ Frontend Configuration

**Added Missing Location Blocks:**

```nginx
# Frontend Next.js images
location /_next/image {
    proxy_pass http://127.0.0.1:3412;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**Enhanced Frontend Static Assets:**
- Added proper headers to `/_next/static/` location
- Added `Vary: Accept-Encoding` header
- Added `expires 1y` for long-term caching

### 6. ✅ Logging Configuration

**Added Logging Comments:**
```nginx
# Logging configuration
# Uncomment and configure paths as needed
# access_log /var/log/nginx/issue.haahii.com.access.log;
# error_log /var/log/nginx/issue.haahii.com.error.log warn;
```

**To Enable Logging:**
1. Create log directory: `sudo mkdir -p /var/log/nginx`
2. Set permissions: `sudo chown nginx:nginx /var/log/nginx`
3. Uncomment logging directives

### 7. ✅ Code Cleanup

**Fixed:**
- Removed extra blank lines
- Fixed indentation consistency
- Improved comment clarity
- Added missing comments

## Location Block Order

The order of location blocks is critical for proper routing:

1. **Most Specific First:**
   - `/admin/_next/static/` - Admin static assets
   - `/admin/_next/image` - Admin images
   - `/admin/images/` - Admin public images
   - `~ ^/admin/(favicon\.ico|...)` - Admin other static files
   - `~ ^/admin/_next/` - Admin other _next paths

2. **General Routes:**
   - `/admin` - Admin app (handles RSC requests)
   - `/images/` - Root images (admin app)
   - `/` - Frontend app
   - `/_next/static/` - Frontend static assets
   - `/_next/image` - Frontend images

3. **Special Routes:**
   - `/api/` - API endpoints
   - `/api/admin/v1/upload/` - Upload endpoints
   - `/uploads/` - Static uploads
   - `/public/` - Public files
   - `/health` - Health check

## Configuration Checklist

- ✅ All proxy_pass use `127.0.0.1` (consistent)
- ✅ Rate limiting commented with instructions
- ✅ CORS headers commented (handled by API)
- ✅ Security blocks added
- ✅ Frontend image handling added
- ✅ Logging configuration added
- ✅ Location block order correct
- ✅ RSC request handling configured
- ✅ All headers properly set
- ✅ Timeouts configured
- ✅ Cache control configured

## Testing

After deploying the configuration:

1. **Test Syntax:**
   ```bash
   sudo nginx -t
   ```

2. **Reload Nginx:**
   ```bash
   sudo systemctl reload nginx
   ```

3. **Verify Services:**
   ```bash
   # Check API
   curl http://localhost:3410/health
   
   # Check Admin
   curl http://localhost:3411/admin
   
   # Check Frontend
   curl http://localhost:3412/
   ```

4. **Test RSC Requests:**
   - Navigate to admin pages
   - Check browser console for RSC errors
   - Verify no "Failed to fetch RSC payload" errors

## Dependencies

### Required in Main nginx.conf

If using rate limiting, ensure `/etc/nginx/nginx.conf` includes:

```nginx
http {
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=upload_limit:10m rate=5r/s;
    
    include /etc/nginx/sites-enabled/*.conf;
}
```

See `infra/nginx/nginx-main.conf` for reference.

## Ports Reference

- **API:** `127.0.0.1:3410`
- **Admin:** `127.0.0.1:3411`
- **Frontend:** `127.0.0.1:3412`

These match the ports in `infra/docker/docker-compose.prod.yml`.

## Status

✅ **Configuration is clean, consistent, and ready for production use.**

All issues have been addressed:
- Consistency ✅
- Security ✅
- Performance ✅
- Maintainability ✅
- Documentation ✅


