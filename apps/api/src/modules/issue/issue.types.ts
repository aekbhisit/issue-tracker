/**
 * @module Issue Types
 * @description Type definitions for issue management
 */

export interface ScreenshotData {
  dataUrl: string  // Base64 data URL
  mimeType: string // image/jpeg or image/png
  fileSize: number // bytes
  width: number
  height: number
}

export interface ElementSelector {
  cssSelector: string
  xpath: string
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
  outerHTML: string
}

export interface ScreenshotMetadata {
  screenshot: ScreenshotData
  selector: ElementSelector
}

export interface ConsoleLogEntry {
  level: 'log' | 'warn' | 'error'
  message: string
  timestamp: number
  metadata?: any
}

export interface ErrorEntry {
  message: string
  source?: string
  line?: number
  column?: number
  stack?: string
  timestamp: number
}

export interface NetworkErrorEntry {
  url: string
  method: string
  status?: number
  error: string
  timestamp: number
}

export interface LogData {
  consoleLogs: ConsoleLogEntry[]
  jsErrors: ErrorEntry[]
  networkErrors: NetworkErrorEntry[]
}

// DTOs for public API (from SDK)
export interface CreateIssueDto {
  projectKey: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  metadata: {
    url: string
    userAgent: string
    viewport: {
      width: number
      height: number
    }
    screen: {
      width: number
      height: number
    }
    language: string
    timezone: string
    timestamp: string
  }
  userInfo?: {
    id?: string
    email?: string
    name?: string
  }
  screenshot?: ScreenshotMetadata  // Optional screenshot data
  logs?: LogData  // Optional log data
}

// DTOs for admin API
export interface IssueListQuery {
  page?: number
  limit?: number
  projectId?: number
  status?: 'open' | 'in-progress' | 'resolved' | 'closed'
  severity?: 'low' | 'medium' | 'high' | 'critical'
  assigneeId?: number
  startDate?: string  // ISO date string
  endDate?: string    // ISO date string
  search?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'severity' | 'status'
  sortOrder?: 'asc' | 'desc'
}

export interface UpdateIssueDto {
  status?: 'open' | 'in-progress' | 'resolved' | 'closed'
  assigneeId?: number | null
  description?: string
}

// API Response types
export interface IssueScreenshotResponse {
  id: number
  storagePath: string
  storageType: string
  mimeType: string | null
  width: number | null
  height: number | null
  fileSize: number | null
  elementSelector: any | null
  createdAt: string
  url?: string  // Signed URL for access
}

export interface IssueLogResponse {
  id: number
  logType: string
  level: string | null
  message: string
  stack: string | null
  metadata: any | null
  timestamp: string
  createdAt: string
}

export interface IssueCommentResponse {
  id: number
  issueId: number
  userId: number
  content: string
  createdAt: string
  updatedAt: string
  user: {
    id: number
    name: string | null
    email: string | null
  }
}

export interface AddCommentDto {
  content: string
}

export interface IssueResponse {
  id: number
  projectId: number
  title: string
  description: string | null
  severity: string
  status: string
  assigneeId: number | null
  reporterInfo: any | null
  metadata: any | null
  createdAt: string
  updatedAt: string
  screenshots: IssueScreenshotResponse[]
  logs: IssueLogResponse[]
  comments?: IssueCommentResponse[]
  project?: {
    id: number
    name: string
    publicKey: string
  }
  assignee?: {
    id: number
    name: string | null
    email: string | null
  } | null
}

export interface IssueListResponse {
  data: IssueResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Legacy type for backward compatibility (IC-2 temporary storage)
export interface IssueData extends CreateIssueDto {
  id: string
  createdAt: Date
}

