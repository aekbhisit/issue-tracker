/**
 * User-related types
 */

export interface User {
	id: number
	username: string | null
	email: string | null
	name: string | null
	roleId: number | null
	status: boolean
	createdAt: Date
	updatedAt: Date
}

export interface CreateUserDto {
	username?: string
	email?: string
	password: string
	name?: string
	roleId?: number
	status?: boolean
}

export interface UpdateUserDto {
	username?: string
	email?: string
	name?: string
	roleId?: number
	status?: boolean
}

export interface LoginDto {
	username?: string
	email?: string
	password: string
	remember?: boolean
}

export interface RegisterDto {
	username?: string
	email: string
	password: string
	name: string
}

export interface AuthTokens {
	accessToken: string
	refreshToken?: string
	user?: {
		id: number
		username: string | null
		email: string | null
		name: string | null
		roleId: number | null
		roleName: string | null
	}
}

export interface AuthUser {
	id: number
	username: string | null
	email: string | null
	name: string | null
	roleId: number | null
	roleName: string | null
}

