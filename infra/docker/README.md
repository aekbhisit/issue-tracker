# Docker Compose Configuration

โฟลเดอร์นี้ประกอบด้วยไฟล์ Docker Compose สำหรับการจัดการ containers ของโปรเจค Node.js monorepo

## 📁 ไฟล์ในโฟลเดอร์

### Docker Compose Files
- **`docker-compose.yml`** - ไฟล์หลักสำหรับ development
- **`docker-compose.staging.yml`** - สำหรับ staging environment
- **`docker-compose.prod.yml`** - สำหรับ production environment
- **`docker-compose.override.yml`** - Override สำหรับ development (ใช้โดยอัตโนมัติ)

### Environment Files
- **`env.example`** - ตัวอย่าง environment variables

## 🚀 การใช้งาน

### Development Options

#### Option 1: Database Only (Recommended for Development)
รัน database ใน Docker, apps รันแบบ local สำหรับ hot reload ที่เร็วที่สุด

```bash
# จาก root directory
docker-compose -f infra/docker/docker-compose.dev-db-only.yml up -d

# รัน apps แบบ local
pnpm install
pnpm db:generate
pnpm dev
```

#### Option 2: Full Docker Stack
รันทุกอย่างใน Docker สำหรับ testing containerization

```bash
# จาก root directory (ใช้ symlink)
docker-compose up -d

# หรือจาก infra/docker/
cd infra/docker
docker-compose up -d
```

#### Option 3: Local Test Stack with pgvector-enabled Postgres

This compose file builds **every service locally** while ensuring PostgreSQL includes the same `pgvector` + PostGIS extensions that the production image exposes.

```bash
cd infra/docker
docker-compose -f docker-compose.local.yml up --build
```

- The `postgres` service uses **`Dockerfile.custom`** (recommended), which installs PostGIS + pgvector from Debian packages on `postgres:17.6` base image.
- Alternative: `Dockerfile` uses `postgis/postgis:17-3.4` base with pgvector added.
- Init scripts in `infra/docker/postgres/initdb/` enable `vector`, `postgis`, `uuid-ossp`, and `pg_trgm` the first time the volume is created.
- Database defaults to `issue_collector` and binds to `localhost:5435` to avoid conflicting with host PostgreSQL installations.

**Note**: `docker-compose.local.yml` uses `Dockerfile.custom` by default for faster, simpler builds.

### 1. Development Environment

```bash
# ไปที่โฟลเดอร์ docker
cd infra/docker

# คัดลอกไฟล์ environment
cp env.example .env

# แก้ไขไฟล์ .env ตามความต้องการ
# จากนั้นรัน services
docker-compose up -d

# ดู logs
docker-compose logs -f

# หยุด services
docker-compose down
```

### 2. Staging Environment

```bash
# ไปที่โฟลเดอร์ docker
cd infra/docker

# ตั้งค่า environment variables
export POSTGRES_USER=staging_user
export POSTGRES_PASSWORD=staging_password
export POSTGRES_DB=mydb_staging
export JWT_SECRET=staging-secret-key
export NEXT_PUBLIC_API_URL=http://localhost:3000
export ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3002

# รัน staging environment
docker-compose -f docker-compose.staging.yml up -d
```

### 3. Production Environment

```bash
# ไปที่โฟลเดอร์ docker
cd infra/docker

# ตั้งค่า environment variables
export POSTGRES_USER=prod_user
export POSTGRES_PASSWORD=secure_prod_password
export POSTGRES_DB=mydb_prod
export JWT_SECRET=your-production-jwt-secret
export NEXT_PUBLIC_API_URL=https://your-api-domain.com
export ALLOWED_ORIGINS=https://your-admin-domain.com,https://your-frontend-domain.com

# รัน production environment
docker-compose -f docker-compose.prod.yml up -d
```

## 🐳 Services

### Development Services (Full Stack)
- **postgres** - PostgreSQL database (port 5432)
- **api** - Express API server (port 3000)
- **admin** - Next.js Admin dashboard (port 3001)
- **frontend** - Next.js Frontend (port 3002)

### Development Services (Database Only)
- **postgres** - PostgreSQL database (port 5432)

### Production Services
- **postgres** - PostgreSQL database
- **api** - Express API server
- **admin** - Next.js Admin dashboard
- **frontend** - Next.js Frontend
- **nginx** - Reverse proxy (ports 80, 443)
- **db-backup** - Database backup service

## 🔧 การตั้งค่า

### Environment Variables

สร้างไฟล์ `.env` จาก `env.example` และแก้ไขค่าตามความต้องการ:

```bash
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-password
POSTGRES_DB=mydb

# Application
JWT_SECRET=your-jwt-secret
NODE_ENV=development

# API URLs
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_ADMIN_URL=http://localhost:3000/api/admin/v1

# CORS
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3002
```

### Docker Registry

สำหรับ staging และ production ต้องตั้งค่า Docker registry:

```bash
DOCKER_REGISTRY=your-registry.com
DOCKER_USERNAME=your-username
DOCKER_PASSWORD=your-password
```

## 📊 การ Monitor

### ตรวจสอบสถานะ Services

```bash
# ดู containers ที่ทำงาน
docker-compose ps

# ดู logs ของ service เฉพาะ
docker-compose logs api
docker-compose logs admin
docker-compose logs frontend
docker-compose logs postgres

# ดู logs แบบ real-time
docker-compose logs -f
```

### Health Checks

```bash
# ตรวจสอบ API
curl http://localhost:3000/health

# ตรวจสอบ Admin
curl http://localhost:3001

# ตรวจสอบ Frontend
curl http://localhost:3002
```

## 🔄 การ Update

### Update Development

```bash
# Database Only Mode
docker-compose -f infra/docker/docker-compose.dev-db-only.yml up -d

# Full Stack Mode - Rebuild และ restart services
docker-compose up -d --build

# หรือ rebuild เฉพาะ service
docker-compose up -d --build api
```

### Update Production

```bash
# Pull images ใหม่
docker-compose -f docker-compose.prod.yml pull

# Restart services
docker-compose -f docker-compose.prod.yml up -d
```

## 🗄️ Database Management

### Backup Database

```bash
# Backup development database
docker-compose exec postgres pg_dump -U postgres mydb > backup.sql

# Backup production database
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup.sql
```

### Restore Database

```bash
# Restore development database
docker-compose exec -T postgres psql -U postgres mydb < backup.sql

# Restore production database
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U $POSTGRES_USER $POSTGRES_DB < backup.sql
```

## 🧹 การทำความสะอาด

### ลบ Containers และ Volumes

```bash
# หยุดและลบ containers
docker-compose down

# ลบ volumes ด้วย
docker-compose down -v

# ลบ images ที่ไม่ได้ใช้
docker system prune -a
```

### ลบเฉพาะ Development

```bash
# ลบ development containers (Full Stack)
docker-compose down

# ลบ development containers (Database Only)
docker-compose -f infra/docker/docker-compose.dev-db-only.yml down

# ลบ development volumes
docker volume rm docker_postgres_data docker_api_node_modules docker_api_app_node_modules docker_api_packages_node_modules docker_admin_node_modules docker_admin_app_node_modules docker_admin_packages_node_modules docker_frontend_node_modules docker_frontend_app_node_modules docker_frontend_packages_node_modules
```

## 🔍 Troubleshooting

### ปัญหาที่พบบ่อย

1. **Port conflicts**
   ```bash
   # ตรวจสอบ ports ที่ใช้งาน
   netstat -tulpn | grep :3000
   ```

2. **Database connection issues**
   ```bash
   # ตรวจสอบ database logs
   docker-compose logs postgres
   ```

3. **Build failures**
   ```bash
   # ลบ images เก่าและ rebuild
   docker-compose down
   docker system prune -f
   docker-compose up -d --build
   ```

4. **Permission issues**
   ```bash
   # เปลี่ยน ownership ของ storage folder
   sudo chown -R $USER:$USER ../../storage
   ```

5. **Hot reload ไม่ทำงาน**
   ```bash
   # ตรวจสอบ volumes mount
   docker-compose exec api ls -la /app
   
   # ตรวจสอบ file permissions
   docker-compose exec api ls -la /app/apps/api/src
   ```

### Debug Commands

```bash
# เข้าไปใน container
docker-compose exec api sh
docker-compose exec postgres psql -U postgres

# ดู resource usage
docker stats

# ดู network
docker network ls
docker network inspect docker_default

# ตรวจสอบ volumes
docker volume ls
docker volume inspect docker_postgres_data

# ตรวจสอบ build context
docker-compose config
```

## 📋 Best Practices

1. **ใช้ .env files** สำหรับ environment variables
2. **ไม่ commit .env files** ลงใน Git
3. **ใช้ health checks** สำหรับ production
4. **ตั้งค่า resource limits** สำหรับ production
5. **ใช้ volumes** สำหรับ persistent data
6. **ทำ backup** ข้อมูลเป็นประจำ
7. **ใช้ networks** เพื่อแยก services
8. **ตั้งค่า logging** ให้เหมาะสม
9. **ใช้ Database Only mode** สำหรับ development (hot reload เร็วที่สุด)
10. **Mount ทั้ง monorepo** สำหรับ hot reload กับ shared packages
11. **แยก node_modules volumes** เพื่อไม่ให้ถูก overwrite

## 🔗 ลิงก์ที่เป็นประโยชน์

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Node.js Docker Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
