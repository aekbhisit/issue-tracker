# Database Schema Management Guide

This guide explains **where** and **how** to create database tables and schemas in the Issue Collector Platform.

## 📍 Where Database Schemas Are Located

**Location**: `infra/database/prisma/schema/`

All database models are defined as **Prisma schema files** in this directory. Each feature/domain has its own `.prisma` file:

```
infra/database/prisma/schema/
├── schema.prisma          # Base config (generator & datasource)
├── user.prisma            # User, Role, Permission models (existing)
├── project.prisma         # Project models (IC-1)
├── issue.prisma           # Issue models (IC-5)
└── ...                    # Other domain models
```

## 🔢 PostgreSQL Extensions (pgvector)

**Important**: This project uses **PostgreSQL with pgvector extension** for vector similarity search (useful for IC-9 AI Triage Engine).

**pgvector is already configured**:
- ✅ Docker images include pgvector (`infra/docker/postgres/Dockerfile.custom` - recommended)
- ✅ Extension is auto-enabled via init script (`infra/docker/postgres/initdb/01-enable-extensions.sql`)
- ✅ Works automatically when using Docker Compose (`docker-compose.local.yml` uses `Dockerfile.custom`)

**To use vector columns in Prisma schema**:

```prisma
// Example: Adding vector embedding field (for IC-9 AI features)
model Issue {
  id          Int      @id @default(autoincrement())
  title       String
  description String?
  embedding   Unsupported("vector(1536)")?  // Vector embedding for AI similarity search
  
  @@map("issues")
}
```

**Note**: Prisma doesn't have native vector type support yet. Use `Unsupported("vector(1536)")` and handle vector operations via raw SQL queries when needed.

**Verify pgvector is enabled**:
```sql
-- Check if extension is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Or create a test vector column
CREATE TABLE test_vector (id SERIAL, embedding vector(1536));
```

## 🛠️ Who Manages Database Schema?

**Prisma ORM** manages all database schemas and migrations:
- **Schema Definition**: Prisma schema files (`.prisma`)
- **Migrations**: Prisma Migrate creates SQL migration files
- **Client Generation**: Prisma generates TypeScript client from schema

## 📝 Steps to Create Database and Tables

### ⚠️ Prerequisites: Docker Already Running

**Before creating schemas, ensure Docker services are running:**
- ✅ **PostgreSQL** container is running (check with `docker ps`)
- ✅ **Redis** container is running (if needed)
- ✅ Database connection is configured in `.env` (`DATABASE_URL`)

**If Docker is not running**, start it:
```bash
cd infra/docker
docker-compose -f docker-compose.local.yml up -d
```

**Note**: You don't need to create the database manually - Prisma migrations will create it automatically if it doesn't exist.

### Step 1: Create Schema File

Create a new `.prisma` file in `infra/database/prisma/schema/`:

```prisma
// infra/database/prisma/schema/project.prisma
// Project Registration Models

model Project {
  id        Int      @id @default(autoincrement())
  name      String
  // ... more fields
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  @@map("projects")
}
```

### Step 2: Generate Prisma Client

After creating/updating schema files, generate the Prisma Client:

```bash
pnpm db:generate
```

This creates TypeScript types and client code based on your schema.

### Step 3: Create Migration

Create a migration to apply schema changes to the **existing PostgreSQL database** (Docker container):

```bash
pnpm db:migrate:dev --name add_project_table
```

This will:
- Create SQL migration files in `infra/database/prisma/migrations/`
- Apply the migration to your **existing PostgreSQL database** (running in Docker)
- Create/update tables in PostgreSQL
- **Note**: Database must already exist (created automatically by Prisma or manually via Docker init scripts)

### Step 4: Verify

Check that tables were created:

```bash
# Open Prisma Studio to view database
pnpm db:studio
```

Or check directly in PostgreSQL:

```sql
\dt  -- List all tables
\d projects  -- Describe projects table
```

## 🔄 Complete Workflow Example

**Example: Creating Project tables (IC-1)**

```bash
# 1. Create schema file
# Edit: infra/database/prisma/schema/project.prisma

# 2. Generate Prisma Client
pnpm db:generate

# 3. Create migration
pnpm db:migrate:dev --name add_project_models

# 4. Verify
pnpm db:studio
```

## 📋 Phase-Specific Schema Creation

### IC-1: Project Registration System

**Files to create**:
- `infra/database/prisma/schema/project.prisma`
  - `Project` model
  - `ProjectEnvironment` model

**Commands**:
```bash
pnpm db:generate
pnpm db:migrate:dev --name add_project_models
```

### IC-5: Issue Collector API & Database

**Files to create**:
- `infra/database/prisma/schema/issue.prisma`
  - `Issue` model
  - `IssueScreenshot` model
  - `IssueLog` model

**Commands**:
```bash
pnpm db:generate
pnpm db:migrate:dev --name add_issue_models
```

**Note**: Make sure `Project` model has `issues Issue[]` relation field.

## 🎯 Key Commands Reference

| Command | Purpose |
|---------|---------|
| `pnpm db:generate` | Generate Prisma Client from schema |
| `pnpm db:migrate:dev` | Create and apply migration (development) |
| `pnpm db:migrate` | Apply migrations (production) |
| `pnpm db:push` | Push schema directly to DB (dev only, no migration) |
| `pnpm db:studio` | Open Prisma Studio (database GUI) |
| `pnpm db:seed` | Seed database with initial data |
| `pnpm db:reset` | Reset database (drop all tables, re-run migrations) |

**PostgreSQL Extensions**:
- pgvector extension is **automatically enabled** when using Docker Compose
- Extensions are enabled via `infra/docker/postgres/initdb/01-enable-extensions.sql`
- If using local PostgreSQL (not Docker), enable manually:
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  CREATE EXTENSION IF NOT EXISTS postgis;
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  CREATE EXTENSION IF NOT EXISTS "pg_trgm";
  ```

## 📚 Related Documentation

- **Database Package**: `infra/database/README.md` - Complete database package guide
- **Setup Guide**: `docs/development/setup.md` - Step 5: Database Migration
- **Getting Started**: `GETTING_STARTED.md` - Step 3: Database Setup
- **Prisma Docs**: https://www.prisma.io/docs

## ⚠️ Important Notes

1. **Always create schema files** in `infra/database/prisma/schema/`, not in root `prisma/` folder
2. **Run `db:generate`** after every schema change before running migrations
3. **Use descriptive migration names**: `--name add_project_models` not `--name migration1`
4. **Never edit migration files** after they've been applied to production
5. **Use `db:push`** only in development for quick prototyping (doesn't create migration files)

## 🔗 Integration with Phase Plans

Each phase plan (IC-1, IC-5) includes database schema creation steps in **Step 2: Implement base code**. Follow those steps along with this guide for complete database setup.

