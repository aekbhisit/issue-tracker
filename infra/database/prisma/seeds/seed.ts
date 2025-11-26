/**
 * Database Seeder
 * 
 * Main seed file that orchestrates all module seeds
 */

import { PrismaClient } from '@prisma/client'
import { seedRoles } from './roles.seed'
import { seedUsers } from './users.seed'
import { seedSettings } from './settings.seed'
import { seedPermissions } from './permissions.seed'
// Load environment variables from .env.local
// Using require to avoid import issues if dotenv is not installed
try {
  const dotenv = require('dotenv')
  const path = require('path')
  dotenv.config({ path: path.join(__dirname, '../../.env.local') })
} catch (e) {
  // dotenv not available, assume env vars are set externally
}

const prisma = new PrismaClient()

async function main() {
	console.log('🌱 Starting database seeding...\n')

	try {
		// Verify Prisma client is properly generated
		if (!prisma.$connect) {
			throw new Error('Prisma client not initialized. Please run: pnpm db:generate')
		}

		// Test database connection
		await prisma.$connect()
		console.log('✅ Database connection verified\n')

		await seedSettings(prisma)
		console.log()

		// Seed in order: permissions → roles → users
		await seedPermissions(prisma)
		console.log()

		await seedRoles(prisma)
		console.log()

		await seedUsers(prisma)
		console.log()

		console.log('🎉 Database seeding completed successfully!')
	} catch (error) {
		console.error('❌ Error during seeding:', error)
		console.error('\n💡 Troubleshooting steps:')
		console.error('1. Ensure database exists: CREATE DATABASE issue_collector;')
		console.error('2. Generate Prisma client: pnpm db:generate')
		console.error('3. Run migrations: pnpm db:push or pnpm db:migrate:dev')
		console.error('4. Then try seeding again: pnpm db:seed')
		throw error
	}
}

main()
	.catch((e) => {
		console.error('❌ Error seeding database:', e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
