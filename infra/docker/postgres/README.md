# PostgreSQL Image with pgvector and PostGIS

This directory contains Dockerfiles to build PostgreSQL images with both pgvector and PostGIS extensions.

## Available Dockerfiles

### 🎯 **Dockerfile.custom** (Recommended for Local Development)
- **Base**: `postgres:17.6`
- **Method**: Installs PostGIS and pgvector from Debian packages
- **Use Case**: Local development, faster builds
- **Location**: `infra/docker/postgres/Dockerfile.custom`

### Dockerfile (Alternative)
- **Base**: `postgis/postgis:17-3.4` (includes PostGIS)
- **Method**: Adds pgvector package
- **Use Case**: Alternative local development option

### Dockerfile.prod (Production)
- **Base**: `postgres:17.6`
- **Method**: Builds pgvector from source (more reliable for production)
- **Use Case**: Production builds, Harbor registry
- **Location**: `infra/docker/postgres/Dockerfile.prod`

## Why These Images?

The standard `postgres:17.6` image doesn't include:
- **pgvector** extension (for vector similarity search)
- **PostGIS** extension (for spatial/GIS data)

These custom images add both extensions so production matches local development.

## Local Development

**Recommended**: Use `Dockerfile.custom` for local development (faster, simpler).

- The `postgres` service in `docker-compose.local.yml` uses `Dockerfile.custom` by default
- Init scripts under `initdb/` automatically enable `vector`, `postgis`, `uuid-ossp`, and `pg_trgm` when the data volume is created
- The compose file binds PostgreSQL to `localhost:5435` and uses `issue_collector` as the default database to avoid colliding with host PostgreSQL
- Run `docker-compose -f infra/docker/docker-compose.local.yml up --build` from project root to bring up the full stack

**To use Dockerfile.custom explicitly**:
```yaml
postgres:
  build:
    context: ./postgres
    dockerfile: Dockerfile.custom
```

## Package Installation (Dockerfile.prod lines 7-12)

The Dockerfile installs packages in this order:

1. **Build dependencies** (lines 9-11):
   - `build-essential` - C/C++ compiler tools
   - `git` - To clone pgvector repository
   - `postgresql-server-dev-17` - PostgreSQL development headers

2. **PostGIS packages** (lines 13-14):
   - `postgresql-17-postgis-3` - PostGIS extension for PostgreSQL 17
   - `postgresql-17-postgis-3-scripts` - PostGIS utility scripts

3. **PostgreSQL contrib** (line 16):
   - `postgresql-contrib` - Additional PostgreSQL extensions (uuid-ossp, pg_trgm, etc.)

4. **pgvector from source** (lines 18-24):
   - Clones pgvector v0.7.2 from GitHub
   - Compiles and installs it
   - Cleans up source files

5. **Cleanup** (lines 26-27):
   - Removes build dependencies to reduce image size
   - Cleans apt cache

## Building and Pushing to Harbor

### Option 1: Using the build script (Recommended)

```bash
cd infra/docker/postgres
./build-and-push.sh
```

### Option 2: Manual build and push

```bash
# Set Harbor configuration
export HARBOR_URL=reg.haahii.com
export HARBOR_PROJECT=haahii

# Build the image
docker build -f infra/docker/postgres/Dockerfile.prod \
  -t ${HARBOR_URL}/${HARBOR_PROJECT}/postgres-pgvector-postgis:17.6 \
  infra/docker/postgres

# Push to Harbor
docker push ${HARBOR_URL}/${HARBOR_PROJECT}/postgres-pgvector-postgis:17.6
```

### Option 3: Using docker-compose build (for local testing)

```bash
cd infra/docker
docker-compose -f docker-compose.prod.yml build postgres
```

## Verification

After building, verify the image has the extensions:

```bash
docker run --rm \
  ${HARBOR_URL}/${HARBOR_PROJECT}/postgres-pgvector-postgis:17.6 \
  psql -U postgres -c "CREATE EXTENSION vector; CREATE EXTENSION postgis;"
```

## Usage in docker-compose.prod.yml

Once the image is pushed to Harbor, it will be automatically pulled by Portainer:

```yaml
postgres:
  image: ${HARBOR_URL:-reg.haahii.com}/${HARBOR_PROJECT:-haahii}/postgres-pgvector-postgis:17.6
```

## Troubleshooting

### Package not found errors

If you see errors like "package postgresql-17-pgvector not found":
- The Dockerfile already handles this by building pgvector from source
- Make sure you're using the updated Dockerfile.prod

### Build fails

- Ensure you have Docker buildx enabled: `docker buildx version`
- Check internet connection (needs to clone from GitHub)
- Verify PostgreSQL 17 packages are available in Debian repos

### Extensions not enabled

- Check that init scripts are copied correctly
- Verify `/docker-entrypoint-initdb.d/01-enable-extensions.sql` exists in image
- Check PostgreSQL logs: `docker logs lobby-concierge-postgres`

