/**
 * @module Project Controller
 * @description HTTP request handlers for project management endpoints
 */

import { Request, Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '@workspace/types'
import { ProjectService } from './project.service'
import { sendSuccess } from '../../shared/utils/response.util'
import { BadRequestError } from '../../shared/utils/error.util'

export class ProjectController {
	private service = new ProjectService()

	/**
	 * Get all projects with pagination and filters
	 * 
	 * @route GET /projects
	 * @access Admin
	 */
	getAll = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const query = {
				page: req.query.page ? parseInt(req.query.page as string) : undefined,
				limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
				search: req.query.search as string,
				status: req.query.status !== undefined ? req.query.status === 'true' : undefined,
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
	 * Get project by public key (public endpoint)
	 * 
	 * @route GET /api/public/v1/projects/:projectKey
	 * @access Public (project key validation only)
	 */
	getByPublicKey = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const publicKey = req.params.projectKey
			if (!publicKey) {
				throw new BadRequestError('Project key is required')
			}

			const project = await this.service.findByPublicKey(publicKey)
			sendSuccess(res, project)
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Get project by ID
	 * 
	 * @route GET /projects/:id
	 * @access Admin
	 */
	getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const id = parseInt(req.params.id)
			if (isNaN(id)) {
				throw new BadRequestError('Invalid project ID')
			}
			const project = await this.service.findById(id)
			sendSuccess(res, project)
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Create new project
	 * 
	 * @route POST /projects
	 * @access Admin
	 */
	create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const project = await this.service.create(req.body, req)
			sendSuccess(res, project, 201, 'Project created successfully')
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Update project
	 * 
	 * @route PATCH /projects/:id
	 * @access Admin
	 */
	update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const id = parseInt(req.params.id)
			if (isNaN(id)) {
				throw new BadRequestError('Invalid project ID')
			}
			const project = await this.service.update(id, req.body, req)
			sendSuccess(res, project, 200, 'Project updated successfully')
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Delete project (soft delete)
	 * 
	 * @route DELETE /projects/:id
	 * @access Admin
	 */
	delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const id = parseInt(req.params.id)
			if (isNaN(id)) {
				throw new BadRequestError('Invalid project ID')
			}
			await this.service.delete(id, req)
			sendSuccess(res, null, 200, 'Project deleted successfully')
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Add environment to project
	 * 
	 * @route POST /projects/:id/environments
	 * @access Admin
	 */
	addEnvironment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const projectId = parseInt(req.params.id)
			if (isNaN(projectId)) {
				throw new BadRequestError('Invalid project ID')
			}
			const environment = await this.service.addEnvironment(projectId, req.body, req)
			sendSuccess(res, environment, 201, 'Environment added successfully')
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Update project environment
	 * 
	 * @route PATCH /projects/:id/environments/:envId
	 * @access Admin
	 */
	updateEnvironment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const projectId = parseInt(req.params.id)
			const envId = parseInt(req.params.envId)
			if (isNaN(projectId)) {
				throw new BadRequestError('Invalid project ID')
			}
			if (isNaN(envId)) {
				throw new BadRequestError('Invalid environment ID')
			}
			const environment = await this.service.updateEnvironment(projectId, envId, req.body, req)
			sendSuccess(res, environment, 200, 'Environment updated successfully')
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Remove environment from project
	 * 
	 * @route DELETE /projects/:id/environments/:envId
	 * @access Admin
	 */
	removeEnvironment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const projectId = parseInt(req.params.id)
			const envId = parseInt(req.params.envId)
			if (isNaN(projectId)) {
				throw new BadRequestError('Invalid project ID')
			}
			if (isNaN(envId)) {
				throw new BadRequestError('Invalid environment ID')
			}
			await this.service.removeEnvironment(projectId, envId, req)
			sendSuccess(res, null, 200, 'Environment removed successfully')
		} catch (error) {
			next(error)
		}
	}
}

