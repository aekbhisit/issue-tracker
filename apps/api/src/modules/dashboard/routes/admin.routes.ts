/**
 * @module Dashboard Admin Routes
 * @description Admin routes for dashboard endpoints
 */

import { Router } from 'express'
import { DashboardController } from '../dashboard.controller'

const router = Router()
const controller = new DashboardController()

/**
 * @route GET /dashboard/statistics
 * @desc Get dashboard statistics
 * @access Admin
 */
router.get('/statistics', controller.getStatistics)

export default router

