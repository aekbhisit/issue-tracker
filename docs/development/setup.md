# Development Setup Guide

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker & Docker Compose (optional, for containerized services)
- PostgreSQL >= 17 (with pgvector extension)
- Redis (optional, for caching/queues)

## Initial Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd nd-issue-tracker
```

### 2. Run Setup Wizard

```bash
pnpm setup
```

Select your database (PostgreSQL or MySQL) and provide configuration.

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Configure Environment Variables

**Important**: The platform uses an enhanced config loader that validates all environment variables on startup.

#### 4.1 Copy Example Files

```bash
# Copy example environment files
cp infra/docker/api/env.example apps/api/.env.local
cp infra/docker/admin/env.example apps/admin/.env.local
cp infra/docker/frontend/env.example apps/frontend/.env.local
cp infra/database/env.example infra/database/.env.local
```

#### 4.2 Configure Required Variables

Edit `.env.local` files and set required variables:

**API (`apps/api/.env.local`):**
```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/issue_collector
JWT_SECRET=your-secret-key-minimum-32-characters-long-change-in-production
```

**Admin (`apps/admin/.env.local`):**
```bash
NEXT_PUBLIC_API_URL=http://localhost:4501
NEXT_PUBLIC_API_ADMIN_URL=http://localhost:4501/api/admin/v1
```

See [Environment Variables Documentation](./environment-variables.md) for complete variable reference.

### 5. Start Database

**Note**: For local development, PostgreSQL and Redis should already be running on your host machine.

**PostgreSQL Extensions**: The Docker setup includes **pgvector** extension (for AI/vector search features in IC-9). If using local PostgreSQL, enable extensions manually:

```bash
# Connect to PostgreSQL
psql -U postgres -d your_database

# Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
```

**Option 2: Start Docker services (if needed)**
```bash
# Docker Compose automatically includes pgvector extension
docker-compose -f infra/docker/docker-compose.local.yml up -d
```

### 6. Database Setup

**Option A: Automated Setup (Recommended)**

```bash
# Complete database setup (creates DB, runs migrations, seeds data)
pnpm db:setup
```

**Option B: Manual Setup**

```bash
# 1. Create database configuration
cp infra/database/env.example infra/database/.env.local
# Edit infra/database/.env.local and set DATABASE_URL

# 2. Create database (using psql)
psql -U postgres -c "CREATE DATABASE issue_collector;"

# 3. Generate Prisma client
pnpm db:generate

# 4. Run migrations (creates tables)
pnpm db:migrate:dev
# OR push schema directly: pnpm db:push

# 5. Seed database (creates admin user)
pnpm db:seed
```

See [Database Setup Guide](./DATABASE-SETUP.md) for detailed instructions.

### 7. Start Development Servers

```bash
# All apps (runs API, Admin, and Frontend)
pnpm dev

# Or run all apps explicitly
pnpm dev:all    # Runs API, Admin, and Frontend together

# Or individually
pnpm dev:api    # API on port 4501 (or configured port)
pnpm dev:admin  # Admin on port 4502 (or configured port)
pnpm dev:frontend  # Frontend on port 4503 (or configured port)

# Stop all development servers
pnpm dev:kill   # Kills all processes on ports 4501, 4502, 4503
```

## Access Applications

- **API**: http://localhost:4501 (or configured `API_PORT`)
  - Health: http://localhost:4501/health
  - Version: http://localhost:4501/version
- **Admin**: http://localhost:4502 (or configured port)
- **Frontend**: http://localhost:4503 (or configured port)

### Default Admin Login Credentials

After running database seeds (`pnpm db:seed`), you can login to the admin dashboard with:

- **Username**: `admin`
- **Password**: `admin`
- **Email**: `admin@admin.com`

**⚠️ Important**: Change the default password in production!

**Login URL**: http://localhost:4502/admin

## Configuration Loader

The platform uses an enhanced config loader (`packages/config`) that:

- Validates environment variables using Zod schemas
- Provides type-safe configuration objects
- Fails fast with clear error messages for missing or invalid variables
- Supports different environments (development, staging, production)

### Usage

```typescript
import { getConfig } from '@workspace/config'

const config = getConfig()
console.log(config.api.port) // 4501
console.log(config.database.url) // postgresql://...
```

### Validation Errors

If you see validation errors on startup, check:
1. All required variables are set (see [Environment Variables](./environment-variables.md))
2. Variable types are correct (numbers vs strings)
3. URL formats are valid for `DATABASE_URL` and `REDIS_URL`
4. `JWT_SECRET` is at least 32 characters

Example error:
```
Configuration validation failed:

Missing required environment variables:
  - DATABASE_URL
  - JWT_SECRET
```

## API Endpoints

### Health Check

```bash
GET /health
```

Returns API health status, uptime, and available routes.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45,
  "routes": ["/api/public/v1", "/api/admin/v1", ...]
}
```

### Version

```bash
GET /version
```

Returns API version information from `package.json`.

**Response:**
```json
{
  "version": "1.0.0",
  "name": "issue-collector-api",
  "description": "Express API Server",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Development Workflow

1. Make changes to code
2. Hot reload will update automatically
3. Run `pnpm lint` before committing
4. Run `pnpm format` to format code
5. Run `pnpm typecheck` to check types
6. Run `pnpm build` to verify builds succeed

## Troubleshooting

### Config Loader Errors

If the config loader fails:
1. Check `.env.local` files exist and have required variables
2. Verify variable formats (URLs, numbers, etc.)
3. See [Environment Variables Documentation](./environment-variables.md) for details

### Database Connection Issues

1. Verify PostgreSQL is running: `psql -U postgres -c "SELECT version();"`
2. Check `DATABASE_URL` is correct
3. Verify network connectivity and credentials

### Port Conflicts

If ports are already in use:
1. Change `API_PORT` in `.env.local` files
2. Update `NEXT_PUBLIC_API_URL` accordingly
3. Restart development servers

## Related Documentation

- [Environment Variables](./environment-variables.md) - Complete environment variable reference
- [API Documentation](../api/README.md) - API endpoints and usage
- [Admin UI Guidelines](./admin-ui-guidelines.md) - UI/UX guidelines for admin dashboard

