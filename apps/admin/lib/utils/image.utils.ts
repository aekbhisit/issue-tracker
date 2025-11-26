/**
 * @module Image Utilities
 * @description Utility functions for image URL handling and file upload validation
 */

type ImageInput = string | null | undefined | { src?: string | null | undefined }

// Upload validation types
export type UploadType = 'image' | 'video' | 'document'

export interface UploadConfig {
  accept: string
  maxSize: number
  validateType: (file: File) => boolean
  errorMessage: string
  sizeErrorMessage: string
  supportedFormats: string
}

const parseSrcString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return null
  }

  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>
      return parseSrcString(parsed.src)
    } catch {
      return null
    }
  }

  return trimmed
}

const extractImagePath = (input: ImageInput): string | null => {
  if (input === null || input === undefined) return null
  if (typeof input === 'string') {
    return parseSrcString(input)
  }
  if (typeof input === 'object' && input) {
    return parseSrcString(input.src)
  }
  return null
}

export function getImageUrl(image: ImageInput): string | null {
  const imagePath = extractImagePath(image)
  if (!imagePath) return null

  if (imagePath.startsWith('http')) {
    return imagePath
  }

  if (imagePath.startsWith('@temp/')) {
    return `/storage/temp/${imagePath.replace('@temp/', '')}`
  }

  if (imagePath.startsWith('@modules/')) {
    return `/storage/uploads/modules/${imagePath.replace('@modules/', '')}`
  }

  if (imagePath.startsWith('/storage/')) {
    return imagePath
  }

  if (imagePath.startsWith('/')) {
    return `/storage${imagePath}`
  }

  return `/storage/${imagePath.replace(/^\/+/, '')}`
}

export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false
  
  if (url.startsWith('/')) {
    return true
  }

  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function isLocalPath(path: string | null | undefined): boolean {
  if (!path) return false
  return path.startsWith('/storage/') || path.startsWith('@temp/')
}

export function getPlaceholderImage(): string {
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA2NCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAxNkwyOCAyNEwzNiAxNkg0NEM0Ni4yMDkxIDE2IDQ4IDE3Ljc5MDkgNDggMjBWMzJDNDggMzQuMjA5MSA0Ni4yMDkxIDM2IDQ0IDM2SDIwQzE3Ljc5MDkgMzYgMTYgMzQuMjA5MSAxNiAzMlYyMEMxNiAxNy43OTA5IDE3Ljc5MDkgMTYgMjAgMTZaIiBmaWxsPSIjOUNBM0FGIi8+CjxjaXJjbGUgY3g9IjI0IiBjeT0iMjIiIHI9IjIiIGZpbGw9IiNGRkZGRkYiLz4KPC9zdmc+'
}

// ============================================================================
// File Upload Validation Functions
// ============================================================================

/**
 * Get upload configuration based on upload type
 */
export function getUploadConfig(
  uploadType: UploadType = 'image',
  customAccept?: string
): UploadConfig {
  switch (uploadType) {
    case 'image':
      return {
        accept: customAccept || "image/jpeg,image/jpg,image/png,image/webp",
        maxSize: 5 * 1024 * 1024, // 5MB
        validateType: (file: File) => file.type.startsWith('image/'),
        errorMessage: 'กรุณาเลือกไฟล์รูปภาพเท่านั้น',
        sizeErrorMessage: 'ขนาดไฟล์ต้องไม่เกิน 5MB',
        supportedFormats: 'JPG, PNG, WEBP'
      }
    case 'video':
      return {
        accept: customAccept || "video/mp4,video/webm,video/ogg",
        maxSize: 50 * 1024 * 1024, // 50MB
        validateType: (file: File) => file.type.startsWith('video/'),
        errorMessage: 'กรุณาเลือกไฟล์วิดีโอเท่านั้น',
        sizeErrorMessage: 'ขนาดไฟล์ต้องไม่เกิน 50MB',
        supportedFormats: 'MP4, WebM, OGG'
      }
    case 'document':
      return {
        accept: customAccept || "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        maxSize: 10 * 1024 * 1024, // 10MB
        validateType: (file: File) => file.type.includes('pdf') || file.type.includes('document'),
        errorMessage: 'กรุณาเลือกไฟล์เอกสารเท่านั้น',
        sizeErrorMessage: 'ขนาดไฟล์ต้องไม่เกิน 10MB',
        supportedFormats: 'PDF, DOC, DOCX'
      }
    default:
      return {
        accept: customAccept || "image/jpeg,image/jpg,image/png,image/webp",
        maxSize: 5 * 1024 * 1024,
        validateType: (file: File) => file.type.startsWith('image/'),
        errorMessage: 'กรุณาเลือกไฟล์รูปภาพเท่านั้น',
        sizeErrorMessage: 'ขนาดไฟล์ต้องไม่เกิน 5MB',
        supportedFormats: 'JPG, PNG, WEBP'
      }
  }
}

/**
 * Validate file type
 */
export function validateFileType(file: File, config: UploadConfig): string | null {
  if (!config.validateType(file)) {
    return config.errorMessage
  }
  return null
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, config: UploadConfig): string | null {
  if (file.size > config.maxSize) {
    return config.sizeErrorMessage
  }
  return null
}

/**
 * Validate file (type and size)
 */
export function validateFile(file: File, config: UploadConfig): string | null {
  const typeError = validateFileType(file, config)
  if (typeError) return typeError

  const sizeError = validateFileSize(file, config)
  if (sizeError) return sizeError

  return null
}

/**
 * Validate required file
 */
export function validateRequiredFile(
  file: File | null,
  existingValue: string | null | undefined,
  label?: string
): string | null {
  if (!file && !existingValue) {
    return `${label || 'ไฟล์'} จำเป็นต้องเลือก`
  }
  return null
}
