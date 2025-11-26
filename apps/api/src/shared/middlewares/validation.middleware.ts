/**
 * @module Validation Middleware
 * @description Request validation middleware using express-validator
 */

import { Request, Response, NextFunction } from 'express'
import { validationResult, ValidationChain } from 'express-validator'

/**
 * Validates request using express-validator
 * 
 * @param validations - Array of validation chains
 * @returns Express middleware
 */
export function validate(validations: ValidationChain[]) {
	return async (req: Request, res: Response, next: NextFunction) => {
		// Run all validations
		await Promise.all(validations.map((validation) => validation.run(req)))

		// Check for errors
		const errors = validationResult(req)
		if (!errors.isEmpty()) {
			return res.status(422).json({
				error: 'ValidationError',
				message: 'Validation failed',
				status: 422,
				details: errors.array(),
			})
		}

		next()
	}
}

