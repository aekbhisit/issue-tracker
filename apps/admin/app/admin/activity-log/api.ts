import { apiClient } from "@/lib/api/client"
import { logger } from "@workspace/utils"
import {
	ActivityLog,
	ActivityLogApiModel,
	ActivityLogApiResponse,
	ActivityLogListApiResponse,
	ActivityLogListQuery,
} from "./types"

function handleApiError(error: any, fallbackMessage: string): never {
	logger.error(fallbackMessage, error)
	const apiMessage: string | undefined = error?.response?.data?.message
	throw new Error(apiMessage || fallbackMessage)
}

export function mapActivityLogFromApi(model: ActivityLogApiModel): ActivityLog {
	return {
		id: model.id.toString(),
		userId: model.userId,
		action: model.action,
		model: model.model,
		modelId: model.modelId,
		oldData: model.oldData,
		newData: model.newData,
		changes: model.changes,
		ipAddress: model.ipAddress,
		userAgent: model.userAgent,
		createdAt: new Date(model.createdAt),
		user: model.user,
	}
}

export class ActivityLogApiService {
	private static readonly baseUrl = "/activity-logs"

	static mapActivityLogFromApi = mapActivityLogFromApi

	static async getActivityLogs(params: ActivityLogListQuery = {}): Promise<ActivityLogListApiResponse> {
		try {
			const response = await apiClient.get<ActivityLogListApiResponse>(this.baseUrl, {
				params: {
					page: params.page,
					limit: params.limit,
					search: params.search,
					action: params.action,
					model: params.model,
					userId: params.userId,
					dateFrom: params.dateFrom,
					dateTo: params.dateTo,
					sortBy: params.sortBy,
					sortOrder: params.sortOrder,
				},
			})
			return response.data
		} catch (error) {
			handleApiError(error, "Failed to load activity logs")
		}
	}

	static async getActivityLog(id: number): Promise<ActivityLogApiResponse> {
		try {
			const response = await apiClient.get<ActivityLogApiResponse>(`${this.baseUrl}/${id}`)
			return response.data
		} catch (error) {
			handleApiError(error, "Failed to load activity log")
		}
	}

	static async getActivityLogsByModel(model: string, modelId: string): Promise<ActivityLogApiResponse> {
		try {
			const response = await apiClient.get<ActivityLogApiResponse>(
				`${this.baseUrl}/model/${model}/${modelId}`
			)
			return response.data
		} catch (error) {
			handleApiError(error, "Failed to load activity logs for model")
		}
	}
}

export const activityLogApiService = ActivityLogApiService

