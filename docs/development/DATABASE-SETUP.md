# Database Setup Guide

Complete guide for setting up the database with proper name and configuration.

## Quick Setup

```bash
# Automated setup (recommended)
pnpm db:setup
```

This will:
1. Create database configuration file
2. Create database if it doesn't exist
3. Generate Prisma client
4. Run migrations
5. Seed initial data

## Manual Setup

### Step 1: Create Database Configuration

```bash
# Copy example environment file
cp infra/database/env.example infra/database/.env.local
```

Edit `infra/database/.env.local` and set your DATABASE_URL:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/issue_collector
```

**Database Name**: Use `issue_collector` (or your preferred name)

### Step 2: Create Database

**Option A: Using psql (Recommended)**

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE issue_collector;

# Exit psql
\q
```

**Option B: Using createdb command**

```bash
createdb -U postgres issue_collector
```

### Step 3: Generate Prisma Client

```bash
pnpm db:generate
```

### Step 4: Run Migrations

```bash
# For development (creates migration files)
pnpm db:migrate:dev

# OR push schema directly (development only)
pnpm db:push
```

### Step 5: Seed Database

```bash
pnpm db:seed
```

## Default Admin Credentials

After seeding, you can login with:

- **Username**: `admin`
- **Password**: `admin`
- **Email**: `admin@admin.com`

**⚠️ Important**: Change the default password in production!

## Troubleshooting

### Error: "Cannot read properties of undefined (reading 'upsert')"

This means the Prisma client is out of sync or database tables don't exist.

**Solution:**

```bash
# 1. Regenerate Prisma client
pnpm db:generate

# 2. Ensure database exists and run migrations
pnpm db:push
# OR
pnpm db:migrate:dev

# 3. Then seed
pnpm db:seed
```

### Error: "Database does not exist"

Create the database manually:

```bash
# Using psql
psql -U postgres -c "CREATE DATABASE issue_collector;"

# Or using createdb
createdb -U postgres issue_collector
```

### Error: "Connection refused"

Check:
1. PostgreSQL is running: `pg_isready` or `psql -U postgres -c "SELECT 1"`
2. DATABASE_URL is correct in `infra/database/.env.local`
3. Port is correct (default: 5432)
4. Credentials are correct

### Reset Everything

```bash
# Reset database (WARNING: Deletes all data!)
pnpm db:reset

# Then seed again
pnpm db:seed
```

## Database Name Convention

Recommended database names:

- **Development**: `issue_collector` or `issue_collector_dev`
- **Staging**: `issue_collector_staging`
- **Production**: `issue_collector_prod`

## Verification

After setup, verify everything works:

```bash
# 1. Check database connection
pnpm db:studio

# 2. Check tables exist
psql -U postgres -d issue_collector -c "\dt"

# 3. Check admin user exists
psql -U postgres -d issue_collector -c "SELECT username, email FROM users WHERE username = 'admin';"
```

## Related Commands

```bash
# Generate Prisma client
pnpm db:generate

# Create migration
pnpm db:migrate:dev --name migration_name

# Apply migrations (production)
pnpm db:migrate

# Push schema (development)
pnpm db:push

# Open Prisma Studio
pnpm db:studio

# Seed database
pnpm db:seed

# Reset database
pnpm db:reset
```

## Next Steps

After database setup:

1. ✅ Start API server: `pnpm dev:api`
2. ✅ Start Admin dashboard: `pnpm dev:admin`
3. ✅ Login at: http://localhost:4502/admin
4. ✅ Use credentials: `admin` / `admin`

