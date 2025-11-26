/**
 * @module Auth Types
 * @description Type definitions for Authentication module
 */

export interface LoginDto {
	username?: string
	email?: string
	password: string
	remember?: boolean
}

export interface RegisterDto {
	email: string
	password: string
	name: string
	username?: string
}

export interface AuthTokens {
	accessToken: string
	refreshToken?: string
	user?: {
		id: number
		username: string | null
		email: string | null
		name: string | null
		avatar: string | null
		roleId: number | null
		roleName: string | null
	}
}

export interface TokenPayload {
	id: number
	username: string | null
	email: string | null
	name: string | null
	avatar: string | null
	roleId: number | null
	roleName: string | null
}

