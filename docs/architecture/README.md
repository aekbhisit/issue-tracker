# Architecture Documentation

System architecture and design documentation for the Issue Collector Platform.

## Overview

The Issue Collector Platform is a monorepo-based application built with:

- **Backend**: Express.js API with TypeScript
- **Admin Dashboard**: Next.js 15 with TailAdmin theme
- **Public Frontend**: Next.js 15
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Storage**: Local filesystem or S3-compatible storage

## Architecture Documents

- **[System Overview](./overview.md)** - High-level system architecture
- **[API Design](./api-design.md)** - API architecture and design principles
- **[Database Design](./database-design.md)** - Database schema and relationships

## Monorepo Structure

```
nd-issue-tracker/
├── apps/
│   ├── api/          # Express.js backend
│   ├── admin/        # Next.js admin dashboard
│   └── frontend/     # Next.js public frontend
├── packages/
│   ├── config/       # Shared configuration
│   ├── types/        # TypeScript types
│   ├── utils/        # Shared utilities
│   └── locales/      # i18n translations
├── infra/
│   ├── database/     # Prisma schema and migrations
│   ├── docker/       # Docker configurations
│   └── nginx/        # Nginx configuration
└── docs/             # Documentation
```

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Validation**: Zod
- **Authentication**: JWT

### Frontend
- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Theme**: TailAdmin
- **State Management**: React Query
- **Tables**: TanStack React Table

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Database**: PostgreSQL
- **Cache**: Redis
- **Storage**: Local filesystem / S3

## Design Principles

1. **Modular Architecture**: Feature-based modules
2. **Type Safety**: TypeScript throughout
3. **Code Reusability**: Shared packages for common code
4. **Scalability**: Horizontal scaling support
5. **Security**: JWT authentication, role-based access control
6. **Performance**: Caching, optimized queries

## Related Documentation

- [Development Setup](../development/setup.md) - Development environment setup
- [API Documentation](../api/) - API endpoints documentation
- [Deployment](../deployment/) - Deployment guides

