#!/bin/bash
# Reset PostgreSQL Password Script
# This script resets the PostgreSQL password without losing data

set -e

echo "🔧 PostgreSQL Password Reset Script"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get password from environment or prompt
if [ -z "$DATABASE_PASSWORD" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_PASSWORD not set in environment${NC}"
    read -sp "Enter new PostgreSQL password: " NEW_PASSWORD
    echo ""
    read -sp "Confirm password: " CONFIRM_PASSWORD
    echo ""
    
    if [ "$NEW_PASSWORD" != "$CONFIRM_PASSWORD" ]; then
        echo -e "${RED}❌ Passwords do not match!${NC}"
        exit 1
    fi
    
    DATABASE_PASSWORD="$NEW_PASSWORD"
fi

# Get other database settings
DATABASE_USER=${DATABASE_USER:-postgres}
DATABASE_NAME=${DATABASE_NAME:-issue_collector}
CONTAINER_NAME=${CONTAINER_NAME:-issue-collector-postgres}

echo -e "${GREEN}✓ Using password from environment${NC}"
echo ""
echo "📋 Configuration:"
echo "  Container: $CONTAINER_NAME"
echo "  User: $DATABASE_USER"
echo "  Database: $DATABASE_NAME"
echo ""

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${RED}❌ Container '$CONTAINER_NAME' is not running!${NC}"
    echo "💡 Start the container first: docker start $CONTAINER_NAME"
    exit 1
fi

echo -e "${YELLOW}🔄 Resetting PostgreSQL password...${NC}"
echo ""

# Method 1: Use ALTER USER (requires current password or trust authentication)
# First, try to connect without password (if pg_hba.conf allows trust for local)
# If that fails, we'll need to temporarily modify pg_hba.conf

# Check if we can connect without password (trust method)
if docker exec -e PGPASSWORD="" $CONTAINER_NAME psql -U $DATABASE_USER -d $DATABASE_NAME -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Can connect without password (trust method)"
    echo "🔄 Changing password..."
    docker exec $CONTAINER_NAME psql -U $DATABASE_USER -d $DATABASE_NAME -c "ALTER USER $DATABASE_USER WITH PASSWORD '$DATABASE_PASSWORD';"
    echo -e "${GREEN}✅ Password changed successfully!${NC}"
else
    echo -e "${YELLOW}⚠️  Cannot connect without password. Trying alternative method...${NC}"
    echo ""
    echo "📝 Method: Temporarily modify pg_hba.conf to allow trust authentication"
    echo ""
    
    # Backup pg_hba.conf
    echo "📦 Creating backup of pg_hba.conf..."
    docker exec $CONTAINER_NAME cp /var/lib/postgresql/data/pg_hba.conf /var/lib/postgresql/data/pg_hba.conf.backup
    
    # Add trust line at the beginning (for local connections only)
    echo "✏️  Modifying pg_hba.conf..."
    docker exec $CONTAINER_NAME sh -c "echo 'local   all             all                                     trust' > /tmp/pg_hba_trust.conf && \
        echo 'host    all             all             127.0.0.1/32            trust' >> /tmp/pg_hba_trust.conf && \
        cat /var/lib/postgresql/data/pg_hba.conf >> /tmp/pg_hba_trust.conf && \
        cp /tmp/pg_hba_trust.conf /var/lib/postgresql/data/pg_hba.conf"
    
    # Reload PostgreSQL configuration
    echo "🔄 Reloading PostgreSQL configuration..."
    docker exec $CONTAINER_NAME psql -U $DATABASE_USER -d $DATABASE_NAME -c "SELECT pg_reload_conf();" > /dev/null 2>&1 || \
        docker exec $CONTAINER_NAME su - postgres -c "pg_ctl reload" > /dev/null 2>&1 || \
        echo "⚠️  Could not reload config, restarting container..." && docker restart $CONTAINER_NAME && sleep 5
    
    # Wait for PostgreSQL to be ready
    echo "⏳ Waiting for PostgreSQL to be ready..."
    for i in {1..30}; do
        if docker exec $CONTAINER_NAME pg_isready -U $DATABASE_USER > /dev/null 2>&1; then
            break
        fi
        sleep 1
    done
    
    # Change password
    echo "🔄 Changing password..."
    docker exec $CONTAINER_NAME psql -U $DATABASE_USER -d $DATABASE_NAME -c "ALTER USER $DATABASE_USER WITH PASSWORD '$DATABASE_PASSWORD';"
    
    # Restore original pg_hba.conf
    echo "📦 Restoring original pg_hba.conf..."
    docker exec $CONTAINER_NAME cp /var/lib/postgresql/data/pg_hba.conf.backup /var/lib/postgresql/data/pg_hba.conf
    
    # Reload configuration again
    echo "🔄 Reloading PostgreSQL configuration..."
    docker exec $CONTAINER_NAME psql -U $DATABASE_USER -d $DATABASE_NAME -c "SELECT pg_reload_conf();" > /dev/null 2>&1 || \
        docker exec $CONTAINER_NAME su - postgres -c "pg_ctl reload" > /dev/null 2>&1 || \
        echo "⚠️  Could not reload config, restarting container..." && docker restart $CONTAINER_NAME && sleep 5
    
    echo -e "${GREEN}✅ Password changed successfully!${NC}"
fi

echo ""
echo -e "${GREEN}✅ Password reset completed!${NC}"
echo ""
echo "💡 Next steps:"
echo "   1. Update stack.env with the new password: DATABASE_PASSWORD=$DATABASE_PASSWORD"
echo "   2. Restart the API container: docker restart issue-collector-api"
echo "   3. Test connection: docker exec $CONTAINER_NAME psql -U $DATABASE_USER -d $DATABASE_NAME -c 'SELECT version();'"
echo ""
echo "🔐 Connection string:"
echo "   postgresql://$DATABASE_USER:$DATABASE_PASSWORD@postgres:5432/$DATABASE_NAME"



