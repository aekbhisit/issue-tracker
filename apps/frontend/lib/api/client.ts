/**
 * @module API Client
 * @description Axios client for API requests
 */

import axios from 'axios'
import { getApiBaseUrl } from './getApiUrl'

// Get API base URL - append /api/public/v1 for this client
const getPublicApiBaseUrl = (): string => {
  const baseUrl = getApiBaseUrl()
  
  // If baseUrl is empty (production with relative URLs), use relative path
  if (!baseUrl) {
    return '/api/public/v1'
  }
  
  // Otherwise, append the public API path
  return `${baseUrl.replace(/\/+$/, '')}/api/public/v1`
}

const API_BASE_URL = getPublicApiBaseUrl()

/**
 * Axios instance for public API
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('accessToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

