/**
 * @module Activity Log Utility
 * @description Utility functions for activity logging
 */

import { AuthenticatedRequest } from '@workspace/types'
import { ActivityLogService } from '../../modules/activity_log/activity_log.service'
import { ActivityAction } from '../../modules/activity_log/activity_log.types'

const activityLogService = new ActivityLogService()

/**
 * Sensitive fields to exclude from logging
 */
const SENSITIVE_FIELDS = ['password', 'rememberToken', 'token', 'secret', 'apiKey', 'accessToken', 'refreshToken']

/**
 * Sanitize data by removing sensitive fields
 */
function sanitizeData(data: any): any {
	if (!data || typeof data !== 'object') {
		return data
	}

	if (Array.isArray(data)) {
		return data.map(item => sanitizeData(item))
	}

	const sanitized: any = {}
	for (const [key, value] of Object.entries(data)) {
		if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
			sanitized[key] = '[REDACTED]'
		} else if (value && typeof value === 'object') {
			sanitized[key] = sanitizeData(value)
		} else {
			sanitized[key] = value
		}
	}

	return sanitized
}

/**
 * Calculate changes between old and new data
 */
function calculateChanges(oldData: any, newData: any): Record<string, any> | null {
	if (!oldData || !newData || typeof oldData !== 'object' || typeof newData !== 'object') {
		return null
	}

	const changes: Record<string, any> = {}
	const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)])

	for (const key of allKeys) {
		const oldValue = oldData[key]
		const newValue = newData[key]

		// Skip sensitive fields
		if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
			continue
		}

		// Deep comparison for objects
		if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
			changes[key] = {
				old: oldValue,
				new: newValue,
			}
		}
	}

	return Object.keys(changes).length > 0 ? changes : null
}

/**
 * Extract IP address from request
 */
function getIpAddress(req: AuthenticatedRequest): string | null {
	const forwarded = req.headers['x-forwarded-for']
	if (typeof forwarded === 'string') {
		return forwarded.split(',')[0].trim()
	}
	return req.ip || req.socket.remoteAddress || null
}

/**
 * Log activity
 * 
 * @param req - Authenticated request object
 * @param action - Action type (CREATE, UPDATE, DELETE)
 * @param model - Model name (e.g., "User", "Content")
 * @param modelId - ID of the affected record
 * @param oldData - Previous data (for UPDATE/DELETE)
 * @param newData - New data (for CREATE/UPDATE)
 */
export async function logActivity(
	req: AuthenticatedRequest | null,
	action: ActivityAction,
	model: string,
	modelId: string,
	oldData?: any,
	newData?: any
): Promise<void> {
	try {
		// Extract user info
		const userId = req?.user?.id || null
		const ipAddress = req ? getIpAddress(req) : null
		const userAgent = req?.headers['user-agent'] || null

		// Sanitize data
		const sanitizedOldData = oldData ? sanitizeData(oldData) : null
		const sanitizedNewData = newData ? sanitizeData(newData) : null

		// Calculate changes for UPDATE action
		let changes: Record<string, any> | null = null
		if (action === ActivityAction.UPDATE && sanitizedOldData && sanitizedNewData) {
			changes = calculateChanges(sanitizedOldData, sanitizedNewData)
		}

		// Log the activity
		await activityLogService.log({
			userId,
			action,
			model,
			modelId,
			oldData: sanitizedOldData,
			newData: sanitizedNewData,
			changes,
			ipAddress,
			userAgent,
		})
	} catch (error) {
		// Silently fail to prevent logging errors from breaking main operations
		console.error('Failed to log activity:', error)
	}
}

