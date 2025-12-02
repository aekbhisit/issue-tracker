# Troubleshooting 502 Bad Gateway Errors

## Problem

502 Bad Gateway errors indicate that nginx cannot connect to the backend services (API, Admin, or Frontend containers).

## Common Causes

1. **Docker containers not running**
   - API container (`issue-collector-api`) not running on port 3410
   - Admin container (`issue-collector-admin`) not running on port 3411
   - Frontend container (`issue-collector-frontend`) not running on port 3412

2. **Containers not healthy**
   - Containers are running but crashed or not responding
   - Health checks failing

3. **Network connectivity issues**
   - Containers not accessible from nginx
   - Port conflicts
   - Firewall blocking connections

4. **Configuration issues**
   - Wrong port numbers in nginx config
   - Wrong service names in docker-compose

## Diagnostic Steps

### 1. Check if containers are running

```bash
# Check all containers
docker ps -a | grep issue-collector

# Check specific containers
docker ps | grep issue-collector-api
docker ps | grep issue-collector-admin
docker ps | grep issue-collector-frontend
```

### 2. Check container logs

```bash
# API logs
docker logs issue-collector-api --tail 50

# Admin logs
docker logs issue-collector-admin --tail 50

# Frontend logs
docker logs issue-collector-frontend --tail 50
```

### 3. Check if services are listening on correct ports

```bash
# Check API (port 3410)
curl http://localhost:3410/health

# Check Admin (port 3411)
curl http://localhost:3411/admin

# Check Frontend (port 3412)
curl http://localhost:3412/
```

### 4. Check nginx configuration

```bash
# Test nginx configuration
sudo nginx -t

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check nginx access logs
sudo tail -f /var/log/nginx/access.log
```

### 5. Check Docker network connectivity

```bash
# Check if containers can reach each other
docker exec issue-collector-api ping -c 2 postgres
docker exec issue-collector-api ping -c 2 redis
```

## Solutions

### Solution 1: Restart Docker containers

```bash
cd /path/to/issue-tracker/infra/docker
docker-compose -f docker-compose.prod.yml restart api admin frontend
```

### Solution 2: Recreate containers

```bash
cd /path/to/issue-tracker/infra/docker
docker-compose -f docker-compose.prod.yml up -d --force-recreate api admin frontend
```

### Solution 3: Check container health

```bash
# Check container health status
docker inspect issue-collector-api | grep -A 10 Health

# If unhealthy, check logs for errors
docker logs issue-collector-api --tail 100
```

### Solution 4: Verify port mappings

```bash
# Check if ports are correctly mapped
docker port issue-collector-api
docker port issue-collector-admin
docker port issue-collector-frontend
```

### Solution 5: Check for port conflicts

```bash
# Check if ports are already in use
sudo netstat -tulpn | grep :3410
sudo netstat -tulpn | grep :3411
sudo netstat -tulpn | grep :3412
```

### Solution 6: Restart nginx

```bash
sudo systemctl restart nginx
sudo systemctl status nginx
```

## Specific Error Scenarios

### 502 on `/api/*` endpoints

- **Cause**: API container not running or not accessible
- **Solution**: 
  1. Check API container: `docker ps | grep issue-collector-api`
  2. Check API logs: `docker logs issue-collector-api`
  3. Restart API: `docker restart issue-collector-api`

### 502 on `/admin/*` or `/admin/_next/static/*`

- **Cause**: Admin container not running or not accessible
- **Solution**:
  1. Check Admin container: `docker ps | grep issue-collector-admin`
  2. Check Admin logs: `docker logs issue-collector-admin`
  3. Restart Admin: `docker restart issue-collector-admin`

### 502 on `/version` endpoint

- **Cause**: API container not running (this endpoint is on the API server)
- **Solution**: Same as 502 on `/api/*` endpoints

### 502 on static assets (logo-icon.svg, favicon.ico)

- **Cause**: Admin or Frontend container not running
- **Solution**: 
  1. Check which service serves the asset (Admin for `/admin/*`, Frontend for root)
  2. Restart the appropriate container

## Prevention

1. **Use health checks** in docker-compose.yml
2. **Monitor container status** with tools like Portainer or Docker Desktop
3. **Set up alerts** for container failures
4. **Use restart policies** (`restart: unless-stopped`)

## Quick Fix Script

```bash
#!/bin/bash
# Quick fix for 502 errors - restart all services

cd /path/to/issue-tracker/infra/docker

echo "Restarting all services..."
docker-compose -f docker-compose.prod.yml restart

echo "Checking service status..."
docker-compose -f docker-compose.prod.yml ps

echo "Testing endpoints..."
curl -s http://localhost:3410/health && echo " - API OK" || echo " - API FAILED"
curl -s http://localhost:3411/admin > /dev/null && echo " - Admin OK" || echo " - Admin FAILED"
curl -s http://localhost:3412/ > /dev/null && echo " - Frontend OK" || echo " - Frontend FAILED"
```


