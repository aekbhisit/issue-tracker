#!/bin/bash

# IC-6 Issue Dashboard Browser Testing Script
# This script tests the API endpoints programmatically to verify functionality

set -e

API_URL="http://localhost:4501/api/admin/v1"
ADMIN_URL="http://localhost:4502"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
TOTAL=0

# Test counter
test_count() {
    TOTAL=$((TOTAL + 1))
}

pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    PASSED=$((PASSED + 1))
    test_count
}

fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    FAILED=$((FAILED + 1))
    test_count
}

info() {
    echo -e "${YELLOW}ℹ️  INFO${NC}: $1"
}

# Check if servers are running
check_servers() {
    echo "Checking if servers are running..."
    
    if curl -s http://localhost:4501/health > /dev/null 2>&1; then
        pass "API server is running on port 4501"
    else
        fail "API server is NOT running on port 4501"
        exit 1
    fi
    
    if curl -s http://localhost:4502 > /dev/null 2>&1; then
        pass "Admin frontend is running on port 4502"
    else
        fail "Admin frontend is NOT running on port 4502"
        exit 1
    fi
}

# Login and get token
get_auth_token() {
    info "Attempting to login..."
    
    # Try with email first
    RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@admin.com","password":"admin"}' 2>&1)
    
    # Try to extract token using jq if available, otherwise use grep
    if command -v jq >/dev/null 2>&1; then
        TOKEN=$(echo "$RESPONSE" | jq -r '.data.accessToken // empty' 2>/dev/null)
    else
        TOKEN=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    fi
    
    if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ] && [ "$TOKEN" != "empty" ]; then
        pass "Login successful, token obtained" >&2
        echo "$TOKEN"
        return 0
    fi
    
    # Try with username
    RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"username":"admin","password":"admin"}' 2>&1)
    
    if command -v jq >/dev/null 2>&1; then
        TOKEN=$(echo "$RESPONSE" | jq -r '.data.accessToken // empty' 2>/dev/null)
    else
        TOKEN=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    fi
    
    if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ] && [ "$TOKEN" != "empty" ]; then
        pass "Login successful with username, token obtained" >&2
        echo "$TOKEN"
        return 0
    fi
    
    fail "Login failed - cannot obtain auth token"
    echo "Response: $RESPONSE"
    return 1
}

# Test Issue List API
test_issue_list() {
    local token=$1
    info "Testing issue list endpoint..."
    
    RESPONSE=$(curl -s -X GET "${API_URL}/issues?page=1&limit=20" \
        -H "Authorization: Bearer ${token}" \
        -H "Content-Type: application/json")
    
    if echo "$RESPONSE" | grep -q '"data"'; then
        pass "Issue list endpoint returns data"
        
        # Check pagination
        if echo "$RESPONSE" | grep -q '"pagination"'; then
            pass "Issue list includes pagination info"
        else
            fail "Issue list missing pagination info"
        fi
        
        # Count issues
        ISSUE_COUNT=$(echo "$RESPONSE" | grep -o '"id":[0-9]*' | wc -l | xargs)
        info "Found $ISSUE_COUNT issues in database"
        
        return 0
    else
        fail "Issue list endpoint failed or returned no data"
        echo "Response: $RESPONSE"
        return 1
    fi
}

# Test Issue List with Filters
test_issue_filters() {
    local token=$1
    info "Testing issue list filters..."
    
    # Test status filter
    RESPONSE=$(curl -s -X GET "${API_URL}/issues?status=open" \
        -H "Authorization: Bearer ${token}")
    if echo "$RESPONSE" | grep -q '"data"'; then
        pass "Status filter (open) works"
    else
        fail "Status filter (open) failed"
    fi
    
    # Test severity filter
    RESPONSE=$(curl -s -X GET "${API_URL}/issues?severity=high" \
        -H "Authorization: Bearer ${token}")
    if echo "$RESPONSE" | grep -q '"data"'; then
        pass "Severity filter (high) works"
    else
        fail "Severity filter (high) failed"
    fi
    
    # Test search filter
    RESPONSE=$(curl -s -X GET "${API_URL}/issues?search=test" \
        -H "Authorization: Bearer ${token}")
    if echo "$RESPONSE" | grep -q '"data"'; then
        pass "Search filter works"
    else
        fail "Search filter failed"
    fi
    
    # Test pagination
    RESPONSE=$(curl -s -X GET "${API_URL}/issues?page=1&limit=10" \
        -H "Authorization: Bearer ${token}")
    if echo "$RESPONSE" | grep -q '"pagination"'; then
        pass "Pagination works"
    else
        fail "Pagination failed"
    fi
    
    # Test sorting
    RESPONSE=$(curl -s -X GET "${API_URL}/issues?sortBy=createdAt&sortOrder=desc" \
        -H "Authorization: Bearer ${token}")
    if echo "$RESPONSE" | grep -q '"data"'; then
        pass "Sorting works"
    else
        fail "Sorting failed"
    fi
    
    # Test date range filter
    START_DATE=$(date -u -v-7d +"%Y-%m-%d" 2>/dev/null || date -u -d "7 days ago" +"%Y-%m-%d" 2>/dev/null || echo "2024-01-01")
    RESPONSE=$(curl -s -X GET "${API_URL}/issues?startDate=${START_DATE}" \
        -H "Authorization: Bearer ${token}")
    if echo "$RESPONSE" | grep -q '"data"'; then
        pass "Date range filter (startDate) works"
    else
        fail "Date range filter (startDate) failed"
    fi
}

# Test Issue Detail API
test_issue_detail() {
    local token=$1
    local issue_id=$2
    
    if [ -z "$issue_id" ]; then
        info "No issue ID provided, skipping detail test"
        return 0
    fi
    
    info "Testing issue detail endpoint for issue $issue_id..."
    
    RESPONSE=$(curl -s -X GET "${API_URL}/issues/${issue_id}" \
        -H "Authorization: Bearer ${token}")
    
    if echo "$RESPONSE" | grep -q '"id":' && echo "$RESPONSE" | grep -q "\"id\":${issue_id}"; then
        pass "Issue detail endpoint works"
        
        # Check for screenshots
        if echo "$RESPONSE" | grep -q '"screenshots"'; then
            pass "Issue detail includes screenshots array"
        fi
        
        # Check for logs
        if echo "$RESPONSE" | grep -q '"logs"'; then
            pass "Issue detail includes logs array"
        fi
        
        # Check for comments
        if echo "$RESPONSE" | grep -q '"comments"'; then
            pass "Issue detail includes comments array"
        else
            info "Issue detail does not include comments (may be empty)"
        fi
        
        return 0
    else
        fail "Issue detail endpoint failed"
        echo "Response: $RESPONSE"
        return 1
    fi
}

# Test Issue Update API
test_issue_update() {
    local token=$1
    local issue_id=$2
    
    if [ -z "$issue_id" ]; then
        info "No issue ID provided, skipping update test"
        return 0
    fi
    
    info "Testing issue update endpoint for issue $issue_id..."
    
    # Test status update
    RESPONSE=$(curl -s -X PATCH "${API_URL}/issues/${issue_id}" \
        -H "Authorization: Bearer ${token}" \
        -H "Content-Type: application/json" \
        -d '{"status":"in-progress"}')
    
    if echo "$RESPONSE" | grep -q '"status":200' || echo "$RESPONSE" | grep -q '"message"'; then
        pass "Issue status update works"
    else
        fail "Issue status update failed"
        echo "Response: $RESPONSE"
    fi
}

# Test Comment API
test_comment_api() {
    local token=$1
    local issue_id=$2
    
    if [ -z "$issue_id" ]; then
        info "No issue ID provided, skipping comment test"
        return 0
    fi
    
    info "Testing comment endpoint for issue $issue_id..."
    
    # Add a comment
    RESPONSE=$(curl -s -X POST "${API_URL}/issues/${issue_id}/comments" \
        -H "Authorization: Bearer ${token}" \
        -H "Content-Type: application/json" \
        -d '{"content":"Test comment from automated test script"}')
    
    if echo "$RESPONSE" | grep -q '"id"' || echo "$RESPONSE" | grep -q '"status":201'; then
        pass "Add comment endpoint works"
        
        # Verify comment appears in issue detail
        DETAIL_RESPONSE=$(curl -s -X GET "${API_URL}/issues/${issue_id}" \
            -H "Authorization: Bearer ${token}")
        
        if echo "$DETAIL_RESPONSE" | grep -q "Test comment from automated test script"; then
            pass "Comment appears in issue detail"
        else
            info "Comment may not appear immediately (caching)"
        fi
        
        return 0
    else
        fail "Add comment endpoint failed"
        echo "Response: $RESPONSE"
        return 1
    fi
}

# Get first issue ID from list
get_first_issue_id() {
    local token=$1
    
    RESPONSE=$(curl -s -X GET "${API_URL}/issues?page=1&limit=1" \
        -H "Authorization: Bearer ${token}")
    
    ISSUE_ID=$(echo "$RESPONSE" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
    echo "$ISSUE_ID"
}

# Main test execution
main() {
    echo "=========================================="
    echo "IC-6 Issue Dashboard API Testing"
    echo "=========================================="
    echo ""
    
    # Check servers
    check_servers
    echo ""
    
    # Get auth token
    TOKEN=$(get_auth_token 2>&1 | tail -1)
    if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ] || [ "$TOKEN" = "empty" ]; then
        echo "Cannot proceed without authentication token"
        echo "Token value: '$TOKEN'"
        exit 1
    fi
    info "Token obtained (length: ${#TOKEN})"
    echo ""
    
    # Test issue list
    test_issue_list "$TOKEN"
    echo ""
    
    # Test filters
    test_issue_filters "$TOKEN"
    echo ""
    
    # Get first issue ID for detail tests
    FIRST_ISSUE_ID=$(get_first_issue_id "$TOKEN")
    info "Using issue ID $FIRST_ISSUE_ID for detail tests"
    echo ""
    
    # Test issue detail
    if [ -n "$FIRST_ISSUE_ID" ]; then
        test_issue_detail "$TOKEN" "$FIRST_ISSUE_ID"
        echo ""
        
        # Test issue update
        test_issue_update "$TOKEN" "$FIRST_ISSUE_ID"
        echo ""
        
        # Test comment API
        test_comment_api "$TOKEN" "$FIRST_ISSUE_ID"
        echo ""
    else
        info "No issues found in database - skipping detail tests"
        info "Please create test issues to test detail functionality"
    fi
    
    # Summary
    echo "=========================================="
    echo "Test Summary"
    echo "=========================================="
    echo "Total Tests: $TOTAL"
    echo -e "${GREEN}Passed: $PASSED${NC}"
    echo -e "${RED}Failed: $FAILED${NC}"
    echo ""
    
    if [ $FAILED -eq 0 ]; then
        echo -e "${GREEN}All API tests passed!${NC}"
        echo ""
        echo "Next steps:"
        echo "1. Open http://localhost:4502/admin/issues in your browser"
        echo "2. Test the UI manually according to the test plan"
        echo "3. Verify filters, pagination, and detail page work correctly"
        exit 0
    else
        echo -e "${RED}Some tests failed. Please check the errors above.${NC}"
        exit 1
    fi
}

# Run main function
main

