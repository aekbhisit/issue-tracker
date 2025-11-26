/**
 * @module User Types
 * @description Type definitions for User module
 */

import { FileUploadMedia } from '../../shared/types/fileupload.types'

// Use shared FileUploadMedia type for avatar
export type AvatarData = FileUploadMedia

export interface User {
	id: number
	roleId: number | null
	name: string | null
	username: string | null
	email: string | null
	avatar: AvatarData | null
	lang: string
	status: boolean
	loginAt: Date | null
	createdAt: Date
	updatedAt: Date
}

export interface CreateUserDto {
	roleId?: number
	name: string
	username: string
	email: string
	password: string
	lang?: string
	status?: boolean
	avatar?: AvatarData | null
}

export interface UpdateUserDto {
	roleId?: number
	name?: string
	email?: string
	password?: string
	lang?: string
	status?: boolean
	avatar?: AvatarData | null
}

export interface UserListQuery {
	page?: number
	limit?: number
	search?: string
	roleId?: number
	sortBy?: string
	sortOrder?: 'asc' | 'desc'
}

export interface UserListResponse {
	data: User[]
	pagination: {
		page: number
		limit: number
		total: number
		totalPages: number
	}
}

// Re-export shared FileUpload media utilities for avatar
export {
	isFileUploadMedia as isAvatarData,
	parseFileUploadMedia as parseAvatarValue,
	sanitizeFileUploadMedia as sanitizeAvatarInput,
	extractFileUploadMediaSrc as extractAvatarSrc,
	mergeFileUploadMediaWithSrc as mergeAvatarWithSrc,
	serializeFileUploadMedia as serializeAvatarValue,
} from '../../shared/utils/fileupload.utils'
