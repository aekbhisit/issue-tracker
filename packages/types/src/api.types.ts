/**
 * API-related types
 */

import { Request, Application } from 'express'
import { AuthUser } from './user.types'

/**
 * Extended Express Request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
	user?: AuthUser
	app: Application
	headers: Request['headers']
	body: Request['body']
	params: Request['params']
	query: Request['query']
}

/**
 * HTTP Status codes
 */
export enum HttpStatus {
	OK = 200,
	CREATED = 201,
	NO_CONTENT = 204,
	BAD_REQUEST = 400,
	UNAUTHORIZED = 401,
	FORBIDDEN = 403,
	NOT_FOUND = 404,
	CONFLICT = 409,
	UNPROCESSABLE_ENTITY = 422,
	INTERNAL_SERVER_ERROR = 500,
}

/**
 * API Error class
 */
export class ApiError extends Error {
	constructor(
		public message: string,
		public status: number = HttpStatus.INTERNAL_SERVER_ERROR,
		public details?: any
	) {
		super(message)
		this.name = 'ApiError'
	}
}

/**
 * Common validation error
 */
export interface ValidationError {
	field: string
	message: string
}

