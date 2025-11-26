/**
 * @module Admin User Routes
 * @description Admin API routes for user management (full CRUD)
 */

import { Router } from 'express'
import { UserController } from '../user.controller'
import { validate } from '../../../shared/middlewares/validation.middleware'
import { userValidation } from '../user.validation'
import { permissionMeta } from '../../../shared/middlewares/permissionMeta.middleware'

const router = Router()
const controller = new UserController()

const withPermission = (group: string, action: string) =>
	permissionMeta({
		module: 'user',
		group,
		action,
		types: ['default'], // Use 'default' as type for consistency
	})

/**
 * @route   GET /users
 * @desc    Get all users with pagination and filters
 * @access  Admin
 */
router.get('/', withPermission('view', 'get_data'), validate(userValidation.list), controller.getAll)

/**
 * @route   GET /users/:id
 * @desc    Get user by ID
 * @access  Admin
 */
router.get('/:id', withPermission('view', 'get_detail'), controller.getById)

/**
 * @route   POST /users
 * @desc    Create new user
 * @access  Admin
 */
router.post('/', withPermission('add', 'add_data'), validate(userValidation.create), controller.create)

/**
 * @route   PUT /users/:id
 * @desc    Update user
 * @access  Admin
 */
router.put('/:id', withPermission('edit', 'edit_data'), validate(userValidation.update), controller.update)

/**
 * @route   PATCH /users/:id/status
 * @desc    Update user status (toggle active/inactive)
 * @access  Admin
 */
router.patch('/:id/status', withPermission('edit', 'update_status'), validate(userValidation.updateStatus), controller.updateStatus)

/**
 * @route   DELETE /users/:id
 * @desc    Delete user (soft delete)
 * @access  Admin
 */
router.delete('/:id', withPermission('delete', 'delete_data'), controller.delete)

/**
 * @route   PATCH /users/:id/role
 * @desc    Update user's role by admin
 * @access  Admin
 */
router.patch('/:id/role', withPermission('edit', 'update_role'), validate(userValidation.updateRole), controller.updateUserRole)

export default router

