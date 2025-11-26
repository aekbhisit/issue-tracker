/**
 * @module Main Routes
 * @description Main API router with version management
 */

import { Router } from 'express'
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
  })
})

export default router

