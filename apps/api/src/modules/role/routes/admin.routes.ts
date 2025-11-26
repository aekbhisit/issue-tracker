/**
 * @module Role Admin Routes
 * @description Admin routes for role management
 */

import { Router } from 'express'
import { RoleController } from '../role.controller'
import { validate } from '../../../shared/middlewares/validation.middleware'
import { roleValidation } from '../role.validation'
import { permissionMeta } from '../../../shared/middlewares/permissionMeta.middleware'

const router = Router()
const controller = new RoleController()

const withPermission = (group: string, action: string) =>
	permissionMeta({
		module: 'role',
		group,
		action,
		types: ['default'], // Use 'default' as placeholder type for permissions meta
	})

/**
 * @route GET /roles/list
 * @desc Get roles list for dropdown
 * @access Admin
 */
router.get('/list', withPermission('view', 'get_list'), validate(roleValidation.getList), controller.getList)

/**
 * @route GET /roles
 * @desc Get all roles with pagination
 * @access Admin
 */
router.get('/', withPermission('view', 'get_data'), validate(roleValidation.list), controller.getAll)

/**
 * @route GET /roles/:id
 * @desc Get role by ID
 * @access Admin
 */
router.get('/:id', withPermission('view', 'get_detail'), controller.getById)

/**
 * @route POST /roles
 * @desc Create new role
 * @access Admin
 */
router.post('/', withPermission('add', 'add_data'), validate(roleValidation.create), controller.create)

/**
 * @route PUT /roles/:id
 * @desc Update role
 * @access Admin
 */
router.put('/:id', withPermission('edit', 'edit_data'), validate(roleValidation.update), controller.update)

/**
 * @route PATCH /roles/:id/status
 * @desc Toggle role status
 * @access Admin
 */
router.patch('/:id/status', withPermission('edit', 'update_status'), validate(roleValidation.status), controller.updateStatus)

/**
 * @route POST /roles/:id/sort
 * @desc Move role up/down in order
 * @access Admin
 */
router.post('/:id/sort', withPermission('edit', 'update_sequence'), validate(roleValidation.sort), controller.setSort)

/**
 * @route DELETE /roles/:id
 * @desc Delete role
 * @access Admin
 */
router.delete('/:id', withPermission('delete', 'delete_data'), validate(roleValidation.delete), controller.delete)

export default router

