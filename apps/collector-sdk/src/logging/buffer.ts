/**
 * @module Log Buffer
 * @description FIFO buffer for console logs, errors, and network errors with redaction
 */

import type { ConsoleLogEntry, ErrorEntry, NetworkErrorEntry, LogData } from '../types'

const MAX_CONSOLE_LOGS = 100
const MAX_NETWORK_ERRORS = 50
const MAX_MESSAGE_LENGTH = 1000
const MAX_METADATA_LENGTH = 500

/**
 * Redact sensitive data from text
 */
function redactSensitiveData(text: string): string {
  if (typeof text !== 'string') {
    return text
  }

  // Redact password patterns
  text = text.replace(/password\s*=\s*[^\s&"']+/gi, 'password=[REDACTED]')
  text = text.replace(/password"\s*:\s*"[^"]+"/gi, 'password":"[REDACTED]"')
  text = text.replace(/password'\s*:\s*'[^']+'/gi, "password':'[REDACTED]'")

  // Redact token patterns
  text = text.replace(/token\s*=\s*[^\s&"']+/gi, 'token=[REDACTED]')
  text = text.replace(/token"\s*:\s*"[^"]+"/gi, 'token":"[REDACTED]"')
  text = text.replace(/token'\s*:\s*'[^']+'/gi, "token':'[REDACTED]'")

  // Redact Bearer tokens
  text = text.replace(/Bearer\s+[A-Za-z0-9\-._~+/]+/g, 'Bearer [REDACTED]')

  // Redact API key patterns
  text = text.replace(/api[_-]?key\s*=\s*[^\s&"']+/gi, 'api_key=[REDACTED]')
  text = text.replace(/api[_-]?key"\s*:\s*"[^"]+"/gi, 'api_key":"[REDACTED]"')
  text = text.replace(/api[_-]?key'\s*:\s*'[^']+'/gi, "api_key':'[REDACTED]'")

  return text
}

/**
 * Sanitize headers object - remove Authorization header
 */
export function sanitizeHeaders(headers: Headers | Record<string, string> | undefined): Record<string, string> {
  if (!headers) {
    return {}
  }

  const sanitized: Record<string, string> = {}

  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      // Never capture Authorization header
      if (key.toLowerCase() !== 'authorization') {
        sanitized[key] = redactSensitiveData(value)
      }
    })
  } else {
    Object.keys(headers).forEach((key) => {
      // Never capture Authorization header
      if (key.toLowerCase() !== 'authorization') {
        sanitized[key] = redactSensitiveData(String(headers[key]))
      }
    })
  }

  return sanitized
}

/**
 * Sanitize request body - redact sensitive keys
 */
export function sanitizeRequestBody(body: any): any {
  if (!body) {
    return body
  }

  // If body is a string, try to parse it
  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body)
      return sanitizeRequestBody(parsed)
    } catch {
      // If parsing fails, redact sensitive patterns in the string
      return redactSensitiveData(body)
    }
  }

  // If body is an object, redact sensitive keys
  if (typeof body === 'object' && body !== null) {
    const sanitized: any = Array.isArray(body) ? [] : {}

    for (const key in body) {
      const lowerKey = key.toLowerCase()
      // Redact common sensitive keys
      if (lowerKey === 'password' || lowerKey === 'token' || lowerKey === 'secret' || lowerKey === 'apikey' || lowerKey === 'api_key') {
        sanitized[key] = '[REDACTED]'
      } else if (typeof body[key] === 'object' && body[key] !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = sanitizeRequestBody(body[key])
      } else if (typeof body[key] === 'string') {
        sanitized[key] = redactSensitiveData(body[key])
      } else {
        sanitized[key] = body[key]
      }
    }

    return sanitized
  }

  return body
}

/**
 * Truncate string to max length
 */
function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str
  }
  return str.substring(0, maxLength - 3) + '...'
}

/**
 * Format metadata for storage (truncate if needed)
 */
function formatMetadata(metadata: any): any {
  if (metadata === undefined || metadata === null) {
    return undefined
  }

  try {
    const jsonStr = JSON.stringify(metadata)
    if (jsonStr.length <= MAX_METADATA_LENGTH) {
      return metadata
    }

    // If metadata is too large, try to truncate it
    const truncated = truncateString(jsonStr, MAX_METADATA_LENGTH)
    try {
      return JSON.parse(truncated)
    } catch {
      return { _truncated: true, _originalLength: jsonStr.length }
    }
  } catch {
    return { _error: 'Failed to serialize metadata' }
  }
}

/**
 * Log buffer class for managing console logs, errors, and network errors
 */
export class LogBuffer {
  private consoleLogs: ConsoleLogEntry[] = []
  private errors: ErrorEntry[] = []
  private networkErrors: NetworkErrorEntry[] = []

  /**
   * Add console log entry
   */
  addConsoleLog(level: 'log' | 'warn' | 'error', message: string, metadata?: any): void {
    // Redact sensitive data from message
    const sanitizedMessage = redactSensitiveData(truncateString(String(message), MAX_MESSAGE_LENGTH))

    const entry: ConsoleLogEntry = {
      level,
      message: sanitizedMessage,
      timestamp: Date.now(),
      metadata: formatMetadata(metadata),
    }

    // FIFO: Add to end, remove from beginning if over limit
    this.consoleLogs.push(entry)
    if (this.consoleLogs.length > MAX_CONSOLE_LOGS) {
      this.consoleLogs.shift()
    }
  }

  /**
   * Add error entry
   */
  addError(message: string, source?: string, line?: number, column?: number, stack?: string): void {
    // Redact sensitive data from message and stack
    const sanitizedMessage = redactSensitiveData(truncateString(String(message), MAX_MESSAGE_LENGTH))
    const sanitizedStack = stack ? redactSensitiveData(truncateString(stack, MAX_MESSAGE_LENGTH * 2)) : undefined

    const entry: ErrorEntry = {
      message: sanitizedMessage,
      source,
      line,
      column,
      stack: sanitizedStack,
      timestamp: Date.now(),
    }

    this.errors.push(entry)
  }

  /**
   * Add network error entry
   */
  addNetworkError(url: string, method: string, status: number | undefined, error: string): void {
    // Redact sensitive data from URL and error message
    const sanitizedUrl = redactSensitiveData(truncateString(url, MAX_MESSAGE_LENGTH))
    const sanitizedError = redactSensitiveData(truncateString(String(error), MAX_MESSAGE_LENGTH))

    const entry: NetworkErrorEntry = {
      url: sanitizedUrl,
      method: method.toUpperCase(),
      status,
      error: sanitizedError,
      timestamp: Date.now(),
    }

    // FIFO: Add to end, remove from beginning if over limit
    this.networkErrors.push(entry)
    if (this.networkErrors.length > MAX_NETWORK_ERRORS) {
      this.networkErrors.shift()
    }
  }

  /**
   * Get all logs formatted for payload
   */
  getLogData(): LogData {
    return {
      logs: [...this.consoleLogs],
      errors: [...this.errors],
      networkErrors: [...this.networkErrors],
    }
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.consoleLogs = []
    this.errors = []
    this.networkErrors = []
  }

  /**
   * Check if there are any logs
   */
  hasLogs(): boolean {
    return this.consoleLogs.length > 0 || this.errors.length > 0 || this.networkErrors.length > 0
  }
}

