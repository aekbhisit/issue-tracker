/**
 * @module Permission Types
 * @description Type definitions for Permission module
 */

export interface Permission {
	id: number
	scope: string
	method: string
	action: string
	type?: string
	path: string
	module: string
	group: string
	metaName: string
	description: string
	isActive: boolean
	createdAt: Date
	updatedAt: Date
}

export interface CreatePermissionDto {
	scope: string
	method: string
	action: string
	type?: string
	path: string
	module: string
	group: string
	metaName: string
	description: string
	isActive?: boolean
}

export interface UpdatePermissionDto {
	scope?: string
	method?: string
	action?: string
	type?: string
	path?: string
	module?: string
	group?: string
	metaName?: string
	description?: string
	isActive?: boolean
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
	isActive?: boolean
	sortBy?: string
	sortOrder?: 'asc' | 'desc'
}

export interface PermissionListResponse {
	data: Permission[]
	pagination: {
		page: number
		limit: number
		total: number
		totalPages: number
	}
}

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

