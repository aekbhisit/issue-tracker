/**
 * @module Admin Menu Types
 * @description Type definitions for admin menu module
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
	createdAt: string
	updatedAt: string
	children?: AdminMenu[]
	parent?: AdminMenu | null
	translates?: AdminMenuTranslation[]
	level?: number
}

export interface AdminMenuTranslation {
	id?: number
	menuId: number
	lang: string
	name: string | null
	createdAt?: string
	updatedAt?: string
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

export interface AdminMenuApiResponse {
	menu: AdminMenu
}

export interface AdminMenuTreeResponse {
	menu: AdminMenu[]
}

export interface AdminMenuFormTranslation {
	name: string
}

export interface AdminMenuFormData {
	translations: Record<string, AdminMenuFormTranslation>
	icon?: string | null
	path?: string | null
	module?: string | null
	type?: string | null
	group?: string | null
	parentId?: number | null
	status?: boolean
}

export interface AdminMenuReorderEntry {
	id: number
	parentId: number | null
	sequence: number
}

export interface AdminMenuTreeNode {
	id: number
	children?: AdminMenuTreeNode[]
}

