# Environment Variables Documentation

This document provides comprehensive documentation for all environment variables used across the Issue Collector Platform.

## Overview

The platform uses environment variables for configuration across three main applications:
- **API** (`apps/api`) - Backend Express.js server
- **Admin** (`apps/admin`) - Next.js admin dashboard
- **Frontend** (`apps/frontend`) - Next.js public frontend

Environment variables are validated using the enhanced config loader in `packages/config` with Zod schema validation.

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
console.log(config.api.port) // 3000
console.log(config.database.url) // postgresql://...
```

## Environment Variable Categories

### 1. Node Environment

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Node environment: `development`, `staging`, `production`, or `test` |

### 2. API Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `API_PORT` | No | `3000` | Port number for the API server |
| `API_HOST` | No | `localhost` | Hostname for the API server |

**Example:**
```bash
API_PORT=3401
API_HOST=0.0.0.0
```

### 3. Database Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | **Yes** | - | PostgreSQL connection string (must be a valid URL) |
| `DATABASE_TYPE` | No | `postgresql` | Database type: `postgresql` or `mysql` |

**Example:**
```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/issue_collector
DATABASE_TYPE=postgresql
```

**Note:** For local development, PostgreSQL should already be running on your host machine. See `docs/development/setup.md` for details.

### 4. Security Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | **Yes** | - | Secret key for JWT token signing (minimum 32 characters) |
| `JWT_EXPIRES_IN` | No | `7d` | JWT token expiration time (e.g., `7d`, `24h`, `1h`) |
| `BCRYPT_ROUNDS` | No | `10` | Number of bcrypt rounds for password hashing (10-15) |

**Example:**
```bash
JWT_SECRET=your-super-secret-key-minimum-32-characters-long-change-in-production
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=10
```

**Security Note:** Always use a strong, randomly generated `JWT_SECRET` in production. Never commit secrets to version control.

### 5. CORS Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ALLOWED_ORIGINS` | No | `*` | Comma-separated list of allowed CORS origins, or `*` for all |

**Example:**
```bash
# Development
ALLOWED_ORIGINS=http://localhost:3412,http://localhost:3413

# Production
ALLOWED_ORIGINS=https://admin.example.com,https://app.example.com
```

### 6. Storage Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `STORAGE_TYPE` | No | `local` | Storage type: `local` or `s3` |
| `STORAGE_PATH` | No | `./storage/uploads` | Local storage path for uploads |
| `STORAGE_PUBLIC_PATH` | No | `./storage/public` | Local storage path for public files |
| `STORAGE_TEMP_PATH` | No | `./storage/uploads/temp` | Local storage path for temporary files |
| `LOCAL_STORAGE_BASE_URL` | No | - | Base URL for local storage (e.g., `http://localhost:4501/uploads`) |

**Example (Local Storage):**
```bash
STORAGE_TYPE=local
STORAGE_PATH=./storage/uploads
STORAGE_PUBLIC_PATH=./storage/public
STORAGE_TEMP_PATH=./storage/uploads/temp
LOCAL_STORAGE_BASE_URL=http://localhost:4501/uploads
```

### 7. AWS S3 Configuration (Optional)

Required only if `STORAGE_TYPE=s3`:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AWS_ACCESS_KEY_ID` | Conditional* | - | AWS access key ID |
| `AWS_SECRET_ACCESS_KEY` | Conditional* | - | AWS secret access key |
| `AWS_S3_BUCKET` | Conditional* | - | S3 bucket name |
| `AWS_S3_REGION` | Conditional* | - | AWS region (e.g., `ap-southeast-1`) |
| `CDN_DOMAIN` | No | - | CDN domain for S3 assets (optional) |

*Required when `STORAGE_TYPE=s3`

**Example:**
```bash
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET=issue-collector-uploads
AWS_S3_REGION=ap-southeast-1
CDN_DOMAIN=https://cdn.example.com
```

### 8. Upload Limits

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MAX_FILE_SIZE` | No | `10485760` | Maximum file size in bytes (default: 10MB) |
| `ALLOWED_IMAGE_TYPES` | No | `jpg,jpeg,png,gif,webp` | Comma-separated list of allowed image types |
| `ALLOWED_DOCUMENT_TYPES` | No | `pdf,doc,docx` | Comma-separated list of allowed document types |

**Example:**
```bash
MAX_FILE_SIZE=52428800  # 50MB
ALLOWED_IMAGE_TYPES=jpg,jpeg,png,gif,webp,svg
ALLOWED_DOCUMENT_TYPES=pdf,doc,docx,xls,xlsx
```

### 9. Cleanup Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TEMP_FILE_CLEANUP_HOURS` | No | `24` | Hours after which temporary files are cleaned up |

**Example:**
```bash
TEMP_FILE_CLEANUP_HOURS=48
```

### 10. Redis Configuration (Optional)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REDIS_URL` | No | - | Redis connection URL (optional, for caching/queues) |

**Example:**
```bash
REDIS_URL=redis://localhost:6379
```

**Note:** For local development, Redis should already be running on your host machine.

### 11. Next.js Public Variables (Admin & Frontend)

These variables are prefixed with `NEXT_PUBLIC_` and are exposed to the browser. They must be set at build time.

#### Admin App (`apps/admin`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | No | - | Base API URL (e.g., `http://localhost:4501`) |
| `NEXT_PUBLIC_API_ADMIN_URL` | No | `http://localhost:4501/api/admin/v1` | Admin API endpoint URL |
| `NEXT_PUBLIC_APP_NAME` | No | - | Application name displayed in UI |

**Example:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:4501
NEXT_PUBLIC_API_ADMIN_URL=http://localhost:4501/api/admin/v1
NEXT_PUBLIC_APP_NAME=Issue Collector Admin
```

#### Frontend App (`apps/frontend`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | No | - | Public API endpoint URL (e.g., `http://localhost:4501/api/public/v1`) |
| `NEXT_PUBLIC_APP_NAME` | No | - | Application name displayed in UI |

**Example:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:4501/api/public/v1
NEXT_PUBLIC_APP_NAME=Issue Collector
```

## Environment Files

Environment variables are loaded from the following locations (in priority order):

1. `.env.local` (local development, git-ignored)
2. `.env` (shared, git-ignored)
3. `infra/docker/{app}/.env` (Docker-specific, git-ignored)

### Example Files

Example environment files are provided in:
- `infra/docker/api/env.example` - API server variables
- `infra/docker/admin/env.example` - Admin app variables
- `infra/docker/frontend/env.example` - Frontend app variables
- `infra/database/env.example` - Database variables

Copy these files to `.env` or `.env.local` and fill in your values:

```bash
# Copy example file
cp infra/docker/api/env.example .env.local

# Edit with your values
nano .env.local
```

## Environment-Specific Configuration

### Development

```bash
NODE_ENV=development
API_PORT=3401
API_HOST=localhost
DATABASE_URL=postgresql://postgres:password@localhost:5432/issue_collector_dev
JWT_SECRET=dev-secret-key-minimum-32-characters-long
ALLOWED_ORIGINS=http://localhost:3412,http://localhost:3413
STORAGE_TYPE=local
```

### Staging

```bash
NODE_ENV=staging
API_PORT=3000
API_HOST=0.0.0.0
DATABASE_URL=postgresql://user:pass@staging-db:5432/issue_collector_staging
JWT_SECRET=<strong-random-secret-32-chars-min>
ALLOWED_ORIGINS=https://admin-staging.example.com
STORAGE_TYPE=s3
AWS_S3_BUCKET=issue-collector-staging
```

### Production

```bash
NODE_ENV=production
API_PORT=3000
API_HOST=0.0.0.0
DATABASE_URL=postgresql://user:pass@prod-db:5432/issue_collector
JWT_SECRET=<strong-random-secret-32-chars-min>
ALLOWED_ORIGINS=https://admin.example.com,https://app.example.com
STORAGE_TYPE=s3
AWS_S3_BUCKET=issue-collector-prod
```

## Validation Errors

The config loader validates all environment variables on startup. If validation fails, you'll see clear error messages:

```
Configuration validation failed:

Missing required environment variables:
  - DATABASE_URL
  - JWT_SECRET

Invalid environment variables:
  - JWT_SECRET: String must contain at least 32 character(s)
  - API_PORT: Expected number, received string
```

Fix the errors and restart the application.

## Best Practices

1. **Never commit secrets** - Use `.env.local` or `.env` files (git-ignored) for local development
2. **Use strong secrets** - Generate random, long secrets for production (minimum 32 characters for JWT_SECRET)
3. **Use different values per environment** - Never reuse production secrets in development
4. **Document custom variables** - If adding new variables, update this documentation
5. **Validate early** - The config loader validates on startup, catching errors before the app runs
6. **Use environment-specific files** - Keep separate `.env` files for dev/staging/production

## Troubleshooting

### Config Loader Errors

If you see validation errors:
1. Check that all required variables are set
2. Verify variable types (numbers vs strings)
3. Check URL formats for `DATABASE_URL` and `REDIS_URL`
4. Ensure `JWT_SECRET` is at least 32 characters

### Next.js Public Variables

Remember that `NEXT_PUBLIC_*` variables are baked into the bundle at build time. To change them:
1. Update the environment variable
2. Rebuild the Next.js app: `pnpm build:admin` or `pnpm build:frontend`

### Database Connection Issues

If you can't connect to the database:
1. Verify `DATABASE_URL` is correct
2. Check PostgreSQL is running: `psql -U postgres -c "SELECT version();"`
3. Verify network connectivity and firewall rules
4. Check database credentials

## Related Documentation

- [Setup Guide](./setup.md) - Initial setup and installation
- [API Documentation](../api/README.md) - API endpoints and usage
- [Deployment Guide](../deployment/production.md) - Production deployment

