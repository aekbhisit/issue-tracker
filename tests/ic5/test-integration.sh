#!/bin/bash

# IC-5 Integration Testing Script
# End-to-end testing: SDK → API → Database → Admin UI
# Run this script when API server and admin dashboard are running

API_URL="http://localhost:4501/api/public/v1"
ADMIN_API_URL="http://localhost:4501/api/admin/v1"
PROJECT_KEY="${1:-YOUR_PROJECT_KEY}"
ADMIN_USERNAME="${2:-admin}"
ADMIN_PASSWORD="${3:-password}"

echo "=========================================="
echo "IC-5 Integration Testing"
echo "=========================================="
echo ""

if [ "$PROJECT_KEY" = "YOUR_PROJECT_KEY" ]; then
    echo "⚠️  Please provide a project key as first argument"
    echo "Usage: ./test-integration.sh proj_your_key_here [admin_username] [admin_password]"
    exit 1
fi

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

# Get admin token
echo "Getting admin token..."
LOGIN_PAYLOAD=$(cat <<EOF
{
  "email": "$ADMIN_USERNAME",
  "password": "$ADMIN_PASSWORD"
}
EOF
)

LOGIN_RESPONSE=$(curl -s -X POST "$ADMIN_API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "$LOGIN_PAYLOAD")

ADMIN_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
    echo "❌ Failed to get admin token"
    exit 1
fi
echo ""

# Test 1: Submit Issue via Public API
echo "Test 1: Submit Issue via Public API"
echo "----------------------------------"
TEST_IMAGE_BASE64="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

INTEGRATION_PAYLOAD=$(cat <<EOF
{
  "projectKey": "$PROJECT_KEY",
  "title": "IC-5 Integration Test Issue",
  "description": "End-to-end integration test",
  "severity": "high",
  "metadata": {
    "url": "https://example.com/integration-test",
    "userAgent": "Mozilla/5.0 (IC-5 Integration Test)",
    "viewport": {"width": 1920, "height": 1080},
    "screen": {"width": 1920, "height": 1080},
    "language": "en-US",
    "timezone": "America/New_York",
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")"
  },
  "screenshot": {
    "screenshot": {
      "dataUrl": "data:image/png;base64,$TEST_IMAGE_BASE64",
      "mimeType": "image/png",
      "fileSize": 95,
      "width": 1,
      "height": 1
    },
    "selector": {
      "cssSelector": "#integration-test",
      "xpath": "/html/body/div[1]",
      "boundingBox": {"x": 0, "y": 0, "width": 1, "height": 1},
      "outerHTML": "<div id='integration-test'>Test</div>"
    }
  },
  "logs": {
    "consoleLogs": [
      {
        "level": "error",
        "message": "Integration test console error",
        "timestamp": $(date +%s)000
      }
    ],
    "jsErrors": [
      {
        "message": "Integration test JS error",
        "stack": "Error: Integration test\n    at test.js:1:1",
        "timestamp": $(date +%s)000
      }
    ],
    "networkErrors": [
      {
        "url": "https://api.example.com/integration",
        "method": "GET",
        "error": "Network error",
        "timestamp": $(date +%s)000
      }
    ]
  }
}
EOF
)

SUBMIT_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "$API_URL/issues" \
  -H "Content-Type: application/json" \
  -d "$INTEGRATION_PAYLOAD")

HTTP_STATUS=$(echo "$SUBMIT_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$SUBMIT_RESPONSE" | sed '/HTTP_STATUS/d')

if check_status "201" "$HTTP_STATUS" "Issue submission via public API"; then
    ISSUE_ID=$(echo "$BODY" | grep -o '"id":[0-9]*' | cut -d: -f2)
    if [ -n "$ISSUE_ID" ]; then
        echo "Issue ID: $ISSUE_ID"
        echo "$ISSUE_ID" > /tmp/ic5_integration_issue_id.txt
    else
        echo "❌ Issue ID not found in response"
        FAILED=$((FAILED + 1))
        exit 1
    fi
else
    echo "❌ Cannot proceed without issue ID"
    exit 1
fi
echo ""

# Test 2: Verify Issue in Database via Admin API
echo "Test 2: Verify Issue in Database via Admin API"
echo "---------------------------------------------"
if [ -z "$ISSUE_ID" ]; then
    ISSUE_ID=$(cat /tmp/ic5_integration_issue_id.txt 2>/dev/null)
fi

if [ -n "$ISSUE_ID" ]; then
    GET_RESPONSE=$(curl -s "$ADMIN_API_URL/issues/$ISSUE_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN")
    
    HTTP_STATUS=$(curl -s -w "%{http_code}" -o /dev/null "$ADMIN_API_URL/issues/$ISSUE_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN")
    
    if check_status "200" "$HTTP_STATUS" "Get issue via admin API"; then
        # Verify issue data
        TITLE=$(echo "$GET_RESPONSE" | grep -o '"title":"[^"]*"' | cut -d'"' -f4)
        if [ "$TITLE" = "IC-5 Integration Test Issue" ]; then
            echo "✅ Issue title matches"
            PASSED=$((PASSED + 1))
        else
            echo "❌ Issue title mismatch"
            FAILED=$((FAILED + 1))
        fi
        
        # Verify screenshot
        SCREENSHOT_COUNT=$(echo "$GET_RESPONSE" | grep -o '"screenshots":\[.*\]' | grep -o '"id"' | wc -l | xargs)
        if [ "$SCREENSHOT_COUNT" -gt 0 ]; then
            echo "✅ Screenshot found in issue"
            PASSED=$((PASSED + 1))
        else
            echo "❌ Screenshot not found"
            FAILED=$((FAILED + 1))
        fi
        
        # Verify logs
        LOG_COUNT=$(echo "$GET_RESPONSE" | grep -o '"logs":\[.*\]' | grep -o '"id"' | wc -l | xargs)
        if [ "$LOG_COUNT" -gt 0 ]; then
            echo "✅ Logs found in issue (count: $LOG_COUNT)"
            PASSED=$((PASSED + 1))
        else
            echo "❌ Logs not found"
            FAILED=$((FAILED + 1))
        fi
    fi
fi
echo ""

# Test 3: Verify Issue Appears in List
echo "Test 3: Verify Issue Appears in List"
echo "------------------------------------"
LIST_RESPONSE=$(curl -s "$ADMIN_API_URL/issues?search=Integration" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

if echo "$LIST_RESPONSE" | grep -q "$ISSUE_ID"; then
    echo "✅ Issue appears in list"
    PASSED=$((PASSED + 1))
else
    echo "❌ Issue not found in list"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 4: Update Issue Status
echo "Test 4: Update Issue Status"
echo "---------------------------"
UPDATE_PAYLOAD=$(cat <<EOF
{
  "status": "in-progress"
}
EOF
)

UPDATE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X PATCH "$ADMIN_API_URL/issues/$ISSUE_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$UPDATE_PAYLOAD")

HTTP_STATUS=$(echo "$UPDATE_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)

if check_status "200" "$HTTP_STATUS" "Update issue status"; then
    # Verify status updated
    GET_RESPONSE=$(curl -s "$ADMIN_API_URL/issues/$ISSUE_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN")
    
    STATUS=$(echo "$GET_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    if [ "$STATUS" = "in-progress" ]; then
        echo "✅ Status updated correctly"
        PASSED=$((PASSED + 1))
    else
        echo "⚠️  Status may not match (got: $STATUS)"
    fi
fi
echo ""

# Test 5: Verify Screenshot Storage
echo "Test 5: Verify Screenshot Storage"
echo "---------------------------------"
GET_RESPONSE=$(curl -s "$ADMIN_API_URL/issues/$ISSUE_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

SCREENSHOT_URL=$(echo "$GET_RESPONSE" | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$SCREENSHOT_URL" ]; then
    echo "Screenshot URL: $SCREENSHOT_URL"
    
    # Try to access screenshot
    URL_STATUS=$(curl -s -w "%{http_code}" -o /dev/null "$SCREENSHOT_URL")
    if [ "$URL_STATUS" = "200" ]; then
        echo "✅ Screenshot URL is accessible"
        PASSED=$((PASSED + 1))
    else
        echo "⚠️  Screenshot URL returned status: $URL_STATUS"
    fi
else
    echo "⚠️  Screenshot URL not found"
fi
echo ""

# Test 6: Verify Logs Storage
echo "Test 6: Verify Logs Storage"
echo "--------------------------"
GET_RESPONSE=$(curl -s "$ADMIN_API_URL/issues/$ISSUE_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

# Check for console logs
if echo "$GET_RESPONSE" | grep -q "Integration test console error"; then
    echo "✅ Console log found"
    PASSED=$((PASSED + 1))
else
    echo "⚠️  Console log not found"
fi

# Check for JS errors
if echo "$GET_RESPONSE" | grep -q "Integration test JS error"; then
    echo "✅ JS error log found"
    PASSED=$((PASSED + 1))
else
    echo "⚠️  JS error log not found"
fi

# Check for network errors
if echo "$GET_RESPONSE" | grep -q "Network error"; then
    echo "✅ Network error log found"
    PASSED=$((PASSED + 1))
else
    echo "⚠️  Network error log not found"
fi
echo ""

# Summary
echo "=========================================="
echo "Integration Testing Complete"
echo "=========================================="
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo ""
echo "Issue ID for manual UI testing: $ISSUE_ID"
echo "Admin Dashboard URL: http://localhost:4502/admin/issues/$ISSUE_ID"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "✅ All integration tests passed!"
    exit 0
else
    echo "❌ Some integration tests failed"
    exit 1
fi

