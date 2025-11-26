/**
 * @module API Client
 * @description API client for submitting issues to the backend
 */

import type { IssuePayload, IssueResponse } from './types'

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Submit issue to API with retry logic
 * 
 * @param payload - Issue payload to submit
 * @param apiUrl - API base URL
 * @returns Promise resolving to issue response
 */
export async function submitIssue(
  payload: IssuePayload,
  apiUrl: string
): Promise<IssueResponse> {
  const maxRetries = 3
  const baseDelay = 1000 // 1 second
  
  // Transform payload to match API expectations
  const apiPayload: any = {
    ...payload,
  }
  
  // Transform logs structure: SDK uses {logs, errors, networkErrors}, API expects {consoleLogs, jsErrors, networkErrors}
  if (payload.logs) {
    apiPayload.logs = {
      consoleLogs: payload.logs.logs || [],
      jsErrors: payload.logs.errors || [],
      networkErrors: payload.logs.networkErrors || [],
    }
  }
  
  // Log payload before sending (without full dataUrl to avoid console spam)
  const logPayload = {
    ...apiPayload,
    screenshot: apiPayload.screenshot ? {
      screenshot: apiPayload.screenshot.screenshot ? {
        ...apiPayload.screenshot.screenshot,
        dataUrl: apiPayload.screenshot.screenshot.dataUrl ? `[Base64 data: ${apiPayload.screenshot.screenshot.dataUrl.length} chars]` : null,
      } : null,
      selector: apiPayload.screenshot.selector,
    } : null,
  }
  console.log('[SDK API] Submitting payload (attempt):', {
    attempt: attempt + 1,
    url: `${apiUrl}/api/public/v1/issues`,
    payload: logPayload,
  })
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`${apiUrl}/api/public/v1/issues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiPayload),
      })
      
      console.log('[SDK API] Response status:', response.status, response.statusText)
      const data = await response.json()
      console.log('[SDK API] Response data:', data)
      
      if (!response.ok) {
        // Don't retry on client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          return {
            success: false,
            error: data.message || data.error || `HTTP ${response.status}`,
          }
        }
        
        // Retry on server errors (5xx)
        throw new Error(`HTTP ${response.status}: ${data.message || data.error || 'Server error'}`)
      }
      
      return {
        success: true,
        issueId: data.data?.id || data.issueId,
        message: data.message || 'Issue submitted successfully',
      }
    } catch (error) {
      // Last attempt failed
      if (attempt === maxRetries) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Network error',
        }
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt)
      await sleep(delay)
    }
  }
  
  return {
    success: false,
    error: 'Failed to submit issue after retries',
  }
}

/**
 * Fetch issues for a project
 * 
 * @param projectKey - Project public key
 * @param apiUrl - API base URL
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 10)
 * @returns Promise resolving to issues list response
 */
export async function fetchIssues(
  projectKey: string,
  apiUrl: string,
  page: number = 1,
  limit: number = 10
): Promise<{
  success: boolean
  data?: {
    data: Array<{
      id: number
      title: string
      severity: 'low' | 'medium' | 'high' | 'critical'
      status: 'open' | 'in-progress' | 'resolved' | 'closed'
      createdAt: string
      updatedAt: string
    }>
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
  error?: string
}> {
  try {
    const url = new URL(`${apiUrl}/api/public/v1/issues`)
    url.searchParams.set('projectKey', projectKey)
    url.searchParams.set('page', page.toString())
    url.searchParams.set('limit', limit.toString())

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || `HTTP ${response.status}`,
      }
    }

    return {
      success: true,
      data: data.data || data,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

/**
 * Fetch project details by public key
 * 
 * @param projectKey - Project public key
 * @param apiUrl - API base URL
 * @returns Promise resolving to project details response
 */
export async function fetchProjectDetails(
  projectKey: string,
  apiUrl: string
): Promise<{
  success: boolean
  data?: {
    id: number
    name: string
    publicKey: string
    allowedDomains: string[]
    status: boolean
  }
  error?: string
}> {
  try {
    const response = await fetch(`${apiUrl}/api/public/v1/projects/${projectKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || `HTTP ${response.status}`,
      }
    }

    return {
      success: true,
      data: data.data || data,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

