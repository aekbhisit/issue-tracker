/**
 * @module SDK Types
 * @description TypeScript type definitions for the Issue Collector SDK
 */

export interface SDKConfig {
  projectKey: string
  apiUrl?: string
}

export interface Metadata {
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

export interface UserInfo {
  id?: string
  email?: string
  name?: string
}

export type Severity = 'low' | 'medium' | 'high' | 'critical'

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

export type LogLevel = 'log' | 'warn' | 'error'

export interface ConsoleLogEntry {
  level: LogLevel
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
  logs: ConsoleLogEntry[]
  errors: ErrorEntry[]
  networkErrors: NetworkErrorEntry[]
}

export interface StorageData {
  localStorage?: Record<string, any>
  sessionStorage?: Record<string, any>
}

export interface FormFieldData {
  name: string
  type: string
  value?: string
}

export interface FormData {
  fields: FormFieldData[]
  action?: string
  method?: string
}

export interface IssuePayload {
  projectKey: string
  title: string
  description: string
  severity: Severity
  metadata: Metadata
  userInfo?: UserInfo
  screenshot?: ScreenshotMetadata  // Optional screenshot data
  logs?: LogData  // Optional log data
  storageData?: StorageData  // Optional storage data (localStorage/sessionStorage)
  formData?: FormData  // Optional form data (if issue is related to a form)
}

export interface IssueResponse {
  success: boolean
  issueId?: string
  message?: string
  error?: string
}

