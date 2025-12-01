/**
 * @module Dashboard Service
 * @description Business logic for dashboard statistics
 */

import { db } from '@workspace/database'
import { DashboardStatistics } from './dashboard.types'
import { IssueResponse } from '../issue/issue.types'
import { ActivityAction } from '../activity_log/activity_log.types'
import { storageService } from '../../shared/storage/storage.service'

export class DashboardService {
  /**
   * Get dashboard statistics
   * Aggregates counts and fetches recent data for dashboard display
   * 
   * @returns Dashboard statistics object
   */
  async getStatistics(): Promise<DashboardStatistics> {
    // Helper function to safely execute a query with error handling
    const safeQuery = async <T>(
      queryName: string,
      queryFn: () => Promise<T>,
      defaultValue: T
    ): Promise<T> => {
      try {
        return await queryFn()
      } catch (error) {
        console.error(`❌ Dashboard query failed [${queryName}]:`, {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : 'UnknownError',
        })
        return defaultValue
      }
    }

    // Execute all queries in parallel with individual error handling
    // This allows partial data to be returned even if some queries fail
    const [
      projectCounts,
      issueCounts,
      issueStatusCounts,
      issueSeverityCounts,
      userCounts,
      recentIssues,
      recentActivity,
    ] = await Promise.all([
      // Project counts
      safeQuery(
        'projectCounts',
        async () => Promise.all([
          db.project.count({
            where: { deletedAt: null },
          }),
          db.project.count({
            where: { deletedAt: null, status: true },
          }),
        ]),
        [0, 0] as [number, number]
      ),

      // Total issue count
      safeQuery(
        'issueCounts',
        () => db.issue.count(),
        0
      ),

      // Issues by status
      safeQuery(
        'issueStatusCounts',
        () => db.issue.groupBy({
          by: ['status'],
          _count: {
            id: true,
          },
        }),
        [] as Array<{ status: string; _count: { id: number } }>
      ),

      // Issues by severity
      safeQuery(
        'issueSeverityCounts',
        () => db.issue.groupBy({
          by: ['severity'],
          _count: {
            id: true,
          },
        }),
        [] as Array<{ severity: string; _count: { id: number } }>
      ),

      // User counts
      safeQuery(
        'userCounts',
        async () => Promise.all([
          db.user.count({
            where: { deletedAt: null },
          }),
          db.user.count({
            where: { deletedAt: null, status: true },
          }),
        ]),
        [0, 0] as [number, number]
      ),

      // Recent issues (last 10)
      safeQuery(
        'recentIssues',
        () => db.issue.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            project: {
              select: {
                id: true,
                name: true,
                publicKey: true,
              },
            },
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            screenshots: {
              take: 1,
              orderBy: { createdAt: 'asc' },
            },
          },
        }),
        []
      ),

      // Recent activity (last 10, filtered to Issue and Project models)
      safeQuery(
        'recentActivity',
        () => db.activityLog.findMany({
          take: 10,
          where: {
            model: {
              in: ['Issue', 'Project'],
            },
          },
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
              },
            },
          },
        }),
        []
      ),
    ])

    // Process issue status counts
    const statusCounts = {
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
    }

    issueStatusCounts.forEach((item) => {
      const status = item.status.toLowerCase()
      if (status === 'open') {
        statusCounts.open = item._count.id
      } else if (status === 'in-progress') {
        statusCounts.inProgress = item._count.id
      } else if (status === 'resolved') {
        statusCounts.resolved = item._count.id
      } else if (status === 'closed') {
        statusCounts.closed = item._count.id
      }
    })

    // Process issue severity counts
    const severityCounts = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    }

    issueSeverityCounts.forEach((item) => {
      const severity = item.severity.toLowerCase()
      if (severity === 'low') {
        severityCounts.low = item._count.id
      } else if (severity === 'medium') {
        severityCounts.medium = item._count.id
      } else if (severity === 'high') {
        severityCounts.high = item._count.id
      } else if (severity === 'critical') {
        severityCounts.critical = item._count.id
      }
    })

    // Format recent issues
    const formattedIssues: IssueResponse[] = recentIssues.map((issue) => ({
      id: issue.id,
      projectId: issue.projectId,
      title: issue.title,
      description: issue.description,
      severity: issue.severity,
      status: issue.status,
      assigneeId: issue.assigneeId,
      reporterInfo: issue.reporterInfo as any,
      metadata: issue.metadata as any,
      createdAt: issue.createdAt.toISOString(),
      updatedAt: issue.updatedAt.toISOString(),
      screenshots: issue.screenshots.map((screenshot) => ({
        id: screenshot.id,
        storagePath: screenshot.storagePath,
        storageType: screenshot.storageType,
        mimeType: screenshot.mimeType,
        width: screenshot.width,
        height: screenshot.height,
        fileSize: screenshot.fileSize,
        elementSelector: screenshot.elementSelector as any,
        createdAt: screenshot.createdAt.toISOString(),
        url: storageService.getScreenshotUrl(screenshot.storagePath, screenshot.storageType),
      })),
      logs: [],
      project: {
        id: issue.project.id,
        name: issue.project.name,
        publicKey: issue.project.publicKey,
      },
      assignee: issue.assignee
        ? {
            id: issue.assignee.id,
            name: issue.assignee.name,
            email: issue.assignee.email,
          }
        : null,
    }))

    // Format recent activity
    const formattedActivity = recentActivity.map((log) => ({
      id: log.id,
      userId: log.userId,
      action: log.action as ActivityAction,
      model: log.model,
      modelId: log.modelId,
      oldData: log.oldData as Record<string, any> | null,
      newData: log.newData as Record<string, any> | null,
      changes: log.changes as Record<string, any> | null,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
      user: log.user
        ? {
            id: log.user.id,
            name: log.user.name,
            username: log.user.username,
            email: log.user.email,
          }
        : null,
    }))

    return {
      projects: {
        total: projectCounts[0],
        active: projectCounts[1],
      },
      issues: {
        total: issueCounts,
        byStatus: statusCounts,
        bySeverity: severityCounts,
      },
      users: {
        total: userCounts[0],
        active: userCounts[1],
      },
      recentIssues: formattedIssues,
      recentActivity: formattedActivity,
    }
  }
}

