export interface PermissionApiModel {
	id: number
	scope: string
	method: string
	module: string
	type?: string | null
	group: string
	action: string
	path: string
	metaName: string
	description: string
	isActive: boolean
	createdAt: string
	updatedAt: string
}

export interface Permission {
	id: string
	scope: string
	method: string
	module: string
	type?: string | null
	group: string
	action: string
	path: string
	metaName: string
	description: string
	isActive: boolean
	createdAt: Date
	updatedAt: Date
}

export interface PermissionListQuery {
	page?: number
	limit?: number
	search?: string
	scope?: string
	module?: string
	method?: string
	action?: string
	type?: string
	group?: string
	metaName?: string
	isActive?: boolean | null
	sortBy?: string
	sortOrder?: "asc" | "desc"
}

export interface PermissionPagination {
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

export type PermissionListApiResponse = ApiSuccessResponse<{
	data: PermissionApiModel[]
	pagination: PermissionPagination
}>

export type PermissionApiResponse = ApiSuccessResponse<PermissionApiModel>

export interface GeneratedPermissionPreview {
	scope: string
	module: string
	method: string
	action: string
	group: string
	metaName: string
	path: string
	description: string
	basePath: string
	type?: string
	paramType?: string
}

export type GeneratePermissionsApiResponse = ApiSuccessResponse<{
	permissions: GeneratedPermissionPreview[]
}>

