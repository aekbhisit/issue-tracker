"use strict";
/**
 * @module Config Loader
 * @description Environment variable parsing and validation with Zod
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = getConfig;
exports.getCachedConfig = getCachedConfig;
exports.resetConfigCache = resetConfigCache;
const zod_1 = require("zod");
/**
 * Environment variable schema using Zod
 * Validates and parses all environment variables with proper types
 */
const envSchema = zod_1.z.object({
    // Node Environment
    NODE_ENV: zod_1.z.enum(['development', 'staging', 'production', 'test']).default('development'),
    // API Configuration
    API_PORT: zod_1.z.string().transform((val) => parseInt(val, 10)).pipe(zod_1.z.number().int().positive()).default('4501'),
    API_HOST: zod_1.z.string().default('localhost'),
    // Database Configuration
    DATABASE_URL: zod_1.z.string().url('DATABASE_URL must be a valid URL'),
    DATABASE_TYPE: zod_1.z.enum(['postgresql', 'mysql']).default('postgresql'),
    // Security Configuration
    JWT_SECRET: zod_1.z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
    JWT_EXPIRES_IN: zod_1.z.string().default('7d'),
    BCRYPT_ROUNDS: zod_1.z.string().transform((val) => parseInt(val, 10)).pipe(zod_1.z.number().int().min(10).max(15)).default('10'),
    // CORS Configuration
    ALLOWED_ORIGINS: zod_1.z.string().default('*'),
    // Storage Configuration
    STORAGE_TYPE: zod_1.z.enum(['local', 's3']).default('local'),
    STORAGE_PATH: zod_1.z.string().default('./storage/uploads'),
    STORAGE_PUBLIC_PATH: zod_1.z.string().default('./storage/public'),
    STORAGE_TEMP_PATH: zod_1.z.string().default('./storage/uploads/temp'),
    LOCAL_STORAGE_BASE_URL: zod_1.z.string().url().optional(),
    // AWS S3 Configuration (optional, required if STORAGE_TYPE=s3)
    AWS_ACCESS_KEY_ID: zod_1.z.string().optional(),
    AWS_SECRET_ACCESS_KEY: zod_1.z.string().optional(),
    AWS_S3_BUCKET: zod_1.z.string().optional(),
    AWS_S3_REGION: zod_1.z.string().optional(),
    CDN_DOMAIN: zod_1.z.string().url().optional(),
    // Upload Limits
    MAX_FILE_SIZE: zod_1.z.string().transform((val) => parseInt(val, 10)).pipe(zod_1.z.number().int().positive()).default('10485760'),
    ALLOWED_IMAGE_TYPES: zod_1.z.string().default('jpg,jpeg,png,gif,webp'),
    ALLOWED_DOCUMENT_TYPES: zod_1.z.string().default('pdf,doc,docx'),
    // Cleanup Configuration
    TEMP_FILE_CLEANUP_HOURS: zod_1.z.string().transform((val) => parseInt(val, 10)).pipe(zod_1.z.number().int().positive()).default('24'),
    // Redis Configuration (optional)
    REDIS_URL: zod_1.z.string().url().optional(),
    // Next.js Public Variables (for admin/frontend apps)
    NEXT_PUBLIC_API_URL: zod_1.z.string().url().optional(),
    NEXT_PUBLIC_API_ADMIN_URL: zod_1.z.string().url().optional(),
    NEXT_PUBLIC_APP_NAME: zod_1.z.string().optional(),
});
/**
 * Parse and validate environment variables
 * @throws {z.ZodError} If validation fails
 */
function parseEnv() {
    try {
        return envSchema.parse(process.env);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const missingVars = error.errors
                .filter((err) => err.code === 'invalid_type' && err.received === 'undefined')
                .map((err) => err.path.join('.'));
            const invalidVars = error.errors
                .filter((err) => err.code !== 'invalid_type' || err.received !== 'undefined')
                .map((err) => `${err.path.join('.')}: ${err.message}`);
            const errorMessages = [];
            if (missingVars.length > 0) {
                errorMessages.push(`Missing required environment variables:\n  - ${missingVars.join('\n  - ')}`);
            }
            if (invalidVars.length > 0) {
                errorMessages.push(`Invalid environment variables:\n  - ${invalidVars.join('\n  - ')}`);
            }
            throw new Error(`Configuration validation failed:\n\n${errorMessages.join('\n\n')}`);
        }
        throw error;
    }
}
/**
 * Transform parsed environment variables into typed config object
 */
function transformConfig(env) {
    // Validate S3 config if storage type is s3
    if (env.STORAGE_TYPE === 's3') {
        if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY || !env.AWS_S3_BUCKET || !env.AWS_S3_REGION) {
            throw new Error('AWS S3 configuration is incomplete. Required variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET, AWS_S3_REGION');
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
                    accessKeyId: env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
                    bucket: env.AWS_S3_BUCKET,
                    region: env.AWS_S3_REGION,
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
    };
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
function getConfig() {
    const env = parseEnv();
    return transformConfig(env);
}
/**
 * Cached config instance (singleton pattern)
 * Config is parsed once and reused across the application
 */
let cachedConfig = null;
/**
 * Get cached configuration instance
 * First call parses and validates, subsequent calls return cached instance
 *
 * @returns {Config} Cached configuration object
 */
function getCachedConfig() {
    if (!cachedConfig) {
        cachedConfig = getConfig();
    }
    return cachedConfig;
}
/**
 * Reset cached config (useful for testing)
 */
function resetConfigCache() {
    cachedConfig = null;
}
