#!/bin/bash
# Quick fix script for 502 Bad Gateway errors

set -e

echo "=========================================="
echo "🔧 Fixing 502 Bad Gateway Errors"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "infra/docker/docker-compose.prod.yml" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    echo "   Current directory: $(pwd)"
    exit 1
fi

echo "📦 Step 1: Checking container status..."
echo ""

# Check containers
API_RUNNING=$(docker ps | grep -q issue-collector-api && echo "yes" || echo "no")
ADMIN_RUNNING=$(docker ps | grep -q issue-collector-admin && echo "yes" || echo "no")
FRONTEND_RUNNING=$(docker ps | grep -q issue-collector-frontend && echo "yes" || echo "no")

echo "   API Container:      $([ "$API_RUNNING" = "yes" ] && echo -e "${GREEN}✅ Running${NC}" || echo -e "${RED}❌ Not Running${NC}")"
echo "   Admin Container:    $([ "$ADMIN_RUNNING" = "yes" ] && echo -e "${GREEN}✅ Running${NC}" || echo -e "${RED}❌ Not Running${NC}")"
echo "   Frontend Container: $([ "$FRONTEND_RUNNING" = "yes" ] && echo -e "${GREEN}✅ Running${NC}" || echo -e "${RED}❌ Not Running${NC}")"
echo ""

if [ "$API_RUNNING" = "no" ] || [ "$ADMIN_RUNNING" = "no" ] || [ "$FRONTEND_RUNNING" = "no" ]; then
    echo -e "${YELLOW}⚠️  Some containers are not running. Attempting to start them...${NC}"
    echo ""
    
    cd infra/docker
    
    echo "📦 Step 2: Starting containers..."
    docker-compose -f docker-compose.prod.yml up -d
    
    echo ""
    echo "⏳ Waiting 10 seconds for containers to start..."
    sleep 10
    
    echo ""
    echo "📦 Step 3: Checking container status again..."
    API_RUNNING=$(docker ps | grep -q issue-collector-api && echo "yes" || echo "no")
    ADMIN_RUNNING=$(docker ps | grep -q issue-collector-admin && echo "yes" || echo "no")
    FRONTEND_RUNNING=$(docker ps | grep -q issue-collector-frontend && echo "yes" || echo "no")
    
    echo "   API Container:      $([ "$API_RUNNING" = "yes" ] && echo -e "${GREEN}✅ Running${NC}" || echo -e "${RED}❌ Not Running${NC}")"
    echo "   Admin Container:    $([ "$ADMIN_RUNNING" = "yes" ] && echo -e "${GREEN}✅ Running${NC}" || echo -e "${RED}❌ Not Running${NC}")"
    echo "   Frontend Container: $([ "$FRONTEND_RUNNING" = "yes" ] && echo -e "${GREEN}✅ Running${NC}" || echo -e "${RED}❌ Not Running${NC}")"
    echo ""
    
    if [ "$API_RUNNING" = "no" ] || [ "$ADMIN_RUNNING" = "no" ] || [ "$FRONTEND_RUNNING" = "no" ]; then
        echo -e "${RED}❌ Some containers failed to start. Checking logs...${NC}"
        echo ""
        
        [ "$API_RUNNING" = "no" ] && echo "📋 API Container Logs:" && docker logs issue-collector-api --tail 20 2>&1 | sed 's/^/   /' && echo ""
        [ "$ADMIN_RUNNING" = "no" ] && echo "📋 Admin Container Logs:" && docker logs issue-collector-admin --tail 20 2>&1 | sed 's/^/   /' && echo ""
        [ "$FRONTEND_RUNNING" = "no" ] && echo "📋 Frontend Container Logs:" && docker logs issue-collector-frontend --tail 20 2>&1 | sed 's/^/   /' && echo ""
        
        echo -e "${YELLOW}💡 Next steps:${NC}"
        echo "   1. Check the logs above for errors"
        echo "   2. Verify Docker images are built: docker images | grep issue-collector"
        echo "   3. Rebuild images if needed: cd infra/docker && docker-compose -f docker-compose.prod.yml build"
        echo "   4. Check port conflicts: sudo netstat -tulpn | grep -E ':(3410|3411|3412)'"
        exit 1
    fi
fi

echo "📦 Step 4: Testing container connectivity..."
echo ""

# Test API
echo -n "   Testing API (port 3410): "
if curl -s -f http://localhost:3410/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ Failed${NC}"
    echo "      Logs: docker logs issue-collector-api --tail 10"
fi

# Test Admin
echo -n "   Testing Admin (port 3411): "
if curl -s -f http://localhost:3411/admin > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ Failed${NC}"
    echo "      Logs: docker logs issue-collector-admin --tail 10"
fi

# Test Frontend
echo -n "   Testing Frontend (port 3412): "
if curl -s -f http://localhost:3412/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ Failed${NC}"
    echo "      Logs: docker logs issue-collector-frontend --tail 10"
fi

echo ""
echo "📦 Step 5: Testing static assets..."
echo ""

# Test admin images
echo -n "   Testing /images/logo/logo-icon.svg: "
if curl -s -f http://localhost:3411/images/logo/logo-icon.svg > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${YELLOW}⚠️  Not found (may be normal if file doesn't exist)${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Fix complete!${NC}"
echo "=========================================="
echo ""
echo "If you're still seeing 502 errors:"
echo "  1. Check nginx is running: sudo systemctl status nginx"
echo "  2. Test nginx config: sudo nginx -t"
echo "  3. Reload nginx: sudo systemctl reload nginx"
echo "  4. Check nginx error logs: sudo tail -f /var/log/nginx/error.log"
echo ""

