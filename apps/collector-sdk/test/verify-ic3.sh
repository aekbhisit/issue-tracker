#!/bin/bash

# IC-3 Testing and Verification Script
# This script automates Phase 1 (Build Verification) and provides guidance for manual testing

set -e

echo "=========================================="
echo "IC-3 Testing and Verification"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Function to check and report
check_result() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} $1"
        ((FAILED++))
        return 1
    fi
}

# Phase 1: Build Verification
echo "Phase 1: Build and File Structure Verification"
echo "------------------------------------------"

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    echo "Error: Must run from apps/collector-sdk directory"
    exit 1
fi

# Build SDK
echo "1. Building SDK..."
pnpm build > /dev/null 2>&1
check_result "SDK build completed"

# Check build output
if [ -f "dist/collector.min.js" ]; then
    FILE_SIZE=$(du -h dist/collector.min.js | awk '{print $1}')
    GZIP_SIZE=$(gzip -c dist/collector.min.js | wc -c | awk '{printf "%.2f", $1/1024}')
    echo -e "   ${GREEN}✓${NC} Build file exists: dist/collector.min.js"
    echo "   File size: $FILE_SIZE"
    echo "   Gzipped size: ${GZIP_SIZE} KB"
    
    # Check if gzipped size is under 150KB
    GZIP_SIZE_KB=$(echo "$GZIP_SIZE" | awk '{print int($1)}')
    if [ "$GZIP_SIZE_KB" -lt 150 ]; then
        echo -e "   ${GREEN}✓${NC} Bundle size is acceptable (< 150KB gzipped)"
        ((PASSED++))
    else
        echo -e "   ${YELLOW}⚠${NC} Bundle size exceeds 150KB target (${GZIP_SIZE_KB}KB)"
        ((FAILED++))
    fi
else
    echo -e "   ${RED}✗${NC} Build file not found"
    ((FAILED++))
fi

# Check source files
echo ""
echo "2. Checking source files..."
REQUIRED_FILES=(
    "src/inspect.ts"
    "src/screenshot.ts"
    "src/selectors.ts"
    "src/modal.ts"
    "src/widget.ts"
    "src/types.ts"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "   ${GREEN}✓${NC} $file exists"
        ((PASSED++))
    else
        echo -e "   ${RED}✗${NC} $file not found"
        ((FAILED++))
    fi
done

# TypeScript typecheck
echo ""
echo "3. Running TypeScript typecheck..."
pnpm typecheck > /dev/null 2>&1
check_result "TypeScript typecheck passed"

# Summary
echo ""
echo "=========================================="
echo "Phase 1 Summary"
echo "=========================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ Phase 1: BUILD VERIFICATION PASSED${NC}"
    echo ""
    echo "Next Steps:"
    echo "1. Start API server: pnpm dev:api"
    echo "2. Get a project key from admin dashboard"
    echo "3. Update apps/collector-sdk/test/index.html with your project key"
    echo "4. Serve test page: cd apps/collector-sdk/test && python3 -m http.server 8080"
    echo "5. Open http://localhost:8080/index.html in browser"
    echo "6. Follow manual testing steps in IC-3-TEST-RESULTS.md"
    exit 0
else
    echo -e "${RED}✗ Phase 1: BUILD VERIFICATION FAILED${NC}"
    echo "Please fix the errors above before proceeding."
    exit 1
fi

