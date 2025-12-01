/**
 * @module Dashboard Controller
 * @description HTTP handlers for dashboard endpoints
 */

import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '@workspace/types'
import { DashboardService } from './dashboard.service'
import { sendSuccess } from '../../shared/utils/response.util'

export class DashboardController {
  private service = new DashboardService()

  /**
   * Get dashboard statistics
   * 
   * @route GET /api/admin/v1/dashboard/statistics
   * @access Admin (JWT authentication required)
   */
  getStatistics = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Log request context for debugging
      console.log('📊 Dashboard statistics request:', {
        userId: req.user?.id,
        username: req.user?.username,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString(),
      })

      const statistics = await this.service.getStatistics()
      
      // Log success
      console.log('✅ Dashboard statistics retrieved successfully:', {
        projects: statistics.projects.total,
        issues: statistics.issues.total,
        users: statistics.users.total,
        recentIssues: statistics.recentIssues.length,
        recentActivity: statistics.recentActivity.length,
      })

      sendSuccess(res, statistics)
    } catch (error) {
      // Log detailed error information
      console.error('❌ Dashboard statistics error:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'UnknownError',
        userId: req.user?.id,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      })
      next(error)
    }
  }
}

