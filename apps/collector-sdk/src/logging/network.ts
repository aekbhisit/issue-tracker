/**
 * @module Network Capture
 * @description Intercept fetch calls and capture failed network requests
 */

import type { LogBuffer } from './buffer'
import { sanitizeHeaders, sanitizeRequestBody } from './buffer'

let buffer: LogBuffer | null = null
let isIntercepted = false
let originalFetch: typeof fetch | null = null

/**
 * Extract request body as string or object
 */
async function extractRequestBody(request: Request): Promise<any> {
  try {
    // Clone request to avoid consuming the body
    const clonedRequest = request.clone()
    
    // Try to get body as text
    const text = await clonedRequest.text()
    
    if (!text) {
      return undefined
    }
    
    // Try to parse as JSON
    try {
      return JSON.parse(text)
    } catch {
      // If not JSON, return as string
      return text
    }
  } catch {
    // If extraction fails, return undefined
    return undefined
  }
}

/**
 * Extract headers as object
 */
function extractHeaders(request: Request): Record<string, string> {
  const headers: Record<string, string> = {}
  
  try {
    request.headers.forEach((value, key) => {
      headers[key] = value
    })
  } catch {
    // Silently fail if header extraction fails
  }
  
  return headers
}

/**
 * Intercepted fetch function
 */
async function interceptedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  if (!originalFetch) {
    // Fallback to native fetch if original is not available
    return fetch(input, init)
  }

  const startTime = Date.now()
  let url: string = ''
  let method: string = 'GET'
  let requestHeaders: Headers | Record<string, string> | undefined
  let requestBody: any

  try {
    // Parse input to get URL and method
    if (typeof input === 'string') {
      url = input
      method = (init?.method || 'GET').toUpperCase()
      requestHeaders = init?.headers as Headers | Record<string, string> | undefined
      requestBody = init?.body
    } else if (input instanceof Request) {
      url = input.url
      method = (input.method || 'GET').toUpperCase()
      requestHeaders = input.headers
      requestBody = await extractRequestBody(input)
    } else if (input instanceof URL) {
      url = input.toString()
      method = (init?.method || 'GET').toUpperCase()
      requestHeaders = init?.headers as Headers | Record<string, string> | undefined
      requestBody = init?.body
    } else {
      // Unknown input type, use original fetch
      return originalFetch(input, init)
    }

    // Call original fetch
    const response = await originalFetch(input, init)
    const endTime = Date.now()
    const responseTime = endTime - startTime

    // Only capture failed requests (status >= 400 or network errors)
    if (response.status >= 400) {
      if (buffer) {
        try {
          // Sanitize headers (remove Authorization)
          const sanitizedHeaders = sanitizeHeaders(requestHeaders)
          
          // Sanitize request body
          const sanitizedBody = requestBody ? sanitizeRequestBody(requestBody) : undefined
          
          // Build error message
          let errorMessage = `HTTP ${response.status} ${response.statusText}`
          
          // Try to get response body for error details
          try {
            const responseText = await response.clone().text()
            if (responseText) {
              errorMessage += `: ${responseText.substring(0, 200)}`
            }
          } catch {
            // Ignore errors reading response body
          }
          
          buffer.addNetworkError(
            url,
            method,
            response.status,
            errorMessage
          )
        } catch {
          // Silently fail if capture fails
        }
      }
    }

    return response
  } catch (error) {
    // Network error or other fetch failure
    if (buffer) {
      try {
        const errorMessage = error instanceof Error ? error.message : String(error)
        
        // Sanitize headers and body if we have them
        const sanitizedHeaders = requestHeaders ? sanitizeHeaders(requestHeaders) : undefined
        const sanitizedBody = requestBody ? sanitizeRequestBody(requestBody) : undefined
        
        buffer.addNetworkError(
          url || String(input),
          method || 'GET',
          undefined, // No status code for network errors
          errorMessage
        )
      } catch {
        // Silently fail if capture fails
      }
    }

    // Re-throw the error so the original behavior is maintained
    throw error
  }
}

/**
 * Setup network capture
 */
export function setupNetworkCapture(logBuffer: LogBuffer): void {
  if (isIntercepted) {
    return // Already intercepted
  }

  try {
    // Check if fetch is available
    if (typeof fetch === 'undefined') {
      return // Fetch not available (unlikely in modern browsers)
    }

    buffer = logBuffer
    
    // Store original fetch
    originalFetch = window.fetch.bind(window)
    
    // Replace window.fetch with intercepted version
    window.fetch = interceptedFetch as typeof fetch
    
    isIntercepted = true
  } catch (error) {
    // If interception fails, restore original fetch and fail silently
    restoreFetch()
  }
}

/**
 * Restore original fetch
 */
export function restoreFetch(): void {
  if (!isIntercepted || !originalFetch) {
    return
  }

  try {
    // Restore original fetch
    window.fetch = originalFetch
    
    originalFetch = null
    buffer = null
    isIntercepted = false
  } catch (error) {
    // Silently fail if restoration fails
  }
}

/**
 * Check if network capture is active
 */
export function isNetworkCaptureActive(): boolean {
  return isIntercepted
}

