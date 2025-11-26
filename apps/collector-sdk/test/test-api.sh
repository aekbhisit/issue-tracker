#!/bin/bash

# API Endpoint Testing Script for IC-2
# Run this script when API server is running on port 4501

API_URL="http://localhost:4501/api/public/v1"
PROJECT_KEY="${1:-YOUR_PROJECT_KEY}"

echo "=========================================="
echo "IC-2 API Endpoint Testing"
echo "=========================================="
echo ""

if [ "$PROJECT_KEY" = "YOUR_PROJECT_KEY" ]; then
    echo "⚠️  Please provide a project key as first argument"
    echo "Usage: ./test-api.sh proj_your_key_here"
    echo ""
    echo "To get a project key:"
    echo "1. Go to http://localhost:4502/admin/projects"
    echo "2. Create or select a project"
    echo "3. Copy the publicKey"
    exit 1
fi

echo "Using project key: $PROJECT_KEY"
echo ""

# Test 1: Health Check
echo "Test 1: Health Check"
echo "-------------------"
HEALTH_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$API_URL/health")
HTTP_STATUS=$(echo "$HEALTH_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$HEALTH_RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Health check passed (Status: $HTTP_STATUS)"
    echo "Response: $BODY"
else
    echo "❌ Health check failed (Status: $HTTP_STATUS)"
    echo "Response: $BODY"
fi
echo ""

# Test 2: Valid Issue Submission
echo "Test 2: Valid Issue Submission"
echo "-----------------------------"
VALID_PAYLOAD=$(cat <<EOF
{
  "projectKey": "$PROJECT_KEY",
  "title": "Test Issue from Script",
  "description": "This is a test issue submitted via API test script",
  "severity": "medium",
  "metadata": {
    "url": "https://example.com/test",
    "userAgent": "Mozilla/5.0 (Test Script)",
    "viewport": {"width": 1920, "height": 1080},
    "screen": {"width": 1920, "height": 1080},
    "language": "en-US",
    "timezone": "America/New_York",
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")"
  }
}
EOF
)

VALID_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "$API_URL/issues" \
  -H "Content-Type: application/json" \
  -d "$VALID_PAYLOAD")

HTTP_STATUS=$(echo "$VALID_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$VALID_RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "201" ]; then
    echo "✅ Valid submission passed (Status: $HTTP_STATUS)"
    echo "Response: $BODY"
    ISSUE_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$ISSUE_ID" ]; then
        echo "Issue ID: $ISSUE_ID"
    fi
else
    echo "❌ Valid submission failed (Status: $HTTP_STATUS)"
    echo "Response: $BODY"
fi
echo ""

# Test 3: Invalid Project Key
echo "Test 3: Invalid Project Key"
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
  -d "$INVALID_PAYLOAD")

HTTP_STATUS=$(echo "$INVALID_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$INVALID_RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "401" ]; then
    echo "✅ Invalid key correctly rejected (Status: $HTTP_STATUS)"
    echo "Response: $BODY"
else
    echo "❌ Invalid key test failed (Expected 401, got $HTTP_STATUS)"
    echo "Response: $BODY"
fi
echo ""

# Test 4: Missing Required Fields
echo "Test 4: Missing Required Fields"
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
  -d "$MISSING_FIELDS_PAYLOAD")

HTTP_STATUS=$(echo "$VALIDATION_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$VALIDATION_RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "422" ]; then
    echo "✅ Validation errors correctly returned (Status: $HTTP_STATUS)"
    echo "Response: $BODY"
else
    echo "⚠️  Validation test (Expected 422, got $HTTP_STATUS)"
    echo "Response: $BODY"
fi
echo ""

# Test 5: CORS Headers Check
echo "Test 5: CORS Headers Check"
echo "-------------------------"
CORS_RESPONSE=$(curl -s -I -X OPTIONS "$API_URL/issues" \
  -H "Origin: http://example.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type")

if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    echo "✅ CORS headers present"
    echo "$CORS_RESPONSE" | grep -i "access-control"
else
    echo "⚠️  CORS headers not found (may be configured differently)"
fi
echo ""

echo "=========================================="
echo "Testing Complete"
echo "=========================================="

