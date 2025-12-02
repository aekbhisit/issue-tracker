import Cookies from 'js-cookie'
import type { User } from '@/lib/auth/auth'

const TOKEN_KEY = 'admin_token'
const USER_KEY = 'admin_user'

// Cookie options
const cookieOptions: Cookies.CookieAttributes = {
  path: '/',
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production'
}

/**
 * Save access token to cookies
 */
export function setToken(token: string, remember: boolean = false): void {
  const expires = remember ? 7 : undefined // 7 days if remember, session cookie otherwise
  Cookies.set(TOKEN_KEY, token, {
    ...cookieOptions,
    expires
  })
}

/**
 * Get access token from cookies
 * Safe for SSR - returns undefined on server side
 */
export function getToken(): string | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }
  return Cookies.get(TOKEN_KEY)
}

/**
 * Remove access token from cookies
 */
export function removeToken(): void {
  Cookies.remove(TOKEN_KEY, cookieOptions)
}

/**
 * Save user info to localStorage
 */
export function setUser(user: User): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    // Dispatch custom event for sidebar to detect user change
    window.dispatchEvent(new CustomEvent('localStorageChange', { detail: { key: USER_KEY } }))
  }
}

/**
 * Get user info from localStorage
 */
export function getUser(): User | null {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem(USER_KEY)
    if (userStr) {
      try {
        return JSON.parse(userStr)
      } catch {
        return null
      }
    }
  }
  return null
}

/**
 * Remove user info from localStorage
 */
export function removeUser(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_KEY)
    // Dispatch custom event for sidebar to detect user change
    window.dispatchEvent(new CustomEvent('localStorageChange', { detail: { key: USER_KEY } }))
  }
}

/**
 * Check if user is authenticated
 * Safe for SSR - returns false on server side
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  return !!getToken()
}

/**
 * Clear all auth data
 */
export function clearAuth(): void {
  removeToken()
  removeUser()
}

