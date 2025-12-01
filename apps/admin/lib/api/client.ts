/**
 * @module API Client
 * @description Axios client for API requests
 */

import axios from 'axios'
import { getApiBaseUrl } from './getApiUrl'

// Get API base URL - append /api/admin/v1 for this client
const getAdminApiBaseUrl = (): string => {
  const baseUrl = getApiBaseUrl()
  
  // If baseUrl is empty (production with relative URLs), use relative path
  if (!baseUrl) {
    return '/api/admin/v1'
  }
  
  // Otherwise, append the admin API path
  return `${baseUrl.replace(/\/+$/, '')}/api/admin/v1`
}

const API_BASE_URL = getAdminApiBaseUrl()

/**
 * Axios instance for admin API
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
    // Only run on client side
    if (typeof window !== 'undefined') {
      // Get token from cookie (for admin)
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
      };
      
      const token = getCookie('admin_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
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
      // Only run on client side
      if (typeof window !== 'undefined') {
        // Unauthorized - redirect to login
        // Clear admin token cookie
        document.cookie = 'admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        window.location.href = '/admin'
      }
    }
    return Promise.reject(error)
  }
)

