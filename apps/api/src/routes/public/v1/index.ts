/**
 * @module Public API Routes v1
 * @description Public API endpoints for Frontend application
 */

import { Router } from 'express'

// Import module routes
import authRoutes from '../../../modules/auth/routes/public.routes'
import userRoutes from '../../../modules/user/routes/public.routes'
import issueRoutes from '../../../modules/issue/routes/public.routes'
import projectRoutes from '../../../modules/project/routes/public.routes'

// Import middlewares
import { authMiddleware } from '../../../modules/auth/auth.middleware'
import { permissionMiddleware } from '../../../shared/middlewares/permission.middleware'

const router = Router()

// Public routes
router.use('/auth', authRoutes)
router.use('/issues', issueRoutes)
router.use('/projects', projectRoutes)

// Protected user routes (with permission check)
router.use('/me', authMiddleware, permissionMiddleware, userRoutes)

// Health check
router.get('/health', (_req, res) => {
	res.json({
		status: 'ok',
		version: 'v1',
		type: 'public',
		timestamp: new Date().toISOString(),
	})
})

export default router

