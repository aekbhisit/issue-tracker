/**
 * @module Project Types
 * @description Shared TypeScript types for Project and ProjectEnvironment
 */

export interface ProjectBase {
  id: number
  name: string
  description: string | null
  publicKey: string
  privateKey: string
  status: boolean
  allowedDomains: string[]
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface ProjectEnvironmentType {
  id: number
  projectId: number
  name: string
  apiUrl: string | null
  allowedOrigins: string[] | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Project with environments
 */
export type ProjectWithEnvironments = ProjectBase & {
  environments: ProjectEnvironmentType[]
}

/**
 * Create Project DTO
 */
export interface CreateProjectDto {
  name: string
  description?: string
  allowedDomains: string[]
  status?: boolean
  environments?: CreateProjectEnvironmentDto[]
}

/**
 * Update Project DTO
 */
export interface UpdateProjectDto {
  name?: string
  description?: string
  allowedDomains?: string[]
  status?: boolean
}

/**
 * Create Project Environment DTO
 */
export interface CreateProjectEnvironmentDto {
  name: string
  apiUrl?: string
  allowedOrigins?: string[]
  isActive?: boolean
}

/**
 * Update Project Environment DTO
 */
export interface UpdateProjectEnvironmentDto {
  name?: string
  apiUrl?: string
  allowedOrigins?: string[]
  isActive?: boolean
}

/**
 * Project list query parameters
 */
export interface ProjectListQuery {
  page?: number
  limit?: number
  search?: string
  status?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Project response (with formatted data)
 */
export interface ProjectResponse {
  id: number
  name: string
  description: string | null
  publicKey: string
  privateKey: string
  status: boolean
  allowedDomains: string[]
  environments: ProjectEnvironmentResponse[]
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  issueCounts?: {
    total: number
    pending: number // open + in-progress
  }
}

/**
 * Project Environment response
 */
export interface ProjectEnvironmentResponse {
  id: number
  projectId: number
  name: string
  apiUrl: string | null
  allowedOrigins: string[] | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

