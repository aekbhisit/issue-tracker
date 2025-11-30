# Certbot SSL Certificate Setup Guide

This guide provides commands to install SSL certificates for `issue.haahii.com` using Let's Encrypt Certbot.

## Prerequisites

- Domain `issue.haahii.com` must point to your server's IP address
- Port 80 must be open and accessible (for HTTP-01 challenge)
- Nginx must be running and accessible on port 80

---

## Option 1: Certbot on Host Server (Recommended)

If nginx is running directly on the host server (not in Docker):

### 1. Install Certbot

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

**CentOS/RHEL:**
```bash
sudo yum install epel-release -y
sudo yum install certbot python3-certbot-nginx -y
```

**Alpine Linux:**
```bash
apk add certbot certbot-nginx
```

### 2. Stop Nginx Temporarily (if needed)

```bash
sudo systemctl stop nginx
```

### 3. Obtain SSL Certificate

**Automatic nginx configuration (easiest):**
```bash
sudo certbot --nginx -d issue.haahii.com
```

**Manual certificate only (then configure nginx yourself):**
```bash
sudo certbot certonly --standalone -d issue.haahii.com
```

**With email notification:**
```bash
sudo certbot --nginx -d issue.haahii.com --email your-email@example.com --agree-tos --non-interactive
```

### 4. Certificates Location

After running Certbot, certificates will be stored at:
- **Certificate:** `/etc/letsencrypt/live/issue.haahii.com/fullchain.pem`
- **Private Key:** `/etc/letsencrypt/live/issue.haahii.com/privkey.pem`

### 5. Update nginx.conf

Update `infra/nginx/nginx.conf` to use the Let's Encrypt certificates:

```nginx
server {
    listen 443 ssl http2;
    server_name issue.haahii.com;

    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/issue.haahii.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/issue.haahii.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    client_max_body_size 50M;

    # Copy all location blocks from HTTP server
    # (API, Admin, Frontend, Uploads, Health check)
    location /api/ {
        # ... existing config ...
    }
    
    location /admin {
        # ... existing config ...
    }
    
    location / {
        # ... existing config ...
    }
    
    # ... other locations ...
}
```

### 6. Enable HTTP to HTTPS Redirect

Uncomment the redirect in the HTTP server block:

```nginx
server {
    listen 80;
    server_name issue.haahii.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}
```

### 7. Test and Reload Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Option 2: Certbot with Docker Nginx

If nginx is running in Docker, use Certbot Docker container:

### 1. Create SSL Directory

```bash
sudo mkdir -p /etc/letsencrypt
sudo mkdir -p /etc/nginx/ssl
```

### 2. Run Certbot Container

```bash
sudo docker run -it --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/lib/letsencrypt:/var/lib/letsencrypt \
  -v /tmp/letsencrypt:/var/www/.well-known \
  -p 80:80 \
  certbot/certbot certonly --standalone \
  -d issue.haahii.com \
  --email your-email@example.com \
  --agree-tos \
  --non-interactive
```

### 3. Copy Certificates to Nginx SSL Directory

```bash
sudo cp /etc/letsencrypt/live/issue.haahii.com/fullchain.pem /etc/nginx/ssl/issue.haahii.com.crt
sudo cp /etc/letsencrypt/live/issue.haahii.com/privkey.pem /etc/nginx/ssl/issue.haahii.com.key
sudo chmod 644 /etc/nginx/ssl/issue.haahii.com.crt
sudo chmod 600 /etc/nginx/ssl/issue.haahii.com.key
```

### 4. Update Docker Compose (if nginx is containerized)

Add volume mounts for SSL certificates:

```yaml
nginx:
  volumes:
    - ./infra/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - /etc/letsencrypt:/etc/letsencrypt:ro
    - /etc/nginx/ssl:/etc/nginx/ssl:ro
```

---

## Auto-Renewal Setup

Let's Encrypt certificates expire every 90 days. Set up auto-renewal:

### 1. Test Renewal

```bash
sudo certbot renew --dry-run
```

### 2. Add Cron Job (Host Server)

```bash
sudo crontab -e
```

Add this line (runs twice daily at 3 AM and 3 PM):
```cron
0 3,15 * * * certbot renew --quiet --deploy-hook "systemctl reload nginx"
```

### 3. Add Systemd Timer (Alternative)

Create `/etc/systemd/system/certbot-renewal.timer`:
```ini
[Unit]
Description=Certbot Renewal Timer

[Timer]
OnCalendar=*-*-* 3:00:00
RandomizedDelaySec=3600
Persistent=true

[Install]
WantedBy=timers.target
```

Enable and start:
```bash
sudo systemctl enable certbot-renewal.timer
sudo systemctl start certbot-renewal.timer
```

### 4. Auto-Renewal with Docker

Create renewal script `/usr/local/bin/certbot-renew-docker.sh`:
```bash
#!/bin/bash
docker run --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/lib/letsencrypt:/var/lib/letsencrypt \
  certbot/certbot renew --quiet

# Reload nginx (adjust based on your setup)
docker exec nginx-container nginx -s reload
# OR if nginx is on host:
systemctl reload nginx
```

Make executable:
```bash
sudo chmod +x /usr/local/bin/certbot-renew-docker.sh
```

Add to crontab:
```cron
0 3,15 * * * /usr/local/bin/certbot-renew-docker.sh
```

---

## Verification

After setup, verify SSL:

```bash
# Check certificate expiration
sudo certbot certificates

# Test SSL connection
curl -I https://issue.haahii.com

# Check SSL rating (external tool)
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=issue.haahii.com
```

---

## Troubleshooting

### Certificate Not Found
```bash
# List all certificates
sudo certbot certificates

# Check certificate files
ls -la /etc/letsencrypt/live/issue.haahii.com/
```

### Port 80 Already in Use
```bash
# Check what's using port 80
sudo lsof -i :80
sudo netstat -tulpn | grep :80

# Stop conflicting service temporarily
sudo systemctl stop nginx  # or apache2, etc.
```

### Nginx Configuration Test Fails
```bash
# Test nginx config
sudo nginx -t

# Check nginx error log
sudo tail -f /var/log/nginx/error.log
```

### Renewal Fails
```bash
# Run renewal with verbose output
sudo certbot renew --verbose

# Check renewal logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

---

## Quick Reference Commands

```bash
# Install Certbot (Ubuntu/Debian)
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate (automatic nginx config)
sudo certbot --nginx -d issue.haahii.com

# Obtain certificate (manual)
sudo certbot certonly --standalone -d issue.haahii.com

# Test renewal
sudo certbot renew --dry-run

# List certificates
sudo certbot certificates

# Revoke certificate (if needed)
sudo certbot revoke --cert-path /etc/letsencrypt/live/issue.haahii.com/cert.pem

# Delete certificate
sudo certbot delete --cert-name issue.haahii.com
```


