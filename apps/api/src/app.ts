/**
 * @module Express App
 * @description Express application setup with middlewares and routes
 */

import express, { Application } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import path from 'path'
import fs from 'fs'
import apiRoutes from './routes'
import { errorMiddleware } from './shared/middlewares/error.middleware'
import { notFoundMiddleware } from './shared/middlewares/notFound.middleware'
import { getAllRoutes } from './shared/utils/route.util'

const app: Application = express()

// Security middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
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
app.use(cors({
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
    
    // For public API, allow all origins (SDK can be embedded in any website)
    // This is checked at route level, but we allow all here for simplicity
    // In production, you may want to restrict this further
    if (process.env.NODE_ENV === 'development' || process.env.ALLOW_PUBLIC_API_CORS === 'true') {
      return callback(null, true)
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
}))

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

// Version endpoint
app.get('/version', (_req, res) => {
  try {
    const packageJsonPath = path.join(__dirname, '../package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    
    res.json({
      version: packageJson.version || '1.0.0',
      name: packageJson.name || 'issue-collector-api',
      description: packageJson.description || 'Express API Server',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to read version information',
      timestamp: new Date().toISOString(),
    })
  }
})

// API routes
app.use('/api', apiRoutes)

// Error handling
app.use(notFoundMiddleware)
app.use(errorMiddleware)

export default app

