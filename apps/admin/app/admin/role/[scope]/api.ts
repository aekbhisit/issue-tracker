import { apiClient } from '@/lib/api/client'
import { logger } from '@workspace/utils'

import {
	ApiSuccessResponse,
	PermissionSummarySet,
	Role,
	RoleApiModel,
	RoleApiResponse,
	RoleFormData,
	RoleListApiResponse,
	RoleListQuery,
} from './types'

const handleApiError = (error: any, fallbackMessage: string): Error => {
	logger.error(fallbackMessage, error)
	const apiMessage: string | undefined = error?.response?.data?.message
	return new Error(apiMessage || fallbackMessage)
}

const toDate = (value: string): Date => new Date(value)

export const mapRoleFromApi = (model: RoleApiModel): Role => ({
	id: model.id.toString(),
	scope: model.scope,
	name: model.name,
	sequence: model.sequence,
	status: model.status,
	createdAt: toDate(model.createdAt),
	updatedAt: toDate(model.updatedAt),
	permissions: model.permissions ?? [],
	usersCount: model.usersCount,
})

const buildListParams = (query: RoleListQuery) => ({
	page: query.page,
	limit: query.limit,
	search: query.search,
	sortBy: query.sortBy,
	sortOrder: query.sortOrder,
	scope: query.scope,
})

const buildPayload = (data: RoleFormData) => ({
	name: data.name,
	status: data.status,
	permissions: data.permissions,
	scope: data.scope,
})

export class RoleApiService {
	private static readonly baseUrl = '/role'

	static async getRoles(query: RoleListQuery): Promise<RoleListApiResponse> {
		try {
			const response = await apiClient.get<RoleListApiResponse>(this.baseUrl, {
				params: buildListParams(query),
			})
			return response.data
		} catch (error) {
			throw handleApiError(error, 'Failed to load roles')
		}
	}

	static async getRole(scope: string, id: number): Promise<RoleApiResponse> {
		try {
			const response = await apiClient.get<RoleApiResponse>(`${this.baseUrl}/${id}`, {
				params: { scope },
			})
			return response.data
		} catch (error) {
			throw handleApiError(error, 'Failed to load role')
		}
	}

	static async createRole(data: RoleFormData): Promise<RoleApiResponse> {
		try {
			const payload = buildPayload(data)
			logger.apiRequest('POST', this.baseUrl, payload)
			const response = await apiClient.post<RoleApiResponse>(this.baseUrl, payload)
			logger.apiResponse('POST', this.baseUrl, response.status, response.data)
			return response.data
		} catch (error) {
			throw handleApiError(error, 'Failed to create role')
		}
	}

	static async updateRole(id: number, data: RoleFormData): Promise<RoleApiResponse> {
		try {
			const payload = buildPayload(data)
			logger.apiRequest('PUT', `${this.baseUrl}/${id}`, payload)
			const response = await apiClient.put<RoleApiResponse>(`${this.baseUrl}/${id}`, payload)
			logger.apiResponse('PUT', `${this.baseUrl}/${id}`, response.status, response.data)
			return response.data
		} catch (error) {
			throw handleApiError(error, 'Failed to update role')
		}
	}

	static async toggleStatus(id: number): Promise<RoleApiResponse> {
		try {
			logger.apiRequest('PATCH', `${this.baseUrl}/${id}/status`)
			const response = await apiClient.patch<RoleApiResponse>(`${this.baseUrl}/${id}/status`)
			logger.apiResponse('PATCH', `${this.baseUrl}/${id}/status`, response.status, response.data)
			return response.data
		} catch (error) {
			throw handleApiError(error, 'Failed to update role status')
		}
	}

	static async updateSequence(id: number, action: 'up' | 'down' | number): Promise<ApiSuccessResponse<null>> {
		try {
			const payload =
				typeof action === 'number'
					? { sequence: action }
					: { move: action }
			logger.apiRequest('POST', `${this.baseUrl}/${id}/sort`, payload)
			const response = await apiClient.post<ApiSuccessResponse<null>>(`${this.baseUrl}/${id}/sort`, payload)
			logger.apiResponse('POST', `${this.baseUrl}/${id}/sort`, response.status, response.data)
			return response.data
		} catch (error) {
			throw handleApiError(error, 'Failed to update role sequence')
		}
	}

	static async deleteRole(id: number): Promise<ApiSuccessResponse<null>> {
		try {
			logger.apiRequest('DELETE', `${this.baseUrl}/${id}`)
			const response = await apiClient.delete<ApiSuccessResponse<null>>(`${this.baseUrl}/${id}`)
			logger.apiResponse('DELETE', `${this.baseUrl}/${id}`, response.status, response.data)
			return response.data
		} catch (error) {
			throw handleApiError(error, 'Failed to delete role')
		}
	}

	static async getPermissions(scope: string, type?: string | null): Promise<PermissionSummarySet[]> {
		try {
			const params: Record<string, string> = { scope }
			if (type !== undefined) {
				params.type = type ?? 'null'
			}
			const response = await apiClient.get<ApiSuccessResponse<{ scope: string; sets: PermissionSummarySet[] }>>(
				'/permission/grouped',
				{ params },
			)
			return response.data.data.sets
		} catch (error) {
			throw handleApiError(error, 'Failed to load permissions')
		}
	}
}


