/**
 * @module Role Validation
 * @description Validation rules for Role module using express-validator
 */

import { body, query, param } from 'express-validator'
import { db } from '@workspace/database'

export const roleValidation = {
	/**
	 * Validation for creating a role
	 */
	create: [
		body('name')
			.notEmpty()
			.withMessage('Name is required')
			.isLength({ max: 255 })
			.withMessage('Name must not exceed 255 characters')
			.trim(),
		body('scope')
			.optional()
			.isString()
			.withMessage('Scope must be a string')
			.trim(),
		body('status')
			.optional()
			.isBoolean()
			.withMessage('Status must be a boolean'),
		body('permissions')
			.optional()
			.isArray()
			.withMessage('Permissions must be an array'),
		body('permissions.*')
			.optional()
			.isInt()
			.withMessage('Each permission ID must be an integer')
			.toInt(),
		// Check for duplicate name
		body('name')
			.custom(async (value: string, { req }) => {
				const scopeParam = typeof req.body.scope === 'string' ? req.body.scope.trim() : ''
				const scope = scopeParam.length > 0 ? scopeParam : 'admin'
				const existing = await db.userRole.findFirst({
					where: { name: value, scope },
				})
				if (existing) {
					throw new Error('Role name already exists')
				}
				return true
			}),
	],

	/**
	 * Validation for updating a role
	 */
	update: [
		param('id')
			.isInt()
			.withMessage('Role ID must be an integer')
			.toInt(),
		body('name')
			.optional()
			.isLength({ min: 1, max: 255 })
			.withMessage('Name must be between 1 and 255 characters')
			.trim(),
		body('status')
			.optional()
			.isBoolean()
			.withMessage('Status must be a boolean'),
		body('scope')
			.optional()
			.isString()
			.withMessage('Scope must be a string')
			.trim(),
		body('permissions')
			.optional()
			.isArray()
			.withMessage('Permissions must be an array'),
		body('permissions.*')
			.optional()
			.isInt()
			.withMessage('Each permission ID must be an integer')
			.toInt(),
		// Check for duplicate name (exclude current role)
		body('name')
			.custom(async (value: string, { req }) => {
				if (!value) return true
				const scopeParam = typeof req.body.scope === 'string' ? req.body.scope.trim() : ''
				const scope = scopeParam.length > 0 ? scopeParam : 'admin'
				const existing = await db.userRole.findFirst({
					where: {
						name: value,
						scope,
						id: { not: parseInt(req.params?.id || '0') },
					},
				})
				if (existing) {
					throw new Error('Role name already exists')
				}
				return true
			}),
	],

	/**
	 * Validation for toggling status
	 */
	status: [
		param('id')
			.isInt()
			.withMessage('Role ID must be an integer')
			.toInt(),
	],

	/**
	 * Validation for deleting
	 */
	delete: [
		param('id')
			.isInt()
			.withMessage('Role ID must be an integer')
			.toInt(),
	],

	/**
	 * Validation for sorting
	 */
	sort: [
		param('id')
			.isInt()
			.withMessage('Role ID must be an integer')
			.toInt(),
		body('move')
			.optional({ nullable: true })
			.isIn(['up', 'down'])
			.withMessage('Move must be either "up" or "down"'),
		body('sequence')
			.optional({ nullable: true })
			.isInt({ min: 1 })
			.withMessage('Sequence must be a positive integer')
			.toInt(),
		body()
			.custom((_, { req }) => {
				const hasMove = typeof req.body.move !== 'undefined'
				const hasSequence = typeof req.body.sequence !== 'undefined'
				if (!hasMove && !hasSequence) {
					throw new Error('Either move or sequence is required')
				}
				if (hasMove && hasSequence) {
					throw new Error('Provide either move or sequence, not both')
				}
				return true
			}),
	],

	/**
	 * Validation for listing roles
	 */
	list: [
		query('page')
			.optional()
			.isInt({ min: 1 })
			.withMessage('Page must be a positive integer')
			.toInt(),
		query('limit')
			.optional()
			.isInt({ min: 1, max: 100 })
			.withMessage('Limit must be between 1 and 100')
			.toInt(),
		query('search')
			.optional()
			.isString()
			.trim(),
		query('scope')
			.optional()
			.isString()
			.trim(),
		query('sortBy')
			.optional()
			.isIn(['name', 'sequence', 'status', 'usersCount', 'createdAt', 'updatedAt'])
			.withMessage('Invalid sort field'),
		query('sortOrder')
			.optional()
			.isIn(['asc', 'desc'])
			.withMessage('Sort order must be either "asc" or "desc"'),
	],

	/**
	 * Validation for get list (dropdown)
	 */
	getList: [
		query('search')
			.optional()
			.isString()
			.trim(),
		query('excludeId')
			.optional()
			.isInt()
			.withMessage('Exclude ID must be an integer')
			.toInt(),
		query('scope')
			.optional()
			.isString()
			.trim(),
	],
}

