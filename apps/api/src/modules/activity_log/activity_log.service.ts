/**
 * @module Activity Log Service
 * @description Business logic for activity log management
 */

import { db } from '@workspace/database'
import { Prisma } from '@prisma/client'
import {
	ActivityLog,
	CreateActivityLogDto,
	ActivityLogListQuery,
	ActivityLogListResponse,
	ActivityAction,
} from './activity_log.types'
import { NotFoundError } from '../../shared/utils/error.util'

export class ActivityLogService {
	/**
	 * Create activity log entry
	 */
	async log(data: CreateActivityLogDto): Promise<ActivityLog> {
		const log = await db.activityLog.create({
			data: {
				userId: data.userId ?? null,
				action: data.action,
				model: data.model,
				modelId: data.modelId,
				oldData: data.oldData === null ? Prisma.JsonNull : data.oldData ?? Prisma.JsonNull,
				newData: data.newData === null ? Prisma.JsonNull : data.newData ?? Prisma.JsonNull,
				changes: data.changes === null ? Prisma.JsonNull : data.changes ?? Prisma.JsonNull,
				ipAddress: data.ipAddress ?? null,
				userAgent: data.userAgent ?? null,
			},
			include: {
				user: {
					select: {
						id: true,
						name: true,
						username: true,
						email: true,
					},
				},
			},
		})

		return this.transformActivityLog(log)
	}

	/**
	 * Get paginated list of activity logs with filters
	 */
	async findAll(query: ActivityLogListQuery): Promise<ActivityLogListResponse> {
		const page = query.page || 1
		const limit = query.limit || 10
		const skip = (page - 1) * limit
		const search = query.search || ''
		const action = query.action
		const model = query.model
		const userId = query.userId
		const dateFrom = query.dateFrom ? new Date(query.dateFrom) : null
		const dateTo = query.dateTo ? new Date(query.dateTo) : null
		const sortBy = query.sortBy || 'createdAt'
		const sortOrder = query.sortOrder || 'desc'

		// Build where clause
		const where: any = {}

		if (action) {
			where.action = action
		}

		if (model) {
			where.model = model
		}

		if (userId) {
			where.userId = userId
		}

		if (dateFrom || dateTo) {
			where.createdAt = {}
			if (dateFrom) {
				where.createdAt.gte = dateFrom
			}
			if (dateTo) {
				// Add one day to include the entire end date
				const endDate = new Date(dateTo)
				endDate.setDate(endDate.getDate() + 1)
				where.createdAt.lt = endDate
			}
		}

		// Add search condition
		if (search) {
			where.OR = [
				{ model: { contains: search, mode: 'insensitive' } },
				{ modelId: { contains: search, mode: 'insensitive' } },
				{
					user: {
						OR: [
							{ name: { contains: search, mode: 'insensitive' } },
							{ username: { contains: search, mode: 'insensitive' } },
							{ email: { contains: search, mode: 'insensitive' } },
						],
					},
				},
			]
		}

		// Get total count
		const total = await db.activityLog.count({ where })

		// Get logs with pagination
		const logs = await db.activityLog.findMany({
			where,
			skip,
			take: limit,
			orderBy: { [sortBy]: sortOrder },
			include: {
				user: {
					select: {
						id: true,
						name: true,
						username: true,
						email: true,
					},
				},
			},
		})

		return {
			data: logs.map(log => this.transformActivityLog(log)),
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		}
	}

	/**
	 * Find activity log by ID
	 */
	async findById(id: number): Promise<ActivityLog> {
		const log = await db.activityLog.findUnique({
			where: { id },
			include: {
				user: {
					select: {
						id: true,
						name: true,
						username: true,
						email: true,
					},
				},
			},
		})

		if (!log) {
			throw new NotFoundError('Activity log not found')
		}

		return this.transformActivityLog(log)
	}

	/**
	 * Find activity logs by model and model ID
	 */
	async findByModel(model: string, modelId: string): Promise<ActivityLog[]> {
		const logs = await db.activityLog.findMany({
			where: {
				model,
				modelId,
			},
			orderBy: {
				createdAt: 'desc',
			},
			include: {
				user: {
					select: {
						id: true,
						name: true,
						username: true,
						email: true,
					},
				},
			},
		})

		return logs.map(log => this.transformActivityLog(log))
	}

	/**
	 * Find activity logs by user ID
	 */
	async findByUser(userId: number): Promise<ActivityLog[]> {
		const logs = await db.activityLog.findMany({
			where: {
				userId,
			},
			orderBy: {
				createdAt: 'desc',
			},
			include: {
				user: {
					select: {
						id: true,
						name: true,
						username: true,
						email: true,
					},
				},
			},
		})

		return logs.map(log => this.transformActivityLog(log))
	}

	/**
	 * Transform Prisma activity log to ActivityLog type
	 */
	private transformActivityLog(log: any): ActivityLog {
		return {
			id: log.id,
			userId: log.userId,
			action: log.action as ActivityAction,
			model: log.model,
			modelId: log.modelId,
			oldData: log.oldData as Record<string, any> | null,
			newData: log.newData as Record<string, any> | null,
			changes: log.changes as Record<string, any> | null,
			ipAddress: log.ipAddress,
			userAgent: log.userAgent,
			createdAt: log.createdAt,
			user: log.user,
		}
	}
}

