# Database Design

Database schema and design for the Issue Collector Platform.

## Database Technology

- **Database**: PostgreSQL
- **ORM**: Prisma
- **Migrations**: Prisma Migrate

## Schema Location

Database schema files are located in `infra/database/prisma/schema/`:

- `schema.prisma` - Base configuration
- `user.prisma` - User model
- `role.prisma` - Role model
- `permission.prisma` - Permission model
- `project.prisma` - Project and ProjectEnvironment models (IC-1)
- Additional models as needed

## Core Models

### User

```prisma
model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  email     String?  @unique
  name      String?
  password  String
  status    Boolean  @default(true)
  roleId    Int?
  role      Role?    @relation(fields: [roleId], references: [id])
  loginAt   DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Role

```prisma
model Role {
  id          Int          @id @default(autoincrement())
  name        String
  description String?
  scope       String       // "admin" or "public"
  users       User[]
  permissions RolePermission[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}
```

### Permission

```prisma
model Permission {
  id          Int            @id @default(autoincrement())
  module      String
  action      String
  type        String         // "admin" or "public"
  roles       RolePermission[]
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
}
```

### RolePermission (Junction Table)

```prisma
model RolePermission {
  id           Int        @id @default(autoincrement())
  roleId       Int
  permissionId Int
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  createdAt    DateTime   @default(now())

  @@unique([roleId, permissionId])
}
```

### Project (IC-1)

Represents a registered project for issue collection.

```prisma
model Project {
  id            Int                  @id @default(autoincrement())
  name          String
  description   String?
  publicKey     String               @unique
  privateKey    String               @unique
  status        Boolean              @default(true)
  allowedDomains Json                // Array of allowed domains
  deletedAt     DateTime?            @map("deleted_at")
  createdAt     DateTime             @default(now()) @map("created_at")
  updatedAt     DateTime             @updatedAt @map("updated_at")
  environments  ProjectEnvironment[]

  @@map("projects")
}
```

**Fields:**

- `id` - Unique project identifier
- `name` - Project name (required, max 255 characters)
- `description` - Optional project description (max 1000 characters)
- `publicKey` - Public API key (auto-generated, format: `proj_pub_<32 hex chars>`)
- `privateKey` - Private API key (auto-generated, format: `proj_priv_<32 hex chars>`)
- `status` - Project active status (default: `true`)
- `allowedDomains` - JSON array of allowed domains
  - Supports exact domains: `app.example.com`
  - Supports wildcards: `*.example.com`
- `deletedAt` - Soft delete timestamp (null if active)
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp
- `environments` - Related environments (one-to-many)

**Key Generation:**

Keys are automatically generated using cryptographically secure random bytes:
- Public key prefix: `proj_pub_`
- Private key prefix: `proj_priv_`
- Both keys are 32 hex characters (16 bytes)

### ProjectEnvironment (IC-1)

Represents environment-specific configuration for a project.

```prisma
model ProjectEnvironment {
  id            Int      @id @default(autoincrement())
  projectId     Int      @map("project_id")
  name          String   // dev, stage, prod, test, etc.
  apiUrl        String?  @map("api_url")
  allowedOrigins Json?   @map("allowed_origins")
  isActive      Boolean  @default(true) @map("is_active")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  project       Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@unique([projectId, name])
  @@map("project_environments")
}
```

**Fields:**

- `id` - Unique environment identifier
- `projectId` - Foreign key to Project
- `name` - Environment name (required, enum: `dev`, `staging`, `prod`, `test`, `development`, `production`)
- `apiUrl` - Optional API URL for this environment
- `allowedOrigins` - Optional JSON array of allowed origins
- `isActive` - Environment active status (default: `true`)
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp
- `project` - Related project (many-to-one)

**Constraints:**

- Unique constraint on `[projectId, name]` ensures no duplicate environment names per project
- Cascade delete: when a project is deleted, all its environments are deleted

## Relationships

### User ↔ Role
- Many-to-One relationship
- User can have one role (optional)
- Role can have many users

### Role ↔ Permission
- Many-to-Many relationship
- Role can have many permissions
- Permission can belong to many roles
- Junction table: `RolePermission`

### Project ↔ ProjectEnvironment
- One-to-Many relationship
- Project can have many environments
- Environment belongs to one project
- Cascade delete: deleting a project deletes all its environments

## Indexes

### Performance Indexes

```prisma
model User {
  // Indexes for common queries
  @@index([username])
  @@index([email])
  @@index([status])
  @@index([roleId])
  @@index([createdAt])
}

model Project {
  // Indexes for common queries
  @@index([name])
  @@index([status])
  @@index([publicKey])
  @@index([deletedAt])
  @@index([createdAt])
}

model ProjectEnvironment {
  // Indexes for common queries
  @@index([projectId])
  @@index([name])
  @@index([isActive])
}
```

## Migrations

### Creating Migrations

```bash
cd infra/database
pnpm prisma migrate dev --name migration_name
```

### Applying Migrations

**Development:**
```bash
pnpm prisma migrate dev
```

**Production:**
```bash
pnpm prisma migrate deploy
```

### Migration Files

Migrations are stored in `infra/database/prisma/migrations/`:
```
migrations/
├── 20240101000000_init/
│   └── migration.sql
└── 20240102000000_add_user_table/
    └── migration.sql
```

## Seed Data

Seed scripts are located in `infra/database/prisma/seeds/`:

- `01-core-data.ts` - Core roles and permissions
- `02-admin-user.ts` - Default admin user

### Running Seeds

```bash
cd infra/database
pnpm prisma db seed
```

## Database Conventions

### Naming Conventions

- **Tables**: PascalCase, singular (`User`, `Role`)
- **Columns**: camelCase (`createdAt`, `updatedAt`)
- **Foreign Keys**: `[model]Id` (e.g., `roleId`, `userId`)
- **Junction Tables**: `[Model1][Model2]` (e.g., `RolePermission`)

### Timestamps

All models include:
- `createdAt` - Record creation timestamp
- `updatedAt` - Last update timestamp

### Soft Deletes

For models that need soft delete:
```prisma
model User {
  deletedAt DateTime?
  
  @@index([deletedAt])
}
```

## Query Optimization

### Eager Loading

Use Prisma `include` to avoid N+1 queries:

```typescript
const users = await db.user.findMany({
  include: {
    role: {
      include: {
        permissions: true
      }
    }
  }
})
```

### Pagination

Always use pagination for list queries:

```typescript
const users = await db.user.findMany({
  skip: (page - 1) * limit,
  take: limit
})
```

## Related Documentation

- [System Overview](./overview.md) - System architecture
- [API Design](./api-design.md) - API architecture
- [Development Setup](../development/setup.md) - Setup guide

