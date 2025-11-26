#!/bin/bash

# IC-5 Admin API Endpoint Testing Script
# Tests admin API endpoints for issue management
# Run this script when API server is running on port 4501

API_URL="http://localhost:4501/api/admin/v1"
ADMIN_USERNAME="${1:-admin}"
ADMIN_PASSWORD="${2:-password}"

echo "=========================================="
echo "IC-5 Admin API Endpoint Testing"
echo "=========================================="
echo ""

PASSED=0
FAILED=0

# Helper function to check HTTP status
check_status() {
    local expected=$1
    local actual=$2
    local test_name=$3
    
    if [ "$actual" = "$expected" ]; then
        echo "✅ $test_name passed (Status: $actual)"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo "❌ $test_name failed (Expected: $expected, Got: $actual)"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Test 1: Get Admin Token
echo "Test 1: Get Admin Token"
echo "----------------------"
LOGIN_PAYLOAD=$(cat <<EOF
{
  "email": "$ADMIN_USERNAME",
  "password": "$ADMIN_PASSWORD"
}
EOF
)

LOGIN_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "$LOGIN_PAYLOAD")

HTTP_STATUS=$(echo "$LOGIN_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$LOGIN_RESPONSE" | sed '/HTTP_STATUS/d')

if check_status "200" "$HTTP_STATUS" "Admin login"; then
    TOKEN=$(echo "$BODY" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$TOKEN" ]; then
        echo "Token obtained successfully"
        echo "$TOKEN" > /tmp/ic5_admin_token.txt
        export ADMIN_TOKEN="$TOKEN"
    else
        echo "⚠️  Token not found in response"
        FAILED=$((FAILED + 1))
        echo "Response: $BODY"
    fi
else
    echo "❌ Cannot proceed without admin token"
    echo "Response: $BODY"
    exit 1
fi
echo ""

if [ -z "$ADMIN_TOKEN" ]; then
    ADMIN_TOKEN=$(cat /tmp/ic5_admin_token.txt 2>/dev/null)
fi

if [ -z "$ADMIN_TOKEN" ]; then
    echo "❌ Failed to get admin token. Cannot continue."
    exit 1
fi

# Test 2: List All Issues
echo "Test 2: List All Issues"
echo "----------------------"
LIST_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X GET "$API_URL/issues" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

HTTP_STATUS=$(echo "$LIST_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$LIST_RESPONSE" | sed '/HTTP_STATUS/d')

if check_status "200" "$HTTP_STATUS" "List all issues"; then
    ISSUE_COUNT=$(echo "$BODY" | grep -o '"total":[0-9]*' | cut -d: -f2)
    if [ -n "$ISSUE_COUNT" ]; then
        echo "Total issues: $ISSUE_COUNT"
        # Extract first issue ID if available
        FIRST_ISSUE_ID=$(echo "$BODY" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
        if [ -n "$FIRST_ISSUE_ID" ]; then
            echo "$FIRST_ISSUE_ID" > /tmp/ic5_test_issue_id.txt
            echo "First issue ID: $FIRST_ISSUE_ID"
        fi
    fi
fi
echo ""

# Test 3: List Issues with Filters
echo "Test 3: List Issues with Filters"
echo "--------------------------------"

# Filter by status
echo "  Testing status filter..."
FILTER_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X GET "$API_URL/issues?status=open" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

HTTP_STATUS=$(echo "$FILTER_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
check_status "200" "$HTTP_STATUS" "Filter by status"
echo ""

# Filter by severity
echo "  Testing severity filter..."
SEVERITY_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X GET "$API_URL/issues?severity=high" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

HTTP_STATUS=$(echo "$SEVERITY_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
check_status "200" "$HTTP_STATUS" "Filter by severity"
echo ""

# Filter by project
echo "  Testing project filter..."
PROJECT_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X GET "$API_URL/issues?projectId=1" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

HTTP_STATUS=$(echo "$PROJECT_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
check_status "200" "$HTTP_STATUS" "Filter by project"
echo ""

# Search query
echo "  Testing search query..."
SEARCH_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X GET "$API_URL/issues?search=test" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

HTTP_STATUS=$(echo "$SEARCH_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
check_status "200" "$HTTP_STATUS" "Search query"
echo ""

# Pagination
echo "  Testing pagination..."
PAGE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X GET "$API_URL/issues?page=1&limit=10" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

HTTP_STATUS=$(echo "$PAGE_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
check_status "200" "$HTTP_STATUS" "Pagination"
echo ""

# Sorting
echo "  Testing sorting..."
SORT_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X GET "$API_URL/issues?sortBy=createdAt&sortOrder=desc" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

HTTP_STATUS=$(echo "$SORT_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
check_status "200" "$HTTP_STATUS" "Sorting"
echo ""

# Test 4: Get Issue by ID
echo "Test 4: Get Issue by ID"
echo "----------------------"
TEST_ISSUE_ID=$(cat /tmp/ic5_test_issue_id.txt 2>/dev/null || echo "1")

if [ -n "$TEST_ISSUE_ID" ] && [ "$TEST_ISSUE_ID" != "null" ]; then
    GET_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
      -X GET "$API_URL/issues/$TEST_ISSUE_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN")
    
    HTTP_STATUS=$(echo "$GET_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
    BODY=$(echo "$GET_RESPONSE" | sed '/HTTP_STATUS/d')
    
    if check_status "200" "$HTTP_STATUS" "Get issue by ID"; then
        echo "Issue retrieved successfully"
        # Check for required fields
        if echo "$BODY" | grep -q '"title"'; then
            echo "  ✅ Title field present"
        fi
        if echo "$BODY" | grep -q '"screenshots"'; then
            echo "  ✅ Screenshots array present"
        fi
        if echo "$BODY" | grep -q '"logs"'; then
            echo "  ✅ Logs array present"
        fi
    fi
else
    echo "⚠️  No issue ID available for testing (create an issue first)"
fi
echo ""

# Test 5: Update Issue Status
echo "Test 5: Update Issue Status"
echo "---------------------------"
if [ -n "$TEST_ISSUE_ID" ] && [ "$TEST_ISSUE_ID" != "null" ]; then
    UPDATE_STATUS_PAYLOAD=$(cat <<EOF
{
  "status": "in-progress"
}
EOF
)
    
    UPDATE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
      -X PATCH "$API_URL/issues/$TEST_ISSUE_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$UPDATE_STATUS_PAYLOAD")
    
    HTTP_STATUS=$(echo "$UPDATE_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
    check_status "200" "$HTTP_STATUS" "Update issue status"
else
    echo "⚠️  Skipping - no issue ID available"
fi
echo ""

# Test 6: Update Issue Description
echo "Test 6: Update Issue Description"
echo "-------------------------------"
if [ -n "$TEST_ISSUE_ID" ] && [ "$TEST_ISSUE_ID" != "null" ]; then
    UPDATE_DESC_PAYLOAD=$(cat <<EOF
{
  "description": "Updated description from IC-5 test script"
}
EOF
)
    
    UPDATE_DESC_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
      -X PATCH "$API_URL/issues/$TEST_ISSUE_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$UPDATE_DESC_PAYLOAD")
    
    HTTP_STATUS=$(echo "$UPDATE_DESC_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
    check_status "200" "$HTTP_STATUS" "Update issue description"
else
    echo "⚠️  Skipping - no issue ID available"
fi
echo ""

# Test 7: Update Issue Assignee
echo "Test 7: Update Issue Assignee"
echo "-----------------------------"
if [ -n "$TEST_ISSUE_ID" ] && [ "$TEST_ISSUE_ID" != "null" ]; then
    UPDATE_ASSIGNEE_PAYLOAD=$(cat <<EOF
{
  "assigneeId": null
}
EOF
)
    
    UPDATE_ASSIGNEE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
      -X PATCH "$API_URL/issues/$TEST_ISSUE_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$UPDATE_ASSIGNEE_PAYLOAD")
    
    HTTP_STATUS=$(echo "$UPDATE_ASSIGNEE_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
    check_status "200" "$HTTP_STATUS" "Update issue assignee (unassign)"
else
    echo "⚠️  Skipping - no issue ID available"
fi
echo ""

# Test 8: Invalid Issue ID
echo "Test 8: Invalid Issue ID"
echo "-----------------------"
INVALID_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X GET "$API_URL/issues/99999" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

HTTP_STATUS=$(echo "$INVALID_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
check_status "404" "$HTTP_STATUS" "Invalid issue ID returns 404"
echo ""

# Test 9: Invalid Status Update
echo "Test 9: Invalid Status Update"
echo "-----------------------------"
if [ -n "$TEST_ISSUE_ID" ] && [ "$TEST_ISSUE_ID" != "null" ]; then
    INVALID_STATUS_PAYLOAD=$(cat <<EOF
{
  "status": "invalid_status"
}
EOF
)
    
    INVALID_STATUS_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
      -X PATCH "$API_URL/issues/$TEST_ISSUE_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$INVALID_STATUS_PAYLOAD")
    
    HTTP_STATUS=$(echo "$INVALID_STATUS_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
    check_status "422" "$HTTP_STATUS" "Invalid status returns validation error"
else
    echo "⚠️  Skipping - no issue ID available"
fi
echo ""

# Test 10: Unauthorized Access
echo "Test 10: Unauthorized Access"
echo "---------------------------"
UNAUTH_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X GET "$API_URL/issues")

HTTP_STATUS=$(echo "$UNAUTH_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
check_status "401" "$HTTP_STATUS" "Unauthorized access returns 401"
echo ""

# Summary
echo "=========================================="
echo "Testing Complete"
echo "=========================================="
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "✅ All tests passed!"
    exit 0
else
    echo "❌ Some tests failed"
    exit 1
fi

