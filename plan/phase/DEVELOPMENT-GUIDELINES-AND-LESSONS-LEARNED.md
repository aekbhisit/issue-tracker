# Development Guidelines & Lessons Learned

## Overview
This document captures critical lessons learned from IC-0 and IC-1 development, and provides guidelines to prevent common issues in future phases.

## Critical Issues Encountered & Solutions

### 1. Database Setup & Prisma Client Issues

#### Problem
- Prisma client not generated with all models
- Database tables not created
- `db.model` undefined errors
- Multi-file schema not merged properly

#### Root Causes
- Prisma doesn't natively support multi-file schemas
- Schema merge script not running before generate
- Database tables not pushed/migrated
- Prisma client cached in running server

#### Solutions Applied
1. ✅ Created `scripts/merge-schema.js` to merge all schema files
2. ✅ Updated all Prisma commands to merge first
3. ✅ Added `db:push` step to create tables
4. ✅ Ensured Prisma client regenerated after schema changes
5. ✅ Added proper error handling in seed files

#### Prevention Guidelines
```markdown
### Database Setup Checklist
- [ ] Run `pnpm db:merge` to merge schema files
- [ ] Run `pnpm db:generate` to regenerate Prisma client
- [ ] Run `pnpm db:push` or `pnpm db:migrate:dev` to create tables
- [ ] **RESTART API SERVER** after Prisma client regeneration
- [ ] Verify tables exist: `psql -d issue_collector -c "\dt"`
- [ ] Test Prisma client: `node -e "const {db} = require('@workspace/database'); console.log(db.modelName)"`
```

### 2. CORS Configuration Issues

#### Problem
- API rejecting requests from admin dashboard
- CORS errors in browser console
- Credentials not sent with requests

#### Root Causes
- `ALLOWED_ORIGINS` set to wrong ports (3001, 3002 instead of 4502, 4503)
- CORS middleware too restrictive
- Helmet blocking cross-origin requests

#### Solutions Applied
1. ✅ Updated `ALLOWED_ORIGINS` to correct ports
2. ✅ Improved CORS to allow localhost in development
3. ✅ Fixed helmet cross-origin policy
4. ✅ Added proper credentials handling

#### Prevention Guidelines
```markdown
### CORS Configuration Checklist
- [ ] Verify `ALLOWED_ORIGINS` includes all frontend ports
- [ ] Test CORS in development (allow localhost origins)
- [ ] Ensure credentials: true in CORS config
- [ ] Fix helmet cross-origin policy
- [ ] **RESTART API SERVER** after CORS changes
- [ ] Test API calls from browser console
```

### 3. Sidebar Loading Performance Issues

#### Problem
- Sidebar waited for API call before rendering
- System menu didn't show until API responded
- Slow initial page load
- Blocking UI spinners

#### Root Causes
- `isLoadingMenu` started as `true`
- Menu API call happened synchronously on mount
- Super admin check waited for API response
- No immediate fallback to default menu

#### Solutions Applied
1. ✅ Changed `isLoadingMenu` initial state to `false`
2. ✅ Menu renders immediately with default items
3. ✅ Database menu loads in background (non-blocking)
4. ✅ Super admin check from localStorage (synchronous)
5. ✅ Removed blocking spinners

#### Prevention Guidelines
```markdown
### Performance Best Practices
- [ ] **Always render UI immediately** - Don't wait for API calls
- [ ] Use default/fallback data for initial render
- [ ] Load data in background (non-blocking)
- [ ] Check localStorage synchronously for immediate state
- [ ] Use `useState` initializer functions for sync checks
- [ ] Avoid blocking spinners - show content first
- [ ] Add small loading indicators (non-blocking) if needed
```

### 4. React Hydration Errors

#### Problem
- Server-rendered HTML didn't match client
- `checkPermission()` accessed localStorage during SSR
- Date/random values causing mismatches

#### Root Causes
- Client-side only code running on server
- localStorage access during SSR
- Permission checks in render (not useEffect)

#### Solutions Applied
1. ✅ Moved permission checks to `useEffect`
2. ✅ Added `typeof window !== 'undefined'` guards
3. ✅ Initialize state as `false`, update after mount
4. ✅ Use client-side only hooks for browser APIs

#### Prevention Guidelines
```markdown
### Hydration Safety Checklist
- [ ] **Never access localStorage/window in render**
- [ ] Use `useEffect` for client-side only code
- [ ] Add `typeof window !== 'undefined'` guards
- [ ] Initialize state safely (no browser APIs in initializer)
- [ ] Use "use client" directive for client components
- [ ] Test SSR vs client rendering differences
- [ ] Avoid Date.now(), Math.random() in render
```

### 5. Environment Variable Configuration

#### Problem
- Wrong ports in configuration
- Missing DATABASE_URL
- Environment variables not loaded correctly
- Different values in different .env files

#### Root Causes
- Ports hardcoded instead of using env vars
- Multiple .env files with conflicting values
- Environment not loaded before imports
- Missing environment variable documentation

#### Solutions Applied
1. ✅ Centralized port configuration
2. ✅ Updated all .env.example files
3. ✅ Added environment variable documentation
4. ✅ Created setup scripts with proper env loading

#### Prevention Guidelines
```markdown
### Environment Configuration Checklist
- [ ] Document all required environment variables
- [ ] Update .env.example files with correct defaults
- [ ] Use centralized config package
- [ ] Load environment BEFORE importing modules
- [ ] Validate environment variables on startup
- [ ] Provide clear error messages for missing vars
- [ ] Document port assignments clearly
```

### 6. API Authentication & Logout

#### Problem
- Logout endpoint returning 401 when token expired
- Can't logout if token invalid
- Auth middleware too strict

#### Root Causes
- Logout endpoint required authentication
- No graceful handling of expired tokens

#### Solutions Applied
1. ✅ Made logout endpoint public (no auth required)
2. ✅ Allows logout even with expired/invalid token

#### Prevention Guidelines
```markdown
### Authentication Best Practices
- [ ] Logout endpoints should be public (no auth required)
- [ ] Handle expired tokens gracefully
- [ ] Clear client-side auth data on logout
- [ ] Provide clear error messages for auth failures
- [ ] Support token refresh if needed
```

## Phase Development Checklist

### Before Starting Development

#### Environment Setup
- [ ] Verify all environment variables are documented
- [ ] Check port assignments are correct
- [ ] Ensure CORS configuration includes all frontend ports
- [ ] Verify database connection string is correct
- [ ] Test database setup script works

#### Database Preparation
- [ ] Review schema requirements
- [ ] Create/update Prisma schema files
- [ ] Run `pnpm db:merge` to merge schemas
- [ ] Run `pnpm db:generate` to generate Prisma client
- [ ] Run `pnpm db:push` or create migrations
- [ ] Verify tables created successfully
- [ ] Test Prisma client has all models

#### API Development
- [ ] Plan API endpoints and routes
- [ ] Consider CORS requirements
- [ ] Plan authentication/authorization
- [ ] Design error handling
- [ ] Plan response formats
- [ ] Consider rate limiting if needed

#### Frontend Development
- [ ] Plan component structure
- [ ] Consider SSR vs client-side rendering
- [ ] Plan loading states (immediate render first)
- [ ] Plan error handling
- [ ] Consider performance (lazy loading, code splitting)
- [ ] Plan state management approach

### During Development

#### Performance Considerations
- [ ] **Render UI immediately** - Don't wait for API
- [ ] Use default/fallback data for initial state
- [ ] Load data asynchronously (non-blocking)
- [ ] Check localStorage synchronously when needed
- [ ] Avoid blocking spinners
- [ ] Use loading indicators (non-blocking)

#### Code Quality
- [ ] Add proper error handling
- [ ] Add loading states
- [ ] Add proper TypeScript types
- [ ] Add validation (client and server)
- [ ] Add proper logging
- [ ] Handle edge cases

#### Testing
- [ ] Test in browser (not just terminal)
- [ ] Test with different user roles
- [ ] Test error scenarios
- [ ] Test loading states
- [ ] Test CORS (from browser)
- [ ] Test authentication flow
- [ ] Test logout flow

### After Development

#### Verification
- [ ] Test all functionality in browser
- [ ] Check browser console for errors
- [ ] Verify API calls succeed
- [ ] Test with different browsers
- [ ] Test responsive design
- [ ] Verify performance (no blocking)

#### Documentation
- [ ] Update API documentation
- [ ] Update setup instructions
- [ ] Document environment variables
- [ ] Document database changes
- [ ] Add troubleshooting section
- [ ] Document known issues

## Common Pitfalls to Avoid

### 1. Waiting for API Before Rendering
❌ **Bad**: Show spinner, wait for API, then render
✅ **Good**: Render immediately with defaults, load data in background

### 2. Server-Side Browser API Access
❌ **Bad**: `localStorage.getItem()` in render
✅ **Good**: `useEffect(() => { if (typeof window !== 'undefined') ... })`

### 3. Hardcoded Configuration
❌ **Bad**: Hardcoded ports, URLs, etc.
✅ **Good**: Use environment variables, centralized config

### 4. Missing Error Handling
❌ **Bad**: No error handling, silent failures
✅ **Good**: Proper try/catch, user-friendly error messages

### 5. Not Restarting After Changes
❌ **Bad**: Expecting changes to work without restart
✅ **Good**: Always restart after config/Prisma changes

### 6. CORS Misconfiguration
❌ **Bad**: Too restrictive CORS, wrong origins
✅ **Good**: Allow localhost in dev, proper production config

### 7. Database Not Ready
❌ **Bad**: Assume database/tables exist
✅ **Good**: Verify tables exist, run migrations/push

## Performance Optimization Guidelines

### Initial Render Performance
1. **Render immediately** with default/empty state
2. **Load data asynchronously** after render
3. **Show loading indicators** (non-blocking)
4. **Use skeleton screens** instead of spinners

### API Call Optimization
1. **Batch requests** when possible
2. **Cache responses** appropriately
3. **Use pagination** for large datasets
4. **Debounce search** inputs
5. **Cancel requests** on unmount

### State Management
1. **Initialize state** with safe defaults
2. **Update state** asynchronously
3. **Avoid unnecessary re-renders**
4. **Use memoization** for expensive computations

## Testing Requirements

### Browser Testing (Required)
- [ ] Test in Chrome/Edge
- [ ] Test in Firefox
- [ ] Test in Safari (if macOS)
- [ ] Check browser console for errors
- [ ] Check Network tab for API calls
- [ ] Test responsive design

### Functional Testing
- [ ] Test all CRUD operations
- [ ] Test with different user roles
- [ ] Test error scenarios
- [ ] Test loading states
- [ ] Test form validation
- [ ] Test navigation

### Performance Testing
- [ ] Measure initial render time
- [ ] Check for blocking operations
- [ ] Verify API calls are non-blocking
- [ ] Check for memory leaks
- [ ] Test with large datasets

## Documentation Requirements

### For Each Phase
1. **Setup Instructions**
   - Environment variables needed
   - Database setup steps
   - Dependencies to install

2. **API Documentation**
   - Endpoints and methods
   - Request/response formats
   - Authentication requirements
   - Error responses

3. **Frontend Documentation**
   - Component structure
   - State management
   - Routing
   - Styling approach

4. **Testing Instructions**
   - How to test functionality
   - Test data setup
   - Common issues and solutions

5. **Troubleshooting**
   - Common errors
   - How to debug
   - Solutions to known issues

## Integration Points

### API ↔ Frontend
- [ ] CORS configured correctly
- [ ] Authentication tokens sent properly
- [ ] Error handling consistent
- [ ] Response formats match

### Database ↔ API
- [ ] Prisma client generated
- [ ] Tables created
- [ ] Migrations applied
- [ ] Seed data loaded

### Frontend ↔ Backend
- [ ] Environment variables match
- [ ] Ports configured correctly
- [ ] API URLs correct
- [ ] Authentication flow works

## Checklist Template for New Phases

```markdown
## Phase [X] Development Checklist

### Pre-Development
- [ ] Review phase requirements
- [ ] Plan database schema changes
- [ ] Plan API endpoints
- [ ] Plan frontend components
- [ ] Review environment variables needed
- [ ] Check CORS configuration

### Database Setup
- [ ] Create/update Prisma schema files
- [ ] Run `pnpm db:merge`
- [ ] Run `pnpm db:generate`
- [ ] Run `pnpm db:push` or migrations
- [ ] Verify tables created
- [ ] Test Prisma client

### API Development
- [ ] Implement endpoints
- [ ] Add validation
- [ ] Add error handling
- [ ] Test endpoints (curl/Postman)
- [ ] Verify CORS works
- [ ] Test authentication

### Frontend Development
- [ ] Create components
- [ ] Implement immediate rendering
- [ ] Add loading states (non-blocking)
- [ ] Add error handling
- [ ] Test in browser
- [ ] Verify no hydration errors

### Testing
- [ ] Test in browser
- [ ] Check console for errors
- [ ] Test with different roles
- [ ] Test error scenarios
- [ ] Verify performance
- [ ] Test responsive design

### Documentation
- [ ] Update API docs
- [ ] Update setup instructions
- [ ] Document environment variables
- [ ] Add troubleshooting section
```

## Key Takeaways

1. **Always render UI immediately** - Never wait for API calls
2. **Check localStorage synchronously** - Use useState initializer
3. **Restart servers after config changes** - CORS, Prisma, etc.
4. **Test in browser** - Not just terminal/API testing
5. **Handle errors gracefully** - User-friendly messages
6. **Document everything** - Environment vars, setup steps, etc.
7. **Verify database setup** - Tables exist, Prisma client generated
8. **Check CORS configuration** - Especially in development
9. **Avoid hydration errors** - No browser APIs in render
10. **Performance first** - Non-blocking operations, immediate rendering

