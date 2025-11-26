#!/bin/bash

# Database Setup Script
# Creates database, runs migrations, and seeds data

set -e

echo ""
echo "============================================================"
echo "🗄️  Database Setup"
echo "============================================================"
echo ""

# Check if .env.local exists
DB_ENV_FILE="infra/database/.env.local"
if [ ! -f "$DB_ENV_FILE" ]; then
  echo "📝 Creating database .env.local from example..."
  cp infra/database/env.example "$DB_ENV_FILE"
  echo "✅ Created $DB_ENV_FILE"
  echo ""
  echo "⚠️  Please edit $DB_ENV_FILE and set your DATABASE_URL"
  echo "   Example: DATABASE_URL=postgresql://postgres:password@localhost:5432/issue_collector"
  echo ""
  read -p "Press Enter after updating DATABASE_URL to continue..."
fi

# Load environment variables (only valid VAR=value lines, skip comments)
while IFS= read -r line; do
  # Skip empty lines and lines starting with #
  if [[ -n "$line" && ! "$line" =~ ^[[:space:]]*# ]]; then
    # Only export lines that look like VAR=value (starts with letter/underscore)
    if [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
      export "$line" 2>/dev/null || true
    fi
  fi
done < "$DB_ENV_FILE"

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not found in $DB_ENV_FILE"
  exit 1
fi

# Parse DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_CONNECTION=$(echo $DATABASE_URL | sed 's/\/[^\/]*$/\/postgres/')

echo "📋 Database Configuration:"
echo "   Database Name: $DB_NAME"
echo ""

# Step 1: Create database if it doesn't exist
echo "📋 Step 1: Checking/Creating database..."
if command -v psql &> /dev/null; then
  # Check if database exists
  DB_EXISTS=$(psql "$DB_CONNECTION" -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null || echo "")
  
  if [ -z "$DB_EXISTS" ]; then
    echo "📝 Creating database '$DB_NAME'..."
    if psql "$DB_CONNECTION" -c "CREATE DATABASE $DB_NAME" 2>/dev/null; then
      echo "✅ Database '$DB_NAME' created"
    else
      echo "⚠️  Could not create database automatically"
      echo "   Please create manually: CREATE DATABASE $DB_NAME;"
      echo "   Or run: createdb -U postgres $DB_NAME"
      read -p "Press Enter after creating database to continue..."
    fi
  else
    echo "✅ Database '$DB_NAME' exists"
  fi
else
  echo "⚠️  psql not found. Please create database manually:"
  echo "   psql -U postgres -c \"CREATE DATABASE $DB_NAME;\""
  echo "   Or: createdb -U postgres $DB_NAME"
  read -p "Press Enter after creating database to continue..."
fi
echo ""

# Step 2: Merge schema files and generate Prisma Client
echo "📋 Step 2: Merging schema files and generating Prisma Client..."
cd infra/database
pnpm db:generate
if [ $? -eq 0 ]; then
  echo "✅ Prisma Client generated"
else
  echo "❌ Failed to generate Prisma Client"
  exit 1
fi
echo ""

# Step 3: Run migrations or push schema
echo "📋 Step 3: Creating database tables..."
# Try migrate deploy first (for existing migrations)
if pnpm db:migrate:deploy 2>/dev/null; then
  echo "✅ Migrations applied"
else
  # Fallback to db push (creates tables from schema)
  echo "⚠️  No migrations found, pushing schema directly..."
  if pnpm db:push --accept-data-loss; then
    echo "✅ Schema pushed to database"
  else
    echo "❌ Failed to create database tables"
    exit 1
  fi
fi
echo ""

# Step 4: Seed database
echo "📋 Step 4: Seeding database..."
if pnpm prisma db seed; then
  echo "✅ Database seeded successfully"
else
  echo "⚠️  Seeding failed, but database tables are ready"
  echo "   You can try seeding manually: pnpm db:seed"
fi
echo ""

cd ../..

echo "============================================================"
echo "🎉 Database setup completed!"
echo "============================================================"
echo ""
echo "📝 Default Admin Credentials:"
echo "   Username: admin"
echo "   Password: admin"
echo "   Email: admin@admin.com"
echo ""
echo "🔗 Admin Dashboard: http://localhost:4502/admin"
echo ""

