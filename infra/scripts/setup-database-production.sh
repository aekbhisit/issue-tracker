#!/bin/bash
# Database Setup Script for Production
# This script helps set up the database when deploying the stack

set -e

echo "🔧 Database Setup Script for Issue Collector Platform"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_URL not set. Using defaults from environment...${NC}"
    
    # Try to construct from individual variables
    DB_USER=${DATABASE_USER:-postgres}
    DB_PASSWORD=${DATABASE_PASSWORD:-postgres}
    DB_HOST=${DATABASE_HOST:-postgres}
    DB_PORT=${DATABASE_PORT:-5432}
    DB_NAME=${DATABASE_NAME:-issue_collector}
    
    export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
    echo -e "${GREEN}✓ Constructed DATABASE_URL: postgresql://${DB_USER}:***@${DB_HOST}:${DB_PORT}/${DB_NAME}${NC}"
else
    echo -e "${GREEN}✓ DATABASE_URL is set${NC}"
fi

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DB_PACKAGE_DIR="$SCRIPT_DIR/../database"

if [ ! -d "$DB_PACKAGE_DIR" ]; then
    echo -e "${RED}❌ Database package not found at: $DB_PACKAGE_DIR${NC}"
    exit 1
fi

echo ""
echo "📁 Database package: $DB_PACKAGE_DIR"
echo ""

# Check if we're in Docker or on host
if [ -f "/.dockerenv" ] || [ -n "$DOCKER_CONTAINER" ]; then
    echo -e "${YELLOW}🐳 Running inside Docker container${NC}"
    USE_NPX=true
else
    echo -e "${YELLOW}💻 Running on host machine${NC}"
    USE_NPX=false
fi

cd "$DB_PACKAGE_DIR"

# Step 1: Merge schemas
echo ""
echo "📋 Step 1: Merging Prisma schemas..."
if [ "$USE_NPX" = true ]; then
    node scripts/merge-schema.js
else
    if command -v pnpm &> /dev/null; then
        pnpm db:merge || node scripts/merge-schema.js
    else
        node scripts/merge-schema.js
    fi
fi

# Step 2: Generate Prisma client
echo ""
echo "🔨 Step 2: Generating Prisma client..."
if [ "$USE_NPX" = true ]; then
    npx prisma generate --schema=./prisma/schema.prisma
else
    if command -v pnpm &> /dev/null; then
        pnpm db:generate || npx prisma generate --schema=./prisma/schema.prisma
    else
        npx prisma generate --schema=./prisma/schema.prisma
    fi
fi

# Step 3: Run migrations
echo ""
echo "🚀 Step 3: Running database migrations..."
if [ "$USE_NPX" = true ]; then
    npx prisma migrate deploy --schema=./prisma/schema.prisma
else
    if command -v pnpm &> /dev/null; then
        pnpm db:migrate:deploy || npx prisma migrate deploy --schema=./prisma/schema.prisma
    else
        npx prisma migrate deploy --schema=./prisma/schema.prisma
    fi
fi

# Step 4: Ask about seeding
echo ""
read -p "🌱 Do you want to seed the database with initial data? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding database..."
    if [ "$USE_NPX" = true ]; then
        npx tsx prisma/seeds/seed.ts
    else
        if command -v pnpm &> /dev/null; then
            pnpm db:seed || npx tsx prisma/seeds/seed.ts
        else
            npx tsx prisma/seeds/seed.ts
        fi
    fi
    echo -e "${GREEN}✅ Database seeded successfully${NC}"
else
    echo -e "${YELLOW}⏭️  Skipping seed (you can run it later: cd infra/database && pnpm db:seed)${NC}"
fi

echo ""
echo -e "${GREEN}✅ Database setup completed!${NC}"
echo ""
echo "💡 Next steps:"
echo "   1. Restart the API container: docker restart issue-collector-api"
echo "   2. Check API logs: docker logs issue-collector-api"
echo "   3. Test login at: https://issue.haahii.com/admin"



