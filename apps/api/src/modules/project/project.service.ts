/**
 * @module Project Service
 * @description Business logic for project management
 */

import { db } from '@workspace/database'
import { Prisma } from '@prisma/client'
import crypto from 'crypto'
import {
	CreateProjectDto,
	UpdateProjectDto,
	CreateProjectEnvironmentDto,
	UpdateProjectEnvironmentDto,
	ProjectListQuery,
	ProjectResponse,
	ProjectEnvironmentResponse,
} from '@workspace/types'
import { NotFoundError, ConflictError, BadRequestError } from '../../shared/utils/error.util'
import { AuthenticatedRequest } from '@workspace/types'
import { logActivity } from '../../shared/utils/activity_log.util'
import { ActivityAction } from '../activity_log/activity_log.types'

interface ProjectListResponse {
	data: ProjectResponse[]
	pagination: {
		page: number
		limit: number
		total: number
		totalPages: number
	}
}

export class ProjectService {
	/**
	 * Generate unique project key pair (public and private)
	 * Format: proj_ + random 16-character base64url string
	 * 
	 * @returns Object with publicKey and privateKey
	 */
	private generateKeys(): { publicKey: string; privateKey: string } {
		// Generate 16 random bytes and convert to base64url (URL-safe)
		const publicKeyBytes = crypto.randomBytes(16)
		const privateKeyBytes = crypto.randomBytes(16)
		
		const publicKey = `proj_${publicKeyBytes.toString('base64url').substring(0, 16)}`
		const privateKey = `proj_${privateKeyBytes.toString('base64url').substring(0, 16)}`
		
		return { publicKey, privateKey }
	}

	/**
	 * Ensure keys are unique (retry if collision)
	 */
	private async ensureUniqueKeys(): Promise<{ publicKey: string; privateKey: string }> {
		let attempts = 0
		const maxAttempts = 10
		
		while (attempts < maxAttempts) {
			const keys = this.generateKeys()
			
			// Check if keys already exist
			const existing = await db.project.findFirst({
				where: {
					OR: [
						{ publicKey: keys.publicKey },
						{ privateKey: keys.privateKey },
					],
				},
			})
			
			if (!existing) {
				return keys
			}
			
			attempts++
		}
		
		throw new Error('Failed to generate unique project keys after multiple attempts')
	}

	/**
	 * Format project response
	 */
	private formatProjectResponse(project: any): ProjectResponse {
		return {
			id: project.id,
			name: project.name,
			description: project.description,
			publicKey: project.publicKey,
			privateKey: project.privateKey,
			status: project.status,
			allowedDomains: project.allowedDomains as string[],
			environments: project.environments?.map((env: any) => this.formatEnvironmentResponse(env)) || [],
			createdAt: project.createdAt,
			updatedAt: project.updatedAt,
			deletedAt: project.deletedAt,
			issueCounts: project.issueCounts,
		}
	}

	/**
	 * Format environment response
	 */
	private formatEnvironmentResponse(env: any): ProjectEnvironmentResponse {
		return {
			id: env.id,
			projectId: env.projectId,
			name: env.name,
			apiUrl: env.apiUrl,
			allowedOrigins: env.allowedOrigins as string[] | null,
			isActive: env.isActive,
			createdAt: env.createdAt,
			updatedAt: env.updatedAt,
		}
	}

	/**
	 * Get paginated list of projects
	 * 
	 * @param query - Query parameters for filtering, pagination, and sorting
	 * @returns Paginated project list
	 */
	async findAll(query: ProjectListQuery): Promise<ProjectListResponse> {
		const page = query.page || 1
		const limit = query.limit || 10
		const skip = (page - 1) * limit
		const search = query.search || ''
		const status = query.status
		const sortBy = query.sortBy || 'updatedAt'
		const sortOrder = query.sortOrder || 'desc'

		// Build where clause
		const where: any = {
			deletedAt: null, // Exclude soft-deleted projects
		}

		// Add search condition
		if (search) {
			where.OR = [
				{ name: { contains: search, mode: 'insensitive' as const } },
				{ description: { contains: search, mode: 'insensitive' as const } },
				{ publicKey: { contains: search, mode: 'insensitive' as const } },
			]
		}

		// Add status filter
		if (status !== undefined) {
			where.status = status
		}

		// Get total count
		const total = await db.project.count({ where })

		// Get projects with pagination
		const projects = await db.project.findMany({
			where,
			skip,
			take: limit,
			orderBy: { [sortBy]: sortOrder },
			include: {
				environments: {
					orderBy: { name: 'asc' },
				},
			},
		})

		// Get issue counts for each project
		const projectIds = projects.map((p) => p.id)
		const issueCountsMap = new Map<number, { total: number; pending: number }>()

		if (projectIds.length > 0) {
			// Get total counts per project
			const totalCounts = await db.issue.groupBy({
				by: ['projectId'],
				_count: {
					id: true,
				},
				where: {
					projectId: {
						in: projectIds,
					},
				},
			})

			// Get pending counts (open + in-progress) per project
			const pendingCounts = await db.issue.groupBy({
				by: ['projectId'],
				_count: {
					id: true,
				},
				where: {
					projectId: {
						in: projectIds,
					},
					status: {
						in: ['open', 'in-progress'],
					},
				},
			})

			// Build map
			totalCounts.forEach((item) => {
				issueCountsMap.set(item.projectId, {
					total: item._count.id,
					pending: 0,
				})
			})

			pendingCounts.forEach((item) => {
				const existing = issueCountsMap.get(item.projectId)
				if (existing) {
					existing.pending = item._count.id
				} else {
					issueCountsMap.set(item.projectId, {
						total: 0,
						pending: item._count.id,
					})
				}
			})
		}

		const formattedProjects = projects.map((project) => {
			const response = this.formatProjectResponse(project)
			const counts = issueCountsMap.get(project.id) || { total: 0, pending: 0 }
			return {
				...response,
				issueCounts: counts,
			}
		})

		return {
			data: formattedProjects,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		}
	}

	/**
	 * Get project by public key (public endpoint)
	 * Returns limited data - no sensitive information
	 * 
	 * @param publicKey - Project public key
	 * @returns Project with limited fields
	 * @throws {NotFoundError} If project not found
	 */
	async findByPublicKey(publicKey: string): Promise<{
		id: number
		name: string
		publicKey: string
		allowedDomains: string[]
		status: boolean
	}> {
		const project = await db.project.findFirst({
			where: {
				publicKey,
				deletedAt: null,
			},
			select: {
				id: true,
				name: true,
				publicKey: true,
				allowedDomains: true,
				status: true,
			},
		})

		if (!project) {
			throw new NotFoundError('Project not found')
		}

		return {
			id: project.id,
			name: project.name,
			publicKey: project.publicKey,
			allowedDomains: project.allowedDomains as string[],
			status: project.status,
		}
	}

	/**
	 * Get project by ID
	 * 
	 * @param id - Project ID
	 * @returns Project with environments
	 * @throws {NotFoundError} If project not found
	 */
	async findById(id: number): Promise<ProjectResponse> {
		const project = await db.project.findFirst({
			where: {
				id,
				deletedAt: null,
			},
			include: {
				environments: {
					orderBy: { name: 'asc' },
				},
			},
		})

		if (!project) {
			throw new NotFoundError('Project not found')
		}

		return this.formatProjectResponse(project)
	}

	/**
	 * Create new project
	 * 
	 * @param data - Project creation data
	 * @param req - Optional authenticated request for logging
	 * @returns Created project
	 */
	async create(data: CreateProjectDto, req?: AuthenticatedRequest | null): Promise<ProjectResponse> {
		// Generate unique keys
		const keys = await this.ensureUniqueKeys()

		// Validate allowed domains
		if (!Array.isArray(data.allowedDomains) || data.allowedDomains.length === 0) {
			throw new BadRequestError('At least one allowed domain is required')
		}

		// Create project with environments
		const project = await db.project.create({
			data: {
				name: data.name,
				description: data.description || null,
				publicKey: keys.publicKey,
				privateKey: keys.privateKey,
				status: data.status ?? true,
				allowedDomains: data.allowedDomains,
				environments: data.environments
					? {
							create: data.environments.map((env) => ({
								name: env.name,
								apiUrl: env.apiUrl || null,
								allowedOrigins: env.allowedOrigins === null ? Prisma.JsonNull : env.allowedOrigins ?? Prisma.JsonNull,
								isActive: env.isActive ?? true,
							})),
						}
					: undefined,
			},
			include: {
				environments: true,
			},
		})

		const result = this.formatProjectResponse(project)

		// Log activity
		await logActivity(req || null, ActivityAction.CREATE, 'Project', project.id.toString(), null, result)

		return result
	}

	/**
	 * Update project
	 * 
	 * @param id - Project ID
	 * @param data - Project update data
	 * @param req - Optional authenticated request for logging
	 * @returns Updated project
	 * @throws {NotFoundError} If project not found
	 */
	async update(id: number, data: UpdateProjectDto, req?: AuthenticatedRequest | null): Promise<ProjectResponse> {
		// Check if project exists
		const existing = await db.project.findFirst({
			where: {
				id,
				deletedAt: null,
			},
			include: {
				environments: true,
			},
		})

		if (!existing) {
			throw new NotFoundError('Project not found')
		}

		// Validate allowed domains if provided
		if (data.allowedDomains !== undefined) {
			if (!Array.isArray(data.allowedDomains) || data.allowedDomains.length === 0) {
				throw new BadRequestError('At least one allowed domain is required')
			}
		}

		// Prepare update data
		const updateData: any = {}
		if (data.name !== undefined) updateData.name = data.name
		if (data.description !== undefined) updateData.description = data.description || null
		if (data.allowedDomains !== undefined) updateData.allowedDomains = data.allowedDomains
		if (data.status !== undefined) updateData.status = data.status

		// Update project
		const project = await db.project.update({
			where: { id },
			data: updateData,
			include: {
				environments: {
					orderBy: { name: 'asc' },
				},
			},
		})

		const result = this.formatProjectResponse(project)

		// Log activity
		await logActivity(
			req || null,
			ActivityAction.UPDATE,
			'Project',
			project.id.toString(),
			existing,
			result
		)

		return result
	}

	/**
	 * Soft delete project
	 * 
	 * @param id - Project ID
	 * @param req - Optional authenticated request for logging
	 * @throws {NotFoundError} If project not found
	 */
	async delete(id: number, req?: AuthenticatedRequest | null): Promise<void> {
		const existing = await db.project.findFirst({
			where: {
				id,
				deletedAt: null,
			},
		})

		if (!existing) {
			throw new NotFoundError('Project not found')
		}

		await db.project.update({
			where: { id },
			data: { deletedAt: new Date() },
		})

		// Log activity
		await logActivity(
			req || null,
			ActivityAction.DELETE,
			'Project',
			id.toString(),
			existing,
			null
		)
	}

	/**
	 * Add environment to project
	 * 
	 * @param projectId - Project ID
	 * @param data - Environment creation data
	 * @param req - Optional authenticated request for logging
	 * @returns Created environment
	 * @throws {NotFoundError} If project not found
	 * @throws {ConflictError} If environment name already exists
	 */
	async addEnvironment(
		projectId: number,
		data: CreateProjectEnvironmentDto,
		req?: AuthenticatedRequest | null
	): Promise<ProjectEnvironmentResponse> {
		// Check if project exists
		const project = await db.project.findFirst({
			where: {
				id: projectId,
				deletedAt: null,
			},
		})

		if (!project) {
			throw new NotFoundError('Project not found')
		}

		// Check if environment name already exists
		const existing = await db.projectEnvironment.findUnique({
			where: {
				projectId_name: {
					projectId,
					name: data.name,
				},
			},
		})

		if (existing) {
			throw new ConflictError(`Environment "${data.name}" already exists for this project`)
		}

		const environment = await db.projectEnvironment.create({
			data: {
				projectId,
				name: data.name,
				apiUrl: data.apiUrl || null,
				allowedOrigins: data.allowedOrigins === null ? Prisma.JsonNull : data.allowedOrigins ?? Prisma.JsonNull,
				isActive: data.isActive ?? true,
			},
		})

		// Log activity
		await logActivity(
			req || null,
			ActivityAction.CREATE,
			'ProjectEnvironment',
			environment.id.toString(),
			null,
			environment
		)

		return this.formatEnvironmentResponse(environment)
	}

	/**
	 * Update project environment
	 * 
	 * @param projectId - Project ID
	 * @param envId - Environment ID
	 * @param data - Environment update data
	 * @param req - Optional authenticated request for logging
	 * @returns Updated environment
	 * @throws {NotFoundError} If project or environment not found
	 * @throws {ConflictError} If new name conflicts with existing environment
	 */
	async updateEnvironment(
		projectId: number,
		envId: number,
		data: UpdateProjectEnvironmentDto,
		req?: AuthenticatedRequest | null
	): Promise<ProjectEnvironmentResponse> {
		// Check if project exists
		const project = await db.project.findFirst({
			where: {
				id: projectId,
				deletedAt: null,
			},
		})

		if (!project) {
			throw new NotFoundError('Project not found')
		}

		// Check if environment exists
		const existing = await db.projectEnvironment.findFirst({
			where: {
				id: envId,
				projectId,
			},
		})

		if (!existing) {
			throw new NotFoundError('Environment not found')
		}

		// Check for name conflict if name is being changed
		if (data.name && data.name !== existing.name) {
			const conflict = await db.projectEnvironment.findUnique({
				where: {
					projectId_name: {
						projectId,
						name: data.name,
					},
				},
			})

			if (conflict) {
				throw new ConflictError(`Environment "${data.name}" already exists for this project`)
			}
		}

		// Prepare update data
		const updateData: any = {}
		if (data.name !== undefined) updateData.name = data.name
		if (data.apiUrl !== undefined) updateData.apiUrl = data.apiUrl || null
		if (data.allowedOrigins !== undefined) updateData.allowedOrigins = data.allowedOrigins === null ? Prisma.JsonNull : data.allowedOrigins ?? Prisma.JsonNull
		if (data.isActive !== undefined) updateData.isActive = data.isActive

		const environment = await db.projectEnvironment.update({
			where: { id: envId },
			data: updateData,
		})

		// Log activity
		await logActivity(
			req || null,
			ActivityAction.UPDATE,
			'ProjectEnvironment',
			environment.id.toString(),
			existing,
			environment
		)

		return this.formatEnvironmentResponse(environment)
	}

	/**
	 * Remove environment from project
	 * 
	 * @param projectId - Project ID
	 * @param envId - Environment ID
	 * @param req - Optional authenticated request for logging
	 * @throws {NotFoundError} If project or environment not found
	 */
	async removeEnvironment(
		projectId: number,
		envId: number,
		req?: AuthenticatedRequest | null
	): Promise<void> {
		// Check if project exists
		const project = await db.project.findFirst({
			where: {
				id: projectId,
				deletedAt: null,
			},
		})

		if (!project) {
			throw new NotFoundError('Project not found')
		}

		// Check if environment exists
		const existing = await db.projectEnvironment.findFirst({
			where: {
				id: envId,
				projectId,
			},
		})

		if (!existing) {
			throw new NotFoundError('Environment not found')
		}

		await db.projectEnvironment.delete({
			where: { id: envId },
		})

		// Log activity
		await logActivity(
			req || null,
			ActivityAction.DELETE,
			'ProjectEnvironment',
			envId.toString(),
			existing,
			null
		)
	}
}

