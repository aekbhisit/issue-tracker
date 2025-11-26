/**
 * @module Admin Menu API Service
 * @description API service for admin menu management
 */

import { apiClient } from '@/lib/api/client'
import {
	AdminMenu,
	AdminMenuListQuery,
	AdminMenuListResponse,
	AdminMenuApiResponse,
	AdminMenuFormData,
	AdminMenuFormTranslation,
	AdminMenuTreeResponse,
} from './types'

const FALLBACK_LANGUAGE_CODES = ['th', 'en']

function normalizeLanguageCodes(languages?: string[]): string[] {
	if (languages && languages.length > 0) {
		return Array.from(new Set(languages))
	}
	return FALLBACK_LANGUAGE_CODES
}

function ensureTranslations(
	translations: Record<string, AdminMenuFormTranslation>,
	languages: string[],
): Record<string, AdminMenuFormTranslation> {
	const nextTranslations: Record<string, AdminMenuFormTranslation> = { ...translations }
	languages.forEach((lang) => {
		if (!nextTranslations[lang]) {
			nextTranslations[lang] = { name: '' }
		}
	})
	return nextTranslations
}

function mapFormTranslations(formData: AdminMenuFormData) {
	return Object.entries(formData.translations).map(([lang, translation]) => ({
		lang,
		name: translation.name || null,
	}))
}

function buildPayload(data: AdminMenuFormData) {
	// Helper to convert empty string to null
	const toNullIfEmpty = (value: string | null | undefined) => {
		if (!value || value.trim() === '') return null
		return value
	}

	return {
		icon: toNullIfEmpty(data.icon),
		path: toNullIfEmpty(data.path),
		module: toNullIfEmpty(data.module),
		type: toNullIfEmpty(data.type),
		group: toNullIfEmpty(data.group),
		parentId: data.parentId || null,
		status: data.status ?? true,
		translates: mapFormTranslations(data),
	}
}

function createEmptyFormData(languages?: string[]): AdminMenuFormData {
	const languageCodes = normalizeLanguageCodes(languages)
	const translations: Record<string, AdminMenuFormTranslation> = {}
	languageCodes.forEach((lang) => {
		translations[lang] = { name: '' }
	})
	return {
		translations,
		icon: null,
		path: null,
		module: null,
		type: null,
		group: null,
		parentId: null,
		status: true,
	}
}

function mapApiModelToFormData(
	menu: AdminMenu | null | undefined,
	languages?: string[],
): AdminMenuFormData {
	const languageCodes = normalizeLanguageCodes(languages)

	if (!menu) {
		return createEmptyFormData(languageCodes)
	}

	const codesSet = new Set(languageCodes)
	menu.translates?.forEach((translate) => {
		if (translate?.lang) {
			codesSet.add(translate.lang)
		}
	})

	const translations: Record<string, AdminMenuFormTranslation> = {}
	Array.from(codesSet).forEach((lang) => {
		const translate = menu.translates?.find((t) => t.lang === lang)
		translations[lang] = {
			name: translate?.name || '',
		}
	})

	return {
		translations,
		icon: menu.icon,
		path: menu.path,
		module: menu.module,
		type: menu.type,
		group: menu.group,
		parentId: menu.parentId,
		status: menu.status,
	}
}

export class AdminMenuApiService {
	private baseUrl = '/admin-menu'

	/**
	 * Get menu items as tree (filtered by user permissions)
	 */
	async getMenu(): Promise<{ menu: AdminMenu[]; isSuperAdmin?: boolean }> {
		const response = await apiClient.get<{ data: { menu: AdminMenu[]; isSuperAdmin?: boolean } }>(
			this.baseUrl,
		)
		return response.data.data
	}

	/**
	 * Get full menu tree for management
	 */
	async getTree(): Promise<AdminMenuTreeResponse> {
		const response = await apiClient.get<{ data: AdminMenuTreeResponse }>(`${this.baseUrl}/tree`)
		return response.data.data
	}

	/**
	 * Get all menu items (for admin management)
	 */
	async getAll(query?: AdminMenuListQuery): Promise<AdminMenuListResponse> {
		const response = await apiClient.get<{ data: AdminMenuListResponse }>(`${this.baseUrl}/all`, {
			params: query,
		})
		return response.data.data
	}

	/**
	 * Get menu item by ID
	 */
	async getById(id: number): Promise<AdminMenuApiResponse> {
		const response = await apiClient.get<{ data: AdminMenuApiResponse }>(`${this.baseUrl}/${id}`)
		return response.data.data
	}

	/**
	 * Create new menu item
	 */
	async create(data: AdminMenuFormData): Promise<AdminMenuApiResponse> {
		const payload = buildPayload(data)
		const response = await apiClient.post<{ data: AdminMenuApiResponse }>(this.baseUrl, payload)
		return response.data.data
	}

	/**
	 * Update menu item
	 */
	async update(id: number, data: AdminMenuFormData): Promise<AdminMenuApiResponse> {
		const payload = buildPayload(data)
		const response = await apiClient.put<{ data: AdminMenuApiResponse }>(`${this.baseUrl}/${id}`, payload)
		return response.data.data
	}

	/**
	 * Map API model to form data
	 */
	static mapApiModelToFormData = mapApiModelToFormData
	static createEmptyFormData = createEmptyFormData
	static ensureTranslations = ensureTranslations
	static normalizeLanguageCodes = normalizeLanguageCodes

	/**
	 * Delete menu item
	 */
	async delete(id: number): Promise<void> {
		await apiClient.delete(`${this.baseUrl}/${id}`)
	}

	/**
	 * Update menu item sequence
	 */
	async updateSequence(
		id: number,
		payload: { sequence?: number; action?: 'up' | 'down' }
	): Promise<AdminMenuApiResponse> {
		const response = await apiClient.put<{ data: AdminMenuApiResponse }>(
			`${this.baseUrl}/${id}/sequence`,
			payload
		)
		return response.data.data
	}

	/**
	 * Reorder menu tree (update parent + sequence)
	 */
	async reorderTree(tree: { id: number; parentId: number | null; sequence: number }[]): Promise<AdminMenuTreeResponse> {
		const response = await apiClient.put<{ data: AdminMenuTreeResponse }>(`${this.baseUrl}/tree/reorder`, {
			tree,
		})
		return response.data.data
	}

	/**
	 * Get available modules
	 */
	async getModules(): Promise<{ modules: string[] }> {
		const response = await apiClient.get<{ data: { modules: string[] } }>(`${this.baseUrl}/modules`)
		return response.data.data
	}

	/**
	 * Get available types for a module
	 */
	async getTypes(module: string): Promise<{ types: string[] }> {
		const response = await apiClient.get<{ data: { types: string[] } }>(`${this.baseUrl}/types/${module}`)
		return response.data.data
	}
}

export const adminMenuApiService = new AdminMenuApiService()

