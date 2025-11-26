/**
 * @module Error Utilities
 * @description Custom error classes
 */

import { HttpStatus } from '@workspace/types'

/**
 * Base API Error class
 */
export class BaseApiError extends Error {
  constructor(
    public message: string,
    public status: number = HttpStatus.INTERNAL_SERVER_ERROR,
    public details?: any
  ) {
    super(message)
    this.name = this.constructor.name
  }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends BaseApiError {
  constructor(message = 'Resource not found') {
    super(message, HttpStatus.NOT_FOUND)
  }
}

/**
 * Validation Error (422)
 */
export class ValidationError extends BaseApiError {
  constructor(message = 'Validation failed', details?: any) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY, details)
  }
}

/**
 * Unauthorized Error (401)
 */
export class UnauthorizedError extends BaseApiError {
  constructor(message = 'Unauthorized') {
    super(message, HttpStatus.UNAUTHORIZED)
  }
}

/**
 * Forbidden Error (403)
 */
export class ForbiddenError extends BaseApiError {
  constructor(message = 'Forbidden') {
    super(message, HttpStatus.FORBIDDEN)
  }
}

/**
 * Conflict Error (409)
 */
export class ConflictError extends BaseApiError {
  constructor(message = 'Resource already exists') {
    super(message, HttpStatus.CONFLICT)
  }
}

/**
 * Bad Request Error (400)
 */
export class BadRequestError extends BaseApiError {
  constructor(message = 'Bad request', details?: any) {
    super(message, HttpStatus.BAD_REQUEST, details)
  }
}

