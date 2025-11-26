#!/bin/bash

# IC-5 Public API Endpoint Testing Script
# Tests issue submission endpoints including screenshots and logs
# Run this script when API server is running on port 4501

API_URL="http://localhost:4501/api/public/v1"
PROJECT_KEY="${1:-YOUR_PROJECT_KEY}"
ORIGIN="${2:-http://localhost:3000}"

echo "=========================================="
echo "IC-5 Public API Endpoint Testing"
echo "=========================================="
echo ""

if [ "$PROJECT_KEY" = "YOUR_PROJECT_KEY" ]; then
    echo "⚠️  Please provide a project key as first argument"
    echo "Usage: ./test-public-api.sh proj_your_key_here [origin]"
    echo ""
    echo "To get a project key:"
    echo "1. Go to http://localhost:4502/admin/projects"
    echo "2. Create or select a project"
    echo "3. Copy the publicKey"
    exit 1
fi

echo "Using project key: $PROJECT_KEY"
echo "Using origin: $ORIGIN"
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

# Test 1: Basic Issue Submission
echo "Test 1: Basic Issue Submission"
echo "-----------------------------"
BASIC_PAYLOAD=$(cat <<EOF
{
  "projectKey": "$PROJECT_KEY",
  "title": "IC-5 Test Issue - Basic",
  "description": "This is a basic test issue for IC-5",
  "severity": "medium",
  "metadata": {
    "url": "https://example.com/test",
    "userAgent": "Mozilla/5.0 (IC-5 Test Script)",
    "viewport": {"width": 1920, "height": 1080},
    "screen": {"width": 1920, "height": 1080},
    "language": "en-US",
    "timezone": "America/New_York",
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")"
  }
}
EOF
)

BASIC_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "$API_URL/issues" \
  -H "Content-Type: application/json" \
  -d "$BASIC_PAYLOAD")

HTTP_STATUS=$(echo "$BASIC_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$BASIC_RESPONSE" | sed '/HTTP_STATUS/d')

if check_status "201" "$HTTP_STATUS" "Basic issue submission"; then
    ISSUE_ID=$(echo "$BODY" | grep -o '"id":[0-9]*' | cut -d: -f2)
    if [ -n "$ISSUE_ID" ]; then
        echo "Issue ID: $ISSUE_ID"
        echo "$ISSUE_ID" > /tmp/ic5_test_issue_id.txt
    fi
fi
echo ""

# Test 2: Issue Submission with Screenshot
echo "Test 2: Issue Submission with Screenshot"
echo "----------------------------------------"
# Create a small test PNG base64 (1x1 red pixel)
TEST_IMAGE_BASE64="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
SCREENSHOT_PAYLOAD=$(cat <<EOF
{
  "projectKey": "$PROJECT_KEY",
  "title": "IC-5 Test Issue - With Screenshot",
  "description": "This issue includes a screenshot",
  "severity": "high",
  "metadata": {
    "url": "https://example.com/test-screenshot",
    "userAgent": "Mozilla/5.0 (IC-5 Test Script)",
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
      "cssSelector": "#test-element",
      "xpath": "/html/body/div[1]",
      "boundingBox": {"x": 100, "y": 200, "width": 300, "height": 400},
      "outerHTML": "<div id='test-element'>Test</div>"
    }
  }
}
EOF
)

SCREENSHOT_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "$API_URL/issues" \
  -H "Content-Type: application/json" \
  -d "$SCREENSHOT_PAYLOAD")

HTTP_STATUS=$(echo "$SCREENSHOT_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$SCREENSHOT_RESPONSE" | sed '/HTTP_STATUS/d')

if check_status "201" "$HTTP_STATUS" "Issue with screenshot submission"; then
    SCREENSHOT_ISSUE_ID=$(echo "$BODY" | grep -o '"id":[0-9]*' | cut -d: -f2)
    if [ -n "$SCREENSHOT_ISSUE_ID" ]; then
        echo "Issue ID: $SCREENSHOT_ISSUE_ID"
        echo "$SCREENSHOT_ISSUE_ID" > /tmp/ic5_test_screenshot_issue_id.txt
    fi
fi
echo ""

# Test 3: Issue Submission with Logs
echo "Test 3: Issue Submission with Logs"
echo "-----------------------------------"
LOGS_PAYLOAD=$(cat <<EOF
{
  "projectKey": "$PROJECT_KEY",
  "title": "IC-5 Test Issue - With Logs",
  "description": "This issue includes console logs, errors, and network errors",
  "severity": "medium",
  "metadata": {
    "url": "https://example.com/test-logs",
    "userAgent": "Mozilla/5.0 (IC-5 Test Script)",
    "viewport": {"width": 1920, "height": 1080},
    "screen": {"width": 1920, "height": 1080},
    "language": "en-US",
    "timezone": "America/New_York",
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")"
  },
  "logs": {
    "consoleLogs": [
      {
        "level": "error",
        "message": "Test console error",
        "timestamp": $(date +%s)000,
        "metadata": {"source": "test"}
      },
      {
        "level": "warn",
        "message": "Test console warning",
        "timestamp": $(date +%s)000
      }
    ],
    "jsErrors": [
      {
        "message": "Test JavaScript error",
        "stack": "Error: Test JavaScript error\n    at test.js:1:1",
        "timestamp": $(date +%s)000,
        "source": "test.js",
        "line": 1,
        "column": 1
      }
    ],
    "networkErrors": [
      {
        "url": "https://api.example.com/test",
        "method": "GET",
        "error": "Network request failed",
        "timestamp": $(date +%s)000,
        "status": 500
      }
    ]
  }
}
EOF
)

LOGS_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "$API_URL/issues" \
  -H "Content-Type: application/json" \
  -d "$LOGS_PAYLOAD")

HTTP_STATUS=$(echo "$LOGS_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$LOGS_RESPONSE" | sed '/HTTP_STATUS/d')

if check_status "201" "$HTTP_STATUS" "Issue with logs submission"; then
    LOGS_ISSUE_ID=$(echo "$BODY" | grep -o '"id":[0-9]*' | cut -d: -f2)
    if [ -n "$LOGS_ISSUE_ID" ]; then
        echo "Issue ID: $LOGS_ISSUE_ID"
        echo "$LOGS_ISSUE_ID" > /tmp/ic5_test_logs_issue_id.txt
    fi
fi
echo ""

# Test 4: Invalid Project Key
echo "Test 4: Invalid Project Key"
echo "---------------------------"
INVALID_PAYLOAD=$(cat <<EOF
{
  "projectKey": "proj_invalid_key_12345",
  "title": "Test Issue",
  "description": "This should fail",
  "severity": "low",
  "metadata": {
    "url": "https://example.com",
    "userAgent": "Mozilla/5.0",
    "viewport": {"width": 1920, "height": 1080},
    "screen": {"width": 1920, "height": 1080},
    "language": "en-US",
    "timezone": "America/New_York",
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")"
  }
}
EOF
)

INVALID_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "$API_URL/issues" \
  -H "Content-Type: application/json" \
  -H "Origin: $ORIGIN" \
  -d "$INVALID_PAYLOAD")

HTTP_STATUS=$(echo "$INVALID_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$INVALID_RESPONSE" | sed '/HTTP_STATUS/d')

check_status "401" "$HTTP_STATUS" "Invalid project key rejection"
echo ""

# Test 5: Missing Required Fields
echo "Test 5: Missing Required Fields"
echo "-------------------------------"
MISSING_FIELDS_PAYLOAD=$(cat <<EOF
{
  "projectKey": "$PROJECT_KEY",
  "title": "",
  "description": "",
  "severity": "low",
  "metadata": {
    "url": "https://example.com",
    "userAgent": "Mozilla/5.0",
    "viewport": {"width": 1920, "height": 1080},
    "screen": {"width": 1920, "height": 1080},
    "language": "en-US",
    "timezone": "America/New_York",
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")"
  }
}
EOF
)

VALIDATION_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "$API_URL/issues" \
  -H "Content-Type: application/json" \
  -H "Origin: $ORIGIN" \
  -d "$MISSING_FIELDS_PAYLOAD")

HTTP_STATUS=$(echo "$VALIDATION_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$VALIDATION_RESPONSE" | sed '/HTTP_STATUS/d')

check_status "422" "$HTTP_STATUS" "Validation errors for missing fields"
echo ""

# Test 6: Invalid Severity
echo "Test 6: Invalid Severity"
echo "-----------------------"
INVALID_SEVERITY_PAYLOAD=$(cat <<EOF
{
  "projectKey": "$PROJECT_KEY",
  "title": "Test Issue",
  "description": "Test",
  "severity": "invalid_severity",
  "metadata": {
    "url": "https://example.com",
    "userAgent": "Mozilla/5.0",
    "viewport": {"width": 1920, "height": 1080},
    "screen": {"width": 1920, "height": 1080},
    "language": "en-US",
    "timezone": "America/New_York",
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")"
  }
}
EOF
)

INVALID_SEVERITY_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "$API_URL/issues" \
  -H "Content-Type: application/json" \
  -H "Origin: $ORIGIN" \
  -d "$INVALID_SEVERITY_PAYLOAD")

HTTP_STATUS=$(echo "$INVALID_SEVERITY_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$INVALID_SEVERITY_RESPONSE" | sed '/HTTP_STATUS/d')

check_status "422" "$HTTP_STATUS" "Validation errors for invalid severity"
echo ""

# Test 7: CORS Headers Check
echo "Test 7: CORS Headers Check"
echo "-------------------------"
CORS_RESPONSE=$(curl -s -I -X OPTIONS "$API_URL/issues" \
  -H "Origin: $ORIGIN" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type")

if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    echo "✅ CORS headers present"
    echo "$CORS_RESPONSE" | grep -i "access-control"
    PASSED=$((PASSED + 1))
else
    echo "⚠️  CORS headers not found (may be configured differently)"
    FAILED=$((FAILED + 1))
fi
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

