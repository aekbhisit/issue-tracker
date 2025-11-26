# Troubleshooting Guide

Common issues and solutions for the Issue Collector Platform.

## Table of Contents

1. [Database Issues](#database-issues)
2. [API Issues](#api-issues)
3. [Frontend/Admin Issues](#frontendadmin-issues)
4. [Docker Issues](#docker-issues)
5. [Network Issues](#network-issues)
6. [Performance Issues](#performance-issues)

---

## Database Issues

### Database Connection Failed

**Symptoms:**
- API fails to start
- "ECONNREFUSED" errors in logs
- "Connection timeout" errors

**Solutions:**

1. **Check if database is running:**
   ```bash
   docker-compose -f infra/docker/docker-compose.prod.yml ps postgres
   # Or if using local PostgreSQL
   pg_isready -h localhost -p 5432
   ```

2. **Verify DATABASE_URL:**
   ```bash
   # Check environment variable
   echo $DATABASE_URL
   
   # Format should be: postgresql://user:password@host:port/database
   ```

3. **Check database logs:**
   ```bash
   docker-compose -f infra/docker/docker-compose.prod.yml logs postgres
   ```

4. **Test connection:**
   ```bash
   # From API container
   docker-compose -f infra/docker/docker-compose.prod.yml exec api sh
   cd /app/infra/database
   pnpm prisma db pull
   ```

5. **Restart database:**
   ```bash
   docker-compose -f infra/docker/docker-compose.prod.yml restart postgres
   ```

### Prisma Client Not Generated

**Symptoms:**
- "Cannot find module '@prisma/client'"
- "PrismaClient is not defined"
- Database queries fail

**Solutions:**

```bash
# Generate Prisma client
cd infra/database
pnpm prisma generate

# Or from Docker
docker-compose -f infra/docker/docker-compose.prod.yml exec api sh -c "cd /app/infra/database && pnpm prisma generate"
```

### Migration Errors

**Symptoms:**
- "Migration failed"
- "Table already exists" errors
- Schema drift warnings

**Solutions:**

1. **Check migration status:**
   ```bash
   cd infra/database
   pnpm prisma migrate status
   ```

2. **Reset database (⚠️ deletes all data):**
   ```bash
   pnpm prisma migrate reset
   ```

3. **Create new migration:**
   ```bash
   pnpm prisma migrate dev --name migration_name
   ```

4. **Deploy migrations:**
   ```bash
   pnpm prisma migrate deploy
   ```

---

## API Issues

### API Won't Start

**Symptoms:**
- Container exits immediately
- "Port already in use" errors
- Module not found errors

**Solutions:**

1. **Check logs:**
   ```bash
   docker-compose -f infra/docker/docker-compose.prod.yml logs api
   ```

2. **Check port availability:**
   ```bash
   # Mac/Linux
   lsof -i :4501
   
   # Windows
   netstat -ano | findstr :4501
   ```

3. **Check environment variables:**
   ```bash
   docker-compose -f infra/docker/docker-compose.prod.yml exec api env | grep DATABASE_URL
   ```

4. **Rebuild container:**
   ```bash
   docker-compose -f infra/docker/docker-compose.prod.yml build --no-cache api
   docker-compose -f infra/docker/docker-compose.prod.yml up -d api
   ```

### Authentication Errors

**Symptoms:**
- "Invalid token" errors
- "Unauthorized" responses
- Login fails

**Solutions:**

1. **Check JWT_SECRET:**
   ```bash
   # Ensure JWT_SECRET is set
   docker-compose -f infra/docker/docker-compose.prod.yml exec api env | grep JWT_SECRET
   ```

2. **Verify token expiration:**
   - Check `JWT_EXPIRES_IN` setting
   - Default is `7d`

3. **Clear browser cookies:**
   - Clear cookies for admin domain
   - Try logging in again

### Module Not Found Errors

**Symptoms:**
- "Cannot find module '@workspace/types'"
- "Module '@workspace/utils' not found"

**Solutions:**

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Rebuild packages:**
   ```bash
   pnpm build
   ```

3. **Check pnpm-workspace.yaml:**
   ```bash
   cat pnpm-workspace.yaml
   ```

---

## Frontend/Admin Issues

### Build Errors

**Symptoms:**
- Next.js build fails
- "Module not found" during build
- Type errors

**Solutions:**

1. **Clear Next.js cache:**
   ```bash
   cd apps/admin  # or apps/frontend
   rm -rf .next
   pnpm build
   ```

2. **Check environment variables:**
   ```bash
   # Ensure NEXT_PUBLIC_* variables are set
   cat .env.local
   ```

3. **Rebuild dependencies:**
   ```bash
   pnpm install
   pnpm build
   ```

### Runtime Errors

**Symptoms:**
- White screen
- "API request failed"
- CORS errors

**Solutions:**

1. **Check API URL:**
   ```bash
   # Verify NEXT_PUBLIC_API_URL is correct
   echo $NEXT_PUBLIC_API_URL
   ```

2. **Check CORS settings:**
   - Verify `ALLOWED_ORIGINS` in API includes frontend/admin domains
   - Check browser console for CORS errors

3. **Check network connectivity:**
   ```bash
   curl $NEXT_PUBLIC_API_URL/health
   ```

---

## Docker Issues

### Container Won't Start

**Symptoms:**
- Container exits with code 1
- "Cannot start container" errors

**Solutions:**

1. **Check logs:**
   ```bash
   docker-compose -f infra/docker/docker-compose.prod.yml logs [service_name]
   ```

2. **Check Docker resources:**
   ```bash
   docker system df
   docker stats
   ```

3. **Restart Docker daemon:**
   ```bash
   # Mac/Windows: Restart Docker Desktop
   # Linux:
   sudo systemctl restart docker
   ```

### Permission Issues

**Symptoms:**
- "Permission denied" errors
- Cannot write to storage directory

**Solutions:**

1. **Fix storage permissions (Linux):**
   ```bash
   sudo chown -R $USER:$USER storage/
   chmod -R 755 storage/
   ```

2. **Check Docker volume permissions:**
   ```bash
   docker volume inspect [volume_name]
   ```

### Out of Disk Space

**Symptoms:**
- "No space left on device"
- Docker build fails

**Solutions:**

```bash
# Clean up Docker resources
docker system prune -a --volumes

# Remove unused images
docker image prune -a

# Check disk usage
df -h
```

---

## Network Issues

### Port Already in Use

**Symptoms:**
- "Bind: address already in use"
- Cannot start service

**Solutions:**

1. **Find process using port:**
   ```bash
   # Mac/Linux
   lsof -i :4501
   
   # Windows
   netstat -ano | findstr :4501
   ```

2. **Kill process or change port:**
   ```bash
   # Kill process (Mac/Linux)
   kill -9 [PID]
   
   # Or change port in docker-compose.yml
   ```

### Connection Timeout

**Symptoms:**
- API requests timeout
- Cannot connect to database

**Solutions:**

1. **Check firewall settings:**
   ```bash
   # Linux
   sudo ufw status
   ```

2. **Verify network connectivity:**
   ```bash
   ping [host]
   telnet [host] [port]
   ```

3. **Check Docker network:**
   ```bash
   docker network ls
   docker network inspect [network_name]
   ```

---

## Performance Issues

### Slow API Responses

**Symptoms:**
- API responses > 1s
- Timeout errors

**Solutions:**

1. **Check database queries:**
   ```bash
   # Enable query logging in Prisma
   # Check for N+1 queries
   ```

2. **Check Redis connection:**
   ```bash
   docker-compose -f infra/docker/docker-compose.prod.yml logs redis
   ```

3. **Monitor resource usage:**
   ```bash
   docker stats
   ```

### High Memory Usage

**Symptoms:**
- Container OOM (Out of Memory) errors
- System becomes slow

**Solutions:**

1. **Check memory limits:**
   ```bash
   docker stats
   ```

2. **Increase memory limits in docker-compose.yml:**
   ```yaml
   services:
     api:
       mem_limit: 1g
   ```

3. **Investigate memory leaks:**
   - Check for unclosed connections
   - Review code for memory leaks

---

## Getting Help

If issues persist:

1. **Collect logs:**
   ```bash
   docker-compose -f infra/docker/docker-compose.prod.yml logs > logs.txt
   ```

2. **Check system resources:**
   ```bash
   docker stats > stats.txt
   df -h > disk.txt
   ```

3. **Document error messages and steps to reproduce**

4. **Check related documentation:**
   - [Docker Deployment](./docker.md)
   - [Production Deployment](./production.md)

---

## Related Documentation

- [Docker Deployment](./docker.md) - Docker setup guide
- [Production Deployment](./production.md) - Production deployment guide
