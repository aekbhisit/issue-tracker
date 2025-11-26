/**
 * @module Activity Log Validation
 * @description Validation schemas for activity log endpoints
 */

import { z } from 'zod'
import { ActivityAction } from './activity_log.types'

// Helper function to convert date string (Y-m-d) to datetime (ISO 8601)
const dateToDatetime = (dateStr: string, isEndOfDay: boolean = false): string => {
	// Check if already datetime format (ISO 8601)
	if (dateStr.includes('T') && dateStr.includes('Z')) {
		// Validate it's a valid datetime
		const date = new Date(dateStr)
		if (isNaN(date.getTime())) {
			throw new Error('Invalid datetime format')
		}
		return dateStr
	}
	
	// If it's just a date (Y-m-d), convert to datetime
	const date = new Date(dateStr)
	if (isNaN(date.getTime())) {
		throw new Error('Invalid date format')
	}
	
	if (isEndOfDay) {
		// Set to end of day (23:59:59.999)
		date.setHours(23, 59, 59, 999)
	} else {
		// Set to start of day (00:00:00.000)
		date.setHours(0, 0, 0, 0)
	}
	
	return date.toISOString()
}

export const activityLogListQuerySchema = z.object({
	page: z.coerce.number().int().positive().optional(),
	limit: z.coerce.number().int().positive().max(100).optional(),
	search: z.string().optional(),
	action: z.nativeEnum(ActivityAction).optional(),
	model: z.string().optional(),
	userId: z.coerce.number().int().positive().optional(),
	dateFrom: z
		.string()
		.optional()
		.transform((val) => {
			if (!val) return undefined
			return dateToDatetime(val, false)
		}),
	dateTo: z
		.string()
		.optional()
		.transform((val) => {
			if (!val) return undefined
			return dateToDatetime(val, true)
		}),
	sortBy: z.string().optional(),
	sortOrder: z.enum(['asc', 'desc']).optional(),
})

export const activityLogParamsSchema = z.object({
	id: z.coerce.number().int().positive(),
})

export const activityLogModelParamsSchema = z.object({
	model: z.string(),
	modelId: z.string(),
})

