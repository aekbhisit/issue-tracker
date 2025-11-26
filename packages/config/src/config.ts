/**
 * @module Config Loader
 * @description Environment variable parsing and validation with Zod
 */

import { z } from 'zod'

/**
 * Environment variable schema using Zod
 * Validates and parses all environment variables with proper types
 */
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),

  // API Configuration
  API_PORT: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().positive()).default('4501'),
  API_HOST: z.string().default('localhost'),

  // Database Configuration
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  DATABASE_TYPE: z.enum(['postgresql', 'mysql']).default('postgresql'),

  // Security Configuration
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().min(10).max(15)).default('10'),

  // CORS Configuration
  ALLOWED_ORIGINS: z.string().default('*'),

  // Storage Configuration
  STORAGE_TYPE: z.enum(['local', 's3']).default('local'),
  STORAGE_PATH: z.string().default('./storage/uploads'),
  STORAGE_PUBLIC_PATH: z.string().default('./storage/public'),
  STORAGE_TEMP_PATH: z.string().default('./storage/uploads/temp'),
  LOCAL_STORAGE_BASE_URL: z.string().url().optional(),

  // AWS S3 Configuration (optional, required if STORAGE_TYPE=s3)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_S3_REGION: z.string().optional(),
  CDN_DOMAIN: z.string().url().optional(),

  // Upload Limits
  MAX_FILE_SIZE: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().positive()).default('10485760'),
  ALLOWED_IMAGE_TYPES: z.string().default('jpg,jpeg,png,gif,webp'),
  ALLOWED_DOCUMENT_TYPES: z.string().default('pdf,doc,docx'),

  // Cleanup Configuration
  TEMP_FILE_CLEANUP_HOURS: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().positive()).default('24'),

  // Redis Configuration (optional)
  REDIS_URL: z.string().url().optional(),

  // Next.js Public Variables (for admin/frontend apps)
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_API_ADMIN_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_NAME: z.string().optional(),
})

/**
 * Type inference from Zod schema
 */
export type EnvConfig = z.infer<typeof envSchema>

/**
 * Validated configuration object
 */
export type Config = {
  env: EnvConfig['NODE_ENV']
  api: {
    port: number
    host: string
  }
  database: {
    url: string
    type: 'postgresql' | 'mysql'
  }
  security: {
    jwtSecret: string
    jwtExpiresIn: string
    bcryptRounds: number
  }
  cors: {
    allowedOrigins: string[]
  }
  storage: {
    type: 'local' | 's3'
    path: string
    publicPath: string
    tempPath: string
    localBaseUrl?: string
    s3?: {
      accessKeyId: string
      secretAccessKey: string
      bucket: string
      region: string
      cdnDomain?: string
    }
  }
  upload: {
    maxFileSize: number
    allowedImageTypes: string[]
    allowedDocumentTypes: string[]
  }
  cleanup: {
    tempFileCleanupHours: number
  }
  redis?: {
    url: string
  }
  nextjs: {
    publicApiUrl?: string
    publicApiAdminUrl?: string
    appName?: string
  }
}

/**
 * Parse and validate environment variables
 * @throws {z.ZodError} If validation fails
 */
function parseEnv(): EnvConfig {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .filter((err) => err.code === 'invalid_type' && err.received === 'undefined')
        .map((err) => err.path.join('.'))
      
      const invalidVars = error.errors
        .filter((err) => err.code !== 'invalid_type' || err.received !== 'undefined')
        .map((err) => `${err.path.join('.')}: ${err.message}`)

      const errorMessages: string[] = []
      
      if (missingVars.length > 0) {
        errorMessages.push(`Missing required environment variables:\n  - ${missingVars.join('\n  - ')}`)
      }
      
      if (invalidVars.length > 0) {
        errorMessages.push(`Invalid environment variables:\n  - ${invalidVars.join('\n  - ')}`)
      }

      throw new Error(`Configuration validation failed:\n\n${errorMessages.join('\n\n')}`)
    }
    throw error
  }
}

/**
 * Transform parsed environment variables into typed config object
 */
function transformConfig(env: EnvConfig): Config {
  // Validate S3 config if storage type is s3
  if (env.STORAGE_TYPE === 's3') {
    if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY || !env.AWS_S3_BUCKET || !env.AWS_S3_REGION) {
      throw new Error(
        'AWS S3 configuration is incomplete. Required variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET, AWS_S3_REGION'
      )
    }
  }

  return {
    env: env.NODE_ENV,
    api: {
      port: env.API_PORT,
      host: env.API_HOST,
    },
    database: {
      url: env.DATABASE_URL,
      type: env.DATABASE_TYPE,
    },
    security: {
      jwtSecret: env.JWT_SECRET,
      jwtExpiresIn: env.JWT_EXPIRES_IN,
      bcryptRounds: env.BCRYPT_ROUNDS,
    },
    cors: {
      allowedOrigins: env.ALLOWED_ORIGINS === '*' ? ['*'] : env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()),
    },
    storage: {
      type: env.STORAGE_TYPE,
      path: env.STORAGE_PATH,
      publicPath: env.STORAGE_PUBLIC_PATH,
      tempPath: env.STORAGE_TEMP_PATH,
      localBaseUrl: env.LOCAL_STORAGE_BASE_URL,
      ...(env.STORAGE_TYPE === 's3' && {
        s3: {
          accessKeyId: env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
          bucket: env.AWS_S3_BUCKET!,
          region: env.AWS_S3_REGION!,
          cdnDomain: env.CDN_DOMAIN,
        },
      }),
    },
    upload: {
      maxFileSize: env.MAX_FILE_SIZE,
      allowedImageTypes: env.ALLOWED_IMAGE_TYPES.split(',').map((s) => s.trim()),
      allowedDocumentTypes: env.ALLOWED_DOCUMENT_TYPES.split(',').map((s) => s.trim()),
    },
    cleanup: {
      tempFileCleanupHours: env.TEMP_FILE_CLEANUP_HOURS,
    },
    ...(env.REDIS_URL && {
      redis: {
        url: env.REDIS_URL,
      },
    }),
    nextjs: {
      publicApiUrl: env.NEXT_PUBLIC_API_URL,
      publicApiAdminUrl: env.NEXT_PUBLIC_API_ADMIN_URL,
      appName: env.NEXT_PUBLIC_APP_NAME,
    },
  }
}

/**
 * Get validated configuration object
 * Parses and validates environment variables, then transforms them into a typed config object
 * 
 * @returns {Config} Validated configuration object
 * @throws {Error} If environment variables are missing or invalid
 * 
 * @example
 * ```typescript
 * import { getConfig } from '@workspace/config'
 * 
 * const config = getConfig()
 * console.log(config.api.port) // 3000
 * console.log(config.database.url) // postgresql://...
 * ```
 */
export function getConfig(): Config {
  const env = parseEnv()
  return transformConfig(env)
}

/**
 * Cached config instance (singleton pattern)
 * Config is parsed once and reused across the application
 */
let cachedConfig: Config | null = null

/**
 * Get cached configuration instance
 * First call parses and validates, subsequent calls return cached instance
 * 
 * @returns {Config} Cached configuration object
 */
export function getCachedConfig(): Config {
  if (!cachedConfig) {
    cachedConfig = getConfig()
  }
  return cachedConfig
}

/**
 * Reset cached config (useful for testing)
 */
export function resetConfigCache(): void {
  cachedConfig = null
}

