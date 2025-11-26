import { body, query } from 'express-validator'

const validatePath = (value: unknown) => {
	if (typeof value === 'undefined' || value === null || value === '') {
		return true
	}

	if (typeof value !== 'string') {
		throw new Error('Path must be a string')
	}

	if (value.includes('..')) {
		throw new Error('Path traversal is not allowed')
	}

	return true
}

export const fileManagerValidation = {
	list: [
		query('path').optional().custom(validatePath),
		query('search').optional().isString().isLength({ max: 255 }),
	],
	upload: [
		query('path').optional().custom(validatePath),
	],
	createFolder: [
		body('path').optional().custom(validatePath),
		body('name').isString().trim().isLength({ min: 1, max: 255 }),
	],
	rename: [
		body('path').isString().custom(validatePath),
		body('newName').isString().trim().isLength({ min: 1, max: 255 }),
	],
	delete: [
		body('path').isString().custom(validatePath),
	],
}

