/**
 * @module Admin API Routes v1
 * @description Admin API endpoints for Admin Dashboard
 */

import { Router } from 'express'

// Import module routes
import authRoutes from '../../../modules/auth/routes/admin.routes'
import userRoutes from '../../../modules/user/routes/admin.routes'
import roleRoutes from '../../../modules/role/routes/admin.routes'
import permissionRoutes from '../../../modules/permission/routes/admin.routes'
import adminMenuRoutes from '../../../modules/admin_menu/routes/admin.routes'
import settingsRoutes from '../../../modules/settings/routes/admin.routes'
import fileManagerRoutes from '../../../modules/file_manager/routes/admin.routes'
import activityLogRoutes from '../../../modules/activity_log/routes/admin.routes'
import projectRoutes from '../../../modules/project/routes/admin.routes'
import issueRoutes from '../../../modules/issue/routes/admin.routes'
import dashboardRoutes from '../../../modules/dashboard/routes/admin.routes'

// Import middlewares
import { adminAuthMiddleware } from '../../../shared/middlewares/adminAuth.middleware'
import { permissionMiddleware } from '../../../shared/middlewares/permission.middleware'

const router = Router()

// Admin authentication (no middleware)
router.use('/auth', authRoutes)

// Admin routes (all protected with auth + permission check)
router.use('/user', adminAuthMiddleware, permissionMiddleware, userRoutes)
router.use('/role', adminAuthMiddleware, permissionMiddleware, roleRoutes)
// router.use('/permissions', adminAuthMiddleware, permissionMiddleware, permissionRoutes)
router.use('/permission', adminAuthMiddleware, permissionMiddleware, permissionRoutes)
router.use('/admin-menu', adminAuthMiddleware, permissionMiddleware, adminMenuRoutes)
router.use('/settings', adminAuthMiddleware, permissionMiddleware, settingsRoutes)
router.use('/file-manager', adminAuthMiddleware, permissionMiddleware, fileManagerRoutes)
router.use('/activity-logs', adminAuthMiddleware, permissionMiddleware, activityLogRoutes)
router.use('/projects', adminAuthMiddleware, permissionMiddleware, projectRoutes)
router.use('/issues', adminAuthMiddleware, permissionMiddleware, issueRoutes)
router.use('/dashboard', adminAuthMiddleware, permissionMiddleware, dashboardRoutes)

export default router

