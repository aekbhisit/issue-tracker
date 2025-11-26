#!/bin/bash

# IC-2 Collector SDK Verification Script
# This script helps verify that IC-2 implementation is complete

echo "=========================================="
echo "IC-2 Collector SDK Verification"
echo "=========================================="
echo ""

ERRORS=0

# 1. Check SDK Build
echo "1. Checking SDK build..."
if [ -f "apps/collector-sdk/dist/collector.min.js" ]; then
    SIZE=$(ls -lh apps/collector-sdk/dist/collector.min.js | awk '{print $5}')
    echo "   ✅ SDK built successfully: $SIZE"
else
    echo "   ❌ SDK build missing - Run: pnpm build:sdk"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 2. Check API Server
echo "2. Checking API server..."
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4501/api/public/v1/health 2>/dev/null)
if [ "$API_RESPONSE" = "200" ]; then
    echo "   ✅ API server is running on port 4501"
else
    echo "   ⚠️  API server not responding (status: $API_RESPONSE)"
    echo "      Make sure API server is running: pnpm dev:api"
fi
echo ""

# 3. Check API Routes
echo "3. Checking API routes..."
if grep -q "router.use('/issues'" apps/api/src/routes/public/v1/index.ts 2>/dev/null; then
    echo "   ✅ Issue routes registered"
else
    echo "   ❌ Issue routes not found"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 4. Check SDK Source Files
echo "4. Checking SDK source files..."
REQUIRED_FILES=(
    "apps/collector-sdk/src/index.ts"
    "apps/collector-sdk/src/types.ts"
    "apps/collector-sdk/src/widget.ts"
    "apps/collector-sdk/src/button.ts"
    "apps/collector-sdk/src/modal.ts"
    "apps/collector-sdk/src/metadata.ts"
    "apps/collector-sdk/src/api.ts"
)

MISSING_FILES=0
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "   ❌ Missing: $file"
        MISSING_FILES=$((MISSING_FILES + 1))
    fi
done

if [ $MISSING_FILES -eq 0 ]; then
    echo "   ✅ All SDK source files present"
else
    ERRORS=$((ERRORS + MISSING_FILES))
fi
echo ""

# 5. Check API Module Files
echo "5. Checking API module files..."
API_FILES=(
    "apps/api/src/modules/issue/issue.types.ts"
    "apps/api/src/modules/issue/issue.service.ts"
    "apps/api/src/modules/issue/issue.controller.ts"
    "apps/api/src/modules/issue/issue.validation.ts"
    "apps/api/src/modules/issue/routes/public.routes.ts"
)

MISSING_API_FILES=0
for file in "${API_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "   ❌ Missing: $file"
        MISSING_API_FILES=$((MISSING_API_FILES + 1))
    fi
done

if [ $MISSING_API_FILES -eq 0 ]; then
    echo "   ✅ All API module files present"
else
    ERRORS=$((ERRORS + MISSING_API_FILES))
fi
echo ""

# 6. Check Documentation
echo "6. Checking documentation..."
if [ -f "apps/collector-sdk/README.md" ] && [ -f "docs/api/public/collector-sdk.md" ]; then
    echo "   ✅ Documentation files present"
else
    echo "   ⚠️  Some documentation files missing"
fi
echo ""

# 7. Check Test Page
echo "7. Checking test page..."
if [ -f "apps/collector-sdk/test/index.html" ]; then
    echo "   ✅ Test HTML page present"
else
    echo "   ⚠️  Test HTML page missing"
fi
echo ""

# Summary
echo "=========================================="
if [ $ERRORS -eq 0 ]; then
    echo "✅ Verification Complete - No Errors Found"
    echo ""
    echo "Next Steps:"
    echo "1. Start API server: pnpm dev:api"
    echo "2. Get a project key from admin dashboard"
    echo "3. Update apps/collector-sdk/test/index.html with your project key"
    echo "4. Open test page in browser and verify functionality"
    echo ""
    echo "See apps/collector-sdk/VERIFICATION.md for detailed testing guide"
else
    echo "❌ Verification Failed - $ERRORS error(s) found"
    echo ""
    echo "Please fix the errors above and run this script again"
fi
echo "=========================================="

exit $ERRORS

