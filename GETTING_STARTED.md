# Getting Started

## 🚀 Quick Start Guide

### Prerequisites

Before you begin, ensure you have:
- ✅ **Node.js** >= 18.0.0
- ✅ **pnpm** >= 8.0.0
- ✅ **Docker** & **Docker Compose**

### Step 1: Install Dependencies

```bash
pnpm install
```

This will install all dependencies for all packages and apps.

### Step 2: Start Infrastructure Services

```bash
# Start PostgreSQL, Redis, and MinIO
docker-compose up -d postgres redis minio
```

**Services:**
- **PostgreSQL**: Database for storing issues, projects, and metadata
- **Redis**: Cache and queue backend for BullMQ
- **MinIO**: S3-compatible object storage for screenshots and logs

### Step 3: Database Setup

```bash
# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate:dev

# (Optional) Seed initial data
pnpm db:seed
```

### Step 4: Start Development Servers

```bash
# Start all apps
pnpm dev
```

Or start individually:
```bash
pnpm dev:api      # API server only
pnpm dev:admin    # Admin dashboard only
pnpm dev:frontend # Frontend only (if applicable)
```

### Step 5: Access Applications

Open your browser and navigate to:

- 🌐 **API Server**: http://localhost:3000
- 🔐 **Admin Dashboard**: http://localhost:3001
- 📊 **Prisma Studio**: Run `pnpm db:studio`

---

## 🛠️ Development Commands

### Development
```bash
pnpm dev              # Run all apps
pnpm dev:api          # API only
pnpm dev:admin        # Admin only
pnpm dev:frontend      # Frontend only
```

### Database
```bash
pnpm db:generate      # Generate Prisma client
pnpm db:migrate:dev   # Create & apply migration
pnpm db:push          # Push schema (dev only)
pnpm db:studio        # Open Prisma Studio
pnpm db:seed          # Seed database
pnpm db:reset         # Reset database
```

### Docker
```bash
pnpm docker:up        # Start all containers
pnpm docker:down      # Stop all containers
pnpm docker:logs      # View logs
pnpm docker:ps        # List containers
pnpm docker:restart   # Restart all
```

### Code Quality
```bash
pnpm lint             # Lint all code
pnpm lint:fix         # Lint and fix
pnpm format           # Format code
pnpm format:check     # Check formatting
pnpm typecheck        # Type check
```

### Build
```bash
pnpm build            # Build all apps
pnpm build:api        # Build API only
pnpm build:admin      # Build Admin only
pnpm build:frontend   # Build Frontend only
```

---

## 🐛 Troubleshooting

### Port Already in Use

If you see port conflict errors:

```bash
# Find process using port (Mac/Linux)
lsof -i :3000

# Find process using port (Windows)
netstat -ano | findstr :3000

# Then kill the process or change port in .env
```

### Module Not Found

```bash
# Reinstall dependencies
pnpm install

# Generate Prisma client
pnpm db:generate
```

### Docker Issues

```bash
# View logs
docker-compose logs [service_name]

# Restart service
docker-compose restart [service_name]

# Clean restart
docker-compose down -v
docker-compose up -d
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

---

## 📚 Next Steps

1. **Read Documentation**
   - [Project Structure](./PROJECT_STRUCTURE.md)
   - [Coding Rules](./RULES.md)
   - [Issue Collector Overview](./plan/idea/issue_collector_project_overview_and_phases.txt)

2. **Understand the Architecture**
   - Review the [Issue Collector Overview](./plan/idea/issue_collector_project_overview_and_phases.txt)
   - Check phase documentation in `plan/idea/` directory

3. **Start Development**
   - Follow the development phases (IC-0 to IC-10)
   - Current phase: IC-0 (Foundation & Environment Setup)

---

## 🎯 Development Phases

The Issue Collector Platform follows a phased development approach:

- **IC-0**: Foundation & Environment Setup ✅ (Current)
- **IC-1**: Project Registration System
- **IC-2**: Collector SDK (Basic)
- **IC-3**: Inspect Mode + Screenshot Capture
- **IC-4**: Log & Error Capture
- **IC-5**: Issue Collector API & Database
- **IC-6**: Issue Dashboard
- **IC-7**: Notifications & Integrations
- **IC-8**: Browser Extension (Optional)
- **IC-9**: AI Triage Engine
- **IC-10**: Heatmap / Session Replay / Rage Click (Future)

See [Issue Collector Overview](./plan/idea/issue_collector_project_overview_and_phases.txt) for detailed phase descriptions.

---

## 💡 Tips

- Use **Docker for infrastructure** (PostgreSQL, Redis, MinIO) and **local development** for apps for fast hot reload
- Use **Prisma Studio** (`pnpm db:studio`) to view/edit database
- Check **Turborepo cache** with `.turbo/` folder
- Use **pnpm** commands from root for all apps
- Review phase documentation before starting new features

---

**Happy Coding!** 🎉
