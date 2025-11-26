/**
 * @module Logger Usage Examples
 * @description Examples of how to use the logger utility
 */

import { logger, info, warn, error, debug } from './logger.utils';

// Example usage in different scenarios

// 1. Basic logging
export function basicLoggingExample() {
  logger.info('Application started');
  logger.warn('This is a warning message');
  logger.error('This is an error message');
  logger.debug('Debug information');
}

// 2. API logging
export function apiLoggingExample() {
  // Log API request
  logger.apiRequest('POST', '/api/users', { name: 'John', email: 'john@example.com' });
  
  // Log API response
  logger.apiResponse('POST', '/api/users', 201, { id: 1, name: 'John' });
  
  // Log API error
  logger.apiResponse('POST', '/api/users', 400, { error: 'Invalid email' });
}

// 3. Form logging
export function formLoggingExample() {
  const formData = {
    name: 'John Doe',
    email: 'john@example.com',
    age: 30
  };
  
  logger.formSubmit('UserRegistrationForm', formData);
}

// 4. File upload logging
export function fileUploadLoggingExample() {
  logger.fileUpload('document.pdf', 1024000, 'application/pdf');
}

// 5. Database operation logging
export function databaseLoggingExample() {
  logger.dbOperation('INSERT', 'users', { name: 'John', email: 'john@example.com' });
  logger.dbOperation('UPDATE', 'users', { id: 1, name: 'John Updated' });
  logger.dbOperation('DELETE', 'users', { id: 1 });
}

// 6. User action logging
export function userActionLoggingExample() {
  logger.userAction('login', 'user123', { ip: '192.168.1.1' });
  logger.userAction('logout', 'user123');
  logger.userAction('profile_update', 'user123', { fields: ['name', 'email'] });
}

// 7. Performance logging
export function performanceLoggingExample() {
  const startTime = Date.now();
  
  // Simulate some operation
  setTimeout(() => {
    const duration = Date.now() - startTime;
    logger.performance('database_query', duration, { query: 'SELECT * FROM users' });
  }, 100);
}

// 8. Security logging
export function securityLoggingExample() {
  logger.security('failed_login_attempt', { 
    email: 'hacker@example.com', 
    ip: '192.168.1.100',
    userAgent: 'Mozilla/5.0...'
  });
  
  logger.security('suspicious_activity', {
    userId: 'user123',
    action: 'multiple_failed_logins',
    count: 5
  });
}

// 9. Custom logging with options
export function customLoggingExample() {
  logger.info('Custom message', { data: 'some data' }, {
    prefix: 'CUSTOM',
    timestamp: true
  });
  
  logger.error('Critical error', { error: 'Database connection failed' }, {
    prefix: 'CRITICAL',
    timestamp: true,
    showInProduction: true // This will show even in production
  });
}

// 10. Using individual methods
export function individualMethodsExample() {
  info('Using individual info method');
  warn('Using individual warn method');
  error('Using individual error method');
  debug('Using individual debug method');
}

// 11. Environment-specific logging
export function environmentSpecificExample() {
  // This will only log in development/local environments
  logger.info('Development only log');
  
  // This will log in all environments including production
  logger.security('Security event', { event: 'unauthorized_access' });
}

// 12. Conditional logging
export function conditionalLoggingExample() {
  const isDebugMode = process.env.DEBUG === 'true';
  
  if (isDebugMode) {
    logger.debug('Debug mode is enabled');
  }
  
  // Always log important events
  logger.info('Important system event', { event: 'system_startup' });
}
