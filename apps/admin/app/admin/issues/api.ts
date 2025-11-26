/**
 * @module Issue API Service
 * @description API service for issue management
 */

import { apiClient } from '@/lib/api/client'
import { logger } from '@workspace/utils'
import {
	IssueListApiResponse,
	IssueApiResponse,
	IssueApiModel,
	Issue,
	IssueScreenshot,
	IssueLog,
	IssueComment,
	IssueListQueryParams,
	UpdateIssuePayload,
	AddCommentPayload,
	IssueCommentApiResponse,
	IssueStatus,
	IssueSeverity,
} from './types'
// ApiSuccessResponse is defined locally in types.ts

function toDate(value: string | null): Date | null {
	return value ? new Date(value) : null
}

function handleApiError(error: any, fallbackMessage: string): never {
	logger.error(fallbackMessage, error)
	const apiMessage: string | undefined = error?.response?.data?.message
	throw new Error(apiMessage || fallbackMessage)
}

export function mapIssueFromApi(model: IssueApiModel): Issue {
	// Normalize status: backend may return 'in-progress' but we use 'in_progress' in frontend
	const normalizeStatus = (status: string): IssueStatus => {
		if (status === 'in-progress') return 'in_progress'
		return status as IssueStatus
	}

	return {
		id: model.id,
		projectId: model.projectId,
		title: model.title,
		description: model.description,
		severity: model.severity as IssueSeverity,
		status: normalizeStatus(model.status),
		assigneeId: model.assigneeId,
		reporterInfo: model.reporterInfo,
		metadata: model.metadata,
		createdAt: new Date(model.createdAt),
		updatedAt: new Date(model.updatedAt),
		screenshots: (model.screenshots || []).map((screenshot) => ({
			id: screenshot.id,
			issueId: screenshot.issueId,
			storagePath: screenshot.storagePath,
			storageType: screenshot.storageType,
			mimeType: screenshot.mimeType,
			width: screenshot.width,
			height: screenshot.height,
			fileSize: screenshot.fileSize,
			elementSelector: screenshot.elementSelector,
			createdAt: new Date(screenshot.createdAt),
			url: screenshot.url,
		})),
		logs: (model.logs || []).map((log) => ({
			id: log.id,
			issueId: log.issueId,
			logType: log.logType as 'console' | 'error' | 'network',
			level: log.level as 'log' | 'warn' | 'error' | null,
			message: log.message,
			stack: log.stack,
			timestamp: new Date(log.timestamp),
			createdAt: new Date(log.createdAt),
			metadata: log.metadata,
		})),
		comments: (model.comments || []).map((comment) => ({
			id: comment.id,
			issueId: comment.issueId,
			userId: comment.userId,
			content: comment.content,
			createdAt: new Date(comment.createdAt),
			updatedAt: new Date(comment.updatedAt),
			user: comment.user,
		})),
		project: model.project,
		assignee: model.assignee,
	}
}

function buildUpdatePayload(data: Partial<UpdateIssuePayload>): UpdateIssuePayload {
	const payload: UpdateIssuePayload = {}
	if (data.description !== undefined) payload.description = data.description?.trim() || undefined
	// Convert frontend status (in_progress) to backend status (in-progress)
	if (data.status !== undefined) {
		payload.status = data.status === 'in_progress' ? 'in-progress' : data.status as any
	}
	if (data.assigneeId !== undefined) payload.assigneeId = data.assigneeId
	return payload
}

export class IssueApiService {
	private static readonly baseUrl = '/issues'

	static mapIssueFromApi = mapIssueFromApi

	static async getIssues(params: IssueListQueryParams = {}): Promise<IssueListApiResponse> {
		try {
			const queryParams: any = {
				page: params.page,
				limit: params.limit,
				projectId: params.projectId,
				status: params.status === 'all' ? undefined : params.status,
				severity: params.severity === 'all' ? undefined : params.severity,
				search: params.search,
				sortBy: params.sortBy,
				sortOrder: params.sortOrder,
			}

			// Add assignee filter
			if (params.assigneeId !== undefined) {
				queryParams.assigneeId = params.assigneeId === null ? 'null' : params.assigneeId
			}

			// Add date range filters
			if (params.startDate) {
				queryParams.startDate = params.startDate
			}
			if (params.endDate) {
				queryParams.endDate = params.endDate
			}

			const response = await apiClient.get<IssueListApiResponse>(this.baseUrl, {
				params: queryParams,
			})
			return response.data
		} catch (error) {
			handleApiError(error, 'Failed to load issues')
		}
	}

	static async getIssue(id: number | string): Promise<IssueApiResponse> {
		try {
			const issueId = typeof id === 'string' ? parseInt(id, 10) : id
			if (isNaN(issueId)) {
				throw new Error('Invalid issue ID')
			}
			const response = await apiClient.get<IssueApiResponse>(`${this.baseUrl}/${issueId}`)
			return response.data
		} catch (error) {
			handleApiError(error, 'Failed to load issue')
		}
	}

	static async updateIssue(id: number | string, data: Partial<UpdateIssuePayload>): Promise<IssueApiResponse> {
		try {
			const issueId = typeof id === 'string' ? parseInt(id, 10) : id
			if (isNaN(issueId)) {
				throw new Error('Invalid issue ID')
			}
			const payload = buildUpdatePayload(data)
			logger.apiRequest('PATCH', `${this.baseUrl}/${issueId}`, payload)
			const response = await apiClient.patch<IssueApiResponse>(`${this.baseUrl}/${issueId}`, payload)
			logger.apiResponse('PATCH', `${this.baseUrl}/${issueId}`, response.status, response.data)
			return response.data
		} catch (error) {
			handleApiError(error, 'Failed to update issue')
		}
	}

	static async addComment(id: number | string, data: AddCommentPayload): Promise<IssueCommentApiResponse> {
		try {
			const issueId = typeof id === 'string' ? parseInt(id, 10) : id
			if (isNaN(issueId)) {
				throw new Error('Invalid issue ID')
			}
			logger.apiRequest('POST', `${this.baseUrl}/${issueId}/comments`, data)
			const response = await apiClient.post<IssueCommentApiResponse>(`${this.baseUrl}/${issueId}/comments`, data)
			logger.apiResponse('POST', `${this.baseUrl}/${issueId}/comments`, response.status, response.data)
			return response.data
		} catch (error) {
			handleApiError(error, 'Failed to add comment')
		}
	}
}

export const issueApiService = IssueApiService

