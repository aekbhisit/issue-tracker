/**
 * @module Console Interception
 * @description Intercept console.log/warn/error calls and capture logs
 */

import type { LogBuffer } from './buffer'
import type { LogLevel } from '../types'

// Store original console methods
let originalConsole: {
  log: typeof console.log
  warn: typeof console.warn
  error: typeof console.error
} | null = null

let buffer: LogBuffer | null = null
let isIntercepted = false

/**
 * Safely stringify arguments, handling circular references
 */
function safeStringify(args: any[]): string {
  const seen = new WeakSet()
  
  function stringify(obj: any): string {
    if (obj === null) return 'null'
    if (obj === undefined) return 'undefined'
    
    const type = typeof obj
    
    if (type === 'string') return obj
    if (type === 'number' || type === 'boolean') return String(obj)
    
    if (type === 'object') {
      if (seen.has(obj)) {
        return '[Circular]'
      }
      
      try {
        seen.add(obj)
        
        if (Array.isArray(obj)) {
          return '[' + obj.map(stringify).join(', ') + ']'
        }
        
        if (obj instanceof Error) {
          return obj.toString() + (obj.stack ? '\n' + obj.stack : '')
        }
        
        // Try JSON.stringify first
        try {
          return JSON.stringify(obj, null, 2)
        } catch {
          // If JSON.stringify fails, try manual stringification
          const keys = Object.keys(obj).slice(0, 10) // Limit to first 10 keys
          const pairs = keys.map(key => {
            try {
              return `${key}: ${stringify(obj[key])}`
            } catch {
              return `${key}: [Error stringifying]`
            }
          })
          return '{' + pairs.join(', ') + (Object.keys(obj).length > 10 ? ', ...' : '') + '}'
        }
      } finally {
        seen.delete(obj)
      }
    }
    
    return String(obj)
  }
  
  try {
    return args.map(stringify).join(' ')
  } catch (error) {
    return '[Error formatting arguments]'
  }
}

/**
 * Format console arguments into a message string
 */
function formatMessage(args: any[]): string {
  if (args.length === 0) {
    return ''
  }
  
  return safeStringify(args)
}

/**
 * Create console interceptor function
 */
function createInterceptor(level: LogLevel, originalMethod: typeof console.log): typeof console.log {
  return function (...args: any[]): void {
    // Call original console method to maintain normal behavior
    try {
      originalMethod.apply(console, args)
    } catch (error) {
      // Silently fail if original console method fails
    }
    
    // Capture log entry if buffer is available
    if (buffer) {
      try {
        const message = formatMessage(args)
        const metadata = args.length > 1 ? args.slice(1) : undefined
        buffer.addConsoleLog(level, message, metadata)
      } catch (error) {
        // Silently fail if capture fails - don't break the host application
      }
    }
  }
}

/**
 * Setup console interception
 */
export function setupConsoleInterception(logBuffer: LogBuffer): void {
  if (isIntercepted) {
    return // Already intercepted
  }
  
  try {
    buffer = logBuffer
    
    // Store original console methods
    originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
    }
    
    // Wrap console methods
    console.log = createInterceptor('log', originalConsole.log)
    console.warn = createInterceptor('warn', originalConsole.warn)
    console.error = createInterceptor('error', originalConsole.error)
    
    isIntercepted = true
  } catch (error) {
    // If interception fails, restore original methods and fail silently
    restoreConsole()
  }
}

/**
 * Restore original console methods
 */
export function restoreConsole(): void {
  if (!isIntercepted || !originalConsole) {
    return
  }
  
  try {
    // Restore original console methods
    console.log = originalConsole.log
    console.warn = originalConsole.warn
    console.error = originalConsole.error
    
    originalConsole = null
    buffer = null
    isIntercepted = false
  } catch (error) {
    // Silently fail if restoration fails
  }
}

/**
 * Check if console interception is active
 */
export function isConsoleIntercepted(): boolean {
  return isIntercepted
}

