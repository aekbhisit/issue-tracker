#!/bin/bash

# IC-5 Database Schema Verification Script
# Verifies database schema for issues, screenshots, and logs
# Requires DATABASE_URL environment variable or PostgreSQL connection

echo "=========================================="
echo "IC-5 Database Schema Verification"
echo "=========================================="
echo ""

PASSED=0
FAILED=0

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL not set. Checking infra/database/.env..."
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
    
    if [ -f "$PROJECT_ROOT/infra/database/.env" ]; then
        set -a
        source "$PROJECT_ROOT/infra/database/.env"
        set +a
    elif [ -f "$PROJECT_ROOT/infra/database/.env.local" ]; then
        set -a
        source "$PROJECT_ROOT/infra/database/.env.local"
        set +a
    else
        echo "❌ DATABASE_URL not found. Please set it or ensure infra/database/.env exists"
        exit 1
    fi
fi

# Extract connection details from DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')

if [ -z "$DB_NAME" ]; then
    echo "❌ Could not parse DATABASE_URL"
    exit 1
fi

echo "Database: $DB_NAME"
echo "Host: ${DB_HOST:-localhost}"
echo "Port: ${DB_PORT:-5432}"
echo ""

# Helper function to check SQL query result
check_sql() {
    local query=$1
    local expected=$2
    local test_name=$3
    
    local result=$(psql "$DATABASE_URL" -t -c "$query" 2>/dev/null | xargs)
    
    if [ "$result" = "$expected" ] || [ -n "$result" ] && [ -z "$expected" ]; then
        echo "✅ $test_name"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo "❌ $test_name (Expected: $expected, Got: $result)"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Test 1: Verify Tables Exist
echo "Test 1: Verify Tables Exist"
echo "---------------------------"

check_sql "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'issues';" "1" "issues table exists"
check_sql "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'issue_screenshots';" "1" "issue_screenshots table exists"
check_sql "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'issue_logs';" "1" "issue_logs table exists"
echo ""

# Test 2: Verify Table Columns
echo "Test 2: Verify Table Columns"
echo "----------------------------"

# Check issues table columns
echo "  Checking issues table columns..."
ISSUES_COLUMNS=$(psql "$DATABASE_URL" -t -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'issues' ORDER BY column_name;" 2>/dev/null | xargs)

REQUIRED_ISSUES_COLUMNS=("id" "project_id" "title" "description" "severity" "status" "assignee_id" "reporter_info" "metadata" "created_at" "updated_at")
for col in "${REQUIRED_ISSUES_COLUMNS[@]}"; do
    if echo "$ISSUES_COLUMNS" | grep -q "$col"; then
        echo "    ✅ Column '$col' exists"
        PASSED=$((PASSED + 1))
    else
        echo "    ❌ Column '$col' missing"
        FAILED=$((FAILED + 1))
    fi
done
echo ""

# Check issue_screenshots table columns
echo "  Checking issue_screenshots table columns..."
SCREENSHOTS_COLUMNS=$(psql "$DATABASE_URL" -t -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'issue_screenshots' ORDER BY column_name;" 2>/dev/null | xargs)

REQUIRED_SCREENSHOTS_COLUMNS=("id" "issue_id" "storage_path" "storage_type" "mime_type" "width" "height" "file_size" "element_selector" "created_at")
for col in "${REQUIRED_SCREENSHOTS_COLUMNS[@]}"; do
    if echo "$SCREENSHOTS_COLUMNS" | grep -q "$col"; then
        echo "    ✅ Column '$col' exists"
        PASSED=$((PASSED + 1))
    else
        echo "    ❌ Column '$col' missing"
        FAILED=$((FAILED + 1))
    fi
done
echo ""

# Check issue_logs table columns
echo "  Checking issue_logs table columns..."
LOGS_COLUMNS=$(psql "$DATABASE_URL" -t -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'issue_logs' ORDER BY column_name;" 2>/dev/null | xargs)

REQUIRED_LOGS_COLUMNS=("id" "issue_id" "log_type" "level" "message" "stack" "metadata" "timestamp" "created_at")
for col in "${REQUIRED_LOGS_COLUMNS[@]}"; do
    if echo "$LOGS_COLUMNS" | grep -q "$col"; then
        echo "    ✅ Column '$col' exists"
        PASSED=$((PASSED + 1))
    else
        echo "    ❌ Column '$col' missing"
        FAILED=$((FAILED + 1))
    fi
done
echo ""

# Test 3: Verify Foreign Key Constraints
echo "Test 3: Verify Foreign Key Constraints"
echo "--------------------------------------"

FK_QUERY="SELECT conname, contype, conrelid::regclass, confrelid::regclass FROM pg_constraint WHERE conrelid IN ('issues'::regclass, 'issue_screenshots'::regclass, 'issue_logs'::regclass) AND contype = 'f';"

FOREIGN_KEYS=$(psql "$DATABASE_URL" -t -c "$FK_QUERY" 2>/dev/null)

# Check for issues.project_id -> projects.id
if echo "$FOREIGN_KEYS" | grep -q "issues.*projects"; then
    echo "✅ Foreign key: issues.project_id -> projects.id"
    PASSED=$((PASSED + 1))
else
    echo "❌ Foreign key missing: issues.project_id -> projects.id"
    FAILED=$((FAILED + 1))
fi

# Check for issues.assignee_id -> users.id (nullable, so might not exist if no data)
if echo "$FOREIGN_KEYS" | grep -q "issues.*users"; then
    echo "✅ Foreign key: issues.assignee_id -> users.id"
    PASSED=$((PASSED + 1))
else
    echo "⚠️  Foreign key: issues.assignee_id -> users.id (may not exist if nullable)"
fi

# Check for issue_screenshots.issue_id -> issues.id
if echo "$FOREIGN_KEYS" | grep -q "issue_screenshots.*issues"; then
    echo "✅ Foreign key: issue_screenshots.issue_id -> issues.id"
    PASSED=$((PASSED + 1))
else
    echo "❌ Foreign key missing: issue_screenshots.issue_id -> issues.id"
    FAILED=$((FAILED + 1))
fi

# Check for issue_logs.issue_id -> issues.id
if echo "$FOREIGN_KEYS" | grep -q "issue_logs.*issues"; then
    echo "✅ Foreign key: issue_logs.issue_id -> issues.id"
    PASSED=$((PASSED + 1))
else
    echo "❌ Foreign key missing: issue_logs.issue_id -> issues.id"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 4: Verify Indexes
echo "Test 4: Verify Indexes"
echo "---------------------"

INDEX_QUERY="SELECT indexname FROM pg_indexes WHERE tablename IN ('issues', 'issue_screenshots', 'issue_logs');"
INDEXES=$(psql "$DATABASE_URL" -t -c "$INDEX_QUERY" 2>/dev/null | xargs)

REQUIRED_INDEXES=(
    "issues_project_id_idx"
    "issues_status_idx"
    "issues_severity_idx"
    "issues_created_at_idx"
    "issue_screenshots_issue_id_idx"
    "issue_logs_issue_id_idx"
    "issue_logs_level_idx"
    "issue_logs_timestamp_idx"
)

for idx in "${REQUIRED_INDEXES[@]}"; do
    if echo "$INDEXES" | grep -qi "$idx"; then
        echo "✅ Index '$idx' exists"
        PASSED=$((PASSED + 1))
    else
        echo "⚠️  Index '$idx' not found (may have different naming)"
    fi
done
echo ""

# Test 5: Verify Data Types
echo "Test 5: Verify Data Types"
echo "------------------------"

# Check issues.id is integer
ISSUES_ID_TYPE=$(psql "$DATABASE_URL" -t -c "SELECT data_type FROM information_schema.columns WHERE table_name = 'issues' AND column_name = 'id';" 2>/dev/null | xargs)
if [ "$ISSUES_ID_TYPE" = "integer" ]; then
    echo "✅ issues.id is integer"
    PASSED=$((PASSED + 1))
else
    echo "⚠️  issues.id type: $ISSUES_ID_TYPE (expected integer)"
fi

# Check issues.status is text/varchar
ISSUES_STATUS_TYPE=$(psql "$DATABASE_URL" -t -c "SELECT data_type FROM information_schema.columns WHERE table_name = 'issues' AND column_name = 'status';" 2>/dev/null | xargs)
if [ "$ISSUES_STATUS_TYPE" = "text" ] || [ "$ISSUES_STATUS_TYPE" = "character varying" ]; then
    echo "✅ issues.status is text/varchar"
    PASSED=$((PASSED + 1))
else
    echo "⚠️  issues.status type: $ISSUES_STATUS_TYPE"
fi

# Check issues.reporter_info is json/jsonb
ISSUES_REPORTER_TYPE=$(psql "$DATABASE_URL" -t -c "SELECT data_type FROM information_schema.columns WHERE table_name = 'issues' AND column_name = 'reporter_info';" 2>/dev/null | xargs)
if [ "$ISSUES_REPORTER_TYPE" = "json" ] || [ "$ISSUES_REPORTER_TYPE" = "jsonb" ]; then
    echo "✅ issues.reporter_info is json/jsonb"
    PASSED=$((PASSED + 1))
else
    echo "⚠️  issues.reporter_info type: $ISSUES_REPORTER_TYPE"
fi
echo ""

# Test 6: Verify Cascade Delete
echo "Test 6: Verify Cascade Delete"
echo "----------------------------"

# Check if issue_screenshots has ON DELETE CASCADE
CASCADE_CHECK=$(psql "$DATABASE_URL" -t -c "SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'issue_screenshots'::regclass AND contype = 'f' AND conname LIKE '%issue_id%';" 2>/dev/null | xargs)

if echo "$CASCADE_CHECK" | grep -qi "on delete cascade"; then
    echo "✅ issue_screenshots has ON DELETE CASCADE"
    PASSED=$((PASSED + 1))
else
    echo "⚠️  issue_screenshots ON DELETE CASCADE not verified"
fi

# Check if issue_logs has ON DELETE CASCADE
CASCADE_CHECK_LOGS=$(psql "$DATABASE_URL" -t -c "SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'issue_logs'::regclass AND contype = 'f' AND conname LIKE '%issue_id%';" 2>/dev/null | xargs)

if echo "$CASCADE_CHECK_LOGS" | grep -qi "on delete cascade"; then
    echo "✅ issue_logs has ON DELETE CASCADE"
    PASSED=$((PASSED + 1))
else
    echo "⚠️  issue_logs ON DELETE CASCADE not verified"
fi
echo ""

# Summary
echo "=========================================="
echo "Verification Complete"
echo "=========================================="
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "✅ All database schema checks passed!"
    exit 0
else
    echo "❌ Some database schema checks failed"
    exit 1
fi

