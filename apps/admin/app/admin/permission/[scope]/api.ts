import { apiClient } from "@/lib/api/client"
import { logger } from "@workspace/utils"

import {
	ApiSuccessResponse,
	Permission,
	PermissionApiModel,
	PermissionApiResponse,
	PermissionListApiResponse,
	PermissionListQuery,
	GeneratePermissionsApiResponse,
} from "./types"

const handleApiError = (error: any, fallbackMessage: string): Error => {
	logger.error(fallbackMessage, error)
	const apiMessage: string | undefined = error?.response?.data?.message
	return new Error(apiMessage || fallbackMessage)
}

const toDate = (value: string): Date => new Date(value)

export const mapPermissionFromApi = (model: PermissionApiModel): Permission => ({
	id: model.id.toString(),
	scope: model.scope,
	method: model.method,
	module: model.module,
	type: model.type ?? undefined,
	group: model.group,
	action: model.action,
	path: model.path,
	metaName: model.metaName,
	description: model.description,
	isActive: model.isActive,
	createdAt: toDate(model.createdAt),
	updatedAt: toDate(model.updatedAt),
})

const buildListParams = (query: PermissionListQuery) => ({
	page: query.page,
	limit: query.limit,
	search: query.search,
	scope: query.scope,
	module: query.module,
	method: query.method,
	action: query.action,
	type: query.type,
	group: query.group,
	metaName: query.metaName,
	isActive: query.isActive ?? undefined,
	sortBy: query.sortBy,
	sortOrder: query.sortOrder,
})

export class PermissionApiService {
	private static readonly baseUrl = "/permission"

	static mapPermissionFromApi = mapPermissionFromApi

	static async getPermissions(params: PermissionListQuery = {}): Promise<PermissionListApiResponse> {
		try {
			const response = await apiClient.get<PermissionListApiResponse>(this.baseUrl, {
				params: buildListParams(params),
			})
			return response.data
		} catch (error) {
			throw handleApiError(error, "Failed to load permissions")
		}
	}

	static async generatePermissions(): Promise<GeneratePermissionsApiResponse> {
		try {
			const response = await apiClient.get<GeneratePermissionsApiResponse>(`${this.baseUrl}/generate`)
			return response.data
		} catch (error) {
			throw handleApiError(error, "Failed to generate permissions")
		}
	}

	static async getModules(): Promise<string[]> {
		try {
			const response = await apiClient.get<ApiSuccessResponse<{ modules: string[] }>>(`${this.baseUrl}/modules`)
			return response.data.data.modules
		} catch (error) {
			throw handleApiError(error, "Failed to load modules")
		}
	}

	static async getGroups(): Promise<string[]> {
		try {
			const response = await apiClient.get<ApiSuccessResponse<{ groups: string[] }>>(`${this.baseUrl}/groups`)
			return response.data.data.groups
		} catch (error) {
			throw handleApiError(error, "Failed to load groups")
		}
	}

	static async updateStatus(id: number): Promise<PermissionApiResponse> {
		try {
			const response = await apiClient.patch<PermissionApiResponse>(`${this.baseUrl}/${id}/status`)
			return response.data
		} catch (error) {
			throw handleApiError(error, "Failed to update permission status")
		}
	}
}

export const permissionApiService = PermissionApiService

