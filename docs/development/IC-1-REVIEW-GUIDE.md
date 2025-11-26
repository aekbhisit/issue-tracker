# IC-1 Project Registration System - Review Guide

This guide helps you review and test the IC-1 implementation.

## 📋 Pre-Review Checklist

### 1. Database Migration

First, ensure the database migration is created and applied:

```bash
# Navigate to database directory
cd infra/database

# Create migration (if not already created)
pnpm prisma migrate dev --schema=./prisma/schema.prisma --name add_project_models

# Or apply existing migrations
pnpm prisma migrate deploy --schema=./prisma/schema.prisma

# Generate Prisma client
pnpm prisma generate --schema=./prisma/schema.prisma
```

**Expected Result:**
- Migration file created in `infra/database/prisma/migrations/`
- Tables `projects` and `project_environments` created in database
- Prisma client regenerated with Project models

### 2. Verify Schema Files

Check that the schema files exist:

```bash
# Check project schema file
ls -la infra/database/prisma/schema/project.prisma

# Verify schema is included
grep -r "project.prisma" infra/database/prisma/schema.prisma
```

## 🔍 Code Review Checklist

### Backend Files

#### 1. Database Schema
- [ ] `infra/database/prisma/schema/project.prisma`
  - Project model with all required fields
  - ProjectEnvironment model with proper relations
  - Unique constraints on keys and environment names

#### 2. Shared Types
- [ ] `packages/types/src/project.types.ts`
  - All TypeScript interfaces defined
  - Matches Prisma schema structure
  - Exported in `packages/types/src/index.ts`

#### 3. Backend Service
- [ ] `apps/api/src/modules/project/project.service.ts`
  - CRUD operations implemented
  - Key generation logic (crypto.randomBytes)
  - Environment management methods
  - Activity logging integration
  - Error handling (NotFoundError, ConflictError, etc.)

#### 4. Validation
- [ ] `apps/api/src/modules/project/project.validation.ts`
  - Domain validation (exact and wildcard)
  - Environment name validation
  - All required fields validated
  - Proper error messages

#### 5. Controller
- [ ] `apps/api/src/modules/project/project.controller.ts`
  - All HTTP handlers implemented
  - Proper error handling
  - Uses service layer correctly

#### 6. Routes
- [ ] `apps/api/src/modules/project/routes/admin.routes.ts`
  - All routes defined
  - Permission middleware applied
  - Validation middleware applied
- [ ] `apps/api/src/routes/admin/v1/index.ts`
  - Project routes registered at `/projects`

### Frontend Files

#### 7. Admin Types
- [ ] `apps/admin/app/admin/projects/types.ts`
  - All interfaces match API responses
  - Form data types defined

#### 8. API Client
- [ ] `apps/admin/lib/api/projects.ts`
  - All CRUD methods implemented
  - Environment management methods
  - Proper error handling
  - Exported in `apps/admin/lib/api/index.ts`

#### 9. Table Components
- [ ] `apps/admin/app/admin/projects/components/ProjectTable.tsx`
  - TanStack React Table integration
  - Pagination, sorting, filtering
- [ ] `apps/admin/app/admin/projects/components/ProjectTableColumns.tsx`
  - All columns defined
  - Actions (edit, delete, toggle status)
- [ ] `apps/admin/app/admin/projects/components/ProjectToolbar.tsx`
  - Search functionality
  - Status filter
  - Create button

#### 10. Form Component
- [ ] `apps/admin/app/admin/projects/components/ProjectForm.tsx`
  - Form validation
  - Domain management (add/remove)
  - Environment management (add/edit/remove)
  - Key display in edit mode

#### 11. Pages
- [ ] `apps/admin/app/admin/projects/page.tsx`
  - List page with full CRUD
  - Permission checks
  - Error handling
- [ ] `apps/admin/app/admin/projects/form/page.tsx`
  - Create page
- [ ] `apps/admin/app/admin/projects/[id]/page.tsx`
  - Edit page

### Documentation

#### 12. API Documentation
- [ ] `docs/api/admin/projects.md`
  - All endpoints documented
  - Request/response examples
  - Error responses

#### 13. Database Documentation
- [ ] `docs/architecture/database-design.md`
  - Project models documented
  - Relationships explained

## 🧪 Testing Guide

### 1. Start Development Servers

**Terminal 1 - API Server:**
```bash
cd apps/api
pnpm dev
```

**Terminal 2 - Admin Dashboard:**
```bash
cd apps/admin
pnpm dev
```

**Expected:**
- API server running on `http://localhost:4501` (or configured port)
- Admin dashboard on `http://localhost:4502` (or configured port)

### 2. Test API Endpoints

#### Health Check
```bash
curl http://localhost:4501/health
```

#### Login to Get Token
```bash
curl -X POST http://localhost:4501/api/admin/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your-password"
  }'
```

Save the `token` from response.

#### Create Project
```bash
curl -X POST http://localhost:4501/api/admin/v1/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Project",
    "description": "Test project description",
    "allowedDomains": ["app.example.com", "*.example.com"],
    "status": true
  }'
```

**Expected Response:**
- Status: 201 Created
- Response includes `publicKey` and `privateKey`
- Project data returned

#### List Projects
```bash
curl http://localhost:4501/api/admin/v1/projects?page=1&limit=10 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
- Status: 200 OK
- Paginated list of projects
- Includes environments if any

#### Get Project by ID
```bash
curl http://localhost:4501/api/admin/v1/projects/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Update Project
```bash
curl -X PATCH http://localhost:4501/api/admin/v1/projects/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Updated Project Name",
    "status": false
  }'
```

#### Add Environment
```bash
curl -X POST http://localhost:4501/api/admin/v1/projects/1/environments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "prod",
    "apiUrl": "https://api.example.com",
    "allowedOrigins": ["https://app.example.com"],
    "isActive": true
  }'
```

#### Delete Project (Soft Delete)
```bash
curl -X DELETE http://localhost:4501/api/admin/v1/projects/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Test Admin UI

#### Access Admin Dashboard
1. Navigate to `http://localhost:4502/admin`
2. Login with admin credentials
3. Navigate to **Projects** in sidebar

#### Test Project List Page
- [ ] Projects table displays correctly
- [ ] Pagination works
- [ ] Sorting works (click column headers)
- [ ] Search functionality works
- [ ] Status filter works
- [ ] Edit button navigates to edit page
- [ ] Delete button shows confirmation modal
- [ ] Status toggle works

#### Test Create Project Page
1. Click "Create Project" button
2. Fill in form:
   - Project name: "My Test Project"
   - Description: "Test description"
   - Add domains: `app.example.com`, `*.example.com`
   - Status: Active
3. Add environment:
   - Name: `prod`
   - API URL: `https://api.example.com`
   - Status: Active
4. Click "Create Project"

**Expected:**
- Form validates correctly
- Domain validation works (try invalid domain)
- Environment validation works
- Project created successfully
- Redirected to edit page

#### Test Edit Project Page
1. Click edit on any project
2. Verify:
   - [ ] Form pre-filled with project data
   - [ ] Public/Private keys displayed in sidebar
   - [ ] Copy buttons work for keys
   - [ ] Can update project details
   - [ ] Can add/edit/remove environments
   - [ ] Can add/remove domains
   - [ ] Changes save correctly

#### Test Domain Validation
Try adding invalid domains:
- [ ] `invalid` (should fail)
- [ ] `*.` (should fail)
- [ ] `example` (should fail)
- [ ] `app.example.com` (should succeed)
- [ ] `*.example.com` (should succeed)

#### Test Environment Management
- [ ] Can add multiple environments
- [ ] Cannot add duplicate environment names
- [ ] Can edit environment
- [ ] Can remove environment
- [ ] Environment validation works (try invalid name)

### 4. Test Error Handling

#### Test Validation Errors
```bash
# Missing required field
curl -X POST http://localhost:4501/api/admin/v1/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "description": "Missing name"
  }'
```

**Expected:** 422 Validation Error

#### Test Not Found
```bash
curl http://localhost:4501/api/admin/v1/projects/99999 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** 404 Not Found

#### Test Unauthorized
```bash
curl http://localhost:4501/api/admin/v1/projects
```

**Expected:** 401 Unauthorized

## 🔍 Code Quality Checks

### 1. Linting
```bash
# Check API linting
cd apps/api
pnpm lint

# Check Admin linting
cd apps/admin
pnpm lint

# Check types linting
cd packages/types
pnpm lint
```

### 2. Type Checking
```bash
# Check API types
cd apps/api
pnpm typecheck

# Check Admin types
cd apps/admin
pnpm typecheck
```

### 3. Build Check
```bash
# Build API
cd apps/api
pnpm build

# Build Admin
cd apps/admin
pnpm build
```

## 📊 Database Verification

### Check Tables Exist
```bash
cd infra/database
pnpm prisma studio
```

Or using SQL:
```sql
-- Check projects table
SELECT * FROM projects LIMIT 5;

-- Check project_environments table
SELECT * FROM project_environments LIMIT 5;

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('projects', 'project_environments');
```

### Verify Constraints
```sql
-- Check unique constraints
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid IN (
  'projects'::regclass, 
  'project_environments'::regclass
);
```

## 🐛 Common Issues & Solutions

### Issue: Migration Fails
**Solution:** Check DATABASE_URL in `.env` file
```bash
cd infra/database
cat .env | grep DATABASE_URL
```

### Issue: Prisma Client Not Generated
**Solution:** Regenerate client
```bash
cd infra/database
pnpm prisma generate --schema=./prisma/schema.prisma
```

### Issue: API Routes Not Found
**Solution:** Check route registration
```bash
# Verify routes are registered
grep -r "projects" apps/api/src/routes/admin/v1/index.ts
```

### Issue: Admin UI Not Loading
**Solution:** Check API client configuration
```bash
# Verify API base URL
grep -r "apiClient" apps/admin/lib/api/client.ts
```

## ✅ Final Checklist

- [ ] All backend files created and working
- [ ] All frontend files created and working
- [ ] Database migration applied successfully
- [ ] API endpoints tested and working
- [ ] Admin UI tested and working
- [ ] Documentation updated
- [ ] No linting errors
- [ ] No type errors
- [ ] Build succeeds
- [ ] Error handling works correctly
- [ ] Permission checks work correctly

## 📝 Review Notes Template

Use this template to document your review:

```markdown
## IC-1 Review - [Date]

### Backend Review
- [ ] Database schema: ✅ / ❌
- [ ] Service layer: ✅ / ❌
- [ ] Validation: ✅ / ❌
- [ ] Controller: ✅ / ❌
- [ ] Routes: ✅ / ❌

### Frontend Review
- [ ] Types: ✅ / ❌
- [ ] API Client: ✅ / ❌
- [ ] Components: ✅ / ❌
- [ ] Pages: ✅ / ❌

### Testing
- [ ] API Endpoints: ✅ / ❌
- [ ] Admin UI: ✅ / ❌
- [ ] Error Handling: ✅ / ❌

### Issues Found
1. [Issue description]
2. [Issue description]

### Notes
[Additional notes]
```

## 🎯 Next Steps

After successful review:

1. **Run Database Migration** (if not done)
2. **Test All Features** using the guide above
3. **Document Any Issues** found
4. **Fix Any Bugs** discovered
5. **Update Documentation** if needed
6. **Proceed to IC-2** when ready

---

For questions or issues, refer to:
- [API Documentation](../../api/admin/projects.md)
- [Database Design](../../architecture/database-design.md)
- [Development Setup](./setup.md)

