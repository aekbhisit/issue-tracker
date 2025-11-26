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
  getStatistics = async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const statistics = await this.service.getStatistics()
      sendSuccess(res, statistics)
    } catch (error) {
      next(error)
    }
  }
}

