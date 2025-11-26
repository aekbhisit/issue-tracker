# Production Deployment Guide

Complete guide for deploying the Issue Collector Platform to production.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Build and Push Images](#build-and-push-images)
4. [Database Setup](#database-setup)
5. [Deployment Steps](#deployment-steps)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Monitoring and Maintenance](#monitoring-and-maintenance)
8. [Rollback Procedure](#rollback-procedure)

---

## Pre-Deployment Checklist

- [ ] Production environment variables configured
- [ ] Database backed up
- [ ] SSL certificates ready (if using HTTPS)
- [ ] Domain DNS configured
- [ ] Harbor registry credentials configured
- [ ] Production Docker images built and pushed
- [ ] Database migrations tested
- [ ] Load balancer/reverse proxy configured
- [ ] Monitoring and logging setup
- [ ] Backup strategy in place

---

## Environment Setup

### Required Environment Variables

Create `.env` files for each service or use environment variable management:

**API (`infra/docker/api/.env`)**:
```env
NODE_ENV=production
API_PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/nd_issue_tracker
REDIS_URL=redis://host:6379
JWT_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=7d
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
AWS_REGION=<region>
AWS_BUCKET_NAME=<bucket>
ALLOWED_ORIGINS=https://admin.yourdomain.com,https://yourdomain.com
```

**Admin (`infra/docker/admin/.env`)**:
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_API_ADMIN_URL=https://api.yourdomain.com/api/admin/v1
NEXT_PUBLIC_APP_NAME=Issue Collector Admin
```

**Frontend (`infra/docker/frontend/.env`)**:
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/public/v1
NEXT_PUBLIC_APP_NAME=Issue Collector Platform
```

### Security Best Practices

1. **Use strong secrets**: Generate random strings for `JWT_SECRET`
   ```bash
   openssl rand -base64 32
   ```

2. **Rotate secrets regularly**: Update JWT secrets periodically

3. **Use HTTPS**: Always use SSL/TLS in production

4. **Restrict CORS**: Only allow trusted domains in `ALLOWED_ORIGINS`

5. **Database credentials**: Use strong passwords and restrict access

---

## Build and Push Images

### Using Jenkins Pipeline

The project includes a Jenkinsfile for automated builds:

```bash
# Push to Git repository
git push origin main

# Jenkins will automatically:
# 1. Build Docker images
# 2. Push to Harbor registry
# 3. Tag with build number and git commit
```

### Manual Build and Push

```bash
# Login to Harbor
docker login harbor-bo-bkk2.ndg-internal.com

# Build and tag images
docker build -f infra/docker/api/Dockerfile.prod -t harbor-bo-bkk2.ndg-internal.com/haahii/issue-collector-api:latest .
docker build -f infra/docker/admin/Dockerfile.prod -t harbor-bo-bkk2.ndg-internal.com/haahii/issue-collector-admin:latest .
docker build -f infra/docker/frontend/Dockerfile.prod -t harbor-bo-bkk2.ndg-internal.com/haahii/issue-collector-frontend:latest .

# Push images
docker push harbor-bo-bkk2.ndg-internal.com/haahii/issue-collector-api:latest
docker push harbor-bo-bkk2.ndg-internal.com/haahii/issue-collector-admin:latest
docker push harbor-bo-bkk2.ndg-internal.com/haahii/issue-collector-frontend:latest
```

---

## Database Setup

### Create Production Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE nd_issue_tracker;

# Create user (if needed)
CREATE USER issue_collector WITH PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE nd_issue_tracker TO issue_collector;
```

### Run Migrations

```bash
# Option 1: From API container
docker-compose -f infra/docker/docker-compose.prod.yml exec api sh
cd /app/infra/database
pnpm prisma migrate deploy

# Option 2: From host machine
cd infra/database
DATABASE_URL="postgresql://user:password@host:5432/nd_issue_tracker" pnpm prisma migrate deploy
```

### Seed Initial Data

```bash
# Run seed script
docker-compose -f infra/docker/docker-compose.prod.yml exec api sh -c "cd /app/infra/database && pnpm prisma db seed"
```

---

## Deployment Steps

### Step 1: Pull Latest Images

```bash
docker-compose -f infra/docker/docker-compose.prod.yml pull
```

### Step 2: Stop Existing Services

```bash
docker-compose -f infra/docker/docker-compose.prod.yml stop
```

### Step 3: Start Services

```bash
# Start all services
docker-compose -f infra/docker/docker-compose.prod.yml up -d

# Or start specific service
docker-compose -f infra/docker/docker-compose.prod.yml up -d api
```

### Step 4: Run Migrations

```bash
docker-compose -f infra/docker/docker-compose.prod.yml exec api sh -c "cd /app/infra/database && pnpm prisma migrate deploy"
```

### Step 5: Verify Services

```bash
# Check service status
docker-compose -f infra/docker/docker-compose.prod.yml ps

# Check logs
docker-compose -f infra/docker/docker-compose.prod.yml logs -f
```

---

## Post-Deployment Verification

### Health Checks

```bash
# API health endpoint
curl https://api.yourdomain.com/health

# Admin dashboard
curl -I https://admin.yourdomain.com

# Frontend
curl -I https://yourdomain.com
```

### Functional Tests

1. **API Endpoints**: Test key endpoints
   ```bash
   curl -X POST https://api.yourdomain.com/api/admin/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"password"}'
   ```

2. **Admin Dashboard**: Login and verify functionality

3. **Frontend**: Verify public pages load correctly

4. **Database**: Verify data is accessible

### Performance Checks

- Response times < 200ms for API endpoints
- Page load times < 2s for frontend/admin
- Database query performance acceptable
- No memory leaks or excessive resource usage

---

## Monitoring and Maintenance

### Log Monitoring

```bash
# View logs
docker-compose -f infra/docker/docker-compose.prod.yml logs -f api

# Export logs
docker-compose -f infra/docker/docker-compose.prod.yml logs api > api.log
```

### Resource Monitoring

```bash
# Container stats
docker stats

# Disk usage
docker system df
```

### Database Maintenance

```bash
# Backup database
docker-compose -f infra/docker/docker-compose.prod.yml exec postgres pg_dump -U postgres nd_issue_tracker > backup.sql

# Restore database
docker-compose -f infra/docker/docker-compose.prod.yml exec -T postgres psql -U postgres nd_issue_tracker < backup.sql
```

### Regular Tasks

- **Daily**: Check logs for errors
- **Weekly**: Review performance metrics
- **Monthly**: Rotate secrets, update dependencies
- **Quarterly**: Security audit, backup verification

---

## Rollback Procedure

If deployment fails or issues are discovered:

### Step 1: Stop New Containers

```bash
docker-compose -f infra/docker/docker-compose.prod.yml stop
```

### Step 2: Pull Previous Image Version

```bash
# Pull previous version (replace with actual version tag)
docker pull harbor-bo-bkk2.ndg-internal.com/haahii/issue-collector-api:previous-version
```

### Step 3: Update docker-compose.prod.yml

Update image tags to previous version.

### Step 4: Start Previous Version

```bash
docker-compose -f infra/docker/docker-compose.prod.yml up -d
```

### Step 5: Restore Database (if needed)

```bash
# Restore from backup
docker-compose -f infra/docker/docker-compose.prod.yml exec -T postgres psql -U postgres nd_issue_tracker < backup.sql
```

### Step 6: Verify Rollback

```bash
# Check services are running
docker-compose -f infra/docker/docker-compose.prod.yml ps

# Test endpoints
curl https://api.yourdomain.com/health
```

---

## Scaling

### Horizontal Scaling

```bash
# Scale API to 3 instances
docker-compose -f infra/docker/docker-compose.prod.yml up -d --scale api=3

# Scale Admin to 2 instances
docker-compose -f infra/docker/docker-compose.prod.yml up -d --scale admin=2
```

### Load Balancer Configuration

Configure nginx or another load balancer to distribute traffic:

```nginx
upstream api {
    server api:4501;
    server api:4501;
    server api:4501;
}

server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://api;
    }
}
```

---

## Related Documentation

- [Docker Deployment](./docker.md) - Docker setup and management
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions
