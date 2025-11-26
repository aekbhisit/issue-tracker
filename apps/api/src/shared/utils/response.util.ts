/**
 * @module Response Utilities
 * @description Consistent API response helpers
 */

import { Response } from 'express'

/**
 * Sends a success response
 * 
 * @param res - Express response object
 * @param data - Response data
 * @param status - HTTP status code (default: 200)
 * @param message - Optional message
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  status = 200,
  message = 'Success'
) {
  res.status(status).json({
    data,
    message,
    status,
  })
}

/**
 * Sends an error response
 * 
 * @param res - Express response object
 * @param message - Error message
 * @param status - HTTP status code (default: 500)
 * @param details - Optional error details
 */
export function sendError(
  res: Response,
  message: string,
  status = 500,
  details?: any
) {
  res.status(status).json({
    error: 'Error',
    message,
    status,
    ...(details && { details }),
  })
}

