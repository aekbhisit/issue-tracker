/**
 * @module Activity Log Types
 * @description Type definitions for Activity Log module
 */

export enum ActivityAction {
	CREATE = 'CREATE',
	UPDATE = 'UPDATE',
	DELETE = 'DELETE',
}

export interface ActivityLog {
	id: number
	userId: number | null
	action: ActivityAction
	model: string
	modelId: string
	oldData: Record<string, any> | null
	newData: Record<string, any> | null
	changes: Record<string, any> | null
	ipAddress: string | null
	userAgent: string | null
	createdAt: Date
	user?: {
		id: number
		name: string | null
		username: string | null
		email: string | null
	} | null
}

export interface CreateActivityLogDto {
	userId?: number | null
	action: ActivityAction
	model: string
	modelId: string
	oldData?: Record<string, any> | null
	newData?: Record<string, any> | null
	changes?: Record<string, any> | null
	ipAddress?: string | null
	userAgent?: string | null
}

export interface ActivityLogListQuery {
	page?: number
	limit?: number
	search?: string
	action?: ActivityAction
	model?: string
	userId?: number
	dateFrom?: string
	dateTo?: string
	sortBy?: string
	sortOrder?: 'asc' | 'desc'
}

export interface ActivityLogListResponse {
	data: ActivityLog[]
	pagination: {
		page: number
		limit: number
		total: number
		totalPages: number
	}
}

