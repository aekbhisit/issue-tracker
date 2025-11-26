/**
 * @module Dashboard API Service
 * @description API service for dashboard statistics
 */

import { apiClient } from './client'
import { logger } from '@workspace/utils'

/**
 * API success response shape used by admin app
 */
interface ApiSuccessResponse<T> {
	data: T;
	message: string;
	status: number;
}

export interface DashboardStatistics {
  projects: {
    total: number
    active: number
  }
  issues: {
    total: number
    byStatus: {
      open: number
      inProgress: number
      resolved: number
      closed: number
    }
    bySeverity: {
      low: number
      medium: number
      high: number
      critical: number
    }
  }
  users: {
    total: number
    active: number
  }
  recentIssues: Array<{
    id: number
    projectId: number
    title: string
    description: string | null
    severity: string
    status: string
    assigneeId: number | null
    reporterInfo: any | null
    metadata: any | null
    createdAt: string
    updatedAt: string
    screenshots: Array<{
      id: number
      storagePath: string
      storageType: string
      mimeType: string | null
      width: number | null
      height: number | null
      fileSize: number | null
      elementSelector: any | null
      createdAt: string
      url?: string
    }>
    logs: Array<{
      id: number
      logType: string
      level: string | null
      message: string
      stack: string | null
      metadata: any | null
      timestamp: string
      createdAt: string
    }>
    project?: {
      id: number
      name: string
      publicKey: string
    }
    assignee?: {
      id: number
      name: string | null
      email: string | null
    } | null
  }>
  recentActivity: Array<{
    id: number
    userId: number | null
    action: string
    model: string
    modelId: string
    oldData: Record<string, any> | null
    newData: Record<string, any> | null
    changes: Record<string, any> | null
    ipAddress: string | null
    userAgent: string | null
    createdAt: Date
    user?: {
      id: number
      name: string | null
      username: string | null
      email: string | null
    } | null
  }>
}

export type DashboardStatisticsApiResponse = ApiSuccessResponse<DashboardStatistics>

function handleApiError(error: any, fallbackMessage: string): never {
  logger.error(fallbackMessage, error)
  const apiMessage: string | undefined = error?.response?.data?.message
  throw new Error(apiMessage || fallbackMessage)
}

export class DashboardApiService {
  private static readonly baseUrl = '/dashboard'

  static async getStatistics(): Promise<DashboardStatistics> {
    try {
      const response = await apiClient.get<DashboardStatisticsApiResponse>(
        `${this.baseUrl}/statistics`
      )
      return response.data.data
    } catch (error) {
      handleApiError(error, 'Failed to load dashboard statistics')
    }
  }
}

export const dashboardApiService = DashboardApiService

