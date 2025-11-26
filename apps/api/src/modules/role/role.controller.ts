/**
 * @module Role Controller
 * @description HTTP request handlers for role management endpoints
 */

import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '@workspace/types'
import { RoleService } from './role.service'
import { sendSuccess } from '../../shared/utils/response.util'
import { BadRequestError } from '../../shared/utils/error.util'

export class RoleController {
	private service = new RoleService()

	/**
	 * Get all roles with pagination and filters
	 * 
	 * @route GET /roles
	 * @access Admin
	 */
	getAll = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const scopeParam = typeof req.query.scope === 'string' ? req.query.scope.trim() : ''
			const scope = scopeParam.length > 0 ? scopeParam : 'admin'
			const query = {
				page: req.query.page ? parseInt(req.query.page as string) : 1,
				limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
				search: req.query.search as string,
				sortBy: req.query.sortBy as string,
				sortOrder: req.query.sortOrder as 'asc' | 'desc',
				scope,
			}

			const result = await this.service.findAll(query)
			sendSuccess(res, result)
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Get role by ID
	 * 
	 * @route GET /roles/:id
	 * @access Admin
	 */
	getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const id = parseInt(req.params.id)
			if (isNaN(id)) {
				throw new BadRequestError('Invalid role ID')
			}
			const scopeParam = typeof req.query.scope === 'string' ? req.query.scope.trim() : ''
			const scope = scopeParam.length > 0 ? scopeParam : 'admin'
			const role = await this.service.findById(id, scope)
			sendSuccess(res, role)
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Create new role
	 * 
	 * @route POST /roles
	 * @access Admin
	 */
	create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const scopeParam = typeof req.body.scope === 'string' ? req.body.scope.trim() : ''
			const payload = {
				...req.body,
				scope: scopeParam.length > 0 ? scopeParam : 'admin',
			}
			const role = await this.service.create(payload, req)
			sendSuccess(res, role, 201, 'Role created successfully')
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Update role
	 * 
	 * @route PUT /roles/:id
	 * @access Admin
	 */
	update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const id = parseInt(req.params.id)
			if (isNaN(id)) {
				throw new BadRequestError('Invalid role ID')
			}
			const scopeParam = typeof req.body.scope === 'string' ? req.body.scope.trim() : ''
			const payload = {
				...req.body,
				scope: scopeParam.length > 0 ? scopeParam : undefined,
			}
			const role = await this.service.update(id, payload, req)
			sendSuccess(res, role, 200, 'Role updated successfully')
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Toggle role status
	 * 
	 * @route PATCH /roles/:id/status
	 * @access Admin
	 */
	updateStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const id = parseInt(req.params.id)
			if (isNaN(id)) {
				throw new BadRequestError('Invalid role ID')
			}
			const role = await this.service.updateStatus(id, req)
			sendSuccess(res, role, 200, 'Role status updated successfully')
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Delete role
	 * 
	 * @route DELETE /roles/:id
	 * @access Admin
	 */
	delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const id = parseInt(req.params.id)
			if (isNaN(id)) {
				throw new BadRequestError('Invalid role ID')
			}
			await this.service.delete(id, req)
			sendSuccess(res, null, 200, 'Role deleted successfully')
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Update role sequence order
	 * 
	 * @route POST /roles/:id/sort
	 * @access Admin
	 */
	setSort = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const id = parseInt(req.params.id)
			const move = typeof req.body.move === 'string' ? (req.body.move as 'up' | 'down') : undefined
			const rawSequence = req.body.sequence
			const hasSequence = typeof rawSequence !== 'undefined'
			const sequence = hasSequence ? parseInt(rawSequence, 10) : undefined

			if (isNaN(id)) {
				throw new BadRequestError('Invalid role ID')
			}

			if (move === 'up' || move === 'down') {
				await this.service.setSort(id, move)
				sendSuccess(res, null, 200, `Role order moved ${move} successfully`)
				return
			}

			if (typeof sequence === 'number' && !isNaN(sequence)) {
				await this.service.setSort(id, sequence)
				sendSuccess(res, null, 200, 'Role sequence updated successfully')
				return
			}

			throw new BadRequestError('Invalid sort payload')
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Get roles list for dropdown
	 * 
	 * @route GET /roles/list
	 * @access Admin
	 */
	getList = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const search = req.query.search as string
			const excludeId = req.query.excludeId
				? parseInt(req.query.excludeId as string)
				: undefined

			const scopeParam = typeof req.query.scope === 'string' ? req.query.scope.trim() : ''
			const scope = scopeParam.length > 0 ? scopeParam : 'admin'
			const results = await this.service.getList(search, excludeId, scope)
			sendSuccess(res, { results })
		} catch (error) {
			next(error)
		}
	}
}

