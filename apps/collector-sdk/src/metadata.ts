/**
 * @module Metadata Collection
 * @description Collects browser and environment metadata for issue reporting
 */

import type { Metadata, UserInfo, StorageData, FormData } from './types'

/**
 * Collect browser and environment metadata
 */
export function collectMetadata(): Metadata {
  const now = new Date()
  
  return {
    url: window.location.href,
    userAgent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    screen: {
      width: screen.width,
      height: screen.height,
    },
    language: navigator.language || 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timestamp: now.toISOString(),
  }
}

/**
 * Get optional user info from global scope
 * Checks for window.issueCollectorUser object
 */
export function getUserInfo(): UserInfo | undefined {
  if (typeof window !== 'undefined' && (window as any).issueCollectorUser) {
    const userInfo = (window as any).issueCollectorUser
    return {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
    }
  }
  return undefined
}

/**
 * Check if a key should be redacted (contains sensitive information)
 */
function shouldRedactKey(key: string): boolean {
  const sensitivePatterns = [
    /password/i,
    /token/i,
    /secret/i,
    /key/i,
    /auth/i,
    /credential/i,
    /session/i,
    /cookie/i,
    /api[_-]?key/i,
    /access[_-]?token/i,
    /refresh[_-]?token/i,
  ]
  
  return sensitivePatterns.some(pattern => pattern.test(key))
}

/**
 * Collect storage data (localStorage and sessionStorage)
 * Redacts sensitive keys
 */
export function collectStorageData(): StorageData | undefined {
  try {
    const storageData: StorageData = {}
    
    // Collect localStorage
    if (typeof localStorage !== 'undefined') {
      const localStorageData: Record<string, any> = {}
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          if (shouldRedactKey(key)) {
            localStorageData[key] = '[REDACTED]'
          } else {
            try {
              const value = localStorage.getItem(key)
              localStorageData[key] = value
            } catch {
              localStorageData[key] = '[UNABLE TO READ]'
            }
          }
        }
      }
      if (Object.keys(localStorageData).length > 0) {
        storageData.localStorage = localStorageData
      }
    }
    
    // Collect sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      const sessionStorageData: Record<string, any> = {}
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key) {
          if (shouldRedactKey(key)) {
            sessionStorageData[key] = '[REDACTED]'
          } else {
            try {
              const value = sessionStorage.getItem(key)
              sessionStorageData[key] = value
            } catch {
              sessionStorageData[key] = '[UNABLE TO READ]'
            }
          }
        }
      }
      if (Object.keys(sessionStorageData).length > 0) {
        storageData.sessionStorage = sessionStorageData
      }
    }
    
    // Only return if we collected something
    if (storageData.localStorage || storageData.sessionStorage) {
      return storageData
    }
    
    return undefined
  } catch (error) {
    console.warn('Failed to collect storage data:', error)
    return undefined
  }
}

/**
 * Collect form data if element is a form or inside a form
 */
export function collectFormData(element: HTMLElement): FormData | undefined {
  try {
    // Find the form element
    let form: HTMLFormElement | null = null
    
    if (element instanceof HTMLFormElement) {
      form = element
    } else {
      form = element.closest('form')
    }
    
    if (!form) {
      return undefined
    }
    
    const formData: FormData = {
      fields: [],
    }
    
    // Get form action and method
    if (form.action) {
      formData.action = form.action
    }
    if (form.method) {
      formData.method = form.method
    }
    
    // Collect form fields
    const inputs = form.querySelectorAll('input, textarea, select')
    inputs.forEach((input) => {
      if (input instanceof HTMLInputElement || 
          input instanceof HTMLTextAreaElement || 
          input instanceof HTMLSelectElement) {
        const fieldName = input.name || input.id || ''
        const fieldType = input.type || input.tagName.toLowerCase()
        
        // Redact password fields
        let fieldValue: string | undefined
        if (input.type === 'password') {
          fieldValue = '[REDACTED]'
        } else {
          try {
            fieldValue = input.value || undefined
          } catch {
            fieldValue = '[UNABLE TO READ]'
          }
        }
        
        formData.fields.push({
          name: fieldName,
          type: fieldType,
          value: fieldValue,
        })
      }
    })
    
    // Only return if we collected fields
    if (formData.fields.length > 0) {
      return formData
    }
    
    return undefined
  } catch (error) {
    console.warn('Failed to collect form data:', error)
    return undefined
  }
}

