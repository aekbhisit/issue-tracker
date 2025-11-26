/**
 * @module Admin Menu Validation
 * @description Validation schemas for admin menu API endpoints
 */

import { body, param, query } from 'express-validator'

// Unused validation function - kept for potential future use
// const _validateTreeNodes = (nodes: any[]): true => {
// 	const validateNode = (node: any) => {
// 		if (typeof node !== 'object' || node === null) {
// 			throw new Error('Tree node must be an object')
// 		}
//
// 		if (!Number.isInteger(node.id)) {
// 			throw new Error('Tree node id must be an integer')
// 		}
//
// 		if (node.children !== undefined) {
// 			if (!Array.isArray(node.children)) {
// 				throw new Error('Tree node children must be an array')
// 			}
// 			node.children.forEach(validateNode)
// 		}
// 	}
//
// 	nodes.forEach(validateNode)
//
// 	return true
// }

export const adminMenuValidation = {
	list: [
		query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
		query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
		query('search').optional().isString().withMessage('Search must be a string'),
		query('module').optional().isString().withMessage('Module must be a string'),
		query('type').optional().isString().withMessage('Type must be a string'),
		query('status').optional().isBoolean().withMessage('Status must be a boolean'),
		query('parentId')
			.optional({ nullable: true, checkFalsy: true })
			.custom((value) => {
				if (value === null || value === undefined || value === '') {
					return true
				}
				const numValue = typeof value === 'string' ? parseInt(value, 10) : value
				if (!Number.isInteger(numValue) || numValue < 1) {
					throw new Error('Parent ID must be a positive integer')
				}
				return true
			}),
		query('sortBy').optional().isString().withMessage('SortBy must be a string'),
		query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('SortOrder must be asc or desc'),
	],

	getById: [
		param('id').isInt({ min: 1 }).withMessage('Menu ID must be a positive integer'),
	],

	create: [
		body('translates')
			.isArray()
			.withMessage('Translates must be an array')
			.notEmpty()
			.withMessage('At least one translation is required'),
		body('translates.*.lang')
			.notEmpty()
			.withMessage('Language is required')
			.isString()
			.withMessage('Language must be a string'),
		body('translates.*.name')
			.optional()
			.isString()
			.withMessage('Name must be a string'),
		body('icon')
			.optional({ nullable: true })
			.custom((value) => value === null || typeof value === 'string')
			.withMessage('Icon must be a string'),
		body('path')
			.optional({ nullable: true })
			.custom((value) => value === null || typeof value === 'string')
			.withMessage('Path must be a string'),
		body('parentId')
			.optional({ nullable: true, checkFalsy: true })
			.custom((value) => {
				if (value === null || value === undefined || value === '') {
					return true
				}
				const numValue = typeof value === 'string' ? parseInt(value, 10) : value
				if (!Number.isInteger(numValue) || numValue < 1) {
					throw new Error('Parent ID must be a positive integer')
				}
				return true
			}),
		body('sequence').optional().isInt({ min: 0 }).withMessage('Sequence must be a non-negative integer'),
		body('module')
			.optional({ nullable: true })
			.custom((value) => value === null || typeof value === 'string')
			.withMessage('Module must be a string'),
		body('type')
			.optional({ nullable: true })
			.custom((value) => value === null || typeof value === 'string')
			.withMessage('Type must be a string'),
		body('group')
			.optional({ nullable: true })
			.custom((value) => value === null || ['view', 'add', 'edit', 'delete'].includes(value))
			.withMessage('Required group must be view, add, edit, or delete'),
		body('status').optional().isBoolean().withMessage('Status must be a boolean'),
	],

	update: [
		param('id').isInt({ min: 1 }).withMessage('Menu ID must be a positive integer'),
		body('translates')
			.optional()
			.isArray()
			.withMessage('Translates must be an array'),
		body('translates.*.lang')
			.optional()
			.notEmpty()
			.withMessage('Language is required')
			.isString()
			.withMessage('Language must be a string'),
		body('translates.*.name')
			.optional()
			.isString()
			.withMessage('Name must be a string'),
		body('icon')
			.optional({ nullable: true })
			.custom((value) => value === null || typeof value === 'string')
			.withMessage('Icon must be a string'),
		body('path')
			.optional({ nullable: true })
			.custom((value) => value === null || typeof value === 'string')
			.withMessage('Path must be a string'),
		body('parentId')
			.optional({ nullable: true, checkFalsy: true })
			.custom((value) => {
				if (value === null || value === undefined || value === '') {
					return true
				}
				const numValue = typeof value === 'string' ? parseInt(value, 10) : value
				if (!Number.isInteger(numValue) || numValue < 1) {
					throw new Error('Parent ID must be a positive integer')
				}
				return true
			}),
		body('sequence').optional().isInt({ min: 0 }).withMessage('Sequence must be a non-negative integer'),
		body('module')
			.optional({ nullable: true })
			.custom((value) => value === null || typeof value === 'string')
			.withMessage('Module must be a string'),
		body('type')
			.optional({ nullable: true })
			.custom((value) => value === null || typeof value === 'string')
			.withMessage('Type must be a string'),
		body('group')
			.optional({ nullable: true })
			.custom((value) => value === null || ['view', 'add', 'edit', 'delete'].includes(value))
			.withMessage('Required group must be view, add, edit, or delete'),
		body('status').optional().isBoolean().withMessage('Status must be a boolean'),
	],

	delete: [
		param('id').isInt({ min: 1 }).withMessage('Menu ID must be a positive integer'),
	],

	updateSequence: [
		param('id').isInt({ min: 1 }).withMessage('Menu ID must be a positive integer'),
		body('sequence').optional().isInt({ min: 0 }).withMessage('Sequence must be a non-negative integer'),
		body('action').optional().isIn(['up', 'down']).withMessage('Action must be up or down'),
	],

	reorderTree: [
		body('tree')
			.isArray({ min: 1 })
			.withMessage('Tree must be a non-empty array')
			.custom((value) => {
				value.forEach((item: any) => {
					if (typeof item !== 'object' || item === null) {
						throw new Error('Each tree entry must be an object')
					}
					if (!Number.isInteger(item.id)) {
						throw new Error('Tree entry id must be an integer')
					}
					if (!(item.parentId === null || Number.isInteger(item.parentId))) {
						throw new Error('Tree entry parentId must be null or integer')
					}
					if (!Number.isInteger(item.sequence) || item.sequence < 1) {
						throw new Error('Tree entry sequence must be a positive integer')
					}
				})
				return true
			}),
	],

	getTypes: [
		param('module').notEmpty().withMessage('Module parameter is required').isString().withMessage('Module must be a string'),
	],
}

