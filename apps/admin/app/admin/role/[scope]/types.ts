export interface RoleApiModel {
	id: number
	scope: string
	name: string
	sequence: number
	status: boolean
	createdAt: string
	updatedAt: string
	permissions?: number[]
	usersCount?: number
}

export interface Role {
	id: string
	scope: string
	name: string
	sequence: number
	status: boolean
	createdAt: Date
	updatedAt: Date
	permissions: number[]
	usersCount?: number
}

export interface RoleListQuery {
	page?: number
	limit?: number
	search?: string
	sortBy?: string
	sortOrder?: 'asc' | 'desc'
	scope: string
}

export interface RolePagination {
	page: number
	limit: number
	total: number
	totalPages: number
}

export interface ApiSuccessResponse<T> {
	data: T
	message: string
	status: number
}

export type RoleListApiResponse = ApiSuccessResponse<{
	data: RoleApiModel[]
	pagination: RolePagination
}>

export type RoleApiResponse = ApiSuccessResponse<RoleApiModel>

export interface RoleFormData {
	name: string
	status: boolean
	permissions: number[]
	scope: string
}

export interface PermissionSummaryAction {
	id: number
	action: string
	metaName: string
	description: string
}

export interface PermissionSummaryGroup {
	key: string
	label: string
	actionIds: number[]
	actions: PermissionSummaryAction[]
}

export interface PermissionSummaryModule {
	key: string
	label: string
	groups: PermissionSummaryGroup[]
}

export interface PermissionSummarySet {
	type: string | null
	modules: PermissionSummaryModule[]
}


