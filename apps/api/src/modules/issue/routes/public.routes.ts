/**
 * @module Public Issue Routes
 * @description Public API routes for issue submission (no authentication required)
 */

import { Router } from 'express'
import { IssueController } from '../issue.controller'
import { issueValidation } from '../issue.validation'
import { validate } from '../../../shared/middlewares/validation.middleware'

const router = Router()
const controller = new IssueController()

/**
 * @route   POST /issues
 * @desc    Submit new issue (public API, project key validation only)
 * @access  Public
 */
router.post(
  '/',
  validate(issueValidation.create),
  controller.create
)

/**
 * @route   GET /issues
 * @desc    List issues by project key (public API, project key validation only)
 * @access  Public
 */
router.get(
  '/',
  validate(issueValidation.listPublic),
  controller.listPublic
)

export default router

