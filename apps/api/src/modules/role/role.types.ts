/**
 * @module Role Types
 * @description Type definitions for Role module
 */

export interface Role {
	id: number
	name: string
	scope: string
	sequence: number
	status: boolean
	createdAt: Date
	updatedAt: Date
	permissions?: number[]
}

export interface CreateRoleDto {
	name: string
	scope: string
	status?: boolean
	permissions?: number[]
}

export interface UpdateRoleDto {
	name?: string
	scope?: string
	status?: boolean
	permissions?: number[]
}

export interface RoleListQuery {
	page?: number
	limit?: number
	search?: string
	scope?: string
	sortBy?: string
	sortOrder?: 'asc' | 'desc'
}

export interface RoleListResponse {
	data: Role[]
	pagination: {
		page: number
		limit: number
		total: number
		totalPages: number
	}
}

export interface RoleSelectOption {
	id: number
	text: string
}

