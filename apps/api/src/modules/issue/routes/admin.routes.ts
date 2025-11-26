/**
 * @module Admin Issue Routes
 * @description Admin API routes for issue management
 */

import { Router } from 'express'
import { IssueController } from '../issue.controller'
import { validate } from '../../../shared/middlewares/validation.middleware'
import { issueValidation } from '../issue.validation'
import { permissionMeta } from '../../../shared/middlewares/permissionMeta.middleware'

const router = Router()
const controller = new IssueController()

const withPermission = (group: string, action: string) =>
  permissionMeta({
    module: 'issue',
    group,
    action,
    types: ['default'],
  })

/**
 * @route   GET /issues
 * @desc    List issues with filters and pagination
 * @access  Admin
 */
router.get('/', withPermission('view', 'get_data'), validate(issueValidation.list), controller.list)

/**
 * @route   GET /issues/:id
 * @desc    Get issue by ID with screenshots and logs
 * @access  Admin
 */
router.get('/:id', withPermission('view', 'get_detail'), controller.getById)

/**
 * @route   PATCH /issues/:id
 * @desc    Update issue (status, assignee, description)
 * @access  Admin
 */
router.patch('/:id', withPermission('edit', 'edit_data'), validate(issueValidation.update), controller.update)

/**
 * @route   GET /issues/screenshots/:path
 * @desc    Serve screenshot with signed URL verification
 * @access  Admin (signed URL token required)
 */
router.get('/screenshots/:path', controller.getScreenshot)

/**
 * @route   POST /issues/:id/comments
 * @desc    Add comment to issue
 * @access  Admin
 */
router.post('/:id/comments', withPermission('edit', 'edit_data'), validate(issueValidation.addComment), controller.addComment)

export default router

