#!/bin/bash

# IC-4 Testing Environment Startup Script
# This script helps set up the testing environment

set -e

echo "=========================================="
echo "IC-4 Testing Environment Setup"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if API server is running
echo "1. Checking API server..."
if curl -s http://localhost:4501/api/health > /dev/null 2>&1; then
    echo -e "   ${GREEN}✓${NC} API server is running on http://localhost:4501"
else
    echo -e "   ${YELLOW}⚠${NC} API server is not running"
    echo "   To start it, run: pnpm dev:api"
    echo ""
fi

# Check if admin dashboard is running
echo "2. Checking admin dashboard..."
if curl -s http://localhost:4502 > /dev/null 2>&1; then
    echo -e "   ${GREEN}✓${NC} Admin dashboard is running on http://localhost:4502"
else
    echo -e "   ${YELLOW}⚠${NC} Admin dashboard is not running"
    echo "   To start it, run: pnpm dev:admin"
    echo ""
fi

# Check SDK build
echo "3. Checking SDK build..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
if [ -f "$PROJECT_ROOT/apps/collector-sdk/dist/collector.min.js" ]; then
    SDK_SIZE=$(du -h "$PROJECT_ROOT/apps/collector-sdk/dist/collector.min.js" | awk '{print $1}')
    echo -e "   ${GREEN}✓${NC} SDK build exists: ${SDK_SIZE}"
else
    echo -e "   ${RED}✗${NC} SDK build not found"
    echo "   Building SDK..."
    cd "$PROJECT_ROOT"
    pnpm --filter=collector-sdk build
    echo -e "   ${GREEN}✓${NC} SDK build complete"
fi

# Check test page
echo "4. Checking test page..."
TEST_PAGE="$SCRIPT_DIR/index-ic4.html"
if [ -f "$TEST_PAGE" ]; then
    echo -e "   ${GREEN}✓${NC} Test page exists: index-ic4.html"
    
    # Check if project key is set
    if grep -q "YOUR_PROJECT_KEY" "$TEST_PAGE"; then
        echo -e "   ${YELLOW}⚠${NC} Project key not set in index-ic4.html"
        echo "   Please update the data-project-key attribute with a real project key"
        echo "   Get project key from: http://localhost:4502/admin/projects"
    else
        echo -e "   ${GREEN}✓${NC} Project key appears to be set"
    fi
else
    echo -e "   ${RED}✗${NC} Test page not found at $TEST_PAGE"
fi

# Check if test server port is available
echo "5. Checking test server port..."
if lsof -ti:8080 > /dev/null 2>&1; then
    echo -e "   ${YELLOW}⚠${NC} Port 8080 is already in use"
    echo "   Please stop the existing server or use a different port"
else
    echo -e "   ${GREEN}✓${NC} Port 8080 is available"
fi

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. If API server is not running, start it:"
echo "   ${YELLOW}pnpm dev:api${NC}"
echo ""
echo "2. If admin dashboard is not running, start it:"
echo "   ${YELLOW}pnpm dev:admin${NC}"
echo ""
echo "3. Update project key in index-ic4.html:"
echo "   - Go to http://localhost:4502/admin/projects"
echo "   - Copy a project's publicKey"
echo "   - Replace YOUR_PROJECT_KEY in index-ic4.html"
echo ""
echo "4. Start test server:"
echo "   ${YELLOW}python3 -m http.server 8080${NC}"
echo ""
echo "5. Open test page in browser:"
echo "   ${GREEN}http://localhost:8080/index-ic4.html${NC}"
echo ""
echo "6. Follow testing instructions:"
echo "   - Quick start: ${YELLOW}QUICK-START-TESTING-IC4.md${NC}"
echo "   - Full guide: ${YELLOW}TESTING-INSTRUCTIONS-IC4.md${NC}"
echo "   - Record results: ${YELLOW}IC-4-TEST-RESULTS.md${NC}"
echo ""

