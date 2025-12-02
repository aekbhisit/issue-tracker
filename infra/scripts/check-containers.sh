#!/bin/bash
# Quick diagnostic script to check container status and connectivity

echo "=========================================="
echo "🔍 Container Status Check"
echo "=========================================="
echo ""

# Check if containers are running
echo "📦 Checking container status..."
docker ps -a --filter "name=issue-collector" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# Check specific containers
echo "🔍 Detailed Container Status:"
echo ""

echo "1. API Container (port 3410):"
if docker ps | grep -q issue-collector-api; then
    echo "   ✅ Running"
    echo "   Testing connectivity..."
    if curl -s -f http://localhost:3410/health > /dev/null 2>&1; then
        echo "   ✅ Health check passed"
    else
        echo "   ❌ Health check failed"
        echo "   Recent logs:"
        docker logs issue-collector-api --tail 10 2>&1 | sed 's/^/      /'
    fi
else
    echo "   ❌ Not running"
fi
echo ""

echo "2. Admin Container (port 3411):"
if docker ps | grep -q issue-collector-admin; then
    echo "   ✅ Running"
    echo "   Testing connectivity..."
    if curl -s -f http://localhost:3411/admin > /dev/null 2>&1; then
        echo "   ✅ Responding"
    else
        echo "   ❌ Not responding"
        echo "   Recent logs:"
        docker logs issue-collector-admin --tail 10 2>&1 | sed 's/^/      /'
    fi
else
    echo "   ❌ Not running"
fi
echo ""

echo "3. Frontend Container (port 3412):"
if docker ps | grep -q issue-collector-frontend; then
    echo "   ✅ Running"
    echo "   Testing connectivity..."
    if curl -s -f http://localhost:3412/ > /dev/null 2>&1; then
        echo "   ✅ Responding"
    else
        echo "   ❌ Not responding"
        echo "   Recent logs:"
        docker logs issue-collector-frontend --tail 20 2>&1 | sed 's/^/      /'
    fi
else
    echo "   ❌ Not running"
    echo "   Checking if container exists..."
    if docker ps -a | grep -q issue-collector-frontend; then
        echo "   Container exists but stopped. Last logs:"
        docker logs issue-collector-frontend --tail 20 2>&1 | sed 's/^/      /'
    fi
fi
echo ""

# Check port availability
echo "🔌 Checking port availability:"
for port in 3410 3411 3412; do
    if netstat -tuln 2>/dev/null | grep -q ":$port " || ss -tuln 2>/dev/null | grep -q ":$port "; then
        echo "   ✅ Port $port is in use"
    else
        echo "   ❌ Port $port is NOT in use (container may not be running)"
    fi
done
echo ""

# Check nginx connectivity
echo "🌐 Checking nginx configuration:"
if command -v nginx > /dev/null 2>&1; then
    if sudo nginx -t 2>&1 | grep -q "successful"; then
        echo "   ✅ Nginx configuration is valid"
    else
        echo "   ❌ Nginx configuration has errors:"
        sudo nginx -t 2>&1 | sed 's/^/      /'
    fi
else
    echo "   ⚠️  Nginx not found in PATH"
fi
echo ""

# Summary
echo "=========================================="
echo "📊 Summary"
echo "=========================================="
echo ""

api_running=$(docker ps | grep -q issue-collector-api && echo "yes" || echo "no")
admin_running=$(docker ps | grep -q issue-collector-admin && echo "yes" || echo "no")
frontend_running=$(docker ps | grep -q issue-collector-frontend && echo "yes" || echo "no")

if [ "$api_running" = "yes" ] && [ "$admin_running" = "yes" ] && [ "$frontend_running" = "yes" ]; then
    echo "✅ All containers are running"
    echo ""
    echo "If you're still seeing 502 errors, check:"
    echo "  1. Nginx configuration: sudo nginx -t"
    echo "  2. Nginx error logs: sudo tail -f /var/log/nginx/error.log"
    echo "  3. Container logs: docker logs issue-collector-frontend"
else
    echo "❌ Some containers are not running:"
    [ "$api_running" = "no" ] && echo "   - API container"
    [ "$admin_running" = "no" ] && echo "   - Admin container"
    [ "$frontend_running" = "no" ] && echo "   - Frontend container"
    echo ""
    echo "To start containers:"
    echo "  cd infra/docker"
    echo "  docker-compose -f docker-compose.prod.yml up -d"
fi
echo ""


