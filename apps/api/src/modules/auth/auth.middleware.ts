/**
 * @module Auth Middleware
 * @description Authentication middleware for protected routes
 */

import { Response, NextFunction } from 'express'
// @ts-ignore - jsonwebtoken has default export at runtime
import jsonwebtoken from 'jsonwebtoken'
import { AuthenticatedRequest } from '@workspace/types'

/**
 * Public authentication middleware
 * 
 * Verifies JWT token for user routes
 * 
 * @throws {401} If token is missing or invalid
 */
export async function authMiddleware(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
) {
	try {
		// Get token from header
		const authHeader = req.headers.authorization
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return res.status(401).json({
				error: 'Unauthorized',
				message: 'No token provided',
				status: 401,
			})
		}

		const token = authHeader.substring(7)

		// Verify token
		const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET!) as any

		// Attach user to request
		req.user = {
			id: decoded.id,
			username: decoded.username,
			email: decoded.email,
			name: decoded.name,
			roleId: decoded.roleId,
			roleName: decoded.roleName,
		}

		next()
	} catch (error) {
		return res.status(401).json({
			error: 'Unauthorized',
			message: 'Invalid token',
			status: 401,
		})
	}
}

