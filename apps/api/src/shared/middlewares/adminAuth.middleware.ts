/**
 * @module Admin Auth Middleware
 * @description Authentication middleware for admin routes
 */

import { Response, NextFunction } from 'express'
// @ts-ignore - jsonwebtoken has default export at runtime
import jsonwebtoken from 'jsonwebtoken'
import { AuthenticatedRequest } from '@workspace/types'

/**
 * Admin authentication middleware
 * 
 * Verifies JWT token and checks for admin role
 * 
 * @throws {401} If token is missing or invalid
 * @throws {403} If user is not an admin
 */
export async function adminAuthMiddleware(
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

		// Check if user has a role
		if (!decoded.roleId || !decoded.roleName) {
			return res.status(403).json({
				error: 'Forbidden',
				message: 'No role assigned',
				status: 403,
			})
		}

		// Note: Specific permission checking is now handled by permissionMiddleware
		// This middleware only verifies token and ensures user has a role

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

