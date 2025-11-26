#!/bin/bash

# IC-5 Performance Testing Script
# Benchmarks API performance with multiple issues
# Run this script when API server is running

API_URL="http://localhost:4501/api/public/v1"
ADMIN_API_URL="http://localhost:4501/api/admin/v1"
PROJECT_KEY="${1:-YOUR_PROJECT_KEY}"
ADMIN_USERNAME="${2:-admin}"
ADMIN_PASSWORD="${3:-password}"
NUM_ISSUES="${4:-10}"

echo "=========================================="
echo "IC-5 Performance Testing"
echo "=========================================="
echo ""

if [ "$PROJECT_KEY" = "YOUR_PROJECT_KEY" ]; then
    echo "⚠️  Please provide a project key as first argument"
    echo "Usage: ./test-performance.sh proj_your_key_here [admin_username] [admin_password] [num_issues]"
    exit 1
fi

echo "Creating $NUM_ISSUES test issues..."
echo ""

# Get admin token
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

# Helper function to measure time
measure_time() {
    local start=$(date +%s%N)
    eval "$@"
    local end=$(date +%s%N)
    local duration=$(( (end - start) / 1000000 ))
    echo "$duration"
}

# Test 1: Create Multiple Issues
echo "Test 1: Create Multiple Issues"
echo "-----------------------------"
ISSUE_IDS=()
TOTAL_CREATE_TIME=0

for i in $(seq 1 $NUM_ISSUES); do
    PAYLOAD=$(cat <<EOF
{
  "projectKey": "$PROJECT_KEY",
  "title": "Performance Test Issue $i",
  "description": "Performance test issue number $i",
  "severity": "medium",
  "metadata": {
    "url": "https://example.com/perf-test-$i",
    "userAgent": "Mozilla/5.0 (Performance Test)",
    "viewport": {"width": 1920, "height": 1080},
    "screen": {"width": 1920, "height": 1080},
    "language": "en-US",
    "timezone": "America/New_York",
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")"
  }
}
EOF
)
    
    CREATE_TIME=$(measure_time curl -s -X POST "$API_URL/issues" \
      -H "Content-Type: application/json" \
      -H "Origin: http://localhost:3000" \
      -d "$PAYLOAD" > /dev/null)
    
    TOTAL_CREATE_TIME=$((TOTAL_CREATE_TIME + CREATE_TIME))
    
    if [ $((i % 10)) -eq 0 ]; then
        echo "  Created $i issues..."
    fi
done

AVG_CREATE_TIME=$((TOTAL_CREATE_TIME / NUM_ISSUES))
echo "✅ Created $NUM_ISSUES issues"
echo "   Total time: ${TOTAL_CREATE_TIME}ms"
echo "   Average time per issue: ${AVG_CREATE_TIME}ms"
echo ""

# Test 2: List Issues Performance
echo "Test 2: List Issues Performance"
echo "-------------------------------"
LIST_TIMES=()

for i in {1..5}; do
    LIST_TIME=$(measure_time curl -s "$ADMIN_API_URL/issues?page=1&limit=10" \
      -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null)
    LIST_TIMES+=($LIST_TIME)
done

AVG_LIST_TIME=$(echo "${LIST_TIMES[@]}" | awk '{sum=0; for(i=1;i<=NF;i++) sum+=$i; print sum/NF}')
MIN_LIST_TIME=$(echo "${LIST_TIMES[@]}" | awk '{min=$1; for(i=2;i<=NF;i++) if($i<min) min=$i; print min}')
MAX_LIST_TIME=$(echo "${LIST_TIMES[@]}" | awk '{max=$1; for(i=2;i<=NF;i++) if($i>max) max=$i; print max}')

echo "✅ List issues performance (5 runs):"
echo "   Average: ${AVG_LIST_TIME}ms"
echo "   Min: ${MIN_LIST_TIME}ms"
echo "   Max: ${MAX_LIST_TIME}ms"
echo ""

# Test 3: Filter Performance
echo "Test 3: Filter Performance"
echo "------------------------"
FILTER_TIMES=()

for status in "open" "in_progress" "resolved"; do
    FILTER_TIME=$(measure_time curl -s "$ADMIN_API_URL/issues?status=$status" \
      -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null)
    FILTER_TIMES+=($FILTER_TIME)
done

AVG_FILTER_TIME=$(echo "${FILTER_TIMES[@]}" | awk '{sum=0; for(i=1;i<=NF;i++) sum+=$i; print sum/NF}')

echo "✅ Filter performance:"
echo "   Average filter time: ${AVG_FILTER_TIME}ms"
echo ""

# Test 4: Pagination Performance
echo "Test 4: Pagination Performance"
echo "-----------------------------"
PAGE_TIMES=()

for page in {1..5}; do
    PAGE_TIME=$(measure_time curl -s "$ADMIN_API_URL/issues?page=$page&limit=10" \
      -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null)
    PAGE_TIMES+=($PAGE_TIME)
done

AVG_PAGE_TIME=$(echo "${PAGE_TIMES[@]}" | awk '{sum=0; for(i=1;i<=NF;i++) sum+=$i; print sum/NF}')

echo "✅ Pagination performance (5 pages):"
echo "   Average page load: ${AVG_PAGE_TIME}ms"
echo ""

# Test 5: Search Performance
echo "Test 5: Search Performance"
echo "------------------------"
SEARCH_TIMES=()

for term in "test" "performance" "issue"; do
    SEARCH_TIME=$(measure_time curl -s "$ADMIN_API_URL/issues?search=$term" \
      -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null)
    SEARCH_TIMES+=($SEARCH_TIME)
done

AVG_SEARCH_TIME=$(echo "${SEARCH_TIMES[@]}" | awk '{sum=0; for(i=1;i<=NF;i++) sum+=$i; print sum/NF}')

echo "✅ Search performance:"
echo "   Average search time: ${AVG_SEARCH_TIME}ms"
echo ""

# Test 6: Get Issue by ID Performance
echo "Test 6: Get Issue by ID Performance"
echo "-----------------------------------"
# Get first issue ID
FIRST_ISSUE_ID=$(curl -s "$ADMIN_API_URL/issues?page=1&limit=1" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)

if [ -n "$FIRST_ISSUE_ID" ]; then
    GET_TIMES=()
    
    for i in {1..10}; do
        GET_TIME=$(measure_time curl -s "$ADMIN_API_URL/issues/$FIRST_ISSUE_ID" \
          -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null)
        GET_TIMES+=($GET_TIME)
    done
    
    AVG_GET_TIME=$(echo "${GET_TIMES[@]}" | awk '{sum=0; for(i=1;i<=NF;i++) sum+=$i; print sum/NF}')
    MIN_GET_TIME=$(echo "${GET_TIMES[@]}" | awk '{min=$1; for(i=2;i<=NF;i++) if($i<min) min=$i; print min}')
    MAX_GET_TIME=$(echo "${GET_TIMES[@]}" | awk '{max=$1; for(i=2;i<=NF;i++) if($i>max) max=$i; print max}')
    
    echo "✅ Get issue by ID performance (10 runs):"
    echo "   Average: ${AVG_GET_TIME}ms"
    echo "   Min: ${MIN_GET_TIME}ms"
    echo "   Max: ${MAX_GET_TIME}ms"
else
    echo "⚠️  No issue ID available for testing"
fi
echo ""

# Performance Summary
echo "=========================================="
echo "Performance Summary"
echo "=========================================="
echo "Issue Creation:"
echo "  - Average: ${AVG_CREATE_TIME}ms per issue"
echo "  - Target: < 500ms"
if [ $AVG_CREATE_TIME -lt 500 ]; then
    echo "  ✅ Within target"
else
    echo "  ⚠️  Exceeds target"
fi
echo ""

echo "List Issues:"
echo "  - Average: ${AVG_LIST_TIME}ms"
echo "  - Target: < 500ms"
if [ $(echo "$AVG_LIST_TIME < 500" | bc) -eq 1 ]; then
    echo "  ✅ Within target"
else
    echo "  ⚠️  Exceeds target"
fi
echo ""

echo "Filter:"
echo "  - Average: ${AVG_FILTER_TIME}ms"
echo "  - Target: < 500ms"
if [ $(echo "$AVG_FILTER_TIME < 500" | bc) -eq 1 ]; then
    echo "  ✅ Within target"
else
    echo "  ⚠️  Exceeds target"
fi
echo ""

echo "Pagination:"
echo "  - Average: ${AVG_PAGE_TIME}ms"
echo "  - Target: < 500ms"
if [ $(echo "$AVG_PAGE_TIME < 500" | bc) -eq 1 ]; then
    echo "  ✅ Within target"
else
    echo "  ⚠️  Exceeds target"
fi
echo ""

echo "Search:"
echo "  - Average: ${AVG_SEARCH_TIME}ms"
echo "  - Target: < 500ms"
if [ $(echo "$AVG_SEARCH_TIME < 500" | bc) -eq 1 ]; then
    echo "  ✅ Within target"
else
    echo "  ⚠️  Exceeds target"
fi
echo ""

if [ -n "$FIRST_ISSUE_ID" ]; then
    echo "Get Issue by ID:"
    echo "  - Average: ${AVG_GET_TIME}ms"
    echo "  - Target: < 200ms"
    if [ $(echo "$AVG_GET_TIME < 200" | bc) -eq 1 ]; then
        echo "  ✅ Within target"
    else
        echo "  ⚠️  Exceeds target"
    fi
fi
echo ""

echo "Performance testing complete!"
echo ""

