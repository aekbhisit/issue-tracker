/**
 * @module Issue Validation
 * @description Validation rules for issue submission endpoints
 */

import { body, query } from 'express-validator'

/**
 * Validation for creating an issue
 */
export const issueValidation = {
  create: [
    body('projectKey')
      .notEmpty()
      .withMessage('Project key is required')
      .isString()
      .withMessage('Project key must be a string')
      .matches(/^proj_/)
      .withMessage('Project key must start with "proj_"')
      .trim(),
    
    body('title')
      .notEmpty()
      .withMessage('Title is required')
      .isString()
      .withMessage('Title must be a string')
      .isLength({ max: 255 })
      .withMessage('Title must not exceed 255 characters')
      .trim(),
    
    body('description')
      .notEmpty()
      .withMessage('Description is required')
      .isString()
      .withMessage('Description must be a string')
      .isLength({ max: 5000 })
      .withMessage('Description must not exceed 5000 characters')
      .trim(),
    
    body('severity')
      .notEmpty()
      .withMessage('Severity is required')
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Severity must be one of: low, medium, high, critical'),
    
    body('metadata')
      .notEmpty()
      .withMessage('Metadata is required')
      .isObject()
      .withMessage('Metadata must be an object')
      .custom((value) => {
        if (!value.url || typeof value.url !== 'string') {
          throw new Error('Metadata must include a valid URL')
        }
        if (!value.userAgent || typeof value.userAgent !== 'string') {
          throw new Error('Metadata must include a valid userAgent')
        }
        if (!value.viewport || typeof value.viewport.width !== 'number' || typeof value.viewport.height !== 'number') {
          throw new Error('Metadata must include a valid viewport object with width and height')
        }
        if (!value.screen || typeof value.screen.width !== 'number' || typeof value.screen.height !== 'number') {
          throw new Error('Metadata must include a valid screen object with width and height')
        }
        if (!value.language || typeof value.language !== 'string') {
          throw new Error('Metadata must include a valid language')
        }
        if (!value.timezone || typeof value.timezone !== 'string') {
          throw new Error('Metadata must include a valid timezone')
        }
        if (!value.timestamp || typeof value.timestamp !== 'string') {
          throw new Error('Metadata must include a valid timestamp')
        }
        return true
      }),
    
    body('userInfo')
      .optional()
      .isObject()
      .withMessage('User info must be an object')
      .custom((value) => {
        if (value) {
          if (value.id !== undefined && typeof value.id !== 'string') {
            throw new Error('User info id must be a string')
          }
          if (value.email !== undefined && typeof value.email !== 'string') {
            throw new Error('User info email must be a string')
          }
          if (value.name !== undefined && typeof value.name !== 'string') {
            throw new Error('User info name must be a string')
          }
        }
        return true
      }),
    
    body('screenshot')
      .optional()
      .isObject()
      .withMessage('Screenshot must be an object')
      .custom((value) => {
        if (value) {
          // Screenshot object must have either screenshot data OR selector (or both)
          // This allows submission when screenshot capture fails but selector is available
          const hasScreenshotData = value.screenshot && typeof value.screenshot === 'object'
          const hasSelector = value.selector && typeof value.selector === 'object'
          
          if (!hasScreenshotData && !hasSelector) {
            throw new Error('Screenshot must include either screenshot data or selector (or both)')
          }
          
          // If screenshot data is provided, validate it
          if (hasScreenshotData) {
            const screenshot = value.screenshot
            if (!screenshot.dataUrl || typeof screenshot.dataUrl !== 'string') {
              throw new Error('Screenshot dataUrl is required and must be a string')
            }
            
            // Validate data URL format
            if (!screenshot.dataUrl.startsWith('data:image/')) {
              throw new Error('Screenshot dataUrl must be a valid data URL starting with "data:image/"')
            }
            
            // Validate mime type
            if (!screenshot.mimeType || typeof screenshot.mimeType !== 'string') {
              throw new Error('Screenshot mimeType is required')
            }
            if (!['image/jpeg', 'image/png'].includes(screenshot.mimeType)) {
              throw new Error('Screenshot mimeType must be image/jpeg or image/png')
            }
            
            // Validate file size (max 10MB)
            const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
            if (typeof screenshot.fileSize !== 'number' || screenshot.fileSize <= 0) {
              throw new Error('Screenshot fileSize must be a positive number')
            }
            if (screenshot.fileSize > MAX_FILE_SIZE) {
              throw new Error(`Screenshot fileSize must not exceed ${MAX_FILE_SIZE / 1024 / 1024}MB`)
            }
            
            // Validate dimensions (max 4096x4096)
            const MAX_DIMENSION = 4096
            if (typeof screenshot.width !== 'number' || screenshot.width <= 0) {
              throw new Error('Screenshot width must be a positive number')
            }
            if (typeof screenshot.height !== 'number' || screenshot.height <= 0) {
              throw new Error('Screenshot height must be a positive number')
            }
            if (screenshot.width > MAX_DIMENSION || screenshot.height > MAX_DIMENSION) {
              throw new Error(`Screenshot dimensions must not exceed ${MAX_DIMENSION}x${MAX_DIMENSION} pixels`)
            }
          }
          
          // If selector is provided, validate it
          if (hasSelector) {
            const selector = value.selector
            if (!selector.cssSelector || typeof selector.cssSelector !== 'string') {
              throw new Error('Selector cssSelector is required and must be a string')
            }
            if (!selector.xpath || typeof selector.xpath !== 'string') {
              throw new Error('Selector xpath is required and must be a string')
            }
            if (!selector.boundingBox || typeof selector.boundingBox !== 'object') {
              throw new Error('Selector boundingBox is required and must be an object')
            }
            if (typeof selector.boundingBox.x !== 'number' || typeof selector.boundingBox.y !== 'number' ||
                typeof selector.boundingBox.width !== 'number' || typeof selector.boundingBox.height !== 'number') {
              throw new Error('Selector boundingBox must have numeric x, y, width, and height properties')
            }
            if (!selector.outerHTML || typeof selector.outerHTML !== 'string') {
              throw new Error('Selector outerHTML is required and must be a string')
            }
          }
        }
        return true
      }),
    
    body('logs')
      .optional()
      .isObject()
      .withMessage('Logs must be an object')
      .custom((value) => {
        if (value) {
          // Validate logs structure (IC-4 structure: consoleLogs, jsErrors, networkErrors)
          if (!Array.isArray(value.consoleLogs)) {
            throw new Error('Logs.consoleLogs must be an array')
          }
          if (value.consoleLogs.length > 100) {
            throw new Error('Logs.consoleLogs must not exceed 100 entries')
          }
          
          if (!Array.isArray(value.jsErrors)) {
            throw new Error('Logs.jsErrors must be an array')
          }
          
          if (!Array.isArray(value.networkErrors)) {
            throw new Error('Logs.networkErrors must be an array')
          }
          if (value.networkErrors.length > 50) {
            throw new Error('Logs.networkErrors must not exceed 50 entries')
          }
          
          // Validate console log entries
          for (let i = 0; i < value.consoleLogs.length; i++) {
            const log = value.consoleLogs[i]
            if (!log.level || !['log', 'warn', 'error'].includes(log.level)) {
              throw new Error(`Logs.consoleLogs[${i}].level must be one of: log, warn, error`)
            }
            if (!log.message || typeof log.message !== 'string') {
              throw new Error(`Logs.consoleLogs[${i}].message is required and must be a string`)
            }
            if (typeof log.timestamp !== 'number') {
              throw new Error(`Logs.consoleLogs[${i}].timestamp must be a number`)
            }
          }
          
          // Validate JS error entries
          for (let i = 0; i < value.jsErrors.length; i++) {
            const error = value.jsErrors[i]
            if (!error.message || typeof error.message !== 'string') {
              throw new Error(`Logs.jsErrors[${i}].message is required and must be a string`)
            }
            if (typeof error.timestamp !== 'number') {
              throw new Error(`Logs.jsErrors[${i}].timestamp must be a number`)
            }
            if (error.source !== undefined && typeof error.source !== 'string') {
              throw new Error(`Logs.jsErrors[${i}].source must be a string if provided`)
            }
            if (error.line !== undefined && typeof error.line !== 'number') {
              throw new Error(`Logs.jsErrors[${i}].line must be a number if provided`)
            }
            if (error.column !== undefined && typeof error.column !== 'number') {
              throw new Error(`Logs.jsErrors[${i}].column must be a number if provided`)
            }
            if (error.stack !== undefined && typeof error.stack !== 'string') {
              throw new Error(`Logs.jsErrors[${i}].stack must be a string if provided`)
            }
          }
          
          // Validate network error entries
          for (let i = 0; i < value.networkErrors.length; i++) {
            const networkError = value.networkErrors[i]
            if (!networkError.url || typeof networkError.url !== 'string') {
              throw new Error(`Logs.networkErrors[${i}].url is required and must be a string`)
            }
            if (!networkError.method || typeof networkError.method !== 'string') {
              throw new Error(`Logs.networkErrors[${i}].method is required and must be a string`)
            }
            if (!networkError.error || typeof networkError.error !== 'string') {
              throw new Error(`Logs.networkErrors[${i}].error is required and must be a string`)
            }
            if (typeof networkError.timestamp !== 'number') {
              throw new Error(`Logs.networkErrors[${i}].timestamp must be a number`)
            }
            if (networkError.status !== undefined && typeof networkError.status !== 'number') {
              throw new Error(`Logs.networkErrors[${i}].status must be a number if provided`)
            }
          }
        }
        return true
      }),
  ],

  /**
   * Validation for listing issues (admin endpoint)
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
    
    query('projectId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Project ID must be a positive integer'),
    
    query('status')
      .optional()
      .isIn(['open', 'in-progress', 'resolved', 'closed'])
      .withMessage('Status must be one of: open, in-progress, resolved, closed'),
    
    query('severity')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Severity must be one of: low, medium, high, critical'),
    
    query('search')
      .optional()
      .isString()
      .withMessage('Search must be a string')
      .isLength({ max: 255 })
      .withMessage('Search must not exceed 255 characters'),
    
    query('sortBy')
      .optional()
      .isIn(['createdAt', 'updatedAt', 'severity', 'status'])
      .withMessage('SortBy must be one of: createdAt, updatedAt, severity, status'),
    
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('SortOrder must be asc or desc'),
    
    query('assigneeId')
      .optional()
      .custom((value) => {
        if (value === 'null' || value === null) {
          return true // Allow null to filter unassigned
        }
        if (typeof value === 'string' && /^\d+$/.test(value)) {
          return true
        }
        throw new Error('Assignee ID must be a positive integer or null')
      }),
    
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date'),
  ],

  /**
   * Validation for updating an issue (admin endpoint)
   */
  update: [
    body('status')
      .optional()
      .isIn(['open', 'in-progress', 'resolved', 'closed'])
      .withMessage('Status must be one of: open, in-progress, resolved, closed'),
    
    body('assigneeId')
      .optional()
      .custom((value) => {
        if (value === null) {
          return true // Allow null to unassign
        }
        if (typeof value !== 'number' || value < 1) {
          throw new Error('Assignee ID must be a positive integer or null')
        }
        return true
      }),
    
    body('description')
      .optional()
      .isString()
      .withMessage('Description must be a string')
      .isLength({ max: 5000 })
      .withMessage('Description must not exceed 5000 characters')
      .trim(),
  ],

  /**
   * Validation for adding a comment to an issue (admin endpoint)
   */
  addComment: [
    body('content')
      .notEmpty()
      .withMessage('Comment content is required')
      .isString()
      .withMessage('Comment content must be a string')
      .isLength({ min: 1, max: 5000 })
      .withMessage('Comment content must be between 1 and 5000 characters')
      .trim(),
  ],

  /**
   * Validation for listing issues (public endpoint)
   */
  listPublic: [
    query('projectKey')
      .notEmpty()
      .withMessage('projectKey query parameter is required')
      .isString()
      .withMessage('projectKey must be a string')
      .matches(/^proj_/)
      .withMessage('projectKey must start with "proj_"'),
    
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
  ],
}

