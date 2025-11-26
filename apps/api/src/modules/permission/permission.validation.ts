/**
 * @module Permission Validation
 * @description Validation schemas for permission endpoints
 */

import { body, query } from 'express-validator'

export const permissionValidation = {
	/**
	 * Validation for list permissions endpoint
	 */
	list: [
		query('page')
			.optional()
			.isInt({ min: 1 })
			.withMessage('Page must be a positive integer'),
		query('limit')
			.optional()
			.isInt({ min: 1, max: 100 })
			.withMessage('Limit must be between 1 and 100'),
		query('scope')
			.optional()
			.isString()
			.withMessage('Scope must be a string')
			.trim(),
		query('module')
			.optional()
			.isString()
			.withMessage('Module must be a string'),
		query('method')
			.optional()
			.isIn(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
			.withMessage('Method must be one of: GET, POST, PUT, PATCH, DELETE'),
		query('action')
			.optional()
			.isString()
			.withMessage('Action must be a string'),
		query('type')
			.optional()
			.isString()
			.withMessage('Type must be a string'),
		query('group')
			.optional()
			.isString()
			.withMessage('Group must be a string'),
		query('metaName')
			.optional()
			.isString()
			.withMessage('metaName must be a string'),
		query('isActive')
			.optional()
			.isBoolean()
			.withMessage('isActive must be a boolean'),
	],

	/**
	 * Validation for grouped permissions endpoint
	 */
	grouped: [
		query('scope')
			.optional()
			.isString()
			.withMessage('Scope must be a string')
			.trim(),
		query('type')
			.optional()
			.isString()
			.withMessage('Type must be a string')
			.trim(),
	],

	/**
	 * Validation for create permission endpoint
	 */
	create: [
		body('method')
			.notEmpty()
			.withMessage('Method is required')
			.isIn(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
			.withMessage('Method must be one of: GET, POST, PUT, PATCH, DELETE'),
		body('scope')
			.optional()
			.isString()
			.withMessage('Scope must be a string')
			.trim(),
		body('action')
			.notEmpty()
			.withMessage('Action is required')
			.isString()
			.withMessage('Action must be a string'),
		body('type')
			.optional()
			.isString()
			.withMessage('Type must be a string'),
		body('path')
			.notEmpty()
			.withMessage('Path is required')
			.isString()
			.withMessage('Path must be a string')
			.matches(/^\/api\/(admin|member|public)\/v\d+\//)
			.withMessage('Path must start with /api/admin/v1/, /api/member/v1/, or /api/public/v1/'),
		body('module')
			.notEmpty()
			.withMessage('Module is required')
			.isString()
			.withMessage('Module must be a string')
			.isLength({ min: 2, max: 50 })
			.withMessage('Module must be between 2 and 50 characters'),
		body('group')
			.notEmpty()
			.withMessage('Group is required')
			.isString()
			.withMessage('Group must be a string')
			.isLength({ min: 2, max: 50 })
			.withMessage('Group must be between 2 and 50 characters'),
		body('metaName')
			.notEmpty()
			.withMessage('metaName is required')
			.isString()
			.withMessage('metaName must be a string'),
		body('description')
			.notEmpty()
			.withMessage('Description is required')
			.isString()
			.withMessage('Description must be a string')
			.isLength({ min: 5, max: 200 })
			.withMessage('Description must be between 5 and 200 characters'),
		body('isActive')
			.optional()
			.isBoolean()
			.withMessage('isActive must be a boolean'),
	],

	/**
	 * Validation for update permission endpoint
	 */
	update: [
		body('method')
			.optional()
			.isIn(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
			.withMessage('Method must be one of: GET, POST, PUT, PATCH, DELETE'),
		body('scope')
			.optional()
			.isString()
			.withMessage('Scope must be a string')
			.trim(),
		body('action')
			.optional()
			.isString()
			.withMessage('Action must be a string'),
		body('type')
			.optional()
			.isString()
			.withMessage('Type must be a string'),
		body('path')
			.optional()
			.isString()
			.withMessage('Path must be a string')
			.matches(/^\/api\/(admin|member|public)\/v\d+\//)
			.withMessage('Path must start with /api/admin/v1/, /api/member/v1/, or /api/public/v1/'),
		body('module')
			.optional()
			.isString()
			.withMessage('Module must be a string')
			.isLength({ min: 2, max: 50 })
			.withMessage('Module must be between 2 and 50 characters'),
		body('group')
			.optional()
			.isString()
			.withMessage('Group must be a string')
			.isLength({ min: 2, max: 50 })
			.withMessage('Group must be between 2 and 50 characters'),
		body('metaName')
			.optional()
			.isString()
			.withMessage('metaName must be a string'),
		body('description')
			.optional()
			.isString()
			.withMessage('Description must be a string')
			.isLength({ min: 5, max: 200 })
			.withMessage('Description must be between 5 and 200 characters'),
		body('isActive')
			.optional()
			.isBoolean()
			.withMessage('isActive must be a boolean'),
	],
}

