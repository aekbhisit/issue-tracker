# Database Package

Shared Prisma database configuration and schemas for the workspace.

## Schema Organization

This package uses **Prisma Multi-File Schema** feature, allowing schemas to be split across multiple files:

```
prisma/
├── schema/
│   └── user.prisma      # User, Role, Permission models
├── migrations/          # Database migrations
├── seeds/               # Seed data files
│   ├── permissions.seed.ts
│   ├── roles.seed.ts
│   ├── users.seed.ts
│   └── seed.ts
└── schema.prisma        # Base configuration (generator & datasource)
```

## Benefits

✅ **Better Organization**: Models grouped by domain/feature
✅ **Easier Maintenance**: Smaller files, easier to navigate
✅ **Reduced Conflicts**: Multiple developers can work on different schema files
✅ **Clear Separation**: Logical grouping of related models

## Available Scripts

### Generate Prisma Client
```bash
pnpm db:generate
```

### Create Migration
```bash
pnpm db:migrate
# or with name
pnpm db:migrate --name add_user_table
```

### Apply Migrations (Production)
```bash
pnpm db:migrate:deploy
```

### Push Schema to Database (Development)
```bash
pnpm db:push
```

### Open Prisma Studio
```bash
pnpm db:studio
```

### Seed Database
```bash
pnpm db:seed
```

### Reset Database
```bash
pnpm db:reset
```

## Adding New Models

1. Create a new `.prisma` file in `prisma/schema/`:
   ```prisma
   // prisma/schema/order.prisma
   
   // Order Management Models
   
   model Order {
     id        Int      @id @default(autoincrement())
     // ... fields
     @@map("orders")
   }
   ```

2. Generate Prisma Client:
   ```bash
   pnpm db:generate
   ```

3. Create migration:
   ```bash
   pnpm db:migrate --name add_order_models
   ```

## Environment Variables

Create `.env` file in this directory:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

## Seed Data

Default seed creates:
- 28 Permissions
- 4 Roles (Super Admin, Admin, User, Viewer)  
- 1 Super Admin user (admin@admin.com / admin)

To customize seed data, edit files in `prisma/seeds/`.

## Notes

- The `schema.prisma` file should only contain `generator` and `datasource` blocks
- All models should be defined in separate `.prisma` files
- Prisma automatically loads all `.prisma` files from the `prisma/schema/` directory

