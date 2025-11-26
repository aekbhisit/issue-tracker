# IC-5 Testing Scripts

This directory contains automated test scripts for verifying IC-5 Issue Collector API & Database implementation.

## Prerequisites

Before running the tests, ensure:

1. **API server is running**
   ```bash
   pnpm dev:api
   # Or: pnpm dev:all
   ```

2. **Admin dashboard is running** (for UI tests)
   ```bash
   pnpm dev:admin
   # Or: pnpm dev:all
   ```

3. **Database is accessible**
   - Ensure `DATABASE_URL` is set in `infra/database/.env`
   - Or export `DATABASE_URL` environment variable

4. **Test project exists**
   - Create a project via admin dashboard: `http://localhost:4502/admin/projects`
   - Note the `publicKey` (starts with `proj_`)

5. **Admin credentials available**
   - Default: `admin` / `password`
   - Or use your admin credentials

## Test Scripts

### 1. Database Verification
**Script**: `verify-database.sh`

**Purpose**: Verifies database schema, tables, relations, indexes, and constraints

**Usage**:
```bash
cd tests/ic5
./verify-database.sh
```

**Requirements**: 
- `DATABASE_URL` environment variable or `infra/database/.env` file
- PostgreSQL client (`psql`) accessible

**What it tests**:
- Tables exist (`issues`, `issue_screenshots`, `issue_logs`)
- Table columns are correct
- Foreign key constraints
- Indexes
- Data types
- Cascade delete

---

### 2. Public API Testing
**Script**: `test-public-api.sh`

**Purpose**: Tests public API endpoints for issue submission

**Usage**:
```bash
cd tests/ic5
./test-public-api.sh proj_your_key_here [origin]
```

**Parameters**:
- `proj_your_key_here`: Project public key (required)
- `origin`: Origin header value (optional, default: `http://localhost:3000`)

**What it tests**:
- Basic issue submission
- Issue submission with screenshot
- Issue submission with logs
- Invalid project key rejection
- Missing required fields validation
- Invalid severity validation
- CORS headers

**Example**:
```bash
./test-public-api.sh proj_abc123xyz http://localhost:3000
```

---

### 3. Admin API Testing
**Script**: `test-admin-api.sh`

**Purpose**: Tests admin API endpoints for issue management

**Usage**:
```bash
cd tests/ic5
./test-admin-api.sh [admin_username] [admin_password]
```

**Parameters**:
- `admin_username`: Admin username (optional, default: `admin`)
- `admin_password`: Admin password (optional, default: `password`)

**What it tests**:
- Admin authentication
- List issues (with all filters)
- Get issue by ID
- Update issue status
- Update issue assignee
- Update issue description
- Error cases (invalid ID, invalid status, unauthorized)

**Example**:
```bash
./test-admin-api.sh admin password
```

---

### 4. Storage Testing
**Script**: `test-storage.sh`

**Purpose**: Tests screenshot storage functionality

**Usage**:
```bash
cd tests/ic5
./test-storage.sh proj_your_key_here [admin_username] [admin_password]
```

**Parameters**:
- `proj_your_key_here`: Project public key (required)
- `admin_username`: Admin username (optional, default: `admin`)
- `admin_password`: Admin password (optional, default: `password`)

**What it tests**:
- Screenshot submission
- Screenshot storage (local or S3)
- Screenshot URL generation
- Screenshot file accessibility
- Storage path format
- S3 storage (if configured)

**Example**:
```bash
./test-storage.sh proj_abc123xyz admin password
```

---

### 5. Integration Testing
**Script**: `test-integration.sh`

**Purpose**: End-to-end integration testing (SDK → API → Database → Admin UI)

**Usage**:
```bash
cd tests/ic5
./test-integration.sh proj_your_key_here [admin_username] [admin_password]
```

**Parameters**:
- `proj_your_key_here`: Project public key (required)
- `admin_username`: Admin username (optional, default: `admin`)
- `admin_password`: Admin password (optional, default: `password`)

**What it tests**:
- Issue submission via public API
- Issue retrieval via admin API
- Issue appears in list
- Status update
- Screenshot storage verification
- Logs storage verification

**Example**:
```bash
./test-integration.sh proj_abc123xyz admin password
```

---

### 6. Performance Testing
**Script**: `test-performance.sh`

**Purpose**: Performance benchmarking

**Usage**:
```bash
cd tests/ic5
./test-performance.sh proj_your_key_here [admin_username] [admin_password] [num_issues]
```

**Parameters**:
- `proj_your_key_here`: Project public key (required)
- `admin_username`: Admin username (optional, default: `admin`)
- `admin_password`: Admin password (optional, default: `password`)
- `num_issues`: Number of issues to create (optional, default: `10`)

**What it tests**:
- Issue creation performance
- List issues performance
- Filter performance
- Pagination performance
- Search performance
- Get issue by ID performance

**Example**:
```bash
./test-performance.sh proj_abc123xyz admin password 50
```

---

### 7. Test Data Setup
**Script**: `setup-test-data.sh`

**Purpose**: Creates test data for comprehensive testing

**Usage**:
```bash
cd tests/ic5
./setup-test-data.sh proj_your_key_here [admin_username] [admin_password]
```

**Parameters**:
- `proj_your_key_here`: Project public key (required)
- `admin_username`: Admin username (optional, default: `admin`)
- `admin_password`: Admin password (optional, default: `password`)

**What it creates**:
- Issues with all severity levels (low, medium, high, critical)
- Issues with all statuses (open, in_progress, resolved, closed)
- Issues with screenshots
- Issues with logs
- Issues with both screenshots and logs

**Example**:
```bash
./setup-test-data.sh proj_abc123xyz admin password
```

---

## Quick Start Testing

### Step 1: Setup Test Data
```bash
cd tests/ic5
./setup-test-data.sh proj_your_key_here
```

### Step 2: Run All Tests
```bash
# Database verification
./verify-database.sh

# Public API tests
./test-public-api.sh proj_your_key_here

# Admin API tests
./test-admin-api.sh admin password

# Storage tests
./test-storage.sh proj_your_key_here admin password

# Integration tests
./test-integration.sh proj_your_key_here admin password

# Performance tests
./test-performance.sh proj_your_key_here admin password 20
```

### Step 3: Record Results
Open `TEST-RESULTS.md` and fill in the test results.

---

## Test Results Template

Use `TEST-RESULTS.md` to record manual test results. The template includes:

- Test execution date and tester information
- Checklist for each test phase
- Space for notes and observations
- Overall status and sign-off

---

## Troubleshooting

### Issue: Scripts not executable
```bash
chmod +x tests/ic5/*.sh
```

### Issue: DATABASE_URL not found
```bash
# Option 1: Export environment variable
export DATABASE_URL="postgresql://user:password@localhost:5432/database"

# Option 2: Ensure infra/database/.env exists
cd infra/database
cp .env.example .env
# Edit .env with your database credentials
```

### Issue: API server not responding
- Check if API server is running: `curl http://localhost:4501/health`
- Check API server logs for errors
- Verify port 4501 is not in use by another process

### Issue: Admin token not obtained
- Verify admin credentials are correct
- Check if admin user exists in database
- Check API server logs for authentication errors

### Issue: Project key invalid
- Get project key from admin dashboard: `http://localhost:4502/admin/projects`
- Ensure project status is active
- Verify project key format: `proj_...`

---

## Expected Test Results

### Database Verification
- All tables exist ✅
- All relations correct ✅
- All indexes created ✅

### Public API
- Basic submission: 201 Created ✅
- With screenshot: 201 Created ✅
- With logs: 201 Created ✅
- Invalid key: 401 Unauthorized ✅
- Validation errors: 422 Unprocessable Entity ✅

### Admin API
- List issues: 200 OK ✅
- Get issue: 200 OK ✅
- Update issue: 200 OK ✅
- Invalid ID: 404 Not Found ✅
- Unauthorized: 401 Unauthorized ✅

### Storage
- Screenshot saved ✅
- URL generated ✅
- File accessible ✅

### Integration
- End-to-end flow works ✅
- All data displays correctly ✅

### Performance
- Issue creation: < 500ms ✅
- List issues: < 500ms ✅
- Get issue: < 200ms ✅

---

## Notes

- All scripts output pass/fail status
- Scripts create temporary files in `/tmp/` for issue IDs and tokens
- Some tests require existing data (run `setup-test-data.sh` first)
- Performance benchmarks may vary based on hardware
- Some tests require specific environment setup (S3, Redis)

---

## Next Steps

After running all tests:

1. Review `TEST-RESULTS.md` and fill in any manual test results
2. Document any issues found
3. Fix any critical failures
4. Re-run tests to verify fixes
5. Sign off when all tests pass

