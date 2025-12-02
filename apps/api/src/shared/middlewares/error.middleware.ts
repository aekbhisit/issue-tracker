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
	const errMessage = err.message || ''
	const errName = err.name || ''
	const errStack = err.stack || ''
	
	// Log raw error for debugging (always, even in production for server logs)
	console.error('🔍 Raw Error Details:', {
		name: errName,
		message: errMessage,
		stack: errStack.substring(0, 500), // First 500 chars of stack
	})

	// Check for database connection errors (comprehensive patterns)
	if (
		errMessage.includes('Can\'t reach database server') ||
		errMessage.includes('Connection refused') ||
		errMessage.includes('ECONNREFUSED') ||
		errMessage.includes('ENOTFOUND') ||
		errMessage.includes('timeout') ||
		errMessage.includes('connect ETIMEDOUT') ||
		errMessage.includes('getaddrinfo ENOTFOUND') ||
		errMessage.includes('Connection terminated') ||
		errMessage.includes('Connection closed') ||
		errMessage.includes('Unable to connect') ||
		errName === 'PrismaClientInitializationError' ||
		errName === 'PrismaClientConnectionError' ||
		errStack.includes('PrismaClientInitializationError') ||
		errStack.includes('ECONNREFUSED')
	) {
		return {
			category: 'DatabaseConnectionError',
			userMessage: 'Unable to connect to database. Please check database configuration and ensure the database server is running.',
			status: 503,
			details: {
				code: 'DATABASE_CONNECTION_FAILED',
				hint: 'Check DATABASE_URL, database host, port, and credentials in environment variables.',
				...(process.env.NODE_ENV === 'development' && {
					rawError: errMessage.substring(0, 200), // First 200 chars for debugging
				}),
			}
		}
	}

	// Check for authentication/authorization errors (database and API)
	if (
		errMessage.includes('password authentication failed') ||
		errMessage.includes('authentication failed') ||
		errMessage.includes('invalid credentials') ||
		errMessage.includes('FATAL: password authentication failed') ||
		errMessage.includes('authentication failed for user') ||
		errStack.includes('password authentication failed')
	) {
		return {
			category: 'AuthenticationError',
			userMessage: 'Database authentication failed. Please check database credentials.',
			status: 503,
			details: {
				code: 'DATABASE_AUTH_FAILED',
				hint: 'Verify DATABASE_USER and DATABASE_PASSWORD in environment variables.',
				...(process.env.NODE_ENV === 'development' && {
					rawError: errMessage.substring(0, 200),
				}),
			}
		}
	}

	// Check for configuration errors
	if (
		errMessage.includes('JWT_SECRET') ||
		errMessage.includes('not configured') ||
		errMessage.includes('environment variable') ||
		errMessage.includes('missing required') ||
		errMessage.includes('is not configured') ||
		errMessage.includes('is required') ||
		errStack.includes('JWT_SECRET')
	) {
		return {
			category: 'ConfigurationError',
			userMessage: 'Server configuration error. Please contact administrator.',
			status: 500,
			details: {
				code: 'CONFIGURATION_ERROR',
				hint: process.env.NODE_ENV === 'development' ? errMessage : 'Check server environment variables.',
				...(process.env.NODE_ENV === 'development' && {
					rawError: errMessage,
				}),
			}
		}
	}

	// Check for Prisma errors (check both name and stack)
	if (errName === 'PrismaClientKnownRequestError' || errStack.includes('PrismaClientKnownRequestError')) {
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

	if (errName === 'PrismaClientValidationError' || errStack.includes('PrismaClientValidationError')) {
		return {
			category: 'ValidationError',
			userMessage: 'Invalid database query. Please check your request.',
			status: 400,
			details: process.env.NODE_ENV === 'development' ? {
				message: errMessage,
				rawError: errMessage.substring(0, 300),
			} : undefined,
		}
	}

	// Check for JSON Web Token errors
	if (errName === 'JsonWebTokenError' || errName === 'TokenExpiredError' || errMessage.includes('jwt') || errStack.includes('jsonwebtoken')) {
		return {
			category: 'AuthenticationError',
			userMessage: errName === 'TokenExpiredError'
				? 'Your session has expired. Please log in again.'
				: 'Invalid authentication token. Please log in again.',
			status: 401,
			details: {
				code: 'JWT_ERROR',
				...(process.env.NODE_ENV === 'development' && {
					rawError: errMessage.substring(0, 200),
				}),
			}
		}
	}

	// Check for bcrypt errors
	if (errMessage.includes('bcrypt') || errStack.includes('bcrypt')) {
		return {
			category: 'AuthenticationError',
			userMessage: 'Password verification failed. Please check your credentials.',
			status: 401,
			details: {
				code: 'PASSWORD_VERIFICATION_FAILED',
				...(process.env.NODE_ENV === 'development' && {
					rawError: errMessage.substring(0, 200),
				}),
			}
		}
	}

	// Check for CORS errors (CRITICAL - should be caught early)
	if (
		errMessage.includes('Not allowed by CORS') ||
		errMessage.includes('CORS') ||
		errMessage.includes('cors') ||
		errName === 'CorsError'
	) {
		return {
			category: 'CorsError',
			userMessage: 'Request blocked by CORS policy. Please check server CORS configuration.',
			status: 403,
			details: {
				code: 'CORS_POLICY_VIOLATION',
				hint: 'The request origin is not allowed by the server CORS policy. Check CORS_ORIGIN or ALLOWED_ORIGINS environment variable.',
				...(process.env.NODE_ENV === 'development' && {
					rawError: errMessage,
					allowedOrigins: process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGIN || 'Not configured',
				}),
			}
		}
	}

	// Default: Internal Server Error
	// In production, show generic message but include error code
	// In development, show actual error message
	const isProduction = process.env.NODE_ENV === 'production'
	
	return {
		category: 'InternalServerError',
		userMessage: isProduction
			? 'An unexpected error occurred. Please try again later or contact support if the problem persists.'
			: errMessage || 'An unexpected error occurred',
		status: 500,
		details: {
			code: 'UNEXPECTED_ERROR',
			...(isProduction ? {
				// In production, provide a hint but not the actual error
				hint: 'Check server logs for detailed error information. Common causes: database connection issues, missing environment variables, or application errors.',
			} : {
				// In development, show full error details
				name: errName,
				message: errMessage,
				stack: errStack.substring(0, 1000), // First 1000 chars
			}),
		},
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
	// Preserve CORS headers for public API routes
	// This ensures CORS headers are present even when errors occur
	const path = req.path || ''
	const baseUrl = req.baseUrl || ''
	const fullPath = baseUrl + path
	const isPublicApiRoute = fullPath.startsWith('/api/public/v1') || path.startsWith('/api/public/v1')
	
	if (isPublicApiRoute && process.env.ALLOW_PUBLIC_API_CORS === 'true') {
		const origin = req.headers.origin
		if (origin) {
			res.setHeader('Access-Control-Allow-Origin', origin)
		} else {
			res.setHeader('Access-Control-Allow-Origin', '*')
		}
		res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
		res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
		res.setHeader('Access-Control-Max-Age', '86400')
	}
	// Enhanced logging with request context
	// Note: For CORS errors, body might not be parsed yet, so we check if body exists
	const requestContext = {
		method: req.method,
		path: req.path,
		query: req.query,
		// Only log body if it exists and has been parsed
		// CORS errors happen before body parsing, so body might be empty
		body: (req.method === 'POST' || req.method === 'PUT') && req.body && Object.keys(req.body).length > 0
			? {
				...req.body,
				password: req.body?.password ? '[REDACTED]' : (req.body?.password === undefined ? 'NOT_PROVIDED' : undefined),
			}
			: (req.method === 'POST' || req.method === 'PUT') 
				? 'BODY_NOT_PARSED_OR_EMPTY' 
				: undefined,
		// Log headers to see if Content-Type is set (helps debug CORS/preflight issues)
		contentType: req.get('content-type'),
		origin: req.get('origin'),
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

