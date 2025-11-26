/**
 * String utility functions
 */

/**
 * Converts a string to slug format (lowercase with hyphens)
 * 
 * @param text - The text to slugify
 * @returns Slugified string
 * 
 * @example
 * ```typescript
 * slugify('Hello World') // 'hello-world'
 * slugify('Product Name 123') // 'product-name-123'
 * ```
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Capitalizes the first letter of a string
 * 
 * @param text - The text to capitalize
 * @returns Capitalized string
 */
export function capitalize(text: string): string {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/**
 * Truncates a string to a specified length
 * 
 * @param text - The text to truncate
 * @param maxLength - Maximum length
 * @param suffix - Suffix to append (default: '...')
 * @returns Truncated string
 */
export function truncate(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - suffix.length) + suffix
}

/**
 * Generates a random string
 * 
 * @param length - Length of the random string
 * @returns Random string
 */
export function randomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

