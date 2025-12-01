# Quick Fix for 502 Bad Gateway Errors

## Immediate Steps

### 1. Check Container Status

Run the diagnostic script:
```bash
cd /path/to/issue-tracker
./infra/scripts/check-containers.sh
```

Or manually check:
```bash
docker ps -a | grep issue-collector
```

### 2. Restart All Containers

```bash
cd /path/to/issue-tracker/infra/docker
docker-compose -f docker-compose.prod.yml restart
```

### 3. If Containers Are Not Running, Start Them

```bash
cd /path/to/issue-tracker/infra/docker
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Check Container Logs

```bash
# Frontend (most likely cause of 502 on root path)
docker logs issue-collector-frontend --tail 50

# Admin
docker logs issue-collector-admin --tail 50

# API
docker logs issue-collector-api --tail 50
```

### 5. Common Issues and Fixes

#### Issue: Container Exited Immediately

**Symptom**: Container shows "Exited" status

**Fix**:
```bash
# Check logs for errors
docker logs issue-collector-frontend

# Common causes:
# - Next.js not found → Rebuild image
# - Build failed → Check build logs
# - Port conflict → Check if port 3412 is in use
```

#### Issue: Container Running But Not Responding

**Symptom**: Container shows "Up" but curl fails

**Fix**:
```bash
# Test direct connection
curl http://localhost:3412/

# If fails, check:
# 1. Container logs for errors
docker logs issue-collector-frontend --tail 50

# 2. Port mapping
docker port issue-collector-frontend

# 3. Network connectivity
docker exec issue-collector-frontend curl http://localhost:3412/
```

#### Issue: Next.js Not Found

**Symptom**: Logs show "Next.js not found"

**Fix**:
```bash
# Rebuild the frontend image
cd /path/to/issue-tracker
docker build -f infra/docker/frontend/Dockerfile.prod -t issue-collector-frontend:latest .

# Or rebuild via docker-compose
cd infra/docker
docker-compose -f docker-compose.prod.yml build frontend
docker-compose -f docker-compose.prod.yml up -d frontend
```

#### Issue: Build Failed

**Symptom**: Container fails to start, build errors in logs

**Fix**:
```bash
# Check build locally first
cd /path/to/issue-tracker/apps/frontend
pnpm build

# If build succeeds locally, rebuild Docker image
cd /path/to/issue-tracker
docker build -f infra/docker/frontend/Dockerfile.prod -t issue-collector-frontend:latest .
```

### 6. Force Recreate Containers

If restart doesn't work:
```bash
cd /path/to/issue-tracker/infra/docker
docker-compose -f docker-compose.prod.yml up -d --force-recreate frontend admin api
```

### 7. Check Nginx Configuration

```bash
# Test nginx config
sudo nginx -t

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart nginx if needed
sudo systemctl restart nginx
```

### 8. Verify Ports Are Not in Use

```bash
# Check if ports are already in use
sudo netstat -tulpn | grep :3412
sudo netstat -tulpn | grep :3411
sudo netstat -tulpn | grep :3410

# If ports are in use by other processes, stop them or change ports in docker-compose.prod.yml
```

## Expected Behavior

After fixing, you should see:
- ✅ All containers running: `docker ps | grep issue-collector` shows 3+ containers
- ✅ Direct access works: `curl http://localhost:3412/` returns HTML
- ✅ Nginx proxy works: `curl http://localhost/` (or your domain) returns HTML

## Still Having Issues?

1. Check the full troubleshooting guide: `docs/deployment/TROUBLESHOOTING-502-ERRORS.md`
2. Review container logs for specific error messages
3. Verify Docker images are built correctly
4. Check network connectivity between containers

