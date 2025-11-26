/**
 * @module Project API Service
 * @description API service for project management
 */

import { apiClient } from './client'
import { logger } from '@workspace/utils'
import {
	ProjectListApiResponse,
	ProjectApiResponse,
	ProjectApiModel,
	Project,
	ProjectEnvironment,
	ProjectListQueryParams,
	ProjectFormData,
	UpdateProjectPayload,
	EnvironmentFormData,
} from '@/app/admin/projects/types'
import { CreateProjectDto, UpdateProjectDto, CreateProjectEnvironmentDto, UpdateProjectEnvironmentDto } from '@workspace/types'

/**
 * API success response shape used by admin app
 */
interface ApiSuccessResponse<T> {
	data: T;
	message: string;
	status: number;
}

function toDate(value: string | null): Date | null {
	return value ? new Date(value) : null
}

function handleApiError(error: any, fallbackMessage: string): never {
	logger.error(fallbackMessage, error)
	const apiMessage: string | undefined = error?.response?.data?.message
	throw new Error(apiMessage || fallbackMessage)
}

export function mapProjectFromApi(model: ProjectApiModel): Project {
	return {
		id: model.id.toString(),
		name: model.name,
		description: model.description,
		publicKey: model.publicKey,
		privateKey: model.privateKey,
		status: model.status,
		allowedDomains: model.allowedDomains,
		environments: model.environments.map((env) => ({
			id: env.id,
			projectId: env.projectId,
			name: env.name,
			apiUrl: env.apiUrl,
			allowedOrigins: env.allowedOrigins,
			isActive: env.isActive,
			createdAt: new Date(env.createdAt),
			updatedAt: new Date(env.updatedAt),
		})),
		createdAt: new Date(model.createdAt),
		updatedAt: new Date(model.updatedAt),
		deletedAt: model.deletedAt ? new Date(model.deletedAt) : null,
		issueCounts: model.issueCounts,
	}
}

function buildCreatePayload(data: ProjectFormData): CreateProjectDto {
	return {
		name: data.name.trim(),
		description: data.description.trim() || undefined,
		allowedDomains: data.allowedDomains.filter((d) => d.trim().length > 0),
		status: data.status,
		environments: data.environments?.map((env) => ({
			name: env.name,
			apiUrl: env.apiUrl || undefined,
			allowedOrigins: env.allowedOrigins && env.allowedOrigins.length > 0 ? env.allowedOrigins : undefined,
			isActive: env.isActive ?? true,
		})),
	}
}

function buildUpdatePayload(data: Partial<ProjectFormData>): UpdateProjectDto {
	const payload: UpdateProjectDto = {}
	if (data.name !== undefined) payload.name = data.name.trim()
	if (data.description !== undefined) payload.description = data.description.trim() || undefined
	if (data.allowedDomains !== undefined) {
		payload.allowedDomains = data.allowedDomains.filter((d) => d.trim().length > 0)
	}
	if (data.status !== undefined) payload.status = data.status
	return payload
}

function buildEnvironmentPayload(data: EnvironmentFormData): CreateProjectEnvironmentDto {
	return {
		name: data.name.trim(),
		apiUrl: data.apiUrl.trim() || undefined,
		allowedOrigins: data.allowedOrigins.filter((o) => o.trim().length > 0).length > 0
			? data.allowedOrigins.filter((o) => o.trim().length > 0)
			: undefined,
		isActive: data.isActive,
	}
}

export class ProjectApiService {
	private static readonly baseUrl = '/projects'

	static mapProjectFromApi = mapProjectFromApi

	static async getProjects(params: ProjectListQueryParams = {}): Promise<ProjectListApiResponse> {
		try {
			const response = await apiClient.get<ProjectListApiResponse>(this.baseUrl, {
				params: {
					page: params.page,
					limit: params.limit,
					search: params.search,
					status: params.status ?? undefined,
					sortBy: params.sortBy,
					sortOrder: params.sortOrder,
				},
			})
			return response.data
		} catch (error) {
			handleApiError(error, 'Failed to load projects')
		}
	}

	static async getProject(id: number): Promise<ProjectApiResponse> {
		try {
			const response = await apiClient.get<ProjectApiResponse>(`${this.baseUrl}/${id}`)
			return response.data
		} catch (error) {
			handleApiError(error, 'Failed to load project')
		}
	}

	static async createProject(data: ProjectFormData): Promise<ProjectApiResponse> {
		try {
			const payload = buildCreatePayload(data)
			logger.apiRequest('POST', this.baseUrl, payload)
			const response = await apiClient.post<ProjectApiResponse>(this.baseUrl, payload)
			logger.apiResponse('POST', this.baseUrl, response.status, response.data)
			return response.data
		} catch (error) {
			handleApiError(error, 'Failed to create project')
		}
	}

	static async updateProject(id: number, data: Partial<ProjectFormData>): Promise<ProjectApiResponse> {
		try {
			const payload = buildUpdatePayload(data)
			logger.apiRequest('PATCH', `${this.baseUrl}/${id}`, payload)
			const response = await apiClient.patch<ProjectApiResponse>(`${this.baseUrl}/${id}`, payload)
			logger.apiResponse('PATCH', `${this.baseUrl}/${id}`, response.status, response.data)
			return response.data
		} catch (error) {
			handleApiError(error, 'Failed to update project')
		}
	}

	static async deleteProject(id: number): Promise<ApiSuccessResponse<null>> {
		try {
			logger.apiRequest('DELETE', `${this.baseUrl}/${id}`)
			const response = await apiClient.delete<ApiSuccessResponse<null>>(`${this.baseUrl}/${id}`)
			logger.apiResponse('DELETE', `${this.baseUrl}/${id}`, response.status, response.data)
			return response.data
		} catch (error) {
			handleApiError(error, 'Failed to delete project')
		}
	}

	static async addEnvironment(projectId: number, data: EnvironmentFormData): Promise<ApiSuccessResponse<ProjectEnvironment>> {
		try {
			const payload = buildEnvironmentPayload(data)
			logger.apiRequest('POST', `${this.baseUrl}/${projectId}/environments`, payload)
			const response = await apiClient.post<ApiSuccessResponse<ProjectEnvironment>>(
				`${this.baseUrl}/${projectId}/environments`,
				payload
			)
			logger.apiResponse('POST', `${this.baseUrl}/${projectId}/environments`, response.status, response.data)
			return response.data
		} catch (error) {
			handleApiError(error, 'Failed to add environment')
		}
	}

	static async updateEnvironment(
		projectId: number,
		envId: number,
		data: Partial<EnvironmentFormData>
	): Promise<ApiSuccessResponse<ProjectEnvironment>> {
		try {
			const payload: UpdateProjectEnvironmentDto = {}
			if (data.name !== undefined) payload.name = data.name.trim()
			if (data.apiUrl !== undefined) payload.apiUrl = data.apiUrl.trim() || undefined
			if (data.allowedOrigins !== undefined) {
				payload.allowedOrigins =
					data.allowedOrigins.filter((o) => o.trim().length > 0).length > 0
						? data.allowedOrigins.filter((o) => o.trim().length > 0)
						: undefined
			}
			if (data.isActive !== undefined) payload.isActive = data.isActive

			logger.apiRequest('PATCH', `${this.baseUrl}/${projectId}/environments/${envId}`, payload)
			const response = await apiClient.patch<ApiSuccessResponse<ProjectEnvironment>>(
				`${this.baseUrl}/${projectId}/environments/${envId}`,
				payload
			)
			logger.apiResponse('PATCH', `${this.baseUrl}/${projectId}/environments/${envId}`, response.status, response.data)
			return response.data
		} catch (error) {
			handleApiError(error, 'Failed to update environment')
		}
	}

	static async removeEnvironment(projectId: number, envId: number): Promise<ApiSuccessResponse<null>> {
		try {
			logger.apiRequest('DELETE', `${this.baseUrl}/${projectId}/environments/${envId}`)
			const response = await apiClient.delete<ApiSuccessResponse<null>>(`${this.baseUrl}/${projectId}/environments/${envId}`)
			logger.apiResponse('DELETE', `${this.baseUrl}/${projectId}/environments/${envId}`, response.status, response.data)
			return response.data
		} catch (error) {
			handleApiError(error, 'Failed to remove environment')
		}
	}
}

export const projectApiService = ProjectApiService

