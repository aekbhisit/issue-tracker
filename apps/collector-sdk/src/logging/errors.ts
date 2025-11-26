/**
 * @module Error Capture
 * @description Capture JavaScript runtime errors and promise rejections
 */

import type { LogBuffer } from './buffer'

let buffer: LogBuffer | null = null
let isCapturing = false

// Store original error handlers (if any)
let originalOnError: OnErrorEventHandler | null = null
let originalOnUnhandledRejection: ((event: PromiseRejectionEvent) => void) | null = null

/**
 * Extract stack trace from error object
 */
function extractStack(error: Error | any): string | undefined {
  if (!error) {
    return undefined
  }

  if (error instanceof Error && error.stack) {
    return error.stack
  }

  if (typeof error === 'object' && error.stack) {
    return String(error.stack)
  }

  return undefined
}

/**
 * Extract error message from error object
 */
function extractMessage(error: Error | any, fallback: string): string {
  if (!error) {
    return fallback
  }

  if (error instanceof Error) {
    return error.message || error.toString() || fallback
  }

  if (typeof error === 'string') {
    return error
  }

  if (typeof error === 'object' && error.message) {
    return String(error.message)
  }

  return String(error) || fallback
}

/**
 * Window error handler
 */
function handleError(
  messageOrEvent: string | Event,
  source?: string,
  lineno?: number,
  colno?: number,
  error?: Error
): boolean {
  // Extract message from event if needed
  const message = typeof messageOrEvent === 'string' ? messageOrEvent : messageOrEvent.toString()
  
  // Call original handler if it exists
  if (originalOnError) {
    try {
      originalOnError(messageOrEvent, source, lineno, colno, error)
    } catch {
      // Silently fail if original handler throws
    }
  }

  // Capture error if buffer is available
  if (buffer) {
    try {
      const errorMessage = error ? extractMessage(error, message) : message
      const stack = error ? extractStack(error) : undefined

      buffer.addError(
        errorMessage,
        source,
        lineno,
        colno,
        stack
      )
    } catch {
      // Silently fail if capture fails
    }
  }

  // Return false to allow default error handling
  return false
}

/**
 * Unhandled rejection handler
 */
function handleUnhandledRejection(event: PromiseRejectionEvent): void {
  // Call original handler if it exists
  if (originalOnUnhandledRejection) {
    try {
      originalOnUnhandledRejection(event)
    } catch {
      // Silently fail if original handler throws
    }
  }

  // Capture error if buffer is available
  if (buffer) {
    try {
      const reason = event.reason
      const errorMessage = extractMessage(reason, 'Unhandled Promise Rejection')
      const stack = extractStack(reason)

      buffer.addError(
        errorMessage,
        undefined,
        undefined,
        undefined,
        stack
      )
    } catch {
      // Silently fail if capture fails
    }
  }
}

/**
 * Setup error capture
 */
export function setupErrorCapture(logBuffer: LogBuffer): void {
  if (isCapturing) {
    return // Already capturing
  }

    try {
      buffer = logBuffer

      // Store original error handlers
      originalOnError = window.onerror || null
      originalOnUnhandledRejection = window.onunhandledrejection || null

      // Attach error handlers
      window.onerror = handleError as OnErrorEventHandler
      window.addEventListener('unhandledrejection', handleUnhandledRejection)

      isCapturing = true
    } catch (error) {
      // If setup fails, restore original handlers and fail silently
      restoreErrorHandlers()
    }
}

/**
 * Restore original error handlers
 */
export function restoreErrorHandlers(): void {
  if (!isCapturing) {
    return
  }

  try {
    // Restore original error handlers
    if (originalOnError) {
      window.onerror = originalOnError
    } else {
      window.onerror = null
    }

    if (originalOnUnhandledRejection) {
      window.onunhandledrejection = originalOnUnhandledRejection
    } else {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }

    originalOnError = null
    originalOnUnhandledRejection = null
    buffer = null
    isCapturing = false
  } catch (error) {
    // Silently fail if restoration fails
  }
}

/**
 * Check if error capture is active
 */
export function isErrorCaptureActive(): boolean {
  return isCapturing
}

