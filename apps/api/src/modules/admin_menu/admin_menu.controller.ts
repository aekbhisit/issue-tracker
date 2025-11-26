/**
 * @module Admin Menu Controller
 * @description HTTP request handlers for admin menu management
 */

import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '@workspace/types'
import { sendSuccess, sendError } from '../../shared/utils/response.util'
import { AdminMenuService } from './admin_menu.service'
import {
	CreateAdminMenuDto,
	UpdateAdminMenuDto,
	AdminMenuListQuery,
} from './admin_menu.types'
import { db } from '@workspace/database'

export class AdminMenuController {
	private service = new AdminMenuService()

	/**
	 * Get menu items as tree (filtered by user permissions)
	 *
	 * @route GET /admin-menu
	 * @access Admin
	 */
	getMenu = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const user = req.user
			if (!user || !user.roleId) {
				return sendError(res, 'No role assigned', 403)
			}

			// Check if super admin (sequence = 0)
			const role = await db.userRole.findUnique({
				where: { id: user.roleId },
				select: { id: true },
			})

			const isSuperAdmin = role?.id === 1

			const menuTree = await this.service.getTree(user.roleId, isSuperAdmin)
			sendSuccess(res, { menu: menuTree, isSuperAdmin })
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Get menu items as tree for management
	 *
	 * @route GET /admin-menu/tree
	 * @access Admin
	 */
	getManagementTree = async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const menuTree = await this.service.getManagementTree()
			sendSuccess(res, { menu: menuTree })
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Reorder menu tree
	 *
	 * @route PUT /admin-menu/tree/reorder
	 * @access Admin
	 */
	reorderTree = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const { tree } = req.body
			await this.service.reorderTree(tree)
			const menuTree = await this.service.getManagementTree()
			sendSuccess(res, { menu: menuTree })
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Get all menu items (for admin management)
	 *
	 * @route GET /admin-menu/all
	 * @access Admin
	 */
	getAll = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const query: AdminMenuListQuery = {
				page: req.query.page ? parseInt(req.query.page as string) : undefined,
				limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
				search: req.query.search as string,
				module: req.query.module as string,
				type: req.query.type as string,
				status: req.query.status === 'true' ? true : req.query.status === 'false' ? false : undefined,
				parentId: req.query.parentId ? parseInt(req.query.parentId as string) : undefined,
				sortBy: req.query.sortBy as string,
				sortOrder: req.query.sortOrder as 'asc' | 'desc',
			}
			const result = await this.service.findAll(query)
			sendSuccess(res, result)
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Get menu item by ID
	 *
	 * @route GET /admin-menu/:id
	 * @access Admin
	 */
	getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const id = parseInt(req.params.id, 10)
			if (isNaN(id)) {
				return sendError(res, 'Invalid menu ID', 400)
			}

			const menu = await this.service.findById(id)
			sendSuccess(res, { menu })
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Create new menu item
	 *
	 * @route POST /admin-menu
	 * @access Admin
	 */
	create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const data = req.body as CreateAdminMenuDto
			const menu = await this.service.create(data, req)
			sendSuccess(res, { menu }, 201)
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Update menu item
	 *
	 * @route PUT /admin-menu/:id
	 * @access Admin
	 */
	update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const id = parseInt(req.params.id, 10)
			if (isNaN(id)) {
				return sendError(res, 'Invalid menu ID', 400)
			}

			const data = req.body as UpdateAdminMenuDto
			const menu = await this.service.update(id, data, req)
			sendSuccess(res, { menu })
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Delete menu item
	 *
	 * @route DELETE /admin-menu/:id
	 * @access Admin
	 */
	delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const id = parseInt(req.params.id, 10)
			if (isNaN(id)) {
				return sendError(res, 'Invalid menu ID', 400)
			}

			await this.service.delete(id, req)
			sendSuccess(res, { message: 'Menu item deleted successfully' })
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Update menu item sequence
	 *
	 * @route PUT /admin-menu/:id/sequence
	 * @access Admin
	 */
	updateSequence = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const id = parseInt(req.params.id, 10)
			if (isNaN(id)) {
				return sendError(res, 'Invalid menu ID', 400)
			}

			const { sequence, action } = req.body

			if (action === 'up' || action === 'down') {
				const menu = await this.service.moveSequence(id, action)
				sendSuccess(res, { menu })
			} else if (typeof sequence === 'number') {
				const menu = await this.service.updateSequence(id, sequence)
				sendSuccess(res, { menu })
			} else {
				return sendError(res, 'Invalid sequence or action', 400)
			}
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Get available modules
	 *
	 * @route GET /admin-menu/modules
	 * @access Admin
	 */
	getModules = async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const modules = await this.service.getModules()
			sendSuccess(res, { modules })
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Get available types for a module
	 *
	 * @route GET /admin-menu/types/:module
	 * @access Admin
	 */
	getTypes = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const { module } = req.params
			if (!module) {
				return sendError(res, 'Module parameter is required', 400)
			}

			const types = await this.service.getTypes(module)
			sendSuccess(res, { types })
		} catch (error) {
			next(error)
		}
	}
}

