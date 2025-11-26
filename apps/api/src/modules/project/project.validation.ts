/**
 * @module Project Validation
 * @description Validation rules for project management endpoints
 */

import { body, query } from 'express-validator'

/**
 * Validate domain format
 * Supports:
 * - Exact domain matches (e.g., app.example.com)
 * - Wildcard domains (e.g., *.example.com)
 * Does NOT automatically allow subdomains
 */
const validateDomain = (value: string): boolean => {
	if (typeof value !== 'string' || value.length === 0) {
		throw new Error('Domain must be a non-empty string')
	}

	// Trim whitespace
	const trimmed = value.trim()

	// Check for wildcard pattern
	if (trimmed.startsWith('*.')) {
		// Wildcard domain: *.example.com
		const domainPart = trimmed.substring(2)
		if (domainPart.length === 0) {
			throw new Error('Wildcard domain must have a domain part after *.')
		}
		// Validate the domain part
		const domainRegex = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i
		if (!domainRegex.test(domainPart)) {
			throw new Error(`Invalid wildcard domain format: ${trimmed}`)
		}
		return true
	}

	// Exact domain match
	// Allow: example.com, app.example.com, subdomain.app.example.com
	const domainRegex = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.[a-z]{2,}$/i
	if (!domainRegex.test(trimmed)) {
		throw new Error(`Invalid domain format: ${trimmed}`)
	}

	return true
}

/**
 * Validate domain array
 */
const validateDomainArray = (value: any): boolean => {
	if (!Array.isArray(value)) {
		throw new Error('Allowed domains must be an array')
	}

	if (value.length === 0) {
		throw new Error('At least one allowed domain is required')
	}

	// Validate each domain
	for (const domain of value) {
		if (typeof domain !== 'string') {
			throw new Error('Each domain must be a string')
		}
		validateDomain(domain)
	}

	return true
}

/**
 * Validate environment name
 */
const validateEnvironmentName = (value: string): boolean => {
	const validNames = ['dev', 'staging', 'prod', 'test', 'development', 'production']
	if (!validNames.includes(value.toLowerCase())) {
		throw new Error(`Environment name must be one of: ${validNames.join(', ')}`)
	}
	return true
}

/**
 * Validate environment array
 */
const validateEnvironmentArray = (value: any): boolean => {
	if (!Array.isArray(value)) {
		throw new Error('Environments must be an array')
	}

	for (const env of value) {
		if (typeof env !== 'object' || Array.isArray(env)) {
			throw new Error('Each environment must be an object')
		}

		// Validate name
		if (!env.name || typeof env.name !== 'string') {
			throw new Error('Environment name is required and must be a string')
		}
		validateEnvironmentName(env.name)

		// Validate apiUrl if provided
		if (env.apiUrl !== undefined && env.apiUrl !== null) {
			if (typeof env.apiUrl !== 'string') {
				throw new Error('Environment apiUrl must be a string')
			}
			try {
				new URL(env.apiUrl)
			} catch {
				throw new Error('Environment apiUrl must be a valid URL')
			}
		}

		// Validate allowedOrigins if provided
		if (env.allowedOrigins !== undefined && env.allowedOrigins !== null) {
			if (!Array.isArray(env.allowedOrigins)) {
				throw new Error('Environment allowedOrigins must be an array')
			}
			for (const origin of env.allowedOrigins) {
				if (typeof origin !== 'string') {
					throw new Error('Each allowed origin must be a string')
				}
				validateDomain(origin)
			}
		}

		// Validate isActive if provided
		if (env.isActive !== undefined && typeof env.isActive !== 'boolean') {
			throw new Error('Environment isActive must be a boolean')
		}
	}

	return true
}

export const projectValidation = {
	/**
	 * Validation for creating a project
	 */
	create: [
		body('name')
			.notEmpty()
			.withMessage('Name is required')
			.isLength({ max: 255 })
			.withMessage('Name must not exceed 255 characters')
			.trim(),
		body('description')
			.optional()
			.isString()
			.withMessage('Description must be a string')
			.isLength({ max: 1000 })
			.withMessage('Description must not exceed 1000 characters')
			.trim(),
		body('allowedDomains')
			.notEmpty()
			.withMessage('Allowed domains are required')
			.custom(validateDomainArray),
		body('status')
			.optional()
			.isBoolean()
			.withMessage('Status must be a boolean'),
		body('environments')
			.optional()
			.custom(validateEnvironmentArray),
	],

	/**
	 * Validation for updating a project
	 */
	update: [
		body('name')
			.optional()
			.isLength({ min: 1, max: 255 })
			.withMessage('Name must be between 1 and 255 characters')
			.trim(),
		body('description')
			.optional()
			.isString()
			.withMessage('Description must be a string')
			.isLength({ max: 1000 })
			.withMessage('Description must not exceed 1000 characters')
			.trim(),
		body('allowedDomains')
			.optional()
			.custom(validateDomainArray),
		body('status')
			.optional()
			.isBoolean()
			.withMessage('Status must be a boolean'),
	],

	/**
	 * Validation for listing projects
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
		query('status')
			.optional()
			.isBoolean()
			.withMessage('Status must be a boolean')
			.toBoolean(),
		query('sortBy')
			.optional()
			.isIn(['name', 'status', 'createdAt', 'updatedAt'])
			.withMessage('Invalid sort field'),
		query('sortOrder')
			.optional()
			.isIn(['asc', 'desc'])
			.withMessage('Sort order must be asc or desc'),
	],

	/**
	 * Validation for creating an environment
	 */
	createEnvironment: [
		body('name')
			.notEmpty()
			.withMessage('Environment name is required')
			.isString()
			.withMessage('Environment name must be a string')
			.custom(validateEnvironmentName),
		body('apiUrl')
			.optional()
			.isURL()
			.withMessage('API URL must be a valid URL'),
		body('allowedOrigins')
			.optional()
			.isArray()
			.withMessage('Allowed origins must be an array')
			.custom((value) => {
				if (Array.isArray(value)) {
					for (const origin of value) {
						if (typeof origin !== 'string') {
							throw new Error('Each allowed origin must be a string')
						}
						validateDomain(origin)
					}
				}
				return true
			}),
		body('isActive')
			.optional()
			.isBoolean()
			.withMessage('isActive must be a boolean'),
	],

	/**
	 * Validation for updating an environment
	 */
	updateEnvironment: [
		body('name')
			.optional()
			.isString()
			.withMessage('Environment name must be a string')
			.custom(validateEnvironmentName),
		body('apiUrl')
			.optional()
			.isURL()
			.withMessage('API URL must be a valid URL'),
		body('allowedOrigins')
			.optional()
			.isArray()
			.withMessage('Allowed origins must be an array')
			.custom((value) => {
				if (Array.isArray(value)) {
					for (const origin of value) {
						if (typeof origin !== 'string') {
							throw new Error('Each allowed origin must be a string')
						}
						validateDomain(origin)
					}
				}
				return true
			}),
		body('isActive')
			.optional()
			.isBoolean()
			.withMessage('isActive must be a boolean'),
	],
}

