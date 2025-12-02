/**
 * @module Express App
 * @description Express application setup with middlewares and routes
 */

import express, { Application } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import path from 'path'
import apiRoutes from './routes'
import { errorMiddleware } from './shared/middlewares/error.middleware'
import { notFoundMiddleware } from './shared/middlewares/notFound.middleware'
import { getAllRoutes } from './shared/utils/route.util'

const app: Application = express()

// Security middlewares
// Configure Helmet to allow CORS for public API
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  // Don't block OPTIONS requests (CORS preflight)
  contentSecurityPolicy: false, // Disable CSP for now to avoid conflicts
}))

// CORS configuration
// Support both ALLOWED_ORIGINS and CORS_ORIGIN environment variables
const corsOriginsEnv = process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGIN || ''
const allowedOrigins = corsOriginsEnv
  ? corsOriginsEnv.split(',').map(o => o.trim()).filter(Boolean)
  : [
      'http://localhost:4502',
      'http://localhost:4503',
      'http://127.0.0.1:4502',
      'http://127.0.0.1:4503',
    ]

// Log CORS configuration on startup (for debugging - always log in production too)
console.log('🔐 CORS Configuration:', {
  allowedOrigins,
  hasCorsOrigin: !!process.env.CORS_ORIGIN,
  hasAllowedOrigins: !!process.env.ALLOWED_ORIGINS,
  corsOriginValue: process.env.CORS_ORIGIN || 'not set',
  allowedOriginsValue: process.env.ALLOWED_ORIGINS || 'not set',
  nodeEnv: process.env.NODE_ENV,
})

// CORS configuration
// Public API endpoints allow all origins (SDK can be embedded anywhere)
// Admin/Member API endpoints use restricted CORS
app.use((req, res, next) => {
  // Check if this is a public API route
  // IMPORTANT: CORS middleware runs BEFORE routes, so paths are not stripped yet
  // Use req.originalUrl or req.url to get the full path
  const originalUrl = req.originalUrl || req.url || ''
  const path = req.path || ''
  const baseUrl = req.baseUrl || ''
  const fullPath = baseUrl + path
  
  // Check if this is a public API route (check originalUrl first - most reliable)
  // originalUrl contains the full path before any routing modifications
  const isPublicApiRoute = 
    originalUrl.startsWith('/api/public/v1') ||
    req.url?.startsWith('/api/public/v1') ||
    fullPath.startsWith('/api/public/v1') ||
    path.startsWith('/api/public/v1') ||
    (baseUrl === '/api' && path.startsWith('/public/v1'))
  
  // Debug logging for troubleshooting (always log for now to diagnose)
  console.log('🔍 CORS Middleware Check:', {
    originalUrl,
    url: req.url,
    path,
    baseUrl,
    fullPath,
    isPublicApiRoute,
    allowPublicCors: process.env.ALLOW_PUBLIC_API_CORS,
    method: req.method,
    origin: req.headers.origin,
    willUsePublicCors: isPublicApiRoute && process.env.ALLOW_PUBLIC_API_CORS === 'true',
  })
  
  // For public API routes, use permissive CORS if ALLOW_PUBLIC_API_CORS is enabled
  if (isPublicApiRoute && process.env.ALLOW_PUBLIC_API_CORS === 'true') {
    const origin = req.headers.origin
    
    // Set CORS headers for public API
    // IMPORTANT: When credentials: true, you CANNOT use '*' - must use specific origin
    // For public API, we allow all origins but don't use credentials (SDK doesn't need them)
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin)
      // Don't set credentials for public API (allows wildcard-like behavior)
      // res.setHeader('Access-Control-Allow-Credentials', 'true')
    } else {
      // If no origin, allow all
      res.setHeader('Access-Control-Allow-Origin', '*')
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    res.setHeader('Access-Control-Max-Age', '86400') // 24 hours
    
    // Handle preflight requests - MUST return before any other middleware
    if (req.method === 'OPTIONS') {
      console.log('✅ CORS Preflight handled for public API:', {
        origin: origin || 'none',
        path: fullPath,
        method: req.method,
        allowPublicCors: process.env.ALLOW_PUBLIC_API_CORS,
      })
      return res.status(200).end()
    }
    
    return next()
  }
  
  // For non-public routes, use standard CORS middleware
  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true)
      }
      
      // Normalize origin (remove trailing slashes, lowercase for comparison)
      const normalizedOrigin = origin.trim().toLowerCase().replace(/\/+$/, '')
      const normalizedAllowedOrigins = allowedOrigins.map(o => o.trim().toLowerCase().replace(/\/+$/, ''))
      
      // In development, allow all localhost origins
      if (process.env.NODE_ENV === 'development') {
        if (normalizedOrigin.includes('localhost') || normalizedOrigin.includes('127.0.0.1')) {
          return callback(null, true)
        }
      }
      
      // Check if origin is in allowed list (exact match or wildcard)
      // Use normalized comparison for case-insensitive matching
      if (normalizedAllowedOrigins.includes(normalizedOrigin) || normalizedAllowedOrigins.includes('*')) {
        return callback(null, true)
      }
      
      // Log CORS rejection for debugging with detailed comparison
      // Note: CORS callback doesn't have access to req object, so we can only log origin info
      console.warn('🚫 CORS blocked:', {
        origin,
        normalizedOrigin,
        allowedOrigins,
        normalizedAllowedOrigins,
        allowedOriginsCount: allowedOrigins.length,
        exactMatch: normalizedAllowedOrigins.includes(normalizedOrigin),
        hasWildcard: normalizedAllowedOrigins.includes('*'),
        nodeEnv: process.env.NODE_ENV,
        corsOriginEnv: process.env.CORS_ORIGIN || 'not set',
        allowedOriginsEnv: process.env.ALLOWED_ORIGINS || 'not set',
        hint: `Add "${origin}" to CORS_ORIGIN or ALLOWED_ORIGINS environment variable`,
      })
      
      // Create a more descriptive CORS error
      const corsError = new Error(`Not allowed by CORS: Origin "${origin}" is not in allowed origins list: ${allowedOrigins.join(', ')}`)
      corsError.name = 'CorsError'
      callback(corsError)
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })(req, res, next)
})

// Body parsing
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined'))
}

// Serve static files (Development/Local only)
if (process.env.STORAGE_TYPE === 'local') {
  const storagePath = process.env.STORAGE_PATH || './storage/uploads'
  const publicPath = process.env.STORAGE_PUBLIC_PATH || './storage/public'

  app.use('/uploads', express.static(path.resolve(storagePath), {
    maxAge: '30d',
    etag: true,
  }))

  app.use('/public', express.static(path.resolve(publicPath), {
    maxAge: '30d',
    etag: true,
  }))
}

// Serve storage files from root storage directory
const { getStorageRootPath } = require('./shared/storage.config')
app.use('/storage', express.static(getStorageRootPath(), {
  maxAge: '30d',
  etag: true,
}))


// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    routes: getAllRoutes(app._router.stack),
  })
})

// API routes
app.use('/api', apiRoutes)

// Error handling
app.use(notFoundMiddleware)
app.use(errorMiddleware)

export default app

