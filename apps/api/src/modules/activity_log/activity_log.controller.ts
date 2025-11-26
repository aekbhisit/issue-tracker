/**
 * @module Activity Log Controller
 * @description HTTP handlers for activity log endpoints
 */

import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '@workspace/types'
import { ActivityLogService } from './activity_log.service'
import { sendSuccess } from '../../shared/utils/response.util'
import { activityLogListQuerySchema, activityLogParamsSchema, activityLogModelParamsSchema } from './activity_log.validation'

export class ActivityLogController {
	private service = new ActivityLogService()

	/**
	 * Get paginated list of activity logs
	 */
	findAll = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const query = activityLogListQuerySchema.parse(req.query)
			const result = await this.service.findAll(query)
			sendSuccess(res, result)
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Get single activity log by ID
	 */
	findById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const { id } = activityLogParamsSchema.parse(req.params)
			const log = await this.service.findById(id)
			sendSuccess(res, log)
		} catch (error) {
			next(error)
		}
	}

	/**
	 * Get activity logs for specific model and model ID
	 */
	findByModel = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const { model, modelId } = activityLogModelParamsSchema.parse(req.params)
			const logs = await this.service.findByModel(model, modelId)
			sendSuccess(res, logs)
		} catch (error) {
			next(error)
		}
	}
}

