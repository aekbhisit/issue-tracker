/**
 * @module Not Found Middleware
 * @description Handles 404 errors for unknown routes
 */

import { Request, Response } from 'express'

/**
 * 404 handler middleware
 * 
 * Returns 404 response for unknown routes
 */
export function notFoundMiddleware(req: Request, res: Response) {
  res.status(404).json({
    error: 'NotFound',
    message: `Route ${req.method} ${req.url} not found`,
    status: 404,
  })
}

