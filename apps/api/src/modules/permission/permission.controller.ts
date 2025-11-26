/**
 * @module Permission Controller
 * @description HTTP request handlers for permission management endpoints
 */

import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '@workspace/types'
import { PermissionService } from './permission.service'
import { sendSuccess } from '../../shared/utils/response.util'
import { BadRequestError } from '../../shared/utils/error.util'

export class PermissionController {
	private service = new PermissionService()

	/**
	 * Get all permissions with pagination and filters
	 *
	 * @route GET /permissions
	 * @access Admin
	 */
	getAll = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const query = {
				page: req.query.page ? parseInt(req.query.page as string) : 1,
				limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
				search: req.query.search as string,
				scope: req.query.scope as string,
				module: req.query.module as string,
				method: req.query.method as string,
				action: req.query.action as string,
				type: req.query.type as string,
				group: req.query.group as string,
				metaName: req.query.metaName as string,
				isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
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
	 * Get permission by ID
	 *
	 * @route GET /permissions/:id
	 * @access Admin
	 */
	getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const id = parseInt(req.params.id)
			if (isNaN(id)) {
				throw new BadRequestError('Invalid permission ID')
			}
			const permission = await this.service.findById(id)
			sendSuccess(res, permission)
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Create new permission
	 *
	 * @route POST /permissions
	 * @access Admin
	 */
	create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const permission = await this.service.create(req.body, req)
			sendSuccess(res, permission, 201, 'Permission created successfully')
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Update permission
	 *
	 * @route PUT /permissions/:id
	 * @access Admin
	 */
	update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const id = parseInt(req.params.id)
			if (isNaN(id)) {
				throw new BadRequestError('Invalid permission ID')
			}
			const permission = await this.service.update(id, req.body, req)
			sendSuccess(res, permission, 200, 'Permission updated successfully')
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Toggle permission status
	 *
	 * @route PATCH /permissions/:id/status
	 * @access Admin
	 */
	updateStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const id = parseInt(req.params.id)
			if (isNaN(id)) {
				throw new BadRequestError('Invalid permission ID')
			}
			const permission = await this.service.updateStatus(id, req)
			sendSuccess(res, permission, 200, 'Permission status updated successfully')
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Delete permission
	 *
	 * @route DELETE /permissions/:id
	 * @access Admin
	 */
	delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const id = parseInt(req.params.id)
			if (isNaN(id)) {
				throw new BadRequestError('Invalid permission ID')
			}
			await this.service.delete(id, req)
			sendSuccess(res, null, 200, 'Permission deleted successfully')
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Get unique modules list
	 *
	 * @route GET /permissions/modules
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
	 * Get unique groups list
	 *
	 * @route GET /permissions/groups
	 * @access Admin
	 */
	getGroups = async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const groups = await this.service.getGroups()
			sendSuccess(res, { groups })
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Get grouped permissions by scope
	 *
	 * @route GET /permissions/grouped
	 * @access Admin
	 */
	getGrouped = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const scopeParam = typeof req.query.scope === 'string' ? req.query.scope.trim() : ''
			const scope = scopeParam.length > 0 ? scopeParam : 'admin'
			const typeRaw = typeof req.query.type === 'string' ? req.query.type.trim() : undefined
			const type =
				typeRaw === undefined
					? undefined
					: typeRaw.length === 0
						? undefined
						: typeRaw.toLowerCase() === 'null'
							? null
							: typeRaw
			const sets = await this.service.getGroupedByScope(scope, type)
			sendSuccess(res, { scope, sets })
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Generate permissions from all routes
	 *
	 * @route GET /permissions/generate
	 * @access Admin
	 */
	generatePermissions = async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const permissions = await this.service.generatePermissions()
			sendSuccess(res, { permissions })
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Get current user's permissions
	 *
	 * @route GET /permissions/me
	 * @access Admin
	 */
	getMyPermissions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			if (!req.user || !req.user.roleId) {
				return res.status(403).json({
					error: 'Forbidden',
					message: 'No role assigned',
					status: 403,
				})
			}

			// Determine scope from path
			const isAdminPath = req.baseUrl?.startsWith('/api/admin')
			const isMemberPath = req.baseUrl?.startsWith('/api/member')
			const scope = isAdminPath ? 'admin' : isMemberPath ? 'member' : 'public'

			const permissions = await this.service.getUserPermissions(req.user.roleId, scope)
			sendSuccess(res, { permissions })
		} catch (error) {
			next(error)
		}
	}
}

