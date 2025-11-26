/**
 * @module Public User Routes
 * @description Public API routes for user self-service
 */

import { Router } from 'express'
import { UserController } from '../user.controller'
import { validate } from '../../../shared/middlewares/validation.middleware'
import { userValidation } from '../user.validation'

const router = Router()
const controller = new UserController()

/**
 * @route   PATCH /me/role
 * @desc    Update current user's role (self-service)
 * @access  Authenticated + Permission required
 */
router.patch('/role', validate(userValidation.updateRole), controller.updateMyRole)

export default router

