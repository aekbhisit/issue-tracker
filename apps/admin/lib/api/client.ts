/**
 * @module API Client
 * @description Axios client for API requests
 */

import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_ADMIN_URL || 'http://localhost:4501/api/admin/v1'

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

