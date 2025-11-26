/**
 * Common types used across the application
 */

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = any> {
  data: T
  message?: string
  status: number
}

/**
 * Generic API error response
 */
export interface ApiErrorResponse {
  error: string
  message: string
  status: number
  details?: any[]
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationMeta
}

/**
 * Generic query options
 */
export interface QueryOptions {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * File upload response
 */
export interface UploadedFile {
  path: string
  url: string
  size: number
  mimetype?: string
}

