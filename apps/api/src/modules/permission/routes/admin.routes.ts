/**
 * @module Permission Admin Routes
 * @description Admin routes for permission management
 */

import { Router } from 'express'
import { PermissionController } from '../permission.controller'
import { validate } from '../../../shared/middlewares/validation.middleware'
import { permissionValidation } from '../permission.validation'
import { permissionMeta } from '../../../shared/middlewares/permissionMeta.middleware'

const router = Router()
const controller = new PermissionController()

const withPermission = (group: string, action: string) =>
	permissionMeta({
		module: 'permission',
		group,
		action,
		types: ['default'], // Use 'default' as type for consistency
	})

/**
 * @route GET /permission/modules
 * @desc Get unique modules list
 * @access Admin
 */
router.get('/modules', withPermission('view', 'get_modules'), controller.getModules)

/**
 * @route GET /permission/groups
 * @desc Get unique groups list
 * @access Admin
 */
router.get('/groups', withPermission('view', 'get_modules'), controller.getGroups)

/**
 * @route GET /permission/me
 * @desc Get current user's permissions (metaNames)
 * @access Admin
 */
router.get('/me', controller.getMyPermissions)

/**
 * @route GET /permission/generate
 * @desc Generate permission from all routes
 * @access Admin
 */
router.get('/generate', controller.generatePermissions)

/**
 * @route GET /permission/grouped
 * @desc Get grouped permission summary by scope
 * @access Admin
 */
router.get(
	'/grouped',
	withPermission('view', 'get_data'),
	validate(permissionValidation.grouped),
	controller.getGrouped,
)

/**
 * @route GET /permission
 * @desc Get all permission with pagination
 * @access Admin
 */
router.get('/', withPermission('view', 'get_data'), validate(permissionValidation.list), controller.getAll)

/**
 * @route GET /permission/:id
 * @desc Get permission by ID
 * @access Admin
 */
router.get('/:id', withPermission('view', 'get_detail'), controller.getById)

/**
 * @route POST /permission
 * @desc Create new permission
 * @access Admin
 */
router.post('/', withPermission('add', 'add_data'), validate(permissionValidation.create), controller.create)

/**
 * @route PUT /permission/:id
 * @desc Update permission
 * @access Admin
 */
router.put('/:id', withPermission('edit', 'edit_data'), validate(permissionValidation.update), controller.update)

/**
 * @route PATCH /permission/:id/status
 * @desc Toggle permission status
 * @access Admin
 */
router.patch('/:id/status', withPermission('edit', 'update_status'), controller.updateStatus)

/**
 * @route DELETE /permission/:id
 * @desc Delete permission
 * @access Admin
 */
router.delete('/:id', withPermission('delete', 'delete_data'), controller.delete)

export default router

