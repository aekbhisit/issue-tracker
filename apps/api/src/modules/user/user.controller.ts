/**
 * @module User Controller
 * @description HTTP request handlers for user management endpoints
 */

import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '@workspace/types'
import { UserService } from './user.service'
import { sendSuccess } from '../../shared/utils/response.util'
import { BadRequestError } from '../../shared/utils/error.util'

export class UserController {
	private service = new UserService()

	/**
	 * Get all users with pagination and filters
	 * 
	 * @route GET /users
	 * @access Admin
	 */
	getAll = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const query = {
				page: req.query.page ? parseInt(req.query.page as string) : 1,
				limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
				search: req.query.search as string,
				roleId: req.query.roleId ? parseInt(req.query.roleId as string) : undefined,
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
	 * Get user by ID
	 * 
	 * @route GET /users/:id
	 * @access Admin
	 */
	getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const id = parseInt(req.params.id)
			if (isNaN(id)) {
				throw new BadRequestError('Invalid user ID')
			}
			const user = await this.service.findById(id)
			sendSuccess(res, user)
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Create new user
	 * 
	 * @route POST /users
	 * @access Admin
	 */
	create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const user = await this.service.create(req.body, req)
			sendSuccess(res, user, 201, 'User created successfully')
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Update user
	 * 
	 * @route PUT /users/:id
	 * @access Admin
	 */
	update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const id = parseInt(req.params.id)
			if (isNaN(id)) {
				throw new BadRequestError('Invalid user ID')
			}
			const user = await this.service.update(id, req.body, req)
			sendSuccess(res, user, 200, 'User updated successfully')
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Update user status
	 * 
	 * @route PATCH /users/:id/status
	 * @access Admin
	 */
	updateStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const id = parseInt(req.params.id)
			if (isNaN(id)) {
				throw new BadRequestError('Invalid user ID')
			}
			const user = await this.service.updateStatus(id, req.body.status, req)
			sendSuccess(res, user, 200, 'User status updated successfully')
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Delete user (soft delete)
	 * 
	 * @route DELETE /users/:id
	 * @access Admin
	 */
	delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const id = parseInt(req.params.id)
			if (isNaN(id)) {
				throw new BadRequestError('Invalid user ID')
			}
			await this.service.delete(id, req)
			sendSuccess(res, null, 200, 'User deleted successfully')
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Update current user's role (self-service)
	 * 
	 * @route PATCH /me/role
	 * @access Authenticated + Permission required
	 */
	updateMyRole = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const userId = req.user!.id
			const { roleId } = req.body

			if (!roleId || isNaN(parseInt(roleId))) {
				throw new BadRequestError('Invalid role ID')
			}

			const user = await this.service.updateUserRole(userId, parseInt(roleId), req)
			sendSuccess(res, user, 200, 'Role updated successfully')
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Update user's role by admin
	 * 
	 * @route PATCH /users/:id/role
	 * @access Admin + Permission required
	 */
	updateUserRole = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const userId = parseInt(req.params.id)
			const { roleId } = req.body

			if (isNaN(userId)) {
				throw new BadRequestError('Invalid user ID')
			}

			if (!roleId || isNaN(parseInt(roleId))) {
				throw new BadRequestError('Invalid role ID')
			}

			const user = await this.service.updateUserRole(userId, parseInt(roleId), req)
			sendSuccess(res, user, 200, 'User role updated successfully')
		} catch (error) {
			next(error)
		}
	}
}

