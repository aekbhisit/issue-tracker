#!/bin/bash

# IC-5 Test Data Setup Script
# Creates test data for comprehensive testing
# Requires API server running

API_URL="http://localhost:4501/api/public/v1"
ADMIN_API_URL="http://localhost:4501/api/admin/v1"
PROJECT_KEY="${1:-YOUR_PROJECT_KEY}"
ADMIN_USERNAME="${2:-admin}"
ADMIN_PASSWORD="${3:-password}"

echo "=========================================="
echo "IC-5 Test Data Setup"
echo "=========================================="
echo ""

if [ "$PROJECT_KEY" = "YOUR_PROJECT_KEY" ]; then
    echo "⚠️  Please provide a project key as first argument"
    echo "Usage: ./setup-test-data.sh proj_your_key_here [admin_username] [admin_password]"
    exit 1
fi

# Get admin token
echo "Getting admin token..."
LOGIN_PAYLOAD=$(cat <<EOF
{
  "email": "$ADMIN_USERNAME",
  "password": "$ADMIN_PASSWORD"
}
EOF
)

ADMIN_TOKEN=$(curl -s -X POST "$ADMIN_API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "$LOGIN_PAYLOAD" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
    echo "❌ Failed to get admin token"
    exit 1
fi

echo "✅ Admin token obtained"
echo ""

# Test image base64 (1x1 red pixel)
TEST_IMAGE_BASE64="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

# Function to create issue
create_issue() {
    local title=$1
    local description=$2
    local severity=$3
    local status=$4
    local with_screenshot=$5
    local with_logs=$6
    
    local payload="{"
    payload+="\"projectKey\": \"$PROJECT_KEY\","
    payload+="\"title\": \"$title\","
    payload+="\"description\": \"$description\","
    payload+="\"severity\": \"$severity\","
    payload+="\"metadata\": {"
    payload+="\"url\": \"https://example.com/test\","
    payload+="\"userAgent\": \"Mozilla/5.0 (Test Data Setup)\","
    payload+="\"viewport\": {\"width\": 1920, \"height\": 1080},"
    payload+="\"screen\": {\"width\": 1920, \"height\": 1080},"
    payload+="\"language\": \"en-US\","
    payload+="\"timezone\": \"America/New_York\","
    payload+="\"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")\""
    payload+="}"
    
    if [ "$with_screenshot" = "true" ]; then
        payload+=",\"screenshot\": {"
        payload+="\"screenshot\": {"
        payload+="\"dataUrl\": \"data:image/png;base64,$TEST_IMAGE_BASE64\","
        payload+="\"mimeType\": \"image/png\","
        payload+="\"fileSize\": 95,"
        payload+="\"width\": 1,"
        payload+="\"height\": 1"
        payload+="},"
        payload+="\"selector\": {"
        payload+="\"cssSelector\": \"#test\","
        payload+="\"xpath\": \"/html/body/div[1]\","
        payload+="\"boundingBox\": {\"x\": 0, \"y\": 0, \"width\": 1, \"height\": 1},"
        payload+="\"outerHTML\": \"<div id='test'>Test</div>\""
        payload+="}"
        payload+="}"
    fi
    
    if [ "$with_logs" = "true" ]; then
        payload+=",\"logs\": {"
        payload+="\"consoleLogs\": [{\"level\": \"error\", \"message\": \"Test error\", \"timestamp\": $(date +%s)000}],"
        payload+="\"jsErrors\": [{\"message\": \"Test JS error\", \"stack\": \"Error: Test\", \"timestamp\": $(date +%s)000}],"
        payload+="\"networkErrors\": [{\"url\": \"https://api.example.com\", \"method\": \"GET\", \"error\": \"Failed\", \"timestamp\": $(date +%s)000}]"
        payload+="}"
    fi
    
    payload+="}"
    
    curl -s -X POST "$API_URL/issues" \
      -H "Content-Type: application/json" \
      -H "Origin: http://localhost:3000" \
      -d "$payload" | grep -o '"id":[0-9]*' | cut -d: -f2
}

# Create issues with different severities
echo "Creating test issues..."
echo ""

echo "1. Creating low severity issue..."
ISSUE_ID=$(create_issue "Low Severity Test Issue" "This is a low severity test issue" "low" "open" "false" "false")
if [ -n "$ISSUE_ID" ]; then
    echo "   ✅ Created issue ID: $ISSUE_ID"
else
    echo "   ❌ Failed to create issue"
fi
echo ""

echo "2. Creating medium severity issue..."
ISSUE_ID=$(create_issue "Medium Severity Test Issue" "This is a medium severity test issue" "medium" "open" "false" "false")
if [ -n "$ISSUE_ID" ]; then
    echo "   ✅ Created issue ID: $ISSUE_ID"
else
    echo "   ❌ Failed to create issue"
fi
echo ""

echo "3. Creating high severity issue..."
ISSUE_ID=$(create_issue "High Severity Test Issue" "This is a high severity test issue" "high" "open" "true" "false")
if [ -n "$ISSUE_ID" ]; then
    echo "   ✅ Created issue ID: $ISSUE_ID"
else
    echo "   ❌ Failed to create issue"
fi
echo ""

echo "4. Creating critical severity issue..."
ISSUE_ID=$(create_issue "Critical Severity Test Issue" "This is a critical severity test issue" "critical" "open" "true" "true")
if [ -n "$ISSUE_ID" ]; then
    echo "   ✅ Created issue ID: $ISSUE_ID"
else
    echo "   ❌ Failed to create issue"
fi
echo ""

echo "5. Creating in-progress issue..."
ISSUE_ID=$(create_issue "In Progress Test Issue" "This issue is in progress" "medium" "in_progress" "false" "false")
if [ -n "$ISSUE_ID" ]; then
    echo "   ✅ Created issue ID: $ISSUE_ID"
    # Update status via admin API
    curl -s -X PATCH "$ADMIN_API_URL/issues/$ISSUE_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"status": "in_progress"}' > /dev/null
else
    echo "   ❌ Failed to create issue"
fi
echo ""

echo "6. Creating resolved issue..."
ISSUE_ID=$(create_issue "Resolved Test Issue" "This issue is resolved" "low" "resolved" "false" "false")
if [ -n "$ISSUE_ID" ]; then
    echo "   ✅ Created issue ID: $ISSUE_ID"
    # Update status via admin API
    curl -s -X PATCH "$ADMIN_API_URL/issues/$ISSUE_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"status": "resolved"}' > /dev/null
else
    echo "   ❌ Failed to create issue"
fi
echo ""

echo "7. Creating closed issue..."
ISSUE_ID=$(create_issue "Closed Test Issue" "This issue is closed" "low" "closed" "false" "false")
if [ -n "$ISSUE_ID" ]; then
    echo "   ✅ Created issue ID: $ISSUE_ID"
    # Update status via admin API
    curl -s -X PATCH "$ADMIN_API_URL/issues/$ISSUE_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"status": "closed"}' > /dev/null
else
    echo "   ❌ Failed to create issue"
fi
echo ""

echo "8. Creating issue with screenshot..."
ISSUE_ID=$(create_issue "Screenshot Test Issue" "This issue has a screenshot" "high" "open" "true" "false")
if [ -n "$ISSUE_ID" ]; then
    echo "   ✅ Created issue ID: $ISSUE_ID"
else
    echo "   ❌ Failed to create issue"
fi
echo ""

echo "9. Creating issue with logs..."
ISSUE_ID=$(create_issue "Logs Test Issue" "This issue has logs" "medium" "open" "false" "true")
if [ -n "$ISSUE_ID" ]; then
    echo "   ✅ Created issue ID: $ISSUE_ID"
else
    echo "   ❌ Failed to create issue"
fi
echo ""

echo "10. Creating issue with screenshot and logs..."
ISSUE_ID=$(create_issue "Complete Test Issue" "This issue has both screenshot and logs" "critical" "open" "true" "true")
if [ -n "$ISSUE_ID" ]; then
    echo "   ✅ Created issue ID: $ISSUE_ID"
else
    echo "   ❌ Failed to create issue"
fi
echo ""

# Verify issues created
echo "Verifying issues created..."
TOTAL_ISSUES=$(curl -s "$ADMIN_API_URL/issues" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | grep -o '"total":[0-9]*' | cut -d: -f2)

if [ -n "$TOTAL_ISSUES" ]; then
    echo "✅ Total issues in database: $TOTAL_ISSUES"
else
    echo "⚠️  Could not verify total issues"
fi
echo ""

echo "=========================================="
echo "Test Data Setup Complete"
echo "=========================================="
echo ""
echo "Test data includes:"
echo "  - Issues with all severity levels (low, medium, high, critical)"
echo "  - Issues with all statuses (open, in_progress, resolved, closed)"
echo "  - Issues with screenshots"
echo "  - Issues with logs"
echo "  - Issues with both screenshots and logs"
echo ""
echo "You can now run other test scripts to verify functionality."
echo ""

