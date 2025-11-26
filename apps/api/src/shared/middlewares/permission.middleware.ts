/**
 * @module Permission Middleware
 * @description Middleware to check if user has permission to access specific endpoints
 */

import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '@workspace/types'
import { db } from '@workspace/database'

/**
 * Permission middleware - checks if user has permission to access endpoint
 * Only applies to admin routes (/api/admin/v1/*)
 *
 * How it works:
 * 1. Extracts method + path from request
 * 2. Fetches user's role permissions from database
 * 3. Checks if permission exists for this endpoint
 * 4. Allows or denies access
 *
 * @param req - Express request with authenticated user
 * @param res - Express response
 * @param next - Express next function
 */
export async function permissionMiddleware(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
) {
	try {
		// Get user from auth middleware
		if (!req.user || !req.user.roleId) {
			return res.status(403).json({
				error: 'Forbidden',
				message: 'No role assigned',
				status: 403,
			})
		}

		if (req.user.id === 1) {
			// Superadmin - bypass all permission checks
			return next()
		}

		// Check if user is superadmin (sequence = 0)
		// Superadmin has full access to all endpoints without permission checks
		const role = await db.userRole.findUnique({
			where: { id: req.user.roleId },
			select: { sequence: true, scope: true },
		})

		// Determine expected scope from path
		const isAdminPath = req.baseUrl?.startsWith('/api/admin')
		const isMemberPath = req.baseUrl?.startsWith('/api/member')
		const expectedScope = isAdminPath ? 'admin' : isMemberPath ? 'member' : 'public'

		// Validate role scope matches path scope
		if (!role || role.scope !== expectedScope) {
			return res.status(403).json({
				error: 'Forbidden',
				message: `${role?.scope || 'Unknown'} users cannot access ${expectedScope} resources`,
				status: 403,
			})
		}

		// TODO: Implement caching for better performance
		// Cache key: `permissions:${expectedScope}:role:${req.user.roleId}`
		// TTL: 5-15 minutes
		// Invalidate on: role permissions update, permission update
		// Example with Redis:
		// const cacheKey = `permissions:${expectedScope}:role:${req.user.roleId}`
		// const cachedPermissions = await redis.get(cacheKey)
		// if (cachedPermissions) {
		//   rolePermissions = JSON.parse(cachedPermissions)
		// } else {
		//   rolePermissions = await db.rolePermission.findMany(...)
		//   await redis.setex(cacheKey, 600, JSON.stringify(rolePermissions))
		// }

		// Get current request method and path
		const method = req.method
		const path = getFullPath(req)

		// Fetch user's role permissions from database (filtered by scope)
		const rolePermissions = await db.rolePermission.findMany({
			where: {
				roleId: req.user.roleId,
				permission: {
					scope: expectedScope,
					isActive: true,
				},
			},
			include: {
				permission: true,
			},
		})

		// Check if user has permission for this exact endpoint
		const hasPermission = rolePermissions.some((rp) => {
			const permission = rp.permission
			if (!permission) return false
			return (
				permission.method === method &&
				matchPath(permission.path, path) &&
				permission.isActive
			)
		})

		if (!hasPermission) {
			return res.status(403).json({
				error: 'Forbidden',
				message: `You do not have permission to ${method} ${path}`,
				status: 403,
			})
		}

		// Permission granted
		next()
	} catch (error) {
		console.error('Permission middleware error:', error)
		return res.status(500).json({
			error: 'Internal Server Error',
			message: 'Failed to check permissions',
			status: 500,
		})
	}
}

/**
 * Get full request path including base URL
 *
 * @param req - Express request
 * @returns Full path (e.g., /api/admin/v1/users/:id)
 */
function getFullPath(req: AuthenticatedRequest): string {
	// baseUrl: /api/admin/v1
	// route.path: /users/:id
	// result: /api/admin/v1/users/:id
	const baseUrl = req.baseUrl || ''
	const routePath = req.route?.path || ''
	return baseUrl + routePath
}

/**
 * Match path with parameters
 * Converts path patterns to regex for matching
 *
 * Examples:
 * - /api/admin/v1/users/:id matches /api/admin/v1/users/123
 * - /api/admin/v1/users matches /api/admin/v1/users
 *
 * @param permissionPath - Path pattern from permission (e.g., /api/admin/v1/users/:id)
 * @param requestPath - Actual request path (e.g., /api/admin/v1/users/123)
 * @returns True if paths match
 */
function matchPath(permissionPath: string, requestPath: string): boolean {
	// If exact match, return true
	if (permissionPath === requestPath) {
		return true
	}

	// Convert :id, :userId, etc. to regex pattern
	// Escape special regex characters first
	let pattern = permissionPath.replace(/[.+?^${}()|[\]\\]/g, '\\$&')

	// Replace :param with regex to match any value
	pattern = pattern.replace(/:[\w]+/g, '[^/]+')

	// Create regex with start and end anchors
	const regex = new RegExp(`^${pattern}$`)

	return regex.test(requestPath)
}

