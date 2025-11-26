/**
 * @module User Validation
 * @description Validation rules for user management endpoints
 */

import { body, query } from 'express-validator'

const validateAvatarPayload = (value: any) => {
	if (value === null) {
		return true
	}
	if (typeof value !== 'object' || Array.isArray(value)) {
		throw new Error('Avatar must be an object')
	}
	if ('src' in value && value.src !== null && typeof value.src !== 'string') {
		throw new Error('Avatar src must be a string or null')
	}
	if ('alt' in value && value.alt !== null && typeof value.alt !== 'string') {
		throw new Error('Avatar alt must be a string or null')
	}
	return true
}

export const userValidation = {
	/**
	 * Validation for creating a user
	 */
	create: [
		body('roleId')
			.optional()
			.isInt()
			.withMessage('Role ID must be an integer')
			.toInt(),
		body('name')
			.notEmpty()
			.withMessage('Name is required')
			.isLength({ max: 255 })
			.withMessage('Name must not exceed 255 characters')
			.trim(),
		body('username')
			.notEmpty()
			.withMessage('Username is required')
			.isLength({ max: 255 })
			.withMessage('Username must not exceed 255 characters')
			.matches(/^[a-zA-Z0-9]+$/)
			.withMessage('Username must contain only letters and numbers')
			.trim(),
		body('email')
			.notEmpty()
			.withMessage('Email is required')
			.isEmail()
			.withMessage('Invalid email format')
			.isLength({ max: 255 })
			.withMessage('Email must not exceed 255 characters')
			.normalizeEmail(),
		body('password')
			.notEmpty()
			.withMessage('Password is required')
			.isLength({ max: 255 })
			.withMessage('Password must not exceed 255 characters'),
		body('lang')
			.optional()
			.isIn(['en', 'th'])
			.withMessage('Language must be en or th'),
		body('status')
			.optional()
			.isBoolean()
			.withMessage('Status must be a boolean'),
		body('avatar')
			.optional()
			.custom(validateAvatarPayload),
	],

	/**
	 * Validation for updating a user
	 */
	update: [
		body('roleId')
			.optional()
			.isInt()
			.withMessage('Role ID must be an integer')
			.toInt(),
		body('name')
			.optional()
			.isLength({ min: 1, max: 255 })
			.withMessage('Name must be between 1 and 255 characters')
			.trim(),
		body('email')
			.optional()
			.isEmail()
			.withMessage('Invalid email format')
			.isLength({ max: 255 })
			.withMessage('Email must not exceed 255 characters')
			.normalizeEmail(),
		body('password')
			.optional()
			.custom((value) => {
				// Ignore placeholder password
				if (value === '********') {
					return true
				}
				if (value && value.length > 255) {
					throw new Error('Password must not exceed 255 characters')
				}
				return true
			}),
		body('lang')
			.optional()
			.isIn(['en', 'th'])
			.withMessage('Language must be en or th'),
		body('status')
			.optional()
			.isBoolean()
			.withMessage('Status must be a boolean'),
		body('avatar')
			.optional()
			.custom(validateAvatarPayload),
	],

	/**
	 * Validation for listing users
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
		query('search')
			.optional()
			.isString()
			.trim(),
		query('roleId')
			.optional()
			.isInt()
			.withMessage('Role ID must be an integer')
			.toInt(),
		query('sortBy')
			.optional()
			.isIn(['name', 'username', 'email', 'status', 'loginAt', 'createdAt', 'updatedAt'])
			.withMessage('Invalid sort field'),
		query('sortOrder')
			.optional()
			.isIn(['asc', 'desc'])
			.withMessage('Sort order must be asc or desc'),
	],

	/**
	 * Validation for status update
	 */
	updateStatus: [
		body('status')
			.notEmpty()
			.withMessage('Status is required')
			.isBoolean()
			.withMessage('Status must be a boolean'),
	],

	/**
	 * Validation for role update
	 */
	updateRole: [
		body('roleId')
			.notEmpty()
			.withMessage('Role ID is required')
			.isInt()
			.withMessage('Role ID must be an integer')
			.toInt(),
	],
}

