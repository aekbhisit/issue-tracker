/**
 * @module Public Auth Routes
 * @description Public authentication routes (login, register)
 */

import { Router } from 'express'
import { AuthController } from '../auth.controller'
import { validate } from '../../../shared/middlewares/validation.middleware'
import { authValidation } from '../auth.validation'
import { authMiddleware } from '../auth.middleware'

const router = Router()
const controller = new AuthController()

/**
 * @route   POST /auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', validate(authValidation.register), controller.register)

/**
 * @route   POST /auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validate(authValidation.login), controller.login)

/**
 * @route   GET /auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authMiddleware, controller.getCurrentUser)

/**
 * @route   POST /auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authMiddleware, controller.logout)

export default router

