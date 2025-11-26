/**
 * @module Common Types
 * @description Common types for API application
 */

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface FilterParams {
  search?: string
  isActive?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface QueryParams extends PaginationParams, FilterParams {}

