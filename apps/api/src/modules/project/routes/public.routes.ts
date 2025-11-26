/**
 * @module Public Project Routes
 * @description Public API routes for project information (no authentication required)
 */

import { Router } from 'express'
import { ProjectController } from '../project.controller'

const router = Router()
const controller = new ProjectController()

/**
 * @route   GET /projects/:projectKey
 * @desc    Get project details by public key (public API, project key validation only)
 * @access  Public
 */
router.get('/:projectKey', controller.getByPublicKey)

export default router

