# System Overview

High-level architecture of the Issue Collector Platform.

## System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Public Web    │     │  Admin Dashboard│     │   Mobile SDK    │
│   (Next.js)     │     │   (Next.js)     │     │   (Future)      │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Express.js API        │
                    │   (TypeScript)          │
                    └────────────┬────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌────────▼────────┐    ┌─────────▼─────────┐   ┌────────▼────────┐
│   PostgreSQL    │    │      Redis        │   │  S3 Storage     │
│   (Database)    │    │     (Cache)       │   │  (Files)        │
└─────────────────┘    └───────────────────┘   └─────────────────┘
```

## Application Layers

### 1. Presentation Layer

**Public Frontend** (`apps/frontend/`)
- Next.js 15 application
- Public-facing issue collection interface
- Responsive design
- SEO optimized

**Admin Dashboard** (`apps/admin/`)
- Next.js 15 application
- TailAdmin theme
- Role-based access control
- Real-time updates

### 2. API Layer

**Express.js API** (`apps/api/`)
- RESTful API design
- JWT authentication
- Role-based authorization
- Request validation
- Error handling

### 3. Business Logic Layer

**Services** (`apps/api/src/modules/`)
- Feature-based modules
- Business logic separation
- Data transformation
- External service integration

### 4. Data Layer

**Database** (`infra/database/`)
- PostgreSQL database
- Prisma ORM
- Schema migrations
- Seed data

**Cache** (Redis)
- Session storage
- API response caching
- Rate limiting

**Storage**
- Local filesystem (development)
- S3-compatible storage (production)

## Data Flow

### Issue Submission Flow

```
1. User submits issue via Public Frontend
   ↓
2. Frontend sends POST /api/public/v1/issues
   ↓
3. API validates request
   ↓
4. Service processes issue
   ↓
5. Data saved to PostgreSQL
   ↓
6. Response returned to frontend
   ↓
7. User sees confirmation
```

### Admin Dashboard Flow

```
1. Admin logs in via Admin Dashboard
   ↓
2. Frontend sends POST /api/admin/v1/auth/login
   ↓
3. API validates credentials
   ↓
4. JWT token generated
   ↓
5. Token stored in browser
   ↓
6. Subsequent requests include token
   ↓
7. API validates token and permissions
   ↓
8. Data returned to dashboard
```

## Security Architecture

### Authentication
- JWT-based authentication
- Token expiration (7 days default)
- Refresh token support

### Authorization
- Role-based access control (RBAC)
- Permission-based actions
- Module-scoped permissions

### Data Protection
- Input validation
- SQL injection prevention (Prisma)
- XSS protection
- CSRF protection
- Rate limiting

## Scalability

### Horizontal Scaling
- Stateless API design
- Load balancer support
- Multiple API instances
- Shared Redis cache
- Shared database

### Performance Optimization
- Database query optimization
- Redis caching
- CDN for static assets
- Image optimization

## Deployment Architecture

### Development
- Local PostgreSQL and Redis
- Docker for optional services (MinIO)
- Hot reload for development

### Production
- Docker containers
- Harbor registry
- Nginx reverse proxy
- SSL/TLS encryption
- Monitoring and logging

## Related Documentation

- [API Design](./api-design.md) - API architecture details
- [Database Design](./database-design.md) - Database schema
- [Deployment](../deployment/) - Deployment guides

