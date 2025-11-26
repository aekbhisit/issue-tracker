/**
 * @module Permission API Service
 * @description API service for fetching user permissions
 */

import { apiClient } from './client'

/**
 * API success response shape used by admin app
 */
interface ApiSuccessResponse<T> {
	data: T;
	message: string;
	status: number;
}

/**
 * Get current user's permissions (metaNames)
 * @returns Array of permission metaNames
 */
export async function getUserPermissions(): Promise<string[]> {
	try {
		const response = await apiClient.get<ApiSuccessResponse<{ permissions: string[] }>>('/permission/me')
		return response.data.data.permissions
	} catch (error) {
		console.error('Failed to fetch user permissions:', error)
		// Return empty array on error - will fall back to permission check
		return []
	}
}

