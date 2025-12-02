/**
 * @module Storage Service
 * @description Service for handling screenshot storage (local and S3)
 */

import * as fs from 'fs'
import * as path from 'path'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'
import type { ScreenshotData, ElementSelector } from '../../modules/issue/issue.types'

const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local'
// Storage configuration (kept for future S3 implementation)
// const STORAGE_PATH = process.env.STORAGE_PATH || './storage/uploads'
const SIGNED_URL_EXPIRY = 3600 // 1 hour in seconds

// S3/MinIO configuration (if using S3 storage) - kept for future implementation
// const S3_ENDPOINT = process.env.S3_ENDPOINT
// const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY
// const S3_SECRET_KEY = process.env.S3_SECRET_KEY
// const S3_BUCKET = process.env.S3_BUCKET || 'issue-collector'
// const S3_REGION = process.env.S3_REGION || 'us-east-1'

interface SaveScreenshotResult {
  storagePath: string
  storageType: string
  filename: string
  projectId: number
  issueId: number
}

/**
 * Storage Service for screenshots
 */
export class StorageService {
  /**
   * Get storage root path
   * Returns project root (where storage/ directory is located)
   */
  private getStorageRootPath(): string {
    // When running from apps/api, process.cwd() returns apps/api directory
    // We need to go up to project root where storage/ directory exists
    const currentDir = process.cwd()
    
    // Check if we're in apps/api directory
    if (currentDir.endsWith('/apps/api') || currentDir.endsWith('\\apps\\api')) {
      // Go up two levels: apps/api -> apps -> project root
      return path.resolve(currentDir, '../..')
    }
    
    // If already at project root, return as is
    return currentDir
  }

  /**
   * Ensure directory exists
   */
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
  }

  /**
   * Decode base64 data URL to buffer
   */
  private decodeBase64DataUrl(dataUrl: string): { buffer: Buffer; mimeType: string } {
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
    if (!matches) {
      throw new Error('Invalid base64 data URL format')
    }

    const mimeType = matches[1]
    const base64Data = matches[2]
    const buffer = Buffer.from(base64Data, 'base64')

    return { buffer, mimeType }
  }

  /**
   * Get file extension from mime type
   */
  private getExtensionFromMimeType(mimeType: string): string {
    const mimeMap: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
    }
    return mimeMap[mimeType] || '.jpg'
  }

  /**
   * Save screenshot to local storage
   * Structure: storage/uploads/screenshots/{projectId}/{issueId}/{filename}
   */
  private async saveToLocal(
    buffer: Buffer,
    projectId: number,
    issueId: number,
    mimeType: string
  ): Promise<SaveScreenshotResult> {
    const rootDir = this.getStorageRootPath()
    // Organize by project: screenshots/{projectId}/{issueId}/
    const screenshotsDir = path.join(
      rootDir, 
      'storage', 
      'uploads', 
      'screenshots', 
      String(projectId),
      String(issueId)
    )
    
    this.ensureDirectoryExists(screenshotsDir)

    const extension = this.getExtensionFromMimeType(mimeType)
    const filename = `${uuidv4()}${extension}`
    const filePath = path.join(screenshotsDir, filename)

    fs.writeFileSync(filePath, buffer)

    // Return relative path from storage root: screenshots/{projectId}/{issueId}/{filename}
    const storagePath = `screenshots/${projectId}/${issueId}/${filename}`

    return {
      storagePath,
      storageType: 'local',
      filename,
      projectId,
      issueId,
    }
  }

  /**
   * Save screenshot to S3/MinIO
   * Structure: screenshots/{projectId}/{issueId}/{filename}
   */
  private async saveToS3(
    buffer: Buffer,
    projectId: number,
    issueId: number,
    mimeType: string
  ): Promise<SaveScreenshotResult> {
    // For IC-5, we'll implement basic S3 upload
    // In production, you would use AWS SDK or MinIO client
    // For now, we'll throw an error if S3 is configured but not implemented
    if (STORAGE_TYPE === 's3') {
      throw new Error('S3 storage is not yet implemented. Please use local storage for IC-5.')
    }

    // Fallback to local if S3 is not properly configured
    return this.saveToLocal(buffer, projectId, issueId, mimeType)
  }

  /**
   * Save screenshot from base64 data URL
   * Structure: screenshots/{projectId}/{issueId}/{filename}
   * 
   * @param screenshotData - Screenshot data with base64 dataUrl
   * @param projectId - Project ID for organization
   * @param issueId - Issue ID
   * @param _elementSelector - Optional element selector (for future use)
   */
  async saveScreenshot(
    screenshotData: ScreenshotData,
    projectId: number,
    issueId: number,
    _elementSelector?: ElementSelector
  ): Promise<SaveScreenshotResult> {
    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (screenshotData.fileSize > maxSize) {
      throw new Error(`Screenshot size exceeds maximum allowed size of ${maxSize} bytes`)
    }

    // Decode base64 data URL
    const { buffer, mimeType } = this.decodeBase64DataUrl(screenshotData.dataUrl)

    // Save to storage (organized by project)
    if (STORAGE_TYPE === 's3') {
      return this.saveToS3(buffer, projectId, issueId, mimeType)
    } else {
      return this.saveToLocal(buffer, projectId, issueId, mimeType)
    }
  }

  /**
   * Generate signed URL for local storage
   * Returns null if file doesn't exist (graceful handling)
   */
  private generateLocalSignedUrl(storagePath: string, expirySeconds: number = SIGNED_URL_EXPIRY): string | null {
    const rootDir = this.getStorageRootPath()
    const fullPath = path.join(rootDir, 'storage', 'uploads', storagePath)
    
    // Check if file exists - return null instead of throwing error
    // This allows the API to continue working even if some files are missing
    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️  Screenshot file not found: ${storagePath} (expected at: ${fullPath})`)
      // Also check if directory exists to help diagnose path issues
      const dirPath = path.dirname(fullPath)
      if (!fs.existsSync(dirPath)) {
        console.warn(`⚠️  Screenshot directory not found: ${dirPath}`)
      } else {
        // Directory exists but file doesn't - list files in directory for debugging
        try {
          const filesInDir = fs.readdirSync(dirPath)
          console.warn(`⚠️  Directory exists but file not found. Files in directory: ${filesInDir.join(', ')}`)
        } catch (err) {
          console.warn(`⚠️  Could not read directory: ${dirPath}`, err)
        }
      }
      return null
    }

    // Generate token with expiration
    const expiresAt = Math.floor(Date.now() / 1000) + expirySeconds
    const token = crypto
      .createHash('sha256')
      .update(`${storagePath}:${expiresAt}:${process.env.SECRET_KEY || 'default-secret'}`)
      .digest('hex')

    // Return signed URL (in production, this would be served by a secure endpoint)
    // For IC-5, we'll use a simple token-based approach
    // Use API_URL if set, otherwise try to detect from request context or use default
    // In production, API_URL should be set to the public API URL (e.g., https://issue.haahii.com)
    let baseUrl = process.env.API_URL
    
    // If API_URL is not set, try to construct from other env vars or use default
    if (!baseUrl) {
      // Try to use NEXT_PUBLIC_API_URL if available (for consistency)
      baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.PUBLIC_API_URL
      
      // If still not set, use default based on environment
      if (!baseUrl) {
        if (process.env.NODE_ENV === 'production') {
          // In production, log warning if API_URL is not set
          console.error('❌ CRITICAL: API_URL environment variable is not set in production!')
          console.error('   Screenshot URLs will be broken. Set API_URL=https://issue.haahii.com in your environment variables.')
          console.error('   Current screenshot URL will use localhost fallback and will NOT work.')
          // In production, try to infer from common production domains
          // This is a last resort - API_URL should always be set explicitly
          const inferredUrl = process.env.CORS_ORIGIN?.split(',')[0]?.trim() || null
          if (inferredUrl && (inferredUrl.startsWith('https://') || inferredUrl.startsWith('http://'))) {
            baseUrl = inferredUrl
            console.warn(`⚠️  Using inferred API_URL from CORS_ORIGIN: ${baseUrl}`)
            console.warn('   This may not be correct. Please set API_URL explicitly.')
          } else {
            baseUrl = 'http://localhost:4501' // Fallback - will NOT work in production
            console.error('   Using localhost fallback - screenshot URLs will be broken!')
          }
        } else {
          baseUrl = 'http://localhost:4501'
        }
      }
    }
    
    // Remove trailing slash if present
    baseUrl = baseUrl.replace(/\/+$/, '')
    
    // Encode storagePath only once - it should already be a clean path like "screenshots/2/12/filename.jpg"
    // Don't double-encode - encodeURIComponent will handle special characters correctly
    const encodedPath = encodeURIComponent(storagePath)
    
    return `${baseUrl}/api/admin/v1/issues/screenshots/${encodedPath}?token=${token}&expires=${expiresAt}`
  }

  /**
   * Generate signed URL for S3/MinIO
   */
  private generateS3SignedUrl(_storagePath: string, _expirySeconds: number = SIGNED_URL_EXPIRY): string {
    // For IC-5, S3 signed URLs are not implemented
    // In production, use AWS SDK presigned URLs
    throw new Error('S3 signed URLs are not yet implemented')
  }

  /**
   * Get signed URL for screenshot access
   * Returns null if file doesn't exist (graceful handling)
   */
  getScreenshotUrl(storagePath: string, storageType: string, expirySeconds: number = SIGNED_URL_EXPIRY): string | null {
    if (storageType === 's3') {
      return this.generateS3SignedUrl(storagePath, expirySeconds)
    } else {
      return this.generateLocalSignedUrl(storagePath, expirySeconds)
    }
  }

  /**
   * Delete screenshot from storage
   */
  async deleteScreenshot(storagePath: string, storageType: string): Promise<void> {
    if (storageType === 's3') {
      // S3 deletion not implemented for IC-5
      throw new Error('S3 deletion is not yet implemented')
    }

    const rootDir = this.getStorageRootPath()
    const fullPath = path.join(rootDir, 'storage', 'uploads', storagePath)

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
    }
  }

  /**
   * Verify signed URL token
   */
  verifySignedUrlToken(storagePath: string, token: string, expires: number): boolean {
    // Check expiration
    const now = Math.floor(Date.now() / 1000)
    if (now > expires) {
      return false
    }

    // Verify token
    const expectedToken = crypto
      .createHash('sha256')
      .update(`${storagePath}:${expires}:${process.env.SECRET_KEY || 'default-secret'}`)
      .digest('hex')

    return token === expectedToken
  }
}

export const storageService = new StorageService()

