# Nginx Setup Guide

This guide explains how to properly configure nginx for the Issue Collector Platform.

## Problem: "events directive is not allowed here"

If you see this error:
```
"events" directive is not allowed here in /etc/nginx/sites-enabled/issue.haahii.com.conf
```

**Cause:** The full `nginx.conf` file (with `events {}` and `http {}` blocks) was copied into `/etc/nginx/sites-enabled/`, but site configuration files should only contain `server {}` blocks.

## Solution: Use Separate Files

### File Structure

1. **`nginx-main.conf`** → `/etc/nginx/nginx.conf` (main config with `events` and `http` blocks)
2. **`issue.haahii.com.conf`** → `/etc/nginx/sites-available/issue.haahii.com.conf` (site-specific `server` blocks)

---

## Setup Steps

### 1. Backup Current Configuration

```bash
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
sudo cp /etc/nginx/sites-enabled/issue.haahii.com.conf /etc/nginx/sites-enabled/issue.haahii.com.conf.backup 2>/dev/null || true
```

### 2. Install Main Configuration

```bash
# Copy main nginx config
sudo cp infra/nginx/nginx-main.conf /etc/nginx/nginx.conf

# Test configuration
sudo nginx -t
```

### 3. Install Site Configuration

```bash
# Copy site config to sites-available
sudo cp infra/nginx/issue.haahii.com.conf /etc/nginx/sites-available/issue.haahii.com.conf

# Create symlink to sites-enabled
sudo ln -sf /etc/nginx/sites-available/issue.haahii.com.conf /etc/nginx/sites-enabled/issue.haahii.com.conf

# Remove old incorrect config if it exists
sudo rm -f /etc/nginx/sites-enabled/nginx.conf 2>/dev/null || true

# Test configuration
sudo nginx -t
```

### 4. Update Upstream Backends

**If running on host (not Docker):**
The upstreams in `nginx-main.conf` already point to `localhost:3410`, `localhost:3411`, `localhost:3412`.

**If using Docker networking:**
Edit `/etc/nginx/nginx.conf` and change upstream servers:
```nginx
upstream api_backend {
    server api:3410;  # Docker service name
}

upstream admin_backend {
    server admin:3411;  # Docker service name
}

upstream frontend_backend {
    server frontend:3412;  # Docker service name
}
```

**If nginx is in Docker but backends are on host:**
Use host networking or `host.docker.internal`:
```nginx
upstream api_backend {
    server host.docker.internal:3410;
}
```

### 5. Reload Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
# OR if nginx is in Docker:
docker exec nginx-container nginx -s reload
```

---

## Configuration Files Explained

### `nginx-main.conf`
- Contains `events {}` and `http {}` blocks
- Defines upstream backends (API, Admin, Frontend)
- Sets rate limiting zones
- Includes site configurations from `sites-enabled/`
- **Location:** `/etc/nginx/nginx.conf`

### `issue.haahii.com.conf`
- Contains only `server {}` blocks
- HTTP server (port 80) with redirect to HTTPS
- HTTPS server (port 443) with SSL configuration
- All location blocks (API, Admin, Frontend, uploads, health)
- **Location:** `/etc/nginx/sites-available/issue.haahii.com.conf`
- **Symlink:** `/etc/nginx/sites-enabled/issue.haahii.com.conf`

---

## Enabling HTTPS

### 1. Obtain SSL Certificate

See `CERTBOT_SETUP.md` for detailed instructions.

Quick command:
```bash
sudo certbot --nginx -d issue.haahii.com
```

### 2. Update Site Configuration

Edit `/etc/nginx/sites-available/issue.haahii.com.conf`:

1. **Uncomment HTTPS server block** (remove `#` from lines starting with `server {`)

2. **Uncomment HTTP redirect** (line with `return 301 https://...`)

3. **Verify SSL certificate paths** match your Certbot installation:
   ```nginx
   ssl_certificate /etc/letsencrypt/live/issue.haahii.com/fullchain.pem;
   ssl_certificate_key /etc/letsencrypt/live/issue.haahii.com/privkey.pem;
   ```

### 3. Test and Reload

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Troubleshooting

### Test Configuration

```bash
# Test nginx configuration syntax
sudo nginx -t

# Check nginx error log
sudo tail -f /var/log/nginx/error.log

# Check nginx access log
sudo tail -f /var/log/nginx/access.log
```

### Verify Upstreams

```bash
# Test if backends are reachable
curl http://localhost:3410/health
curl http://localhost:3411/health
curl http://localhost:3412/health
```

### Check Active Configuration

```bash
# Show active nginx configuration
sudo nginx -T

# Check which config files are included
sudo nginx -T | grep "include"
```

### Common Issues

**Issue:** "upstream not found"
- **Fix:** Check upstream names match in `nginx-main.conf` and `issue.haahii.com.conf`

**Issue:** "502 Bad Gateway"
- **Fix:** Verify backend services are running and ports match upstream configuration

**Issue:** "SSL certificate not found"
- **Fix:** Run Certbot or verify certificate paths in HTTPS server block

---

## Quick Reference

```bash
# Install configuration
sudo cp infra/nginx/nginx-main.conf /etc/nginx/nginx.conf
sudo cp infra/nginx/issue.haahii.com.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/issue.haahii.com.conf /etc/nginx/sites-enabled/

# Test and reload
sudo nginx -t && sudo systemctl reload nginx

# View logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Check status
sudo systemctl status nginx
```


