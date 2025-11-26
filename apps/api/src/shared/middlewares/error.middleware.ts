/**
 * @module Error Middleware
 * @description Global error handling middleware
 */

import { Request, Response, NextFunction } from 'express'
import { BaseApiError } from '../utils/error.util'

/**
 * Global error handler middleware
 * 
 * Catches all errors and returns consistent error responses
 */
export function errorMiddleware(
	err: Error | BaseApiError,
	_req: Request,
	res: Response,
	_next: NextFunction
) {
	// Log error
	console.error('Error:', err)

	// Handle custom API errors (NotFoundError, BadRequestError, etc.)
	if (err instanceof BaseApiError) {
		return res.status(err.status).json({
			error: err.name,
			message: err.message,
			status: err.status,
			details: err.details,
		})
	}

	// Handle Prisma errors
	if (err.name === 'PrismaClientKnownRequestError' || err.name === 'PrismaClientValidationError' || err.name === 'PrismaClientInitializationError') {
		// Log detailed error in development
		if (process.env.NODE_ENV === 'development') {
			console.error('Prisma Error Details:', {
				name: err.name,
				message: err.message,
				code: (err as any).code,
				meta: (err as any).meta,
			})
		}
		
		return res.status(400).json({
			error: 'DatabaseError',
			message: process.env.NODE_ENV === 'production'
				? 'Database operation failed'
				: err.message || 'Database operation failed',
			status: 400,
			...(process.env.NODE_ENV === 'development' && {
				details: {
					code: (err as any).code,
					meta: (err as any).meta,
				}
			}),
		})
	}

	// Default error response
	res.status(500).json({
		error: 'InternalServerError',
		message: process.env.NODE_ENV === 'production'
			? 'An unexpected error occurred'
			: err.message,
		status: 500,
	})
}

