/**
 * @module API Server
 * @description Main entry point for the Express API server
 */

import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Load environment variables FIRST before importing app (which imports database)
// Priority: .env.local (local dev) > .env (shared) > infra/docker/api/.env (fallback)
const envLocalPath = path.join(__dirname, '../.env.local')
const envPath = path.join(__dirname, '../.env')
const envDockerPath = path.join(__dirname, '../../infra/docker/api/.env')

// Try .env.local first (local development)
if (fs.existsSync(envLocalPath)) {
	dotenv.config({ path: envLocalPath })
	console.log('📝 Loaded environment from .env.local')
} else if (fs.existsSync(envPath)) {
	dotenv.config({ path: envPath })
	console.log('📝 Loaded environment from .env')
} else if (fs.existsSync(envDockerPath)) {
	dotenv.config({ path: envDockerPath })
	console.log('📝 Loaded environment from infra/docker/api/.env')
} else {
	console.warn('⚠️  No environment file found. Using system environment variables.')
}

import app from './app'

const PORT = process.env.API_PORT || 4501
const HOST = process.env.API_HOST || 'localhost'

/**
 * Run database migrations if enabled
 */
async function runMigrationsIfEnabled() {
	// Only run migrations if explicitly enabled via environment variable
	// This prevents accidental migrations in production
	if (process.env.RUN_MIGRATIONS_ON_STARTUP !== 'true') {
		return
	}

	try {
		console.log('🔄 Running database migrations...')
		const { execSync } = require('child_process')
		const path = require('path')
		const fs = require('fs')
		
		// Find the database package directory (from /app/apps/api/dist to /app/infra/database)
		const dbPackagePath = path.join(__dirname, '../../../infra/database')
		
		console.log(`📁 Database package path: ${dbPackagePath}`)
		
		// Check if path exists
		if (!fs.existsSync(dbPackagePath)) {
			console.warn(`⚠️  Database package not found at ${dbPackagePath}`)
			console.warn('💡 Migrations will need to be run manually')
			return
		}
		
		// Ensure DATABASE_URL is set
		const databaseUrl = process.env.DATABASE_URL || 
			`postgresql://${process.env.DATABASE_USER || 'postgres'}:${process.env.DATABASE_PASSWORD || 'postgres'}@${process.env.DATABASE_HOST || 'postgres'}:${process.env.DATABASE_PORT || '5432'}/${process.env.DATABASE_NAME || 'issue_collector'}`
		
		// Run migrations using npx prisma directly (more reliable in Docker)
		// First merge schemas, then run migrations
		console.log('📋 Merging Prisma schemas...')
		execSync('node scripts/merge-schema.js', {
			cwd: dbPackagePath,
			env: { ...process.env, DATABASE_URL: databaseUrl },
			stdio: 'inherit',
		})
		
		console.log('🚀 Deploying migrations...')
		execSync('npx prisma migrate deploy --schema=./prisma/schema.prisma', {
			cwd: dbPackagePath,
			env: { ...process.env, DATABASE_URL: databaseUrl },
			stdio: 'inherit',
		})
		
		console.log('✅ Database migrations completed')
	} catch (error: any) {
		console.error('❌ Migration error:', error.message)
		if (error.stack) {
			console.error('Stack:', error.stack)
		}
		// Don't exit - allow server to start even if migrations fail
		// This allows manual migration if needed
		console.warn('⚠️  Server will start, but database may not be initialized')
		console.warn('💡 Run migrations manually:')
		console.warn('   1. Connect to server via SSH')
		console.warn('   2. cd /path/to/issue-tracker/infra/database')
		console.warn('   3. DATABASE_URL="postgresql://..." pnpm db:migrate:deploy')
	}
}

/**
 * Start the Express server
 */
async function startServer() {
	try {
		// Run migrations if enabled
		await runMigrationsIfEnabled()

		const isDev = process.env.NODE_ENV === 'development'

		app.listen(PORT, () => {
			console.clear()
			console.log('\n' + '='.repeat(60))
			console.info(`🚀 API Server running on http://${HOST}:${PORT}`)
			console.info(`📍 Public API: http://${HOST}:${PORT}/api/public/v1`)
			console.info(`📍 Admin API: http://${HOST}:${PORT}/api/admin/v1`)
			console.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
			console.info(`🔌 Port: ${PORT} (from ${process.env.API_PORT ? 'API_PORT env var' : 'default'})`)

			if (isDev) {
				console.info(`🔥 Hot Reload: ACTIVE`)
				console.info(`   → Edit any .ts file to see instant reload!`)
			}

			console.log('='.repeat(60) + '\n')
			console.info('✓ Server ready - Waiting for requests...\n')
		})
	} catch (error) {
		console.error('❌ Failed to start server:', error)
		process.exit(1)
	}
}

startServer()

