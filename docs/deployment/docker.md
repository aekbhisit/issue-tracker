# Docker Deployment Guide

Complete guide for deploying the Issue Collector Platform using Docker.

## Table of Contents

1. [Local Development](#local-development)
2. [Production Deployment](#production-deployment)
3. [Docker Compose Files](#docker-compose-files)
4. [Service Management](#service-management)
5. [Troubleshooting](#troubleshooting)

---

## Local Development

### Prerequisites

- Docker & Docker Compose installed
- PostgreSQL and Redis running locally (or use Docker containers)

### Quick Start

**Option 1: Database Only (Recommended for Development)**

If you have PostgreSQL and Redis running locally:

```bash
# Start only MinIO (if needed for S3-compatible storage)
docker-compose -f infra/docker/docker-compose.local.yml up -d minio

# Run apps locally
pnpm dev
```

**Option 2: Full Stack with Docker**

```bash
# Start all services
docker-compose -f infra/docker/docker-compose.local.yml up -d

# Or build and start
docker-compose -f infra/docker/docker-compose.local.yml up --build -d
```

### Development Workflow

```bash
# Start services
docker-compose -f infra/docker/docker-compose.local.yml up -d

# View logs
docker-compose -f infra/docker/docker-compose.local.yml logs -f

# Stop services
docker-compose -f infra/docker/docker-compose.local.yml down

# Restart a specific service
docker-compose -f infra/docker/docker-compose.local.yml restart api
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Environment variables configured in `.env` files
- [ ] Database backed up
- [ ] SSL certificates ready (if using HTTPS)
- [ ] Domain DNS configured
- [ ] Secrets rotated
- [ ] Harbor registry credentials configured
- [ ] Production Docker images built and pushed

### Build Production Images

```bash
# Build all images
docker-compose -f infra/docker/docker-compose.prod.yml build

# Or build specific service
docker-compose -f infra/docker/docker-compose.prod.yml build api
```

### Deploy to Production

```bash
# Start all services
docker-compose -f infra/docker/docker-compose.prod.yml up -d

# Or with build
docker-compose -f infra/docker/docker-compose.prod.yml up --build -d
```

### Scale Services

```bash
# Scale API to 3 instances
docker-compose -f infra/docker/docker-compose.prod.yml up -d --scale api=3

# Scale Admin to 2 instances
docker-compose -f infra/docker/docker-compose.prod.yml up -d --scale admin=2
```

### Run Database Migrations

```bash
# Enter API container
docker-compose -f infra/docker/docker-compose.prod.yml exec api sh

# Run migrations
cd /app/infra/database
pnpm prisma migrate deploy
```

---

## Docker Compose Files

### File Structure

- `infra/docker/docker-compose.local.yml` - Local development (uses local PostgreSQL/Redis)
- `infra/docker/docker-compose.prod.yml` - Production deployment (includes all services)

### Service Configuration

| Service | Port | Description |
|---------|------|-------------|
| **api** | 3000 | Express.js API backend |
| **admin** | 3001 | Next.js Admin dashboard |
| **frontend** | 3002 | Next.js Public frontend |
| **postgres** | 5432 | PostgreSQL database |
| **redis** | 6379 | Redis cache |
| **minio** | 9000/9001 | S3-compatible storage |

---

## Service Management

### View Logs

```bash
# All services
docker-compose -f infra/docker/docker-compose.prod.yml logs

# Specific service
docker-compose -f infra/docker/docker-compose.prod.yml logs api

# Follow logs in real-time
docker-compose -f infra/docker/docker-compose.prod.yml logs -f api

# Last 100 lines
docker-compose -f infra/docker/docker-compose.prod.yml logs --tail=100 api
```

### Restart Services

```bash
# Restart all services
docker-compose -f infra/docker/docker-compose.prod.yml restart

# Restart specific service
docker-compose -f infra/docker/docker-compose.prod.yml restart api
```

### Stop Services

```bash
# Stop all services (keeps containers)
docker-compose -f infra/docker/docker-compose.prod.yml stop

# Stop and remove containers
docker-compose -f infra/docker/docker-compose.prod.yml down

# Stop and remove containers + volumes (⚠️ deletes data)
docker-compose -f infra/docker/docker-compose.prod.yml down -v
```

### Check Service Status

```bash
# List running containers
docker-compose -f infra/docker/docker-compose.prod.yml ps

# Check container health
docker inspect [container_name]
```

### Access Container Shell

```bash
# API container
docker-compose -f infra/docker/docker-compose.prod.yml exec api sh

# Database container
docker-compose -f infra/docker/docker-compose.prod.yml exec postgres psql -U postgres -d nd_issue_tracker
```

---

## Troubleshooting

### Common Issues

**Port Already in Use**

```bash
# Find process using port
lsof -i :4501  # Mac/Linux
netstat -ano | findstr :4501  # Windows

# Kill process or stop Docker container
docker-compose -f infra/docker/docker-compose.prod.yml stop api
```

**Database Connection Failed**

```bash
# Check if database is running
docker-compose -f infra/docker/docker-compose.prod.yml ps postgres

# Check database logs
docker-compose -f infra/docker/docker-compose.prod.yml logs postgres

# Restart database
docker-compose -f infra/docker/docker-compose.prod.yml restart postgres
```

**Container Won't Start**

```bash
# Check logs for errors
docker-compose -f infra/docker/docker-compose.prod.yml logs api

# Rebuild without cache
docker-compose -f infra/docker/docker-compose.prod.yml build --no-cache api
```

**Permission Issues (Linux)**

```bash
# Fix storage permissions
sudo chown -R $USER:$USER storage/
chmod -R 755 storage/
```

### Clean Up

```bash
# Remove stopped containers
docker-compose -f infra/docker/docker-compose.prod.yml rm -f

# Remove unused images
docker image prune -a

# Full cleanup (⚠️ removes everything)
docker system prune -a --volumes
```

---

## Environment Variables

See `infra/docker/env.example` for all available environment variables.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret
- `STORAGE_TYPE` - `local` or `s3`
- `NODE_ENV` - `development` or `production`

---

## Related Documentation

- [Production Deployment](./production.md) - Detailed production setup
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions
