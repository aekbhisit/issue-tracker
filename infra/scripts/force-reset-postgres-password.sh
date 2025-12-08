#!/bin/bash
# Force Reset PostgreSQL Password Script
# This script temporarily modifies pg_hba.conf to allow password reset without knowing the current password

set -e

echo "🔧 Force Reset PostgreSQL Password Script"
echo "=========================================="
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

echo "📋 Configuration:"
echo "  Container: $CONTAINER_NAME"
echo "  User: $DATABASE_USER"
echo "  Database: $DATABASE_NAME"
echo "  New Password: [HIDDEN]"
echo ""

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${RED}❌ Container '$CONTAINER_NAME' is not running!${NC}"
    echo "💡 Start the container first: docker start $CONTAINER_NAME"
    exit 1
fi

echo -e "${YELLOW}⚠️  This script will temporarily modify pg_hba.conf to allow password reset${NC}"
echo "   The original configuration will be restored after password change."
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled"
    exit 1
fi

echo ""
echo "📦 Step 1: Creating backup of pg_hba.conf..."
docker exec $CONTAINER_NAME cp /var/lib/postgresql/data/pg_hba.conf /var/lib/postgresql/data/pg_hba.conf.backup.$(date +%Y%m%d_%H%M%S)

echo "✏️  Step 2: Modifying pg_hba.conf to allow trust authentication..."
# Create a new pg_hba.conf with trust for local connections at the top
docker exec $CONTAINER_NAME sh -c "cat > /tmp/pg_hba_trust.conf << 'EOF'
# Temporary trust authentication (added by reset-password script)
local   all             all                                     trust
host    all             all             127.0.0.1/32            trust
host    all             all             ::1/128                 trust
EOF
cat /var/lib/postgresql/data/pg_hba.conf >> /tmp/pg_hba_trust.conf && \
cp /tmp/pg_hba_trust.conf /var/lib/postgresql/data/pg_hba.conf"

echo "🔄 Step 3: Reloading PostgreSQL configuration..."
# Try multiple methods to reload
if docker exec $CONTAINER_NAME psql -U $DATABASE_USER -d $DATABASE_NAME -c "SELECT pg_reload_conf();" > /dev/null 2>&1; then
    echo "✅ Configuration reloaded via SQL"
else
    echo "⚠️  SQL reload failed, trying pg_ctl..."
    if docker exec $CONTAINER_NAME su - postgres -c "pg_ctl reload -D /var/lib/postgresql/data" > /dev/null 2>&1; then
        echo "✅ Configuration reloaded via pg_ctl"
    else
        echo "⚠️  pg_ctl reload failed, restarting container..."
        docker restart $CONTAINER_NAME
        echo "⏳ Waiting for PostgreSQL to be ready..."
        for i in {1..30}; do
            if docker exec $CONTAINER_NAME pg_isready -U $DATABASE_USER > /dev/null 2>&1; then
                echo "✅ PostgreSQL is ready"
                break
            fi
            sleep 1
        done
    fi
fi

echo "⏳ Step 4: Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if docker exec $CONTAINER_NAME pg_isready -U $DATABASE_USER > /dev/null 2>&1; then
        echo "✅ PostgreSQL is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ PostgreSQL did not become ready in time${NC}"
        exit 1
    fi
    sleep 1
done

echo "🔐 Step 5: Changing password..."
if docker exec $CONTAINER_NAME psql -U $DATABASE_USER -d $DATABASE_NAME -c "ALTER USER $DATABASE_USER WITH PASSWORD '$DATABASE_PASSWORD';" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Password changed successfully!${NC}"
else
    echo -e "${RED}❌ Failed to change password${NC}"
    echo "💡 Trying alternative method..."
    docker exec $CONTAINER_NAME su - postgres -c "psql -c \"ALTER USER $DATABASE_USER WITH PASSWORD '$DATABASE_PASSWORD';\""
fi

echo "📦 Step 6: Restoring original pg_hba.conf..."
# Find the most recent backup
BACKUP_FILE=$(docker exec $CONTAINER_NAME sh -c "ls -t /var/lib/postgresql/data/pg_hba.conf.backup.* 2>/dev/null | head -1" | tr -d '\r')
if [ -n "$BACKUP_FILE" ]; then
    docker exec $CONTAINER_NAME cp "$BACKUP_FILE" /var/lib/postgresql/data/pg_hba.conf
    echo "✅ Original pg_hba.conf restored"
else
    echo -e "${YELLOW}⚠️  Backup file not found, restoring from default${NC}"
    # Restore to scram-sha-256 (default secure method)
    docker exec $CONTAINER_NAME sh -c "cat > /tmp/pg_hba_restore.conf << 'EOF'
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             all                                     scram-sha-256
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256
host    all             all             0.0.0.0/0               scram-sha-256
host    all             all             ::/0                    scram-sha-256
EOF
cp /tmp/pg_hba_restore.conf /var/lib/postgresql/data/pg_hba.conf"
fi

echo "🔄 Step 7: Reloading PostgreSQL configuration with restored settings..."
# Try to reload again
if docker exec $CONTAINER_NAME psql -U $DATABASE_USER -d $DATABASE_NAME -c "SELECT pg_reload_conf();" > /dev/null 2>&1; then
    echo "✅ Configuration reloaded"
else
    echo "⚠️  Reload failed, restarting container to apply changes..."
    docker restart $CONTAINER_NAME
    echo "⏳ Waiting for PostgreSQL to be ready..."
    for i in {1..30}; do
        if docker exec $CONTAINER_NAME pg_isready -U $DATABASE_USER > /dev/null 2>&1; then
            echo "✅ PostgreSQL is ready"
            break
        fi
        sleep 1
    done
fi

echo ""
echo -e "${GREEN}✅ Password reset completed successfully!${NC}"
echo ""
echo "🧪 Testing connection with new password..."
if docker exec -e PGPASSWORD="$DATABASE_PASSWORD" $CONTAINER_NAME psql -U $DATABASE_USER -d $DATABASE_NAME -c "SELECT version();" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Connection test successful!${NC}"
else
    echo -e "${YELLOW}⚠️  Connection test failed, but password may still be changed${NC}"
    echo "   Try connecting manually to verify"
fi

echo ""
echo "💡 Next steps:"
echo "   1. Update stack.env with the new password: DATABASE_PASSWORD=$DATABASE_PASSWORD"
echo "   2. Restart the API container: docker restart issue-collector-api"
echo "   3. Test connection:"
echo "      docker exec -e PGPASSWORD='$DATABASE_PASSWORD' $CONTAINER_NAME psql -U $DATABASE_USER -d $DATABASE_NAME -c 'SELECT version();'"
echo ""
echo "🔐 Connection string:"
echo "   postgresql://$DATABASE_USER:$DATABASE_PASSWORD@postgres:5432/$DATABASE_NAME"



