# Database Setup Guide

## Overview

The Issue Collector Platform uses PostgreSQL with Prisma ORM. The database needs to be initialized with migrations before the API can function.

## Quick Setup

### Option 1: Automatic Migration on Startup (Recommended for First Deployment)

1. **Set environment variable in your stack deployment:**
   ```env
   RUN_MIGRATIONS_ON_STARTUP=true
   ```

2. **Deploy the stack** - migrations will run automatically when the API container starts

3. **After first deployment, remove the env var** to prevent accidental migrations

### Option 2: Manual Migration (Recommended for Production)

#### Step 1: Ensure Database Container is Running

Check if the postgres container is running:
```bash
docker ps | grep issue-collector-postgres
```

If not running, start it:
```bash
# In Portainer or via docker-compose
docker-compose -f infra/docker/docker-compose.prod.yml up -d postgres
```

#### Step 2: Connect to Database

**Via SSH Tunnel (from your local machine):**
```bash
# Create SSH tunnel to port 5436
ssh -L 5436:localhost:5436 user@your-server

# In another terminal, connect to database
psql -h localhost -p 5436 -U postgres -d issue_collector
```

**Or directly on the server:**
```bash
# Connect to the container
docker exec -it issue-collector-postgres psql -U postgres -d issue_collector
```

#### Step 3: Run Migrations

**Option A: From your local machine (via SSH tunnel):**
```bash
# Make sure SSH tunnel is active (from Step 2)
cd /path/to/issue-tracker/infra/database

# Set DATABASE_URL for migration
export DATABASE_URL="postgresql://postgres:IC4544!SecureP@ssw0rd@localhost:5436/issue_collector"

# Run migrations
pnpm db:migrate:deploy
```

**Option B: From inside the API container:**
```bash
# Execute migration command in API container
docker exec -it issue-collector-api sh -c "cd /app/infra/database && DATABASE_URL='postgresql://postgres:IC4544!SecureP@ssw0rd@postgres:5432/issue_collector' pnpm db:migrate:deploy"
```

**Option C: Using a temporary migration container:**
```bash
# Run a one-off container with database access
docker run --rm \
  --network issue-collector-network \
  -v /path/to/issue-tracker:/app \
  -w /app/infra/database \
  -e DATABASE_URL="postgresql://postgres:IC4544!SecureP@ssw0rd@postgres:5432/issue_collector" \
  node:22-alpine sh -c "npm install -g pnpm && pnpm install && pnpm db:migrate:deploy"
```

#### Step 4: Seed Initial Data (Optional)

After migrations, seed the database with initial data:
```bash
cd infra/database
export DATABASE_URL="postgresql://postgres:IC4544!SecureP@ssw0rd@localhost:5436/issue_collector"
pnpm db:seed
```

This creates:
- Default roles (Super Admin, Admin, User, Viewer)
- Default permissions
- Initial admin user (check `prisma/seeds/users.seed.ts` for credentials)

## Troubleshooting

### Database Container Not Starting

1. **Check logs:**
   ```bash
   docker logs issue-collector-postgres
   ```

2. **Check if port 5436 is already in use:**
   ```bash
   lsof -i :5436
   # or
   netstat -an | grep 5436
   ```

3. **Verify environment variables are set:**
   - `DATABASE_USER`
   - `DATABASE_PASSWORD`
   - `DATABASE_NAME`

### Cannot Connect via SSH Tunnel

1. **Verify port binding:**
   ```bash
   docker port issue-collector-postgres
   # Should show: 5432/tcp -> 127.0.0.1:5436
   ```

2. **Check if port is bound to localhost only:**
   - The port is intentionally bound to `127.0.0.1` for security
   - SSH tunnel should work: `ssh -L 5436:localhost:5436 user@server`

3. **Test connection from server:**
   ```bash
   docker exec -it issue-collector-postgres psql -U postgres -d issue_collector -c "SELECT 1;"
   ```

### Migration Errors

1. **Check Prisma client is generated:**
   ```bash
   cd infra/database
   pnpm db:generate
   ```

2. **Verify DATABASE_URL is correct:**
   ```bash
   echo $DATABASE_URL
   # Should be: postgresql://user:password@host:port/database
   ```

3. **Check database exists:**
   ```sql
   -- Connect to postgres database
   psql -U postgres -d postgres
   
   -- List databases
   \l
   
   -- Create database if missing
   CREATE DATABASE issue_collector;
   ```

### API Returns 500 on Login

If login returns 500 Internal Server Error, check:

1. **Database connection:**
   ```bash
   docker logs issue-collector-api | grep -i "database\|prisma\|connection"
   ```

2. **Tables exist:**
   ```sql
   -- Connect to database
   psql -U postgres -d issue_collector
   
   -- List tables
   \dt
   
   -- Should see: User, Role, Permission, etc.
   ```

3. **JWT_SECRET is set:**
   ```bash
   docker exec issue-collector-api printenv JWT_SECRET
   ```

## Environment Variables

Required database environment variables:

```env
DATABASE_USER=postgres
DATABASE_PASSWORD=IC4544!SecureP@ssw0rd
DATABASE_NAME=issue_collector
DATABASE_PORT_EXTERNAL=5436
```

For API container:
```env
DATABASE_URL=postgresql://postgres:IC4544!SecureP@ssw0rd@postgres:5432/issue_collector
```

## Security Notes

- Port 5436 is bound to `127.0.0.1` only for security
- Use SSH tunnel for remote access: `ssh -L 5436:localhost:5436 user@server`
- Change default passwords in production
- Never expose database port publicly

