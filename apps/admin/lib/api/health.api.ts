/**
 * @module Health API Service
 * @description API service for health check endpoints
 */

import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

/**
 * Health check response type
 */
export interface HealthCheckResponse {
  status: string
  timestamp: string
  uptime?: number
  routes?: string[]
}

/**
 * Version response type
 */
export interface VersionResponse {
  version: string
  name: string
  description?: string
  timestamp: string
}

/**
 * Check API health status
 * @returns Health check response or null if unavailable
 */
export async function checkApiHealth(): Promise<HealthCheckResponse | null> {
  try {
    const response = await axios.get<HealthCheckResponse>(`${API_BASE_URL}/health`, {
      timeout: 5000, // 5 second timeout
    })
    return response.data
  } catch (error) {
    console.warn('API health check failed:', error)
    return null
  }
}

/**
 * Get API version information
 * @returns Version response or null if unavailable
 */
export async function getApiVersion(): Promise<VersionResponse | null> {
  try {
    const response = await axios.get<VersionResponse>(`${API_BASE_URL}/version`, {
      timeout: 5000, // 5 second timeout
    })
    return response.data
  } catch (error) {
    console.warn('API version check failed:', error)
    return null
  }
}

