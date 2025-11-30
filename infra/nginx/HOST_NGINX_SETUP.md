# Nginx Setup for Host-Based Nginx (Not in Docker)

This guide is for when nginx runs directly on the host server, proxying to Docker containers.

## Architecture

```
Internet → Nginx (Host:80/443) → Docker Containers (localhost:3410/3411/3412)
```

- **Nginx:** Runs on host server (not in Docker)
- **Containers:** API (3410), Admin (3411), Frontend (3412) expose ports to `localhost`
- **Upstreams:** Point to `localhost:3410`, `localhost:3411`, `localhost:3412`

## Setup Steps

### 1. Ensure Docker Containers Expose Ports

Verify your `docker-compose.prod.yml` has port mappings:

```yaml
api:
  ports:
    - "${API_PORT:-3410}:3410"

admin:
  ports:
    - "${ADMIN_PORT:-3411}:3411"

frontend:
  ports:
    - "${FRONTEND_PORT:-3412}:3412"
```

### 2. Install Main Nginx Configuration

```bash
# Backup current config
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup.$(date +%Y%m%d)

# Copy main config (includes upstream definitions)
sudo cp infra/nginx/nginx-main.conf /etc/nginx/nginx.conf

# Test configuration
sudo nginx -t
```

### 3. Install Site Configuration

```bash
# Copy site config
sudo cp infra/nginx/issue.haahii.com.conf /etc/nginx/sites-available/issue.haahii.com.conf

# Create symlink
sudo ln -sf /etc/nginx/sites-available/issue.haahii.com.conf /etc/nginx/sites-enabled/issue.haahii.com.conf

# Test configuration
sudo nginx -t
```

### 4. Verify Containers Are Running

```bash
# Check if containers are running and ports are exposed
docker ps | grep -E "api|admin|frontend"

# Test if ports are accessible from host
curl http://localhost:3410/health
curl http://localhost:3411/health
curl http://localhost:3412/health
```

### 5. Reload Nginx

```bash
# If test passes, reload nginx
sudo systemctl reload nginx

# Check nginx status
sudo systemctl status nginx
```

## Verify Configuration

### Test Upstream Connectivity

```bash
# From host, test each backend
curl -I http://localhost:3410/health  # API
curl -I http://localhost:3411/health  # Admin
curl -I http://localhost:3412/health  # Frontend
```

### Test Through Nginx

```bash
# Test nginx proxy
curl -I http://issue.haahii.com/api/public/v1/health
curl -I http://issue.haahii.com/admin
curl -I http://issue.haahii.com/
```

## Troubleshooting

### Error: "host not found in upstream"

**Cause:** Upstream definitions not in `/etc/nginx/nginx.conf`

**Fix:**
```bash
sudo cp infra/nginx/nginx-main.conf /etc/nginx/nginx.conf
sudo nginx -t
```

### Error: "Connection refused" (502 Bad Gateway)

**Cause:** Containers not running or ports not exposed

**Fix:**
```bash
# Check containers
docker ps

# Check port mappings
docker port issue-collector-api
docker port issue-collector-admin
docker port issue-collector-frontend

# Test direct connection
curl http://localhost:3410/health
```

### Error: "upstream timed out"

**Cause:** Containers are slow to respond or not healthy

**Fix:**
```bash
# Check container logs
docker logs issue-collector-api
docker logs issue-collector-admin
docker logs issue-collector-frontend

# Check if containers are healthy
docker ps --format "table {{.Names}}\t{{.Status}}"
```

## Configuration Files

- **`nginx-main.conf`** → `/etc/nginx/nginx.conf`
  - Contains `events {}` and `http {}` blocks
  - Defines upstreams pointing to `localhost:3410/3411/3412`
  - Includes site configs from `sites-enabled/`

- **`issue.haahii.com.conf`** → `/etc/nginx/sites-available/issue.haahii.com.conf`
  - Contains only `server {}` blocks
  - References upstreams defined in main config

## Quick Reference

```bash
# Install configuration
sudo cp infra/nginx/nginx-main.conf /etc/nginx/nginx.conf
sudo cp infra/nginx/issue.haahii.com.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/issue.haahii.com.conf /etc/nginx/sites-enabled/

# Test and reload
sudo nginx -t && sudo systemctl reload nginx

# Check logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Verify backends
curl http://localhost:3410/health
curl http://localhost:3411/health
curl http://localhost:3412/health
```


