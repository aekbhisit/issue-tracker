/**
 * @module Main Routes
 * @description Main API router with version management
 */

import { Router } from 'express'
import path from 'path'
import fs from 'fs'
import publicV1Routes from './public/v1'
import memberV1Routes from './member/v1'
import adminV1Routes from './admin/v1'
import uploadRoutes from './upload'

const router = Router()

// Upload routes (for file uploads)
router.use('/upload', uploadRoutes)

// Public API routes (for Frontend - no auth)
router.use('/public/v1', publicV1Routes)

// Member API routes (for Frontend - authenticated)
router.use('/member/v1', memberV1Routes)

// Admin API routes (for Admin Dashboard)
router.use('/admin/v1', adminV1Routes)

// Version endpoint (moved from root to /api/version)
router.get('/version', (_req, res) => {
  try {
    // Try multiple paths to find package.json (works in both dev and Docker production)
    const possiblePaths = [
      path.join(__dirname, '../../../package.json'), // From routes/ to root (production Docker)
      path.join(__dirname, '../../package.json'), // From routes/ to apps/api (development)
      path.join(process.cwd(), 'package.json'), // Current working directory
      path.join(process.cwd(), 'apps/api/package.json'), // From monorepo root
    ]

    let packageJson: any = null
    let packageJsonPath: string | null = null

    // Try each path until we find package.json
    for (const possiblePath of possiblePaths) {
      try {
        if (fs.existsSync(possiblePath)) {
          packageJsonPath = possiblePath
          packageJson = JSON.parse(fs.readFileSync(possiblePath, 'utf-8'))
          break
        }
      } catch (err) {
        // Continue to next path
        continue
      }
    }

    // Fallback to environment variable or default values
    if (!packageJson) {
      console.warn('⚠️ Could not find package.json, using fallback values')
      res.json({
        version: process.env.API_VERSION || process.env.npm_package_version || '1.0.0',
        name: process.env.API_NAME || 'issue-collector-api',
        description: process.env.API_DESCRIPTION || 'Express API Server',
        timestamp: new Date().toISOString(),
        source: 'environment',
      })
      return
    }

    res.json({
      version: packageJson.version || '1.0.0',
      name: packageJson.name || 'issue-collector-api',
      description: packageJson.description || 'Express API Server',
      timestamp: new Date().toISOString(),
      source: packageJsonPath || 'unknown',
    })
  } catch (error) {
    console.error('❌ Error reading version information:', error)
    // Return fallback values instead of 500 error
    res.json({
      version: process.env.API_VERSION || '1.0.0',
      name: 'issue-collector-api',
      description: 'Express API Server',
      timestamp: new Date().toISOString(),
      source: 'fallback',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
    })
  }
})

// Root API endpoint
router.get('/', (_req, res) => {
  res.json({
    message: 'API Server',
    version: '1.0.0',
    apis: {
      public: '/api/public/v1',
      member: '/api/member/v1',
      admin: '/api/admin/v1',
    },
    documentation: {
      public: '/api/public/v1/health',
      member: '/api/member/v1/health',
      admin: '/api/admin/v1/health',
    },
    versionEndpoint: '/api/version',
  })
})

export default router

