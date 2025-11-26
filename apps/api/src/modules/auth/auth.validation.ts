/**
 * @module Auth Validation
 * @description Validation rules for authentication endpoints
 */

import { body } from 'express-validator'

export const authValidation = {
	/**
	 * Validation for registration
	 */
	register: [
		body('email')
			.notEmpty()
			.withMessage('Email is required')
			.isEmail()
			.withMessage('Invalid email format')
			.normalizeEmail(),
		body('password')
			.notEmpty()
			.withMessage('Password is required')
			.isLength({ min: 8 })
			.withMessage('Password must be at least 8 characters')
			.matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/)
			.withMessage('Password must contain uppercase, lowercase, number, and special character'),
		body('name')
			.notEmpty()
			.withMessage('Name is required')
			.isLength({ min: 2, max: 100 })
			.withMessage('Name must be between 2 and 100 characters'),
	],

	/**
	 * Validation for login
	 * Must provide either username or email
	 */
	login: [
		body('username')
			.optional()
			.isLength({ max: 255 })
			.withMessage('Username must not exceed 255 characters')
			.trim(),
		body('email')
			.optional()
			.isEmail()
			.withMessage('Invalid email format')
			.normalizeEmail(),
		body('password')
			.notEmpty()
			.withMessage('Password is required')
			.isLength({ max: 255 })
			.withMessage('Password must not exceed 255 characters'),
		body('remember')
			.optional()
			.isBoolean()
			.withMessage('Remember must be a boolean'),
		// Custom validation: ensure at least username or email is provided
		body()
			.custom((_value, { req }) => {
				if (!req.body.username && !req.body.email) {
					throw new Error('Either username or email is required')
				}
				return true
			}),
	],
}

