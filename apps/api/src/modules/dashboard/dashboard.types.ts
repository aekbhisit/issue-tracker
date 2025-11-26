/**
 * @module Dashboard Types
 * @description Type definitions for dashboard statistics
 */

import { IssueResponse } from '../issue/issue.types'
import { ActivityLog } from '../activity_log/activity_log.types'

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
  recentIssues: IssueResponse[]
  recentActivity: ActivityLog[]
}

