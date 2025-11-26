/**
 * @module Admin Auth Routes
 * @description Admin authentication routes
 */

import { Router } from 'express'
import { AuthController } from '../auth.controller'
import { validate } from '../../../shared/middlewares/validation.middleware'
import { authValidation } from '../auth.validation'
import { adminAuthMiddleware } from '../../../shared/middlewares/adminAuth.middleware'

const router = Router()
const controller = new AuthController()

/**
 * @route   POST /auth/login
 * @desc    Admin login
 * @access  Public
 */
router.post('/login', validate(authValidation.login), controller.login)

/**
 * @route   GET /auth/me
 * @desc    Get current admin user
 * @access  Admin
 */
router.get('/me', adminAuthMiddleware, controller.getCurrentUser)

/**
 * @route   POST /auth/logout
 * @desc    Admin logout
 * @access  Public (allows logout even if token expired/invalid)
 */
router.post('/logout', controller.logout)

export default router

