/**
 * @module Settings API Service
 * @description API service for settings management
 */

import { apiClient } from '@/lib/api/client'
import { logger } from '@workspace/utils'

export interface SettingsLanguage {
	code: string
	name: string
	isDefault: boolean
}

interface ApiSuccessResponse<T> {
	data: T
	message: string
	status: number
}

interface SettingsLanguagesApiResponse extends ApiSuccessResponse<{ languages: SettingsLanguage[] }> {}

function handleApiError(error: any, fallbackMessage: string): never {
	logger.error(fallbackMessage, error)
	const apiMessage: string | undefined = error?.response?.data?.message
	throw new Error(apiMessage || fallbackMessage)
}

export class SettingsApiService {
	private static readonly baseUrl = '/settings'

	/**
	 * Get available languages
	 */
	static async getLanguages(): Promise<SettingsLanguage[]> {
		try {
			const response = await apiClient.get<SettingsLanguagesApiResponse>(`${this.baseUrl}/languages`)
			return response.data.data.languages
		} catch (error) {
			handleApiError(error, 'Failed to load languages')
		}
	}
}

export const settingsApiService = SettingsApiService

