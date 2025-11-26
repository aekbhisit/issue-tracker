#!/usr/bin/env node

/**
 * Database Setup Script
 * Creates database if it doesn't exist, then runs migrations and seeds
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  console.error('Please create infra/database/.env.local with DATABASE_URL');
  process.exit(1);
}

// Parse DATABASE_URL to extract database name
// Format: postgresql://user:password@host:port/database
const urlMatch = DATABASE_URL.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
if (!urlMatch) {
  console.error('❌ Invalid DATABASE_URL format');
  console.error('Expected format: postgresql://user:password@host:port/database');
  process.exit(1);
}

const [, user, password, host, port, databaseName] = urlMatch;
const connectionUrl = `postgresql://${user}:${password}@${host}:${port}`;

console.log('\n' + '='.repeat(60));
console.log('🗄️  Database Setup');
console.log('='.repeat(60));
console.log(`Host: ${host}:${port}`);
console.log(`Database: ${databaseName}`);
console.log(`User: ${user}`);
console.log('='.repeat(60) + '\n');

try {
  // Step 1: Check if database exists, create if not
  console.log('📋 Step 1: Checking database...');
  try {
    execSync(`psql "${connectionUrl}/postgres" -c "SELECT 1 FROM pg_database WHERE datname = '${databaseName}'"`, {
      stdio: 'pipe',
      encoding: 'utf8'
    });
    
    // Try to connect to the database
    try {
      execSync(`psql "${DATABASE_URL}" -c "SELECT 1"`, {
        stdio: 'pipe',
        encoding: 'utf8'
      });
      console.log(`✅ Database '${databaseName}' exists`);
    } catch (error) {
      console.log(`⚠️  Database '${databaseName}' not found, creating...`);
      execSync(`psql "${connectionUrl}/postgres" -c "CREATE DATABASE ${databaseName}"`, {
        stdio: 'inherit'
      });
      console.log(`✅ Database '${databaseName}' created`);
    }
  } catch (error) {
    // If psql command fails, try creating database anyway
    console.log(`⚠️  Could not check database, attempting to create...`);
    try {
      execSync(`psql "${connectionUrl}/postgres" -c "CREATE DATABASE ${databaseName}"`, {
        stdio: 'pipe'
      });
      console.log(`✅ Database '${databaseName}' created`);
    } catch (createError) {
      console.log(`ℹ️  Database might already exist or psql not available`);
      console.log(`   Continuing with migrations...`);
    }
  }

  // Step 2: Generate Prisma Client
  console.log('\n📋 Step 2: Generating Prisma Client...');
  execSync('pnpm prisma generate --schema=./prisma/schema.prisma', {
    stdio: 'inherit',
    cwd: __dirname + '/..'
  });
  console.log('✅ Prisma Client generated');

  // Step 3: Run migrations
  console.log('\n📋 Step 3: Running database migrations...');
  execSync('pnpm prisma migrate deploy --schema=./prisma/schema.prisma', {
    stdio: 'inherit',
    cwd: __dirname + '/..'
  });
  console.log('✅ Migrations completed');

  // Step 4: Seed database
  console.log('\n📋 Step 4: Seeding database...');
  execSync('pnpm prisma db seed', {
    stdio: 'inherit',
    cwd: __dirname + '/..'
  });
  console.log('✅ Database seeded');

  console.log('\n' + '='.repeat(60));
  console.log('🎉 Database setup completed successfully!');
  console.log('='.repeat(60) + '\n');
  console.log('📝 Default Admin Credentials:');
  console.log('   Username: admin');
  console.log('   Password: admin');
  console.log('   Email: admin@admin.com');
  console.log('');

} catch (error) {
  console.error('\n❌ Error during database setup:', error.message);
  console.error('\n💡 Troubleshooting:');
  console.error('1. Make sure PostgreSQL is running');
  console.error('2. Check DATABASE_URL in infra/database/.env.local');
  console.error('3. Verify database credentials');
  console.error('4. Ensure psql is available in PATH');
  process.exit(1);
}

