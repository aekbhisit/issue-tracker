import axios, { AxiosError } from 'axios'
import type { LoginCredentials, LoginResponse, AuthError, User } from '@/lib/auth/auth'
import { setToken, setUser, clearAuth, getToken } from './token'
import { getApiBaseUrl } from '@/lib/api/getApiUrl'

// API base URL - uses utility function for proper production/development handling
const API_BASE_URL = getApiBaseUrl()

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL || undefined, // Empty string means relative URLs (for production)
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * Login user
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  try {
    const endpoint = '/api/admin/v1/auth/login'
    const fullUrl = API_BASE_URL ? `${API_BASE_URL}${endpoint}` : endpoint
    console.log('🌐 API Request to:', fullUrl);
    console.log('📦 Request body:', { ...credentials, password: '***' });
    
    const response = await apiClient.post<LoginResponse>(
      endpoint,
      credentials
    )

    console.log('✅ API Response:', response.status, response.data);

    // Save token and user data
    setToken(response.data.data.accessToken, credentials.remember || false)
    setUser(response.data.data.user)

    return response.data
  } catch (error) {
    console.error('❌ API Error:', error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<AuthError>
      console.error('📛 Axios Error Details:', {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        message: axiosError.message
      });
      throw axiosError.response?.data || {
        error: 'NetworkError',
        message: 'Network connection error',
        status: 0
      }
    }
    throw {
      error: 'UnknownError',
      message: 'An unknown error occurred',
      status: 0
    }
  }
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  try {
    await apiClient.post('/api/admin/v1/auth/logout')
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    clearAuth()
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<User> {
  try {
    const response = await apiClient.get<{ status: number; data: User }>(
      '/api/admin/v1/auth/me'
    )
    return response.data.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<AuthError>
      throw axiosError.response?.data || {
        error: 'NetworkError',
        message: 'Network connection error',
        status: 0
      }
    }
    throw {
      error: 'UnknownError',
      message: 'An unknown error occurred',
      status: 0
    }
  }
}

/**
 * Verify token validity
 */
export async function verifyToken(): Promise<boolean> {
  try {
    await getCurrentUser()
    return true
  } catch {
    clearAuth()
    return false
  }
}

