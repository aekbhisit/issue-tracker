/**
 * @module Logger Utils
 * @description Logging utilities for development and local environments
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogOptions {
  level?: LogLevel;
  prefix?: string;
  timestamp?: boolean;
  showInProduction?: boolean;
}

class Logger {
  private isDevelopment: boolean;
  private isLocal: boolean;

  constructor() {
    // Check environment variables
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isLocal = process.env.ENVIRONMENT === 'local';
  }

  private shouldLog(showInProduction: boolean = false): boolean {
    return this.isDevelopment || this.isLocal || showInProduction;
  }

  private formatMessage(message: string, options: LogOptions = {}): string {
    const { prefix, timestamp } = options;
    let formattedMessage = '';

    if (timestamp) {
      formattedMessage += `[${new Date().toISOString()}] `;
    }

    if (prefix) {
      formattedMessage += `[${prefix}] `;
    }

    formattedMessage += message;
    return formattedMessage;
  }

  private log(level: LogLevel, message: string, data?: any, options: LogOptions = {}): void {
    if (!this.shouldLog(options.showInProduction)) {
      return;
    }

    const formattedMessage = this.formatMessage(message, options);

    switch (level) {
      case 'info':
        console.info(formattedMessage, data || '');
        break;
      case 'warn':
        console.warn(formattedMessage, data || '');
        break;
      case 'error':
        console.error(formattedMessage, data || '');
        break;
      case 'debug':
        console.debug(formattedMessage, data || '');
        break;
      default:
        console.log(formattedMessage, data || '');
    }
  }

  /**
   * Log info message
   */
  info(message: string, data?: any, options?: LogOptions): void {
    this.log('info', message, data, options);
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: any, options?: LogOptions): void {
    this.log('warn', message, data, options);
  }

  /**
   * Log error message
   */
  error(message: string, data?: any, options?: LogOptions): void {
    this.log('error', message, data, options);
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: any, options?: LogOptions): void {
    this.log('debug', message, data, options);
  }

  /**
   * Log API request
   */
  apiRequest(method: string, url: string, data?: any): void {
    this.info(`API ${method.toUpperCase()} ${url}`, data, {
      prefix: 'API',
      timestamp: true
    });
  }

  /**
   * Log API response
   */
  apiResponse(method: string, url: string, status: number, data?: any): void {
    const level = status >= 400 ? 'error' : 'info';
    this.log(level, `API ${method.toUpperCase()} ${url} - ${status}`, data, {
      prefix: 'API',
      timestamp: true
    });
  }

  /**
   * Log form submission
   */
  formSubmit(formName: string, data?: any): void {
    this.info(`Form submitted: ${formName}`, data, {
      prefix: 'FORM',
      timestamp: true
    });
  }

  /**
   * Log file upload
   */
  fileUpload(filename: string, size?: number, type?: string): void {
    this.info(`File uploaded: ${filename}`, { size, type }, {
      prefix: 'UPLOAD',
      timestamp: true
    });
  }

  /**
   * Log database operation
   */
  dbOperation(operation: string, table: string, data?: any): void {
    this.info(`DB ${operation}: ${table}`, data, {
      prefix: 'DB',
      timestamp: true
    });
  }

  /**
   * Log user action
   */
  userAction(action: string, userId?: string, data?: any): void {
    this.info(`User action: ${action}`, { userId, ...data }, {
      prefix: 'USER',
      timestamp: true
    });
  }

  /**
   * Log performance metrics
   */
  performance(operation: string, duration: number, data?: any): void {
    this.info(`Performance: ${operation} took ${duration}ms`, data, {
      prefix: 'PERF',
      timestamp: true
    });
  }

  /**
   * Log security events
   */
  security(event: string, data?: any): void {
    this.warn(`Security: ${event}`, data, {
      prefix: 'SECURITY',
      timestamp: true,
      showInProduction: true // Always show security logs
    });
  }
}

// Create singleton instance
export const logger = new Logger();

// Export individual methods for convenience
export const {
  info,
  warn,
  error,
  debug,
  apiRequest,
  apiResponse,
  formSubmit,
  fileUpload,
  dbOperation,
  userAction,
  performance,
  security
} = logger;

// Export the Logger class for custom instances
export { Logger };
