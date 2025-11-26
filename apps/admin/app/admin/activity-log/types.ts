export enum ActivityAction {
	CREATE = 'CREATE',
	UPDATE = 'UPDATE',
	DELETE = 'DELETE',
}

export interface ActivityLogUser {
	id: number
	name: string | null
	username: string | null
	email: string | null
}

export interface ActivityLogApiModel {
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
	createdAt: string
	user: ActivityLogUser | null
}

export interface ActivityLog {
	id: string
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
	user: ActivityLogUser | null
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

export interface ActivityLogPagination {
	page: number
	limit: number
	total: number
	totalPages: number
}

export type ActivityLogListApiResponse = ApiSuccessResponse<{
	data: ActivityLogApiModel[]
	pagination: ActivityLogPagination
}>

export type ActivityLogApiResponse = ApiSuccessResponse<ActivityLogApiModel>

export interface ApiSuccessResponse<T> {
	data: T
	message: string
	status: number
}

