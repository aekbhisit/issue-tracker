/**
 * @module Admin Project Routes
 * @description Admin API routes for project management (full CRUD)
 */

import { Router } from 'express'
import { ProjectController } from '../project.controller'
import { validate } from '../../../shared/middlewares/validation.middleware'
import { projectValidation } from '../project.validation'
import { permissionMeta } from '../../../shared/middlewares/permissionMeta.middleware'

const router = Router()
const controller = new ProjectController()

const withPermission = (group: string, action: string) =>
	permissionMeta({
		module: 'project',
		group,
		action,
		types: ['default'],
	})

/**
 * @route   GET /projects
 * @desc    Get all projects with pagination and filters
 * @access  Admin
 */
router.get('/', withPermission('view', 'get_data'), validate(projectValidation.list), controller.getAll)

/**
 * @route   GET /projects/:id
 * @desc    Get project by ID
 * @access  Admin
 */
router.get('/:id', withPermission('view', 'get_detail'), controller.getById)

/**
 * @route   POST /projects
 * @desc    Create new project
 * @access  Admin
 */
router.post('/', withPermission('add', 'add_data'), validate(projectValidation.create), controller.create)

/**
 * @route   PATCH /projects/:id
 * @desc    Update project
 * @access  Admin
 */
router.patch('/:id', withPermission('edit', 'edit_data'), validate(projectValidation.update), controller.update)

/**
 * @route   DELETE /projects/:id
 * @desc    Delete project (soft delete)
 * @access  Admin
 */
router.delete('/:id', withPermission('delete', 'delete_data'), controller.delete)

/**
 * @route   POST /projects/:id/environments
 * @desc    Add environment to project
 * @access  Admin
 */
router.post(
	'/:id/environments',
	withPermission('edit', 'edit_data'),
	validate(projectValidation.createEnvironment),
	controller.addEnvironment
)

/**
 * @route   PATCH /projects/:id/environments/:envId
 * @desc    Update project environment
 * @access  Admin
 */
router.patch(
	'/:id/environments/:envId',
	withPermission('edit', 'edit_data'),
	validate(projectValidation.updateEnvironment),
	controller.updateEnvironment
)

/**
 * @route   DELETE /projects/:id/environments/:envId
 * @desc    Remove environment from project
 * @access  Admin
 */
router.delete('/:id/environments/:envId', withPermission('delete', 'delete_data'), controller.removeEnvironment)

export default router

