/**
 * @module Error Middleware
 * @description Global error handling middleware with improved error categorization and user-friendly messages
 */

import { Request, Response, NextFunction } from 'express'
import { BaseApiError } from '../utils/error.util'

/**
 * Categorize error and provide user-friendly message
 */
function categorizeError(err: Error): { category: string; userMessage: string; status: number; details?: any } {
	// Check for database connection errors
	if (
		err.message?.includes('Can\'t reach database server') ||
		err.message?.includes('Connection refused') ||
		err.message?.includes('ECONNREFUSED') ||
		err.message?.includes('ENOTFOUND') ||
		err.message?.includes('timeout') ||
		err.message?.includes('connect ETIMEDOUT') ||
		err.name === 'PrismaClientInitializationError'
	) {
		return {
			category: 'DatabaseConnectionError',
			userMessage: 'Unable to connect to database. Please check database configuration and ensure the database server is running.',
			status: 503,
			details: {
				code: 'DATABASE_CONNECTION_FAILED',
				hint: 'Check DATABASE_URL, database host, port, and credentials in environment variables.',
			}
		}
	}

	// Check for authentication/authorization errors
	if (
		err.message?.includes('password authentication failed') ||
		err.message?.includes('authentication failed') ||
		err.message?.includes('invalid credentials')
	) {
		return {
			category: 'AuthenticationError',
			userMessage: 'Database authentication failed. Please check database credentials.',
			status: 503,
			details: {
				code: 'DATABASE_AUTH_FAILED',
				hint: 'Verify DATABASE_USER and DATABASE_PASSWORD in environment variables.',
			}
		}
	}

	// Check for configuration errors
	if (
		err.message?.includes('JWT_SECRET') ||
		err.message?.includes('not configured') ||
		err.message?.includes('environment variable') ||
		err.message?.includes('missing required')
	) {
		return {
			category: 'ConfigurationError',
			userMessage: 'Server configuration error. Please contact administrator.',
			status: 500,
			details: {
				code: 'CONFIGURATION_ERROR',
				hint: process.env.NODE_ENV === 'development' ? err.message : 'Check server environment variables.',
			}
		}
	}

	// Check for Prisma errors
	if (err.name === 'PrismaClientKnownRequestError') {
		const prismaErr = err as any
		const code = prismaErr.code

		// Handle specific Prisma error codes
		if (code === 'P1001') {
			return {
				category: 'DatabaseConnectionError',
				userMessage: 'Cannot reach database server. Please check database connection settings.',
				status: 503,
				details: {
					code: 'DATABASE_UNREACHABLE',
					hint: 'Verify database host and port are correct.',
				}
			}
		}

		if (code === 'P1000') {
			return {
				category: 'AuthenticationError',
				userMessage: 'Database authentication failed. Invalid username or password.',
				status: 503,
				details: {
					code: 'DATABASE_AUTH_FAILED',
					hint: 'Check DATABASE_USER and DATABASE_PASSWORD.',
				}
			}
		}

		if (code === 'P1003') {
			return {
				category: 'DatabaseError',
				userMessage: 'Database does not exist. Please create the database first.',
				status: 400,
				details: {
					code: 'DATABASE_NOT_FOUND',
					hint: `Database "${prismaErr.meta?.database_name}" not found. Create it or update DATABASE_NAME.`,
				}
			}
		}

		if (code === 'P2002') {
			return {
				category: 'ConflictError',
				userMessage: 'A record with this value already exists.',
				status: 409,
				details: {
					code: 'UNIQUE_CONSTRAINT_VIOLATION',
					field: prismaErr.meta?.target?.[0],
				}
			}
		}

		// Generic Prisma error
		return {
			category: 'DatabaseError',
			userMessage: process.env.NODE_ENV === 'production'
				? 'Database operation failed. Please try again later.'
				: err.message || 'Database operation failed',
			status: 400,
			details: process.env.NODE_ENV === 'development' ? {
				code: prismaErr.code,
				meta: prismaErr.meta,
			} : undefined,
		}
	}

	if (err.name === 'PrismaClientValidationError') {
		return {
			category: 'ValidationError',
			userMessage: 'Invalid database query. Please check your request.',
			status: 400,
			details: process.env.NODE_ENV === 'development' ? {
				message: err.message,
			} : undefined,
		}
	}

	// Check for JSON Web Token errors
	if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError' || err.message?.includes('jwt')) {
		return {
			category: 'AuthenticationError',
			userMessage: err.name === 'TokenExpiredError'
				? 'Your session has expired. Please log in again.'
				: 'Invalid authentication token. Please log in again.',
			status: 401,
			details: {
				code: 'JWT_ERROR',
			}
		}
	}

	// Default: Internal Server Error
	return {
		category: 'InternalServerError',
		userMessage: process.env.NODE_ENV === 'production'
			? 'An unexpected error occurred. Please try again later or contact support if the problem persists.'
			: err.message || 'An unexpected error occurred',
		status: 500,
		details: process.env.NODE_ENV === 'development' ? {
			name: err.name,
			message: err.message,
			stack: err.stack,
		} : undefined,
	}
}

/**
 * Global error handler middleware
 * 
 * Catches all errors and returns consistent, user-friendly error responses
 */
export function errorMiddleware(
	err: Error | BaseApiError,
	req: Request,
	res: Response,
	_next: NextFunction
) {
	// Enhanced logging with request context
	const requestContext = {
		method: req.method,
		path: req.path,
		query: req.query,
		body: req.method === 'POST' || req.method === 'PUT' ? {
			...req.body,
			password: req.body?.password ? '[REDACTED]' : undefined,
		} : undefined,
		ip: req.ip || req.socket.remoteAddress,
		userAgent: req.get('user-agent'),
	}

	// Handle custom API errors (these already have user-friendly messages)
	if (err instanceof BaseApiError) {
		console.error('API Error:', {
			name: err.name,
			message: err.message,
			status: err.status,
			...requestContext,
		})

		return res.status(err.status).json({
			error: err.name,
			message: err.message,
			status: err.status,
			details: err.details,
		})
	}

	// Categorize and handle other errors
	const categorized = categorizeError(err)

	// Log error with full context
	console.error('Error Details:', {
		category: categorized.category,
		name: err.name,
		message: err.message,
		status: categorized.status,
		stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
		...requestContext,
	})

	// Return user-friendly error response
	res.status(categorized.status).json({
		error: categorized.category,
		message: categorized.userMessage,
		status: categorized.status,
		...(categorized.details && { details: categorized.details }),
	})
}

