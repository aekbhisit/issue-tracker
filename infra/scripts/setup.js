#!/usr/bin/env node

/**
 * @module Setup Wizard
 * @description Interactive setup script for selecting database stack
 */

const prompts = require('prompts')
const fs = require('fs-extra')
const path = require('path')

async function setup() {
  console.log('🚀 Welcome to Monorepo Setup\n')

  // Check if already configured
  const rootDir = path.join(__dirname, '../..')
  if (fs.existsSync(path.join(rootDir, '.env')) || fs.existsSync(path.join(rootDir, 'docker-compose.yml'))) {
    const { confirm } = await prompts({
      type: 'confirm',
      name: 'confirm',
      message: '⚠️  Project already configured. Overwrite?',
      initial: false
    })
    
    if (!confirm) {
      console.log('❌ Setup cancelled')
      process.exit(0)
    }
  }

  // Select database
  const { database } = await prompts({
    type: 'select',
    name: 'database',
    message: 'Select your database stack:',
    choices: [
      { title: 'PostgreSQL (recommended)', value: 'postgres' },
      { title: 'MySQL', value: 'mysql' }
    ]
  })

  if (!database) {
    console.log('❌ Setup cancelled')
    process.exit(0)
  }

  // Database configuration
  const config = await prompts([
    {
      type: 'text',
      name: 'dbName',
      message: 'Database name:',
      initial: 'mydb'
    },
    {
      type: 'password',
      name: 'dbPassword',
      message: 'Database password:',
      initial: 'password'
    }
  ])

  // Generate files
  console.log('\n📦 Generating project files...\n')
  
  await generateEnvFiles(database, config)
  await generateDockerCompose(database, config)
  await generatePrismaSchema(database)
  
  console.log('✅ Setup complete!\n')
  console.log('Next steps:')
  console.log('  1. pnpm install')
  console.log('  2. pnpm docker:up (or docker-compose up -d postgres for DB only)')
  console.log('  3. pnpm db:generate')
  console.log('  4. pnpm db:migrate:dev')
  console.log('  5. pnpm dev\n')
}

async function generateEnvFiles(database, config) {
  // Build DATABASE_URL
  const dbUrl = database === 'postgres'
    ? `postgresql://postgres:${config.dbPassword}@localhost:5432/${config.dbName}`
    : `mysql://root:${config.dbPassword}@localhost:3306/${config.dbName}`
  
  const env = `NODE_ENV=development
DATABASE_TYPE=${database === 'postgres' ? 'postgresql' : 'mysql'}
DATABASE_URL=${dbUrl}
API_PORT=3000
JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=10
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3002
STORAGE_TYPE=local
STORAGE_PATH=./storage/uploads
LOCAL_STORAGE_BASE_URL=http://localhost:3000/uploads
MAX_FILE_SIZE=10485760
`
  
  // Write .env files
  const rootDir = path.join(__dirname, '../..')
  await fs.writeFile(path.join(rootDir, '.env'), env)
  await fs.copy(path.join(rootDir, 'apps/api/env.example'), path.join(rootDir, 'apps/api/.env'))
  await fs.copy(path.join(rootDir, 'apps/admin/env.example'), path.join(rootDir, 'apps/admin/.env'))
  await fs.copy(path.join(rootDir, 'apps/frontend/env.example'), path.join(rootDir, 'apps/frontend/.env'))
  
  console.log('  ✅ Created .env files')
}

async function generateDockerCompose(database, config) {
  const templatePath = path.join(__dirname, '../templates', database, 'docker-compose.yml')
  const template = await fs.readFile(templatePath, 'utf-8')
  
  const rootDir = path.join(__dirname, '../..')
  
  // Copy template as-is (uses env vars now)
  await fs.writeFile(path.join(rootDir, 'docker-compose.yml'), template)
  
  // Create .env file for docker-compose
  const dockerEnv = `DB_NAME=${config.dbName}\nDB_PASSWORD=${config.dbPassword}\n`
  await fs.writeFile(path.join(rootDir, '.env.docker'), dockerEnv)
  
  console.log('  ✅ Created docker-compose.yml')
  console.log('  ✅ Created .env.docker')
}

async function generatePrismaSchema(database) {
  const templatePath = path.join(__dirname, '../templates', database, 'schema.prisma')
  const schema = await fs.readFile(templatePath, 'utf-8')
  
  const rootDir = path.join(__dirname, '../..')
  const prismaPath = path.join(rootDir, 'packages/database/prisma/schema.prisma')
  await fs.writeFile(prismaPath, schema)
  
  console.log('  ✅ Created Prisma schema')
}

setup().catch((error) => {
  console.error('❌ Setup failed:', error)
  process.exit(1)
})

