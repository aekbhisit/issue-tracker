/**
 * @module Activity Log Admin Routes
 * @description Admin routes for activity log management
 */

import { Router } from 'express'
import { ActivityLogController } from '../activity_log.controller'

const router = Router()
const controller = new ActivityLogController()

// Get paginated list of activity logs
router.get('/', controller.findAll)

// Get single activity log by ID
router.get('/:id', controller.findById)

// Get activity logs for specific model and model ID
router.get('/model/:model/:modelId', controller.findByModel)

export default router

