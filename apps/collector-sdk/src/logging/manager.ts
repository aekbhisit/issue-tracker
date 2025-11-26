/**
 * @module Logging Manager
 * @description Coordinate all logging modules and provide unified API
 */

import { LogBuffer } from './buffer'
import { setupConsoleInterception, restoreConsole } from './console'
import { setupErrorCapture, restoreErrorHandlers } from './errors'
import { setupNetworkCapture, restoreFetch } from './network'
import type { LogData } from '../types'

/**
 * Logging manager class
 */
export class LoggingManager {
  private buffer: LogBuffer
  private isActive = false

  constructor() {
    this.buffer = new LogBuffer()
  }

  /**
   * Start logging (initialize all interceptors)
   */
  start(): void {
    if (this.isActive) {
      return // Already active
    }

    try {
      // Initialize all interceptors
      setupConsoleInterception(this.buffer)
      setupErrorCapture(this.buffer)
      setupNetworkCapture(this.buffer)

      this.isActive = true
    } catch (error) {
      // If initialization fails, try to cleanup and fail silently
      this.stop()
    }
  }

  /**
   * Stop logging (cleanup all interceptors)
   */
  stop(): void {
    if (!this.isActive) {
      return
    }

    try {
      // Restore all interceptors
      restoreConsole()
      restoreErrorHandlers()
      restoreFetch()

      this.isActive = false
    } catch (error) {
      // Silently fail if cleanup fails
      this.isActive = false
    }
  }

  /**
   * Get formatted log data for payload
   */
  getLogs(): LogData | undefined {
    if (!this.isActive || !this.buffer.hasLogs()) {
      return undefined
    }

    try {
      return this.buffer.getLogData()
    } catch (error) {
      // Silently fail if getting logs fails
      return undefined
    }
  }

  /**
   * Clear all logs
   */
  clear(): void {
    try {
      this.buffer.clear()
    } catch (error) {
      // Silently fail if clearing fails
    }
  }

  /**
   * Check if logging is active
   */
  isLoggingActive(): boolean {
    return this.isActive
  }
}

