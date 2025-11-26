/**
 * @module Admin Menu Admin Routes
 * @description Admin routes for admin menu management
 */

import { Router } from 'express'
import { AdminMenuController } from '../admin_menu.controller'
import { validate } from '../../../shared/middlewares/validation.middleware'
import { adminMenuValidation } from '../admin_menu.validation'
import { adminAuthMiddleware } from '../../../shared/middlewares/adminAuth.middleware'
import { permissionMeta } from '../../../shared/middlewares/permissionMeta.middleware'

const router = Router()
const controller = new AdminMenuController()

const withPermission = (group: string, action: string) =>
	permissionMeta({
		module: 'admin_menu',
		group,
		action,
		types: ['default'], // Use 'default' as type for consistency
	})

/**
 * @route GET /admin-menu
 * @desc Get menu items as tree (filtered by user permissions)
 * @access Admin
 */
router.get('/', adminAuthMiddleware, withPermission('view', 'get_menu'), controller.getMenu)

/**
 * @route GET /admin-menu/all
 * @desc Get all menu items (for admin management)
 * @access Admin
 */
router.get('/all', adminAuthMiddleware, withPermission('view', 'get_data'), validate(adminMenuValidation.list), controller.getAll)

/**
 * @route GET /admin-menu/modules
 * @desc Get available modules
 * @access Admin
 */
router.get('/modules', adminAuthMiddleware, withPermission('view', 'get_modules'), controller.getModules)

/**
 * @route GET /admin-menu/tree
 * @desc Get full admin menu tree for management
 * @access Admin
 */
router.get('/tree', adminAuthMiddleware, withPermission('view', 'get_data'), controller.getManagementTree)

/**
 * @route PUT /admin-menu/tree/reorder
 * @desc Reorder admin menu tree
 * @access Admin
 */
router.put(
	'/tree/reorder',
	adminAuthMiddleware,
	withPermission('edit', 'update_sequence'),
	validate(adminMenuValidation.reorderTree),
	controller.reorderTree,
)

/**
 * @route GET /admin-menu/types/:module
 * @desc Get available types for a module
 * @access Admin
 */
router.get('/types/:module', adminAuthMiddleware, withPermission('view', 'get_types'), validate(adminMenuValidation.getTypes), controller.getTypes)

/**
 * @route GET /admin-menu/:id
 * @desc Get menu item by ID
 * @access Admin
 */
router.get('/:id', adminAuthMiddleware, withPermission('view', 'get_detail'), validate(adminMenuValidation.getById), controller.getById)

/**
 * @route POST /admin-menu
 * @desc Create new menu item
 * @access Admin
 */
router.post('/', adminAuthMiddleware, withPermission('add', 'add_data'), validate(adminMenuValidation.create), controller.create)

/**
 * @route PUT /admin-menu/:id
 * @desc Update menu item
 * @access Admin
 */
router.put('/:id', adminAuthMiddleware, withPermission('edit', 'edit_data'), validate(adminMenuValidation.update), controller.update)

/**
 * @route PUT /admin-menu/:id/sequence
 * @desc Update menu item sequence
 * @access Admin
 */
router.put('/:id/sequence', adminAuthMiddleware, withPermission('edit', 'update_sequence'), validate(adminMenuValidation.updateSequence), controller.updateSequence)

/**
 * @route DELETE /admin-menu/:id
 * @desc Delete menu item
 * @access Admin
 */
router.delete('/:id', adminAuthMiddleware, withPermission('delete', 'delete_data'), validate(adminMenuValidation.delete), controller.delete)

export default router

