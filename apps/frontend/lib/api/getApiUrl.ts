/**
 * @module API URL Utility
 * @description Utility function to get the correct API base URL for both development and production
 */

/**
 * Get the API base URL
 * - Uses NEXT_PUBLIC_API_URL if set
 * - In production (non-localhost), uses current origin (relative URLs work with nginx proxy)
 * - In development, defaults to http://localhost:4501
 */
export function getApiBaseUrl(): string {
  // Check environment variable first
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }

  // Client-side: auto-detect from current origin in production
  if (typeof window !== 'undefined') {
    const origin = window.location.origin
    const isProduction = origin.startsWith('https://') || 
                         (!origin.includes('localhost') && !origin.includes('127.0.0.1'))
    
    if (isProduction) {
      // Use relative URLs in production (nginx will proxy to API)
      // Return empty string to use relative URLs
      return ''
    }
  }

  // Server-side or development: default to localhost
  // Default to port 4501 (API server port)
  return 'http://localhost:4501'
}

/**
 * Get the full API URL for a specific endpoint
 * @param endpoint - API endpoint path (e.g., '/api/public/v1/issues')
 * @returns Full URL or relative path depending on environment
 */
export function getApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl()
  
  // If baseUrl is empty (production with relative URLs), return endpoint as-is
  if (!baseUrl) {
    return endpoint
  }
  
  // Remove leading slash from endpoint if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  
  // Remove trailing slash from baseUrl
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '')
  
  return `${cleanBaseUrl}${cleanEndpoint}`
}



