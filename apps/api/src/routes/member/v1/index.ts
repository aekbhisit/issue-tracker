/**
 * @module Member API Routes v1
 * @description Member API endpoints for authenticated frontend users
 */

import { Router } from 'express'

// Import middlewares
// import { authMiddleware } from '../../../modules/auth/auth.middleware'
// import { permissionMiddleware } from '../../../shared/middlewares/permission.middleware'

const router = Router()

// TODO: Add member route modules here
// Example:
// import profileRoutes from '../../../modules/profile/routes/member.routes'
// router.use('/profile', authMiddleware, permissionMiddleware, profileRoutes)

// Health check
router.get('/health', (_req, res) => {
	res.json({
		status: 'ok',
		version: 'v1',
		scope: 'member',
		timestamp: new Date().toISOString(),
	})
})

export default router

