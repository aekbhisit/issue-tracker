/**
 * @module Admin Menu Types
 * @description Type definitions for Admin Menu module
 */

export interface AdminMenu {
	id: number
	icon?: string | null
	path?: string | null
	parentId?: number | null
	sequence: number
	module?: string | null
	type?: string | null
	group?: string | null
	status: boolean
	createdAt: Date
	updatedAt: Date
	children?: AdminMenu[]
	parent?: AdminMenu | null
	translates?: AdminMenuTranslate[]
}

export interface AdminMenuTranslate {
	id?: number
	menuId: number
	lang: string
	name: string | null
	createdAt?: Date
	updatedAt?: Date
}

export interface CreateAdminMenuDto {
	icon?: string | null
	path?: string | null
	parentId?: number | null
	sequence?: number
	module?: string | null
	type?: string | null
	group?: string | null
	status?: boolean
	translates: CreateAdminMenuTranslateDto[]
}

export interface CreateAdminMenuTranslateDto {
	lang: string
	name?: string
}

export interface UpdateAdminMenuDto {
	icon?: string | null
	path?: string | null
	parentId?: number | null
	sequence?: number
	module?: string | null
	type?: string | null
	group?: string | null
	status?: boolean
	translates?: UpdateAdminMenuTranslateDto[]
}

export interface UpdateAdminMenuTranslateDto {
	lang: string
	name?: string
}

export interface AdminMenuListQuery {
	page?: number
	limit?: number
	search?: string
	module?: string
	type?: string
	status?: boolean
	parentId?: number | null
	sortBy?: string
	sortOrder?: 'asc' | 'desc'
}

export interface AdminMenuListResponse {
	data: AdminMenu[]
	pagination: {
		page: number
		limit: number
		total: number
		totalPages: number
	}
}

export interface AdminMenuTreeItem extends AdminMenu {
	children?: AdminMenuTreeItem[]
}

export interface AdminMenuReorderEntry {
	id: number
	parentId: number | null
	sequence: number
}

