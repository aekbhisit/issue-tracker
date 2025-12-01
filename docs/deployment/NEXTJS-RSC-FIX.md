# Next.js RSC (React Server Components) Request Fix

## Problem

Next.js 15 RSC requests were failing with errors:
- `Failed to fetch RSC payload for https://issue.haahii.com/admin/issues`
- `Fetch API cannot load ... due to access control checks`
- `TypeError: Load failed`

## Root Cause

Next.js 15 uses React Server Components (RSC) which make special requests with `?_rsc=...` query parameters. These requests:

1. **Need special headers**: `Accept: text/x-component` and `RSC: 1`
2. **Should not be cached**: RSC payloads are dynamic
3. **Need proper proxying**: Must be handled before general route matching
4. **May be blocked by CORS**: If not properly configured

## Solution

### 1. Added RSC-Specific Location Block

Added a dedicated nginx location block for RSC requests that comes **before** the general `/admin` location:

```nginx
# Admin RSC (React Server Components) requests
# Next.js 15 uses ?_rsc= query parameter for RSC payload requests
# These must be handled before the general /admin location
location ~ ^/admin.*\?_rsc= {
    proxy_pass http://localhost:3411;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Accept "text/x-component";
    proxy_set_header RSC "1";
    
    # RSC requests should not be cached
    proxy_cache_bypass 1;
    proxy_no_cache 1;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
    
    # Next.js RSC specific settings
    proxy_buffering off;
    proxy_redirect off;
    
    # Longer timeout for RSC requests
    proxy_read_timeout 60s;
    proxy_connect_timeout 10s;
}
```

### 2. Key Features

**Special Headers:**
- `Accept: text/x-component` - Tells Next.js this is an RSC request
- `RSC: 1` - Indicates React Server Components request

**No Caching:**
- `proxy_cache_bypass 1`
- `proxy_no_cache 1`
- Cache-Control headers set to prevent caching

**Proper Ordering:**
- RSC location block comes **before** `/admin` location
- Uses regex `~ ^/admin.*\?_rsc=` to match RSC requests

**Timeouts:**
- `proxy_read_timeout 60s` - Longer timeout for RSC processing
- `proxy_connect_timeout 10s` - Connection timeout

### 3. Location Block Order

The order of location blocks in nginx is critical:

1. `/admin/_next/static/` - Static assets (most specific)
2. `/admin/_next/image` - Next.js images
3. `/admin/images/` - Public images
4. `~ ^/admin.*\?_rsc=` - **RSC requests (NEW)**
5. `/admin` - General admin routes (least specific)

This ensures RSC requests are caught by the specific handler before falling through to the general `/admin` handler.

## Testing

After applying the fix:

1. **Reload nginx:**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

2. **Check RSC requests work:**
   - Navigate to admin pages
   - Check browser console for RSC errors
   - Verify no "Failed to fetch RSC payload" errors

3. **Verify admin container is running:**
   ```bash
   docker ps | grep issue-collector-admin
   curl http://localhost:3411/admin
   ```

## Troubleshooting

### If RSC requests still fail:

1. **Check admin container:**
   ```bash
   docker ps | grep issue-collector-admin
   docker logs issue-collector-admin --tail 50
   ```

2. **Test RSC request directly:**
   ```bash
   curl -H "Accept: text/x-component" -H "RSC: 1" \
        "http://localhost:3411/admin/issues?_rsc=test"
   ```

3. **Check nginx error logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

4. **Verify location block order:**
   ```bash
   sudo nginx -T | grep -A 20 "location.*admin"
   ```

### Common Issues

**502 Bad Gateway:**
- Admin container not running
- Check: `docker ps | grep issue-collector-admin`

**CORS Errors:**
- RSC requests are same-origin, shouldn't have CORS issues
- If CORS errors persist, check Next.js configuration

**Timeout Errors:**
- Increase `proxy_read_timeout` if RSC requests take longer
- Check admin container logs for slow queries

## Additional Notes

### Next.js 15 RSC Behavior

Next.js 15 uses RSC for:
- Server-side component rendering
- Streaming responses
- Partial page updates

RSC requests:
- Use `?_rsc=...` query parameter
- Require `Accept: text/x-component` header
- Should not be cached
- Are same-origin (no CORS needed)

### Performance Considerations

- RSC requests are fast (server-side rendering)
- No caching means each request hits the server
- Consider Next.js caching strategies for optimal performance

## References

- [Next.js 15 RSC Documentation](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Nginx Location Matching](https://nginx.org/en/docs/http/ngx_http_core_module.html#location)

