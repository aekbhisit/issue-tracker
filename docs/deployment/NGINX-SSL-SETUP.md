# Nginx SSL Configuration with Certbot

**Date:** 2025-12-01  
**File:** `infra/nginx/issue.haahii.com.conf`  
**Status:** ✅ **READY FOR PRODUCTION WITH SSL**

## Configuration Overview

The nginx configuration has been updated to work with Certbot-managed SSL certificates from Let's Encrypt.

## Server Blocks

### 1. HTTP Server (Port 80)
- **Purpose:** Redirects all HTTP traffic to HTTPS
- **Managed by:** Certbot
- **Configuration:**
  ```nginx
  server {
      if ($host = issue.haahii.com) {
          return 301 https://$host$request_uri;
      } # managed by Certbot

      listen 80;
      listen [::]:80;
      server_name issue.haahii.com;
      return 404; # managed by Certbot
  }
  ```

### 2. HTTPS Server (Port 443)
- **Purpose:** Handles all HTTPS traffic with SSL encryption
- **SSL Certificates:** Managed by Certbot
- **Configuration:**
  ```nginx
  server {
      listen 443 ssl; # managed by Certbot
      listen [::]:443 ssl; # managed by Certbot
      server_name issue.haahii.com;

      # SSL certificates (managed by Certbot)
      ssl_certificate /etc/letsencrypt/live/issue.haahii.com/fullchain.pem;
      ssl_certificate_key /etc/letsencrypt/live/issue.haahii.com/privkey.pem;
      include /etc/letsencrypt/options-ssl-nginx.conf;
      ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
      
      # Security headers
      add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
      add_header X-Content-Type-Options "nosniff" always;
      add_header X-Frame-Options "SAMEORIGIN" always;
      add_header X-XSS-Protection "1; mode=block" always;
      add_header Referrer-Policy "strict-origin-when-cross-origin" always;
      
      # All location blocks configured here...
  }
  ```

## SSL Certificate Paths

Certbot-managed certificates are located at:
- **Certificate:** `/etc/letsencrypt/live/issue.haahii.com/fullchain.pem`
- **Private Key:** `/etc/letsencrypt/live/issue.haahii.com/privkey.pem`
- **SSL Options:** `/etc/letsencrypt/options-ssl-nginx.conf`
- **DH Parameters:** `/etc/letsencrypt/ssl-dhparams.pem`

## Security Headers

The HTTPS server includes the following security headers:

1. **Strict-Transport-Security (HSTS)**
   - Forces browsers to use HTTPS for 2 years
   - Includes subdomains
   - Preload enabled

2. **X-Content-Type-Options**
   - Prevents MIME type sniffing

3. **X-Frame-Options**
   - Prevents clickjacking attacks

4. **X-XSS-Protection**
   - Enables XSS filtering in browsers

5. **Referrer-Policy**
   - Controls referrer information sent with requests

## Location Blocks

All location blocks are configured in the HTTPS server block:

1. **API Endpoints** (`/api/`)
   - Proxies to `127.0.0.1:3410`
   - Rate limiting (commented, requires zones in nginx.conf)

2. **Upload Endpoints** (`/api/admin/v1/upload/`)
   - Larger body size (100M)
   - Longer timeouts

3. **Static Files** (`/uploads/`, `/public/`)
   - Served directly by nginx
   - CORS enabled

4. **Admin Static Assets** (`/admin/_next/static/`, `/admin/_next/image`, `/admin/images/`)
   - Proxies to `127.0.0.1:3411`
   - Long-term caching

5. **Admin App** (`/admin`)
   - Handles RSC requests
   - Proxies to `127.0.0.1:3411`
   - No caching

6. **Root Images** (`/images/`)
   - Proxies to admin container
   - For admin app root-relative paths

7. **Frontend App** (`/`)
   - Proxies to `127.0.0.1:3412`
   - Handles all frontend routes

8. **Frontend Static Assets** (`/_next/static/`, `/_next/image`)
   - Proxies to `127.0.0.1:3412`
   - Long-term caching

9. **Security Blocks**
   - Blocks access to sensitive files (`.env`, `package.json`, etc.)

10. **Health Check** (`/health`)
    - Returns 200 OK

## Deployment Steps

### 1. Install Certbot (if not already installed)
```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
```

### 2. Obtain SSL Certificate
```bash
sudo certbot --nginx -d issue.haahii.com
```

Certbot will:
- Obtain SSL certificate from Let's Encrypt
- Automatically configure nginx
- Set up automatic renewal

### 3. Deploy Configuration
```bash
# Copy configuration file
sudo cp infra/nginx/issue.haahii.com.conf /etc/nginx/sites-available/issue.haahii.com.conf

# Create symlink
sudo ln -sf /etc/nginx/sites-available/issue.haahii.com.conf /etc/nginx/sites-enabled/issue.haahii.com.conf

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 4. Verify SSL
```bash
# Test HTTPS
curl -I https://issue.haahii.com

# Check SSL certificate
openssl s_client -connect issue.haahii.com:443 -servername issue.haahii.com
```

## Certificate Renewal

Certbot automatically renews certificates. To test renewal:
```bash
sudo certbot renew --dry-run
```

Certbot sets up a systemd timer to automatically renew certificates before they expire.

## Troubleshooting

### Certificate Not Found
If you see errors about missing certificate files:
```bash
# Check certificate exists
sudo ls -la /etc/letsencrypt/live/issue.haahii.com/

# Re-run certbot if needed
sudo certbot --nginx -d issue.haahii.com --force-renewal
```

### SSL Configuration Errors
```bash
# Test nginx configuration
sudo nginx -t

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Mixed Content Warnings
Ensure all resources (images, scripts, etc.) use HTTPS URLs or relative paths.

## Security Best Practices

1. ✅ **HSTS Enabled** - Forces HTTPS for 2 years
2. ✅ **Modern SSL Configuration** - TLS 1.2+ only (via Certbot)
3. ✅ **Security Headers** - XSS, clickjacking, MIME sniffing protection
4. ✅ **Certificate Auto-Renewal** - Certbot handles renewal automatically
5. ✅ **Sensitive Files Blocked** - `.env`, `package.json`, etc.

## Ports Reference

- **HTTP:** Port 80 (redirects to HTTPS)
- **HTTPS:** Port 443 (main server)
- **API Backend:** `127.0.0.1:3410`
- **Admin Backend:** `127.0.0.1:3411`
- **Frontend Backend:** `127.0.0.1:3412`

## Status

✅ **Configuration is ready for production use with SSL.**

All features configured:
- SSL/TLS encryption ✅
- HTTP to HTTPS redirect ✅
- Security headers ✅
- RSC request handling ✅
- Static asset caching ✅
- Security file blocking ✅


