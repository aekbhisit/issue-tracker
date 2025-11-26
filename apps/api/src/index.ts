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
 * Start the Express server
 */
async function startServer() {
	try {
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

