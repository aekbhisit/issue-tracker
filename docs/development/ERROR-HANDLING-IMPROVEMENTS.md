# Error Handling Improvements

## Overview

This document describes the improvements made to error handling in the API to provide clearer, more actionable error messages to users and better debugging information for developers.

## Problem Statement

Previously, when errors occurred (especially 500 Internal Server Errors), users would receive generic messages like "An unexpected error occurred" which provided no insight into:
- What actually went wrong
- Whether it's a configuration issue, database issue, or application bug
- What steps they could take to resolve it

## Improvements Made

### 1. New Error Types

Added specific error classes for better categorization:

- **`DatabaseConnectionError`** (503): For database connection failures
- **`ConfigurationError`** (500): For missing or invalid configuration (e.g., JWT_SECRET)

### 2. Enhanced Error Middleware

The error middleware now:

- **Categorizes errors automatically** based on error type and message patterns
- **Provides user-friendly messages** that explain what went wrong
- **Includes actionable hints** in error details (e.g., "Check DATABASE_URL")
- **Logs comprehensive context** including request method, path, IP, user agent
- **Handles specific error scenarios**:
  - Database connection errors (ECONNREFUSED, timeout, etc.)
  - Database authentication failures
  - Prisma-specific error codes (P1001, P1000, P1003, P2002, etc.)
  - JWT errors (expired, invalid)
  - Configuration errors

### 3. Improved Auth Service Error Handling

- **Wraps database queries in try-catch** to catch connection errors early
- **Validates JWT_SECRET** before attempting to generate tokens
- **Provides specific error messages** for different failure scenarios
- **Handles JWT errors** with appropriate messages (expired vs invalid)

### 4. Better Logging

- **Request context** is logged with every error (method, path, IP, user agent)
- **Sensitive data** (passwords) are redacted in logs
- **Development vs Production** logging levels (stack traces only in dev)
- **Error categorization** is logged for easier debugging

## Error Response Format

All errors now follow this consistent format:

```json
{
  "error": "ErrorCategory",
  "message": "User-friendly error message",
  "status": 500,
  "details": {
    "code": "ERROR_CODE",
    "hint": "Actionable hint for resolution"
  }
}
```

## Error Categories and Messages

### Database Connection Errors (503)

**Message**: "Unable to connect to database. Please check database configuration and ensure the database server is running."

**Details**:
- `code`: `DATABASE_CONNECTION_FAILED` or `DATABASE_UNREACHABLE`
- `hint`: "Check DATABASE_URL, database host, port, and credentials in environment variables."

**Triggers**:
- Prisma initialization errors
- Connection refused errors
- Timeout errors
- Network errors (ENOTFOUND, ECONNREFUSED)

### Database Authentication Errors (503)

**Message**: "Database authentication failed. Please check database credentials."

**Details**:
- `code`: `DATABASE_AUTH_FAILED`
- `hint`: "Verify DATABASE_USER and DATABASE_PASSWORD in environment variables."

**Triggers**:
- Password authentication failures
- Prisma error code P1000

### Database Not Found Errors (400)

**Message**: "Database does not exist. Please create the database first."

**Details**:
- `code`: `DATABASE_NOT_FOUND`
- `hint`: "Database 'X' not found. Create it or update DATABASE_NAME."

**Triggers**:
- Prisma error code P1003

### Configuration Errors (500)

**Message**: "Server configuration error. Please contact administrator."

**Details**:
- `code`: `CONFIGURATION_ERROR`
- `hint`: In development, shows the actual error message. In production, shows generic hint.

**Triggers**:
- Missing JWT_SECRET
- Missing required environment variables
- Invalid configuration values

### JWT Errors (401)

**Expired Token**:
- **Message**: "Your session has expired. Please log in again."

**Invalid Token**:
- **Message**: "Invalid authentication token. Please log in again."

**Details**:
- `code`: `JWT_ERROR`

### Validation Errors (400)

**Message**: "Invalid database query. Please check your request."

**Triggers**:
- Prisma validation errors

### Conflict Errors (409)

**Message**: "A record with this value already exists."

**Details**:
- `code`: `UNIQUE_CONSTRAINT_VIOLATION`
- `field`: The field that caused the conflict

**Triggers**:
- Prisma error code P2002 (unique constraint violation)

## Examples

### Example 1: Database Connection Failure

**Before**:
```json
{
  "error": "InternalServerError",
  "message": "An unexpected error occurred",
  "status": 500
}
```

**After**:
```json
{
  "error": "DatabaseConnectionError",
  "message": "Unable to connect to database. Please check database configuration and ensure the database server is running.",
  "status": 503,
  "details": {
    "code": "DATABASE_CONNECTION_FAILED",
    "hint": "Check DATABASE_URL, database host, port, and credentials in environment variables."
  }
}
```

### Example 2: Missing JWT_SECRET

**Before**:
```json
{
  "error": "InternalServerError",
  "message": "An unexpected error occurred",
  "status": 500
}
```

**After**:
```json
{
  "error": "ConfigurationError",
  "message": "Server configuration error. Please contact administrator.",
  "status": 500,
  "details": {
    "code": "CONFIGURATION_ERROR",
    "hint": "JWT_SECRET is not configured. Please set JWT_SECRET environment variable."
  }
}
```

### Example 3: Database Authentication Failure

**Before**:
```json
{
  "error": "InternalServerError",
  "message": "An unexpected error occurred",
  "status": 500
}
```

**After**:
```json
{
  "error": "AuthenticationError",
  "message": "Database authentication failed. Invalid username or password.",
  "status": 503,
  "details": {
    "code": "DATABASE_AUTH_FAILED",
    "hint": "Check DATABASE_USER and DATABASE_PASSWORD."
  }
}
```

## Development vs Production

### Development Mode

- Full error messages are shown
- Stack traces are included in error details
- Detailed Prisma error codes and metadata are included
- More verbose logging

### Production Mode

- User-friendly messages only
- No stack traces
- Generic hints (no sensitive information)
- Minimal logging (no sensitive data)

## Logging

All errors are logged with:

- Error category and name
- Error message
- HTTP status code
- Request context:
  - HTTP method
  - Request path
  - Query parameters
  - Request body (with passwords redacted)
  - Client IP
  - User agent
- Stack trace (development only)

## Testing Error Scenarios

To test different error scenarios:

1. **Database Connection Error**: Stop PostgreSQL service
2. **Database Auth Error**: Use wrong DATABASE_PASSWORD
3. **Missing JWT_SECRET**: Remove JWT_SECRET from environment
4. **Database Not Found**: Use non-existent DATABASE_NAME
5. **Invalid Token**: Use expired or malformed JWT token

## Future Improvements

Potential future enhancements:

1. **Error Tracking**: Integrate with error tracking service (Sentry, etc.)
2. **Error Codes**: Standardize error codes across the application
3. **Localization**: Translate error messages based on user locale
4. **Retry Logic**: Automatic retry for transient errors (database connection)
5. **Health Checks**: Proactive health checks for database and services
6. **Rate Limiting**: Better error messages for rate limit exceeded

## Related Files

- `apps/api/src/shared/middlewares/error.middleware.ts` - Error middleware
- `apps/api/src/shared/utils/error.util.ts` - Error classes
- `apps/api/src/modules/auth/auth.service.ts` - Auth service with improved error handling


