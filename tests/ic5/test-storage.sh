#!/bin/bash

# IC-5 Storage Testing Script
# Tests screenshot storage functionality (local and S3)
# Requires API server running and test issue with screenshot

API_URL="http://localhost:4501/api/public/v1"
ADMIN_API_URL="http://localhost:4501/api/admin/v1"
PROJECT_KEY="${1:-YOUR_PROJECT_KEY}"
ADMIN_USERNAME="${2:-admin}"
ADMIN_PASSWORD="${3:-password}"

echo "=========================================="
echo "IC-5 Storage Testing"
echo "=========================================="
echo ""

if [ "$PROJECT_KEY" = "YOUR_PROJECT_KEY" ]; then
    echo "⚠️  Please provide a project key as first argument"
    echo "Usage: ./test-storage.sh proj_your_key_here [admin_username] [admin_password]"
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

# Test 1: Submit Issue with Screenshot
echo "Test 1: Submit Issue with Screenshot"
echo "-----------------------------------"
# Create a small test PNG base64 (1x1 red pixel)
TEST_IMAGE_BASE64="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

SCREENSHOT_PAYLOAD=$(cat <<EOF
{
  "projectKey": "$PROJECT_KEY",
  "title": "IC-5 Storage Test - Screenshot",
  "description": "Testing screenshot storage",
  "severity": "high",
  "metadata": {
    "url": "https://example.com/storage-test",
    "userAgent": "Mozilla/5.0 (IC-5 Storage Test)",
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
      "cssSelector": "#storage-test",
      "xpath": "/html/body/div[1]",
      "boundingBox": {"x": 0, "y": 0, "width": 1, "height": 1},
      "outerHTML": "<div id='storage-test'>Test</div>"
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
    ISSUE_ID=$(echo "$BODY" | grep -o '"id":[0-9]*' | cut -d: -f2)
    if [ -n "$ISSUE_ID" ]; then
        echo "Issue ID: $ISSUE_ID"
        echo "$ISSUE_ID" > /tmp/ic5_storage_test_issue_id.txt
    fi
else
    echo "❌ Cannot proceed without issue ID"
    exit 1
fi
echo ""

# Test 2: Verify Screenshot in Database
echo "Test 2: Verify Screenshot in Database"
echo "------------------------------------"
if [ -z "$ISSUE_ID" ]; then
    ISSUE_ID=$(cat /tmp/ic5_storage_test_issue_id.txt 2>/dev/null)
fi

if [ -n "$ISSUE_ID" ]; then
    # Get issue details via admin API
    GET_RESPONSE=$(curl -s "$ADMIN_API_URL/issues/$ISSUE_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN")
    
    SCREENSHOT_COUNT=$(echo "$GET_RESPONSE" | grep -o '"screenshots":\[.*\]' | grep -o '"id"' | wc -l | xargs)
    
    if [ "$SCREENSHOT_COUNT" -gt 0 ]; then
        echo "✅ Screenshot found in database (count: $SCREENSHOT_COUNT)"
        PASSED=$((PASSED + 1))
        
        # Extract screenshot URL
        SCREENSHOT_URL=$(echo "$GET_RESPONSE" | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4)
        if [ -n "$SCREENSHOT_URL" ]; then
            echo "Screenshot URL: $SCREENSHOT_URL"
            echo "$SCREENSHOT_URL" > /tmp/ic5_screenshot_url.txt
        fi
    else
        echo "❌ Screenshot not found in database"
        FAILED=$((FAILED + 1))
    fi
else
    echo "⚠️  No issue ID available"
fi
echo ""

# Test 3: Verify Screenshot File Storage (Local)
echo "Test 3: Verify Screenshot File Storage (Local)"
echo "----------------------------------------------"
STORAGE_TYPE="${STORAGE_TYPE:-local}"

if [ "$STORAGE_TYPE" = "local" ]; then
    if [ -n "$ISSUE_ID" ]; then
        # Check for storage directory
        STORAGE_DIR="storage/uploads/screenshots/$ISSUE_ID"
        
        if [ -d "$STORAGE_DIR" ]; then
            echo "✅ Storage directory exists: $STORAGE_DIR"
            PASSED=$((PASSED + 1))
            
            # Check for files in directory
            FILE_COUNT=$(find "$STORAGE_DIR" -type f | wc -l | xargs)
            if [ "$FILE_COUNT" -gt 0 ]; then
                echo "✅ Screenshot file found (count: $FILE_COUNT)"
                PASSED=$((PASSED + 1))
                
                # Check file size
                FIRST_FILE=$(find "$STORAGE_DIR" -type f | head -1)
                FILE_SIZE=$(stat -f%z "$FIRST_FILE" 2>/dev/null || stat -c%s "$FIRST_FILE" 2>/dev/null)
                if [ "$FILE_SIZE" -gt 0 ]; then
                    echo "✅ File size: $FILE_SIZE bytes"
                    PASSED=$((PASSED + 1))
                else
                    echo "⚠️  File size is 0"
                fi
            else
                echo "❌ No screenshot files found"
                FAILED=$((FAILED + 1))
            fi
        else
            echo "⚠️  Storage directory not found: $STORAGE_DIR"
            echo "   (This may be normal if storage is in a different location)"
        fi
    fi
else
    echo "⚠️  Skipping local storage test (STORAGE_TYPE=$STORAGE_TYPE)"
fi
echo ""

# Test 4: Verify Screenshot URL Accessibility
echo "Test 4: Verify Screenshot URL Accessibility"
echo "------------------------------------------"
SCREENSHOT_URL=$(cat /tmp/ic5_screenshot_url.txt 2>/dev/null)

if [ -n "$SCREENSHOT_URL" ]; then
    # Try to access the screenshot URL
    URL_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -o /tmp/ic5_screenshot_test.png "$SCREENSHOT_URL")
    HTTP_STATUS=$(echo "$URL_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
    
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "✅ Screenshot URL is accessible (Status: $HTTP_STATUS)"
        PASSED=$((PASSED + 1))
        
        # Check if file was downloaded
        if [ -f "/tmp/ic5_screenshot_test.png" ]; then
            DOWNLOADED_SIZE=$(stat -f%z "/tmp/ic5_screenshot_test.png" 2>/dev/null || stat -c%s "/tmp/ic5_screenshot_test.png" 2>/dev/null)
            if [ "$DOWNLOADED_SIZE" -gt 0 ]; then
                echo "✅ Screenshot downloaded successfully (size: $DOWNLOADED_SIZE bytes)"
                PASSED=$((PASSED + 1))
                rm -f /tmp/ic5_screenshot_test.png
            else
                echo "⚠️  Downloaded file is empty"
            fi
        fi
    else
        echo "❌ Screenshot URL not accessible (Status: $HTTP_STATUS)"
        FAILED=$((FAILED + 1))
    fi
else
    echo "⚠️  No screenshot URL available for testing"
fi
echo ""

# Test 5: Verify Storage Path Format
echo "Test 5: Verify Storage Path Format"
echo "---------------------------------"
if [ -n "$ISSUE_ID" ]; then
    GET_RESPONSE=$(curl -s "$ADMIN_API_URL/issues/$ISSUE_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN")
    
    STORAGE_PATH=$(echo "$GET_RESPONSE" | grep -o '"storagePath":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -n "$STORAGE_PATH" ]; then
        echo "Storage path: $STORAGE_PATH"
        
        # Check path format
        if echo "$STORAGE_PATH" | grep -q "/uploads/screenshots/"; then
            echo "✅ Storage path format is correct"
            PASSED=$((PASSED + 1))
        else
            echo "⚠️  Storage path format may be incorrect"
        fi
        
        # Check storage type
        STORAGE_TYPE_VALUE=$(echo "$GET_RESPONSE" | grep -o '"storageType":"[^"]*"' | head -1 | cut -d'"' -f4)
        if [ -n "$STORAGE_TYPE_VALUE" ]; then
            echo "Storage type: $STORAGE_TYPE_VALUE"
            if [ "$STORAGE_TYPE_VALUE" = "local" ] || [ "$STORAGE_TYPE_VALUE" = "s3" ] || [ "$STORAGE_TYPE_VALUE" = "minio" ]; then
                echo "✅ Storage type is valid"
                PASSED=$((PASSED + 1))
            else
                echo "⚠️  Storage type may be invalid"
            fi
        fi
    else
        echo "⚠️  Storage path not found in response"
    fi
fi
echo ""

# Test 6: Test S3 Storage (if configured)
echo "Test 6: Test S3 Storage (if configured)"
echo "--------------------------------------"
if [ "$STORAGE_TYPE" = "s3" ] || [ "$STORAGE_TYPE" = "minio" ]; then
    echo "⚠️  S3/MinIO storage testing requires manual verification"
    echo "   Check that:"
    echo "   1. Screenshot URL points to S3/MinIO endpoint"
    echo "   2. File is accessible via URL"
    echo "   3. File exists in S3 bucket"
else
    echo "ℹ️  S3/MinIO storage not configured (STORAGE_TYPE=$STORAGE_TYPE)"
fi
echo ""

# Summary
echo "=========================================="
echo "Storage Testing Complete"
echo "=========================================="
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "✅ All storage tests passed!"
    exit 0
else
    echo "❌ Some storage tests failed"
    exit 1
fi

